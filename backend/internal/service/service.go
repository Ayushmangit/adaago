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
}

func NewServices(storage store.Storage) Services {
	return Services{
		Programs: &ProgramService{storage},
		Batches:  &BatchService{storage},
	}
}
