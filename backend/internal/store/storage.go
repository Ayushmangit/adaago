package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

var (
	ErrNotFound          = errors.New("not found")
	ErrDuplicateEmail    = errors.New("email already registered")
	ErrDuplicateUsername = errors.New("username already exists")
	ErrInvalidID         = errors.New("invalid ID")
	ErrConflict          = errors.New("resource conflict")
	ErrInvalidInput      = errors.New("invalid input")
)

const QUERY_CANCEL_DURATION = 5 * time.Second

type Storage struct {
	Users interface {
		Create(ctx context.Context, user *User) error
		GetByID(ctx context.Context, userID int64) (*User, error)
		GetByEmail(ctx context.Context, email string) (*User, error)
		DeleteByID(ctx context.Context, userID int64) error
		UpdateByID(ctx context.Context, userID int64, payload UpdateUserPayload) (*User, error)
	}
	Programs interface {
		Create(ctx context.Context, program *Program) error
		GetAll(ctx context.Context) ([]Program, error)
		GetByID(ctx context.Context, programID int64) (*Program, error)
		UpdateByID(
			ctx context.Context,
			programID int64,
			payload UpdateProgramPayload,
		) (*Program, error)
	}
	Batches interface {
		Create(
			ctx context.Context,
			batch *Batch,
		) error

		GetAll(
			ctx context.Context,
		) ([]Batch, error)

		GetByProgramID(
			ctx context.Context,
			programID int64,
		) ([]Batch, error)

		GetByID(
			ctx context.Context,
			batchID int64,
		) (*Batch, error)

		UpdateByID(
			ctx context.Context,
			batchID int64,
			payload UpdateBatchPayload,
		) (*Batch, error)
	}

	Students interface {
		CreateWithUser(
			ctx context.Context,
			user *User,
			student *Student,
		) error

		GetByID(
			ctx context.Context,
			studentID int64,
		) (*StudentWithUser, error)

		GetByUserID(
			ctx context.Context,
			userID int64,
		) (*StudentWithUser, error)

		GetAll(
			ctx context.Context,
		) ([]StudentWithUser, error)

		UpdateByID(
			ctx context.Context,
			studentID int64,
			payload UpdateStudentPayload,
		) (*StudentWithUser, error)
	}
	Enrollments interface {
		Create(
			ctx context.Context,
			enrollment *Enrollment,
		) error

		GetByID(
			ctx context.Context,
			enrollmentID int64,
		) (*Enrollment, error)

		GetByStudentID(
			ctx context.Context,
			studentID int64,
		) ([]Enrollment, error)

		GetByBatchID(
			ctx context.Context,
			batchID int64,
		) ([]Enrollment, error)
	}
}

func NewStorage(db *sql.DB) Storage {
	return Storage{
		Users:       &UserStore{db},
		Programs:    &ProgramStore{db},
		Batches:     &BatchStore{db},
		Students:    &StudentStore{db},
		Enrollments: &EnrollmentStore{db},
	}
}

func withTx(db *sql.DB, ctx context.Context, fn func(*sql.Tx) error) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	if err := fn(tx); err != nil {
		_ = tx.Rollback()
		return err
	}

	return tx.Commit()
}
