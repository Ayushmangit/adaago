package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/Ayushmangit/adaago.git/backend/internal/store"
)

var (
	ErrInvalidEnrollmentStatus = errors.New(
		"enrollment status must be completed or cancelled",
	)

	ErrEnrollmentAlreadyEnded = errors.New(
		"enrollment is already completed or cancelled",
	)

	ErrInvalidEnrollmentEndDate = errors.New(
		"left_at must use YYYY-MM-DD format",
	)

	ErrEnrollmentEndBeforeJoin = errors.New(
		"left_at cannot be before joined_at",
	)
)

var (
	ErrStudentInactive = errors.New(
		"cannot enroll an inactive student",
	)

	ErrBatchInactive = errors.New(
		"cannot enroll into an inactive batch",
	)

	ErrEnrollmentExists = errors.New(
		"student is already enrolled in this batch",
	)

	ErrBatchFull = errors.New(
		"batch has reached its maximum capacity",
	)

	ErrInvalidEnrollmentDate = errors.New(
		"joined_at must use YYYY-MM-DD format",
	)

	ErrFutureEnrollmentDate = errors.New(
		"joined_at cannot be in the future",
	)
)

type EnrollmentService struct {
	store store.Storage
}

type CreateEnrollmentInput struct {
	StudentID int64   `json:"student_id" validate:"required,min=1"`
	BatchID   int64   `json:"batch_id" validate:"required,min=1"`
	JoinedAt  *string `json:"joined_at"`
}

func (s *EnrollmentService) Create(
	ctx context.Context,
	input CreateEnrollmentInput,
) (*store.Enrollment, error) {
	if input.StudentID < 1 || input.BatchID < 1 {
		return nil, store.ErrInvalidID
	}

	// Make sure the student exists.
	student, err := s.store.Students.GetByID(
		ctx,
		input.StudentID,
	)
	if err != nil {
		return nil, err
	}

	// Inactive students should not be enrolled.
	if student.Status != store.StudentStatusActive {
		return nil, ErrStudentInactive
	}

	// Make sure the batch exists.
	batch, err := s.store.Batches.GetByID(
		ctx,
		input.BatchID,
	)
	if err != nil {
		return nil, err
	}

	if !batch.IsActive {
		return nil, ErrBatchInactive
	}

	// Also make sure the parent program is active.
	program, err := s.store.Programs.GetByID(
		ctx,
		batch.ProgramID,
	)
	if err != nil {
		return nil, err
	}

	if !program.IsActive {
		return nil, ErrProgramInactive
	}

	// Parse joined_at.
	joinedAt, err := parseEnrollmentDate(
		input.JoinedAt,
	)
	if err != nil {
		return nil, err
	}

	/*
		Check existing enrollments for this student.

		This gives us a nicer service-level error instead
		of depending entirely on the PostgreSQL unique index.
	*/
	studentEnrollments, err := s.store.Enrollments.GetByStudentID(
		ctx,
		input.StudentID,
	)
	if err != nil {
		return nil, err
	}

	for _, enrollment := range studentEnrollments {
		if enrollment.BatchID == input.BatchID &&
			enrollment.Status == store.EnrollmentStatusActive {

			return nil, ErrEnrollmentExists
		}
	}

	/*
		Check batch capacity.

		nil capacity means unlimited capacity.
	*/
	if batch.Capacity != nil {
		batchEnrollments, err := s.store.Enrollments.GetByBatchID(
			ctx,
			input.BatchID,
		)
		if err != nil {
			return nil, err
		}

		activeCount := 0

		for _, enrollment := range batchEnrollments {
			if enrollment.Status ==
				store.EnrollmentStatusActive {

				activeCount++
			}
		}

		if activeCount >= *batch.Capacity {
			return nil, ErrBatchFull
		}
	}

	enrollment := &store.Enrollment{
		StudentID: input.StudentID,
		BatchID:   input.BatchID,
		JoinedAt:  joinedAt,
		Status:    store.EnrollmentStatusActive,
	}

	if err := s.store.Enrollments.Create(
		ctx,
		enrollment,
	); err != nil {
		switch {
		case errors.Is(err, store.ErrConflict):
			return nil, ErrEnrollmentExists

		case errors.Is(err, store.ErrNotFound):
			return nil, store.ErrNotFound

		case errors.Is(err, store.ErrInvalidInput):
			return nil, store.ErrInvalidInput

		default:
			return nil, err
		}
	}

	return enrollment, nil
}

func (s *EnrollmentService) GetByID(
	ctx context.Context,
	enrollmentID int64,
) (*store.Enrollment, error) {
	if enrollmentID < 1 {
		return nil, store.ErrInvalidID
	}

	return s.store.Enrollments.GetByID(
		ctx,
		enrollmentID,
	)
}

func (s *EnrollmentService) GetByStudentID(
	ctx context.Context,
	studentID int64,
) ([]store.Enrollment, error) {
	if studentID < 1 {
		return nil, store.ErrInvalidID
	}

	// Makes GET /students/{id}/enrollments return
	// 404 for a nonexistent student instead of [].
	if _, err := s.store.Students.GetByID(
		ctx,
		studentID,
	); err != nil {
		return nil, err
	}

	return s.store.Enrollments.GetByStudentID(
		ctx,
		studentID,
	)
}

func (s *EnrollmentService) GetByBatchID(
	ctx context.Context,
	batchID int64,
) ([]store.Enrollment, error) {
	if batchID < 1 {
		return nil, store.ErrInvalidID
	}

	if _, err := s.store.Batches.GetByID(
		ctx,
		batchID,
	); err != nil {
		return nil, err
	}

	return s.store.Enrollments.GetByBatchID(
		ctx,
		batchID,
	)
}

func parseEnrollmentDate(
	value *string,
) (time.Time, error) {
	now := time.Now().UTC()

	// If admin doesn't provide joined_at,
	// enrollment begins today.
	if value == nil {
		return time.Date(
			now.Year(),
			now.Month(),
			now.Day(),
			0,
			0,
			0,
			0,
			time.UTC,
		), nil
	}

	normalized := strings.TrimSpace(*value)

	date, err := time.Parse(
		"2006-01-02",
		normalized,
	)
	if err != nil {
		return time.Time{}, ErrInvalidEnrollmentDate
	}

	today := time.Date(
		now.Year(),
		now.Month(),
		now.Day(),
		0,
		0,
		0,
		0,
		time.UTC,
	)

	if date.After(today) {
		return time.Time{}, ErrFutureEnrollmentDate
	}

	return date, nil
}

func (s *EnrollmentService) GetForUser(
	ctx context.Context,
	userID int64,
) ([]store.Enrollment, error) {
	if userID < 1 {
		return nil, store.ErrInvalidID
	}
	student, err := s.store.Students.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return s.store.Enrollments.GetByStudentID(
		ctx,
		student.ID,
	)
}

type UpdateEnrollmentInput struct {
	Status store.EnrollmentStatus `json:"status" validate:"required,oneof=completed cancelled"`

	LeftAt *string `json:"left_at"`
}

func (s *EnrollmentService) UpdateStatus(
	ctx context.Context,
	enrollmentID int64,
	input UpdateEnrollmentInput,
) (*store.Enrollment, error) {
	if enrollmentID < 1 {
		return nil, store.ErrInvalidID
	}

	if input.Status != store.EnrollmentStatusCompleted &&
		input.Status != store.EnrollmentStatusCancelled {

		return nil, ErrInvalidEnrollmentStatus
	}

	enrollment, err := s.store.Enrollments.GetByID(
		ctx,
		enrollmentID,
	)
	if err != nil {
		return nil, err
	}

	if enrollment.Status !=
		store.EnrollmentStatusActive {

		return nil, ErrEnrollmentAlreadyEnded
	}

	now := time.Now().UTC()
	leftAt := time.Date(
		now.Year(),
		now.Month(),
		now.Day(),
		0,
		0,
		0,
		0,
		time.UTC,
	)

	if input.LeftAt != nil {
		parsed, err := time.Parse(
			"2006-01-02",
			strings.TrimSpace(
				*input.LeftAt,
			),
		)
		if err != nil {
			return nil,
				ErrInvalidEnrollmentEndDate
		}

		leftAt = parsed
	}

	if leftAt.Before(
		enrollment.JoinedAt,
	) {
		return nil,
			ErrEnrollmentEndBeforeJoin
	}

	return s.store.Enrollments.UpdateStatus(
		ctx,
		enrollmentID,
		store.UpdateEnrollmentPayload{
			Status: input.Status,
			LeftAt: leftAt,
		},
	)
}
