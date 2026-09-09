package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type EnrollmentStatus string

const (
	EnrollmentStatusActive    EnrollmentStatus = "active"
	EnrollmentStatusCompleted EnrollmentStatus = "completed"
	EnrollmentStatusCancelled EnrollmentStatus = "cancelled"
)

type Enrollment struct {
	ID        int64            `json:"id"`
	StudentID int64            `json:"student_id"`
	BatchID   int64            `json:"batch_id"`
	JoinedAt  time.Time        `json:"joined_at"`
	LeftAt    *time.Time       `json:"left_at,omitempty"`
	Status    EnrollmentStatus `json:"status"`
	CreatedAt time.Time        `json:"created_at"`
	UpdatedAt time.Time        `json:"updated_at"`
}

type EnrollmentStore struct {
	db *sql.DB
}

func (s *EnrollmentStore) Create(
	ctx context.Context,
	enrollment *Enrollment,
) error {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		INSERT INTO enrollments (
			student_id,
			batch_id,
			joined_at,
			status
		)
		VALUES ($1, $2, $3, $4)
		RETURNING
			id,
			created_at,
			updated_at
	`

	err := s.db.QueryRowContext(
		ctx,
		query,
		enrollment.StudentID,
		enrollment.BatchID,
		enrollment.JoinedAt,
		enrollment.Status,
	).Scan(
		&enrollment.ID,
		&enrollment.CreatedAt,
		&enrollment.UpdatedAt,
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

func (s *EnrollmentStore) GetByID(
	ctx context.Context,
	enrollmentID int64,
) (*Enrollment, error) {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		SELECT
			id,
			student_id,
			batch_id,
			joined_at,
			left_at,
			status,
			created_at,
			updated_at
		FROM enrollments
		WHERE id = $1
	`

	enrollment := &Enrollment{}

	err := s.db.QueryRowContext(
		ctx,
		query,
		enrollmentID,
	).Scan(
		&enrollment.ID,
		&enrollment.StudentID,
		&enrollment.BatchID,
		&enrollment.JoinedAt,
		&enrollment.LeftAt,
		&enrollment.Status,
		&enrollment.CreatedAt,
		&enrollment.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}

		return nil, err
	}

	return enrollment, nil
}

func (s *EnrollmentStore) GetByStudentID(
	ctx context.Context,
	studentID int64,
) ([]Enrollment, error) {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		SELECT
			id,
			student_id,
			batch_id,
			joined_at,
			left_at,
			status,
			created_at,
			updated_at
		FROM enrollments
		WHERE student_id = $1
		ORDER BY joined_at DESC
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

	enrollments := make([]Enrollment, 0)

	for rows.Next() {
		var enrollment Enrollment

		err := rows.Scan(
			&enrollment.ID,
			&enrollment.StudentID,
			&enrollment.BatchID,
			&enrollment.JoinedAt,
			&enrollment.LeftAt,
			&enrollment.Status,
			&enrollment.CreatedAt,
			&enrollment.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		enrollments = append(
			enrollments,
			enrollment,
		)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return enrollments, nil
}

func (s *EnrollmentStore) GetByBatchID(
	ctx context.Context,
	batchID int64,
) ([]Enrollment, error) {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		SELECT
			id,
			student_id,
			batch_id,
			joined_at,
			left_at,
			status,
			created_at,
			updated_at
		FROM enrollments
		WHERE batch_id = $1
		ORDER BY joined_at ASC
	`

	rows, err := s.db.QueryContext(
		ctx,
		query,
		batchID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	enrollments := make([]Enrollment, 0)

	for rows.Next() {
		var enrollment Enrollment

		err := rows.Scan(
			&enrollment.ID,
			&enrollment.StudentID,
			&enrollment.BatchID,
			&enrollment.JoinedAt,
			&enrollment.LeftAt,
			&enrollment.Status,
			&enrollment.CreatedAt,
			&enrollment.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		enrollments = append(
			enrollments,
			enrollment,
		)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return enrollments, nil
}

type UpdateEnrollmentPayload struct {
	Status EnrollmentStatus
	LeftAt time.Time
}

func (s *EnrollmentStore) UpdateStatus(
	ctx context.Context,
	enrollmentID int64,
	payload UpdateEnrollmentPayload,
) (*Enrollment, error) {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		UPDATE enrollments
		SET
			status = $1,
			left_at = $2,
			updated_at = NOW()
		WHERE id = $3
		RETURNING
			id,
			student_id,
			batch_id,
			joined_at,
			left_at,
			status,
			created_at,
			updated_at
	`

	enrollment := &Enrollment{}

	err := s.db.QueryRowContext(
		ctx,
		query,
		payload.Status,
		payload.LeftAt,
		enrollmentID,
	).Scan(
		&enrollment.ID,
		&enrollment.StudentID,
		&enrollment.BatchID,
		&enrollment.JoinedAt,
		&enrollment.LeftAt,
		&enrollment.Status,
		&enrollment.CreatedAt,
		&enrollment.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}

		return nil, err
	}

	return enrollment, nil
}
