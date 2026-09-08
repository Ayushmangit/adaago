package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type Program struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description,omitempty"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateProgramPayload struct {
	Name        string  `json:"name" validate:"required,min=2,max=100"`
	Description *string `json:"description" validate:"omitempty,max=1000"`
}

type UpdateProgramPayload struct {
	Name        *string `json:"name" validate:"omitempty,min=2,max=100"`
	Description *string `json:"description" validate:"omitempty,max=1000"`
	IsActive    *bool   `json:"is_active"`
}

type ProgramStore struct {
	db *sql.DB
}

func (s *ProgramStore) Create(
	ctx context.Context,
	program *Program,
) error {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		INSERT INTO programs (
			name,
			description
		)
		VALUES ($1, $2)
		RETURNING
			id,
			is_active,
			created_at,
			updated_at
	`

	err := s.db.QueryRowContext(
		ctx,
		query,
		program.Name,
		program.Description,
	).Scan(
		&program.ID,
		&program.IsActive,
		&program.CreatedAt,
		&program.UpdatedAt,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return ErrConflict
		}

		return err
	}

	return nil
}

func (s *ProgramStore) GetAll(
	ctx context.Context,
) ([]Program, error) {
	ctx, cancel := context.WithTimeout(ctx, QUERY_CANCEL_DURATION)
	defer cancel()

	query := `
		SELECT
			id,
			name,
			description,
			is_active,
			created_at,
			updated_at
		FROM programs
		ORDER BY name ASC
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	programs := make([]Program, 0)

	for rows.Next() {
		var program Program

		err := rows.Scan(
			&program.ID,
			&program.Name,
			&program.Description,
			&program.IsActive,
			&program.CreatedAt,
			&program.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		programs = append(programs, program)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return programs, nil
}

func (s *ProgramStore) GetByID(
	ctx context.Context,
	programID int64,
) (*Program, error) {
	ctx, cancel := context.WithTimeout(ctx, QUERY_CANCEL_DURATION)
	defer cancel()

	query := `
		SELECT
			id,
			name,
			description,
			is_active,
			created_at,
			updated_at
		FROM programs
		WHERE id = $1
	`

	program := &Program{}

	err := s.db.QueryRowContext(
		ctx,
		query,
		programID,
	).Scan(
		&program.ID,
		&program.Name,
		&program.Description,
		&program.IsActive,
		&program.CreatedAt,
		&program.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}

		return nil, err
	}

	return program, nil
}

func (s *ProgramStore) UpdateByID(
	ctx context.Context,
	programID int64,
	payload UpdateProgramPayload,
) (*Program, error) {
	ctx, cancel := context.WithTimeout(ctx, QUERY_CANCEL_DURATION)
	defer cancel()

	query := `
		UPDATE programs
		SET
			name = COALESCE($1, name),
			description = COALESCE($2, description),
			is_active = COALESCE($3, is_active),
			updated_at = NOW()
		WHERE id = $4
		RETURNING
			id,
			name,
			description,
			is_active,
			created_at,
			updated_at
	`

	program := &Program{}

	err := s.db.QueryRowContext(
		ctx,
		query,
		payload.Name,
		payload.Description,
		payload.IsActive,
		programID,
	).Scan(
		&program.ID,
		&program.Name,
		&program.Description,
		&program.IsActive,
		&program.CreatedAt,
		&program.UpdatedAt,
	)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrNotFound

		case isUniqueViolation(err):
			return nil, ErrConflict

		default:
			return nil, err
		}
	}
	return program, nil
}
