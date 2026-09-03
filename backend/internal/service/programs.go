package service

import (
	"context"
	"errors"
	"strings"

	"github.com/Ayushmangit/adaago.git/backend/internal/store"
)

var (
	ErrProgramNameRequired = errors.New("program name is required")
	ErrProgramNameConflict = errors.New("program name already exists")
	ErrEmptyUpdate         = errors.New("at least one field must be provided")
)

type ProgramService struct {
	store store.Storage
}

type CreateProgramInput struct {
	Name        string  `json:"name" validate:"required,min=2,max=100"`
	Description *string `json:"description" validate:"omitempty,max=1000"`
}

func (s *ProgramService) Create(
	ctx context.Context,
	input CreateProgramInput,
) (*store.Program, error) {
	name := strings.TrimSpace(input.Name)

	if name == "" {
		return nil, ErrProgramNameRequired
	}

	description := normalizeOptionalString(input.Description)

	program := &store.Program{
		Name:        name,
		Description: description,
		IsActive:    true,
	}

	if err := s.store.Programs.Create(ctx, program); err != nil {
		if errors.Is(err, store.ErrConflict) {
			return nil, ErrProgramNameConflict
		}

		return nil, err
	}

	return program, nil
}

func (s *ProgramService) GetAll(
	ctx context.Context,
) ([]store.Program, error) {
	return s.store.Programs.GetAll(ctx)
}

func (s *ProgramService) GetByID(
	ctx context.Context,
	programID int64,
) (*store.Program, error) {
	return s.store.Programs.GetByID(ctx, programID)
}

type UpdateProgramInput struct {
	Name        *string `json:"name" validate:"omitempty,min=2,max=100"`
	Description *string `json:"description" validate:"omitempty,max=1000"`
	IsActive    *bool   `json:"is_active"`
}

func (s *ProgramService) UpdateByID(
	ctx context.Context,
	programID int64,
	input UpdateProgramInput,
) (*store.Program, error) {
	if input.Name == nil &&
		input.Description == nil &&
		input.IsActive == nil {
		return nil, ErrEmptyUpdate
	}

	var name *string

	if input.Name != nil {
		normalizedName := strings.TrimSpace(*input.Name)

		if normalizedName == "" {
			return nil, ErrProgramNameRequired
		}

		name = &normalizedName
	}

	payload := store.UpdateProgramPayload{
		Name:        name,
		Description: normalizeOptionalString(input.Description),
		IsActive:    input.IsActive,
	}

	program, err := s.store.Programs.UpdateByID(
		ctx,
		programID,
		payload,
	)
	if err != nil {
		if errors.Is(err, store.ErrConflict) {
			return nil, ErrProgramNameConflict
		}

		return nil, err
	}

	return program, nil
}

func normalizeOptionalString(value *string) *string {
	if value == nil {
		return nil
	}

	normalized := strings.TrimSpace(*value)
	return &normalized
}
