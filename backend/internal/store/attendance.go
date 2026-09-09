package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type AttendanceStatus string

const (
	AttendancePresent AttendanceStatus = "present"
	AttendanceAbsent  AttendanceStatus = "absent"
	AttendanceLeave   AttendanceStatus = "leave"
)

type Attendance struct {
	ID             int64            `json:"id"`
	EnrollmentID   int64            `json:"enrollment_id"`
	AttendanceDate time.Time        `json:"attendance_date"`
	Status         AttendanceStatus `json:"status"`
	Remarks        *string          `json:"remarks,omitempty"`
	MarkedBy       int64            `json:"marked_by"`
	MarkedAt       time.Time        `json:"marked_at"`
	UpdatedAt      time.Time        `json:"updated_at"`
}

type AttendanceStore struct {
	db *sql.DB
}

func (s *AttendanceStore) Create(
	ctx context.Context,
	attendance *Attendance,
) error {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		INSERT INTO attendance (
			enrollment_id,
			attendance_date,
			status,
			remarks,
			marked_by
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING
			id,
			marked_at,
			updated_at
	`

	err := s.db.QueryRowContext(
		ctx,
		query,
		attendance.EnrollmentID,
		attendance.AttendanceDate,
		attendance.Status,
		attendance.Remarks,
		attendance.MarkedBy,
	).Scan(
		&attendance.ID,
		&attendance.MarkedAt,
		&attendance.UpdatedAt,
	)
	if err != nil {
		switch {
		case isUniqueViolation(err):
			return ErrConflict

		case isForeignKeyViolation(err):
			return ErrNotFound

		case isCheckViolation(err):
			return ErrInvalidInput

		default:
			return err
		}
	}

	return nil
}

func (s *AttendanceStore) GetByID(
	ctx context.Context,
	attendanceID int64,
) (*Attendance, error) {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		SELECT
			id,
			enrollment_id,
			attendance_date,
			status,
			remarks,
			marked_by,
			marked_at,
			updated_at
		FROM attendance
		WHERE id = $1
	`

	attendance := &Attendance{}

	err := s.db.QueryRowContext(
		ctx,
		query,
		attendanceID,
	).Scan(
		&attendance.ID,
		&attendance.EnrollmentID,
		&attendance.AttendanceDate,
		&attendance.Status,
		&attendance.Remarks,
		&attendance.MarkedBy,
		&attendance.MarkedAt,
		&attendance.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}

		return nil, err
	}

	return attendance, nil
}

func (s *AttendanceStore) GetByEnrollmentID(
	ctx context.Context,
	enrollmentID int64,
) ([]Attendance, error) {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		SELECT
			id,
			enrollment_id,
			attendance_date,
			status,
			remarks,
			marked_by,
			marked_at,
			updated_at
		FROM attendance
		WHERE enrollment_id = $1
		ORDER BY attendance_date DESC
	`

	rows, err := s.db.QueryContext(
		ctx,
		query,
		enrollmentID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	records := make([]Attendance, 0)

	for rows.Next() {
		var attendance Attendance

		if err := rows.Scan(
			&attendance.ID,
			&attendance.EnrollmentID,
			&attendance.AttendanceDate,
			&attendance.Status,
			&attendance.Remarks,
			&attendance.MarkedBy,
			&attendance.MarkedAt,
			&attendance.UpdatedAt,
		); err != nil {
			return nil, err
		}

		records = append(
			records,
			attendance,
		)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return records, nil
}

func (s *AttendanceStore) GetByBatchIDAndDate(
	ctx context.Context,
	batchID int64,
	attendanceDate time.Time,
) ([]Attendance, error) {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		SELECT
			a.id,
			a.enrollment_id,
			a.attendance_date,
			a.status,
			a.remarks,
			a.marked_by,
			a.marked_at,
			a.updated_at
		FROM attendance a
		INNER JOIN enrollments e
			ON e.id = a.enrollment_id
		WHERE
			e.batch_id = $1
			AND a.attendance_date = $2
		ORDER BY a.enrollment_id ASC
	`

	rows, err := s.db.QueryContext(
		ctx,
		query,
		batchID,
		attendanceDate,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	records := make([]Attendance, 0)

	for rows.Next() {
		var attendance Attendance

		if err := rows.Scan(
			&attendance.ID,
			&attendance.EnrollmentID,
			&attendance.AttendanceDate,
			&attendance.Status,
			&attendance.Remarks,
			&attendance.MarkedBy,
			&attendance.MarkedAt,
			&attendance.UpdatedAt,
		); err != nil {
			return nil, err
		}

		records = append(
			records,
			attendance,
		)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return records, nil
}

func (s *AttendanceStore) GetByStudentID(
	ctx context.Context,
	studentID int64,
) ([]Attendance, error) {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		SELECT
			a.id,
			a.enrollment_id,
			a.attendance_date,
			a.status,
			a.remarks,
			a.marked_by,
			a.marked_at,
			a.updated_at
		FROM attendance a
		INNER JOIN enrollments e
			ON e.id = a.enrollment_id
		WHERE e.student_id = $1
		ORDER BY a.attendance_date DESC
	`

	rows, err := s.db.QueryContext(
		ctx,
		query,
		studentID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	records := make([]Attendance, 0)

	for rows.Next() {
		var attendance Attendance

		if err := rows.Scan(
			&attendance.ID,
			&attendance.EnrollmentID,
			&attendance.AttendanceDate,
			&attendance.Status,
			&attendance.Remarks,
			&attendance.MarkedBy,
			&attendance.MarkedAt,
			&attendance.UpdatedAt,
		); err != nil {
			return nil, err
		}

		records = append(
			records,
			attendance,
		)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return records, nil
}

type UpdateAttendancePayload struct {
	Status  AttendanceStatus
	Remarks *string
}

func (s *AttendanceStore) UpdateByID(
	ctx context.Context,
	attendanceID int64,
	payload UpdateAttendancePayload,
) (*Attendance, error) {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		UPDATE attendance
		SET
			status = $1,
			remarks = $2,
			updated_at = NOW()
		WHERE id = $3
		RETURNING
			id,
			enrollment_id,
			attendance_date,
			status,
			remarks,
			marked_by,
			marked_at,
			updated_at
	`

	attendance := &Attendance{}

	err := s.db.QueryRowContext(
		ctx,
		query,
		payload.Status,
		payload.Remarks,
		attendanceID,
	).Scan(
		&attendance.ID,
		&attendance.EnrollmentID,
		&attendance.AttendanceDate,
		&attendance.Status,
		&attendance.Remarks,
		&attendance.MarkedBy,
		&attendance.MarkedAt,
		&attendance.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}

		if isCheckViolation(err) {
			return nil, ErrInvalidInput
		}

		return nil, err
	}

	return attendance, nil
}

type BulkAttendanceRecord struct {
	EnrollmentID   int64
	AttendanceDate time.Time
	Status         AttendanceStatus
	Remarks        *string
	MarkedBy       int64
}

func (s *AttendanceStore) BulkUpsert(
	ctx context.Context,
	records []BulkAttendanceRecord,
) ([]Attendance, error) {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	attendanceRecords := make(
		[]Attendance,
		0,
		len(records),
	)

	err := withTx(
		s.db,
		ctx,
		func(tx *sql.Tx) error {
			query := `
				INSERT INTO attendance (
					enrollment_id,
					attendance_date,
					status,
					remarks,
					marked_by
				)
				VALUES ($1, $2, $3, $4, $5)

				ON CONFLICT (
					enrollment_id,
					attendance_date
				)
				DO UPDATE SET
					status = EXCLUDED.status,
					remarks = EXCLUDED.remarks,
					marked_by = EXCLUDED.marked_by,
					updated_at = NOW()

				RETURNING
					id,
					enrollment_id,
					attendance_date,
					status,
					remarks,
					marked_by,
					marked_at,
					updated_at
			`

			for _, record := range records {
				var attendance Attendance

				err := tx.QueryRowContext(
					ctx,
					query,
					record.EnrollmentID,
					record.AttendanceDate,
					record.Status,
					record.Remarks,
					record.MarkedBy,
				).Scan(
					&attendance.ID,
					&attendance.EnrollmentID,
					&attendance.AttendanceDate,
					&attendance.Status,
					&attendance.Remarks,
					&attendance.MarkedBy,
					&attendance.MarkedAt,
					&attendance.UpdatedAt,
				)
				if err != nil {
					return err
				}

				attendanceRecords = append(
					attendanceRecords,
					attendance,
				)
			}

			return nil
		},
	)
	if err != nil {
		return nil, err
	}

	return attendanceRecords, nil
}
