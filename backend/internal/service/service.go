package service

import (
	"context"

	"github.com/Ayushmangit/adaago.git/backend/internal/store"
)

type Services struct {
	Programs interface {
		Create(
			ctx context.Context,
			input CreateProgramInput,
		) (*store.Program, error)

		GetAll(
			ctx context.Context,
		) ([]store.Program, error)

		GetByID(
			ctx context.Context,
			programID int64,
		) (*store.Program, error)

		UpdateByID(
			ctx context.Context,
			programID int64,
			input UpdateProgramInput,
		) (*store.Program, error)
	}

	Batches interface {
		Create(
			ctx context.Context,
			input CreateBatchInput,
		) (*store.Batch, error)
		GetAll(
			ctx context.Context,
		) ([]store.Batch, error)

		GetByProgramID(
			ctx context.Context,
			programID int64,
		) ([]store.Batch, error)

		GetByID(
			ctx context.Context,
			batchID int64,
		) (*store.Batch, error)
		UpdateByID(
			ctx context.Context,
			batchID int64,
			input UpdateBatchInput,
		) (*store.Batch, error)
	}
	Students interface {
		Create(
			ctx context.Context,
			input CreateStudentInput,
		) (*store.StudentWithUser, error)

		GetProfile(
			ctx context.Context,
			userID int64,
		) (*store.StudentWithUser, error)

		GetAll(
			ctx context.Context,
		) ([]store.StudentWithUser, error)

		GetByID(
			ctx context.Context,
			studentID int64,
		) (*store.StudentWithUser, error)

		UpdateByID(
			ctx context.Context,
			studentID int64,
			input AdminUpdateStudentInput,
		) (*store.StudentWithUser, error)
	}
	Enrollments interface {
		Create(
			ctx context.Context,
			input CreateEnrollmentInput,
		) (*store.Enrollment, error)

		GetByID(
			ctx context.Context,
			enrollmentID int64,
		) (*store.Enrollment, error)

		GetByStudentID(
			ctx context.Context,
			studentID int64,
		) ([]store.Enrollment, error)

		GetByBatchID(
			ctx context.Context,
			batchID int64,
		) ([]store.Enrollment, error)
	}
}

func NewServices(storage store.Storage) Services {
	return Services{
		Programs:    &ProgramService{storage},
		Batches:     &BatchService{storage},
		Students:    &StudentService{storage},
		Enrollments: &EnrollmentService{storage},
	}
}
