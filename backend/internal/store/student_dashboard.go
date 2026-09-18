package store

import (
	"context"
	"database/sql"
	"errors"
)

type StudentDashboardSummary struct {
	StudentID         int64   `json:"student_id"`
	FullName          string  `json:"full_name"`
	ActiveEnrollments int64   `json:"active_enrollments"`
	Present           int64   `json:"present"`
	Absent            int64   `json:"absent"`
	Leave             int64   `json:"leave"`
	AttendancePercent float64 `json:"attendance_percent"`
	PendingFees       int64   `json:"pending_fees"`
	PendingAmount     int64   `json:"pending_amount_paise"`
}

type StudentDashboardStore struct {
	db *sql.DB
}

func (s *StudentDashboardStore) GetSummary(ctx context.Context, userID int64) (*StudentDashboardSummary, error) {
	ctx, cancel := context.WithTimeout(ctx, QUERY_CANCEL_DURATION)
	defer cancel()

	query := `
		SELECT
			s.id,
			s.full_name,

			(
				SELECT COUNT(*)
				FROM enrollments e
				WHERE e.student_id = s.id
				AND e.status = 'active'
			),

			(
				SELECT COUNT(*)
				FROM attendance a
				JOIN enrollments e ON e.id = a.enrollment_id
				WHERE e.student_id = s.id
				AND a.status = 'present'
			),

			(
				SELECT COUNT(*)
				FROM attendance a
				JOIN enrollments e ON e.id = a.enrollment_id
				WHERE e.student_id = s.id
				AND a.status = 'absent'
			),

			(
				SELECT COUNT(*)
				FROM attendance a
				JOIN enrollments e ON e.id = a.enrollment_id
				WHERE e.student_id = s.id
				AND a.status = 'leave'
			),

			(
				SELECT COUNT(*)
				FROM fee_dues fd
				JOIN enrollments e ON e.id = fd.enrollment_id
				WHERE e.student_id = s.id
				AND fd.status IN ('pending', 'partial')
			),

			(
				SELECT COALESCE(SUM(fd.amount_paise), 0)
				FROM fee_dues fd
				JOIN enrollments e ON e.id = fd.enrollment_id
				WHERE e.student_id = s.id
				AND fd.status IN ('pending', 'partial')
			)

		FROM students s
		WHERE s.user_id = $1
	`

	var summary StudentDashboardSummary

	err := s.db.QueryRowContext(ctx, query, userID).Scan(
		&summary.StudentID,
		&summary.FullName,
		&summary.ActiveEnrollments,
		&summary.Present,
		&summary.Absent,
		&summary.Leave,
		&summary.PendingFees,
		&summary.PendingAmount,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	totalAttendance := summary.Present + summary.Absent + summary.Leave
	if totalAttendance > 0 {
		summary.AttendancePercent = float64(summary.Present) / float64(totalAttendance) * 100
	}

	return &summary, nil
}
