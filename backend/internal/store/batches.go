package store

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/lib/pq"
)

type Batch struct {
	ID              int64         `json:"id"`
	ProgramID       int64         `json:"program_id"`
	Name            string        `json:"name"`
	StartTime       string        `json:"start_time"`
	EndTime         string        `json:"end_time"`
	Weekdays        pq.Int64Array `json:"weekdays"`
	MonthlyFeePaise int64         `json:"monthly_fee_paise"`
	Capacity        *int          `json:"capacity,omitempty"`
	IsActive        bool          `json:"is_active"`
	CreatedAt       time.Time     `json:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at"`
}

type UpdateBatchPayload struct {
	Name            *string        `json:"name"`
	StartTime       *string        `json:"start_time"`
	EndTime         *string        `json:"end_time"`
	Weekdays        *pq.Int64Array `json:"weekdays"`
	MonthlyFeePaise *int64         `json:"monthly_fee_paise"`
	Capacity        *int           `json:"capacity"`
	IsActive        *bool          `json:"is_active"`
}

type BatchStore struct {
	db *sql.DB
}

func (s *BatchStore) Create(
	ctx context.Context,
	batch *Batch,
) error {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		INSERT INTO batches (
			program_id,
			name,
			start_time,
			end_time,
			weekdays,
			monthly_fee_paise,
			capacity
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING
			id,
			is_active,
			created_at,
			updated_at
	`

	err := s.db.QueryRowContext(
		ctx,
		query,
		batch.ProgramID,
		batch.Name,
		batch.StartTime,
		batch.EndTime,
		batch.Weekdays,
		batch.MonthlyFeePaise,
		batch.Capacity,
	).Scan(
		&batch.ID,
		&batch.IsActive,
		&batch.CreatedAt,
		&batch.UpdatedAt,
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

func (s *BatchStore) GetAll(
	ctx context.Context,
) ([]Batch, error) {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		SELECT
			id,
			program_id,
			name,
			start_time,
			end_time,
			weekdays,
			monthly_fee_paise,
			capacity,
			is_active,
			created_at,
			updated_at
		FROM batches
		ORDER BY name ASC
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	batches := make([]Batch, 0)

	for rows.Next() {
		var batch Batch

		if err := scanBatch(rows, &batch); err != nil {
			return nil, err
		}

		batches = append(batches, batch)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return batches, nil
}

func (s *BatchStore) GetByProgramID(
	ctx context.Context,
	programID int64,
) ([]Batch, error) {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		SELECT
			id,
			program_id,
			name,
			start_time,
			end_time,
			weekdays,
			monthly_fee_paise,
			capacity,
			is_active,
			created_at,
			updated_at
		FROM batches
		WHERE program_id = $1
		ORDER BY start_time ASC, name ASC
	`

	rows, err := s.db.QueryContext(ctx, query, programID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	batches := make([]Batch, 0)

	for rows.Next() {
		var batch Batch

		if err := scanBatch(rows, &batch); err != nil {
			return nil, err
		}

		batches = append(batches, batch)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return batches, nil
}

func (s *BatchStore) GetByID(
	ctx context.Context,
	batchID int64,
) (*Batch, error) {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		SELECT
			id,
			program_id,
			name,
			start_time,
			end_time,
			weekdays,
			monthly_fee_paise,
			capacity,
			is_active,
			created_at,
			updated_at
		FROM batches
		WHERE id = $1
	`

	batch := &Batch{}

	err := scanBatch(
		s.db.QueryRowContext(ctx, query, batchID),
		batch,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}

		return nil, err
	}

	return batch, nil
}

func (s *BatchStore) UpdateByID(
	ctx context.Context,
	batchID int64,
	payload UpdateBatchPayload,
) (*Batch, error) {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		UPDATE batches
		SET
			name = COALESCE($1, name),
			start_time = COALESCE($2, start_time),
			end_time = COALESCE($3, end_time),
			weekdays = COALESCE($4, weekdays),
			monthly_fee_paise =
				COALESCE($5, monthly_fee_paise),
			capacity = COALESCE($6, capacity),
			is_active = COALESCE($7, is_active),
			updated_at = NOW()
		WHERE id = $8
		RETURNING
			id,
			program_id,
			name,
			start_time,
			end_time,
			weekdays,
			monthly_fee_paise,
			capacity,
			is_active,
			created_at,
			updated_at
	`

	batch := &Batch{}

	err := scanBatch(
		s.db.QueryRowContext(
			ctx,
			query,
			payload.Name,
			payload.StartTime,
			payload.EndTime,
			payload.Weekdays,
			payload.MonthlyFeePaise,
			payload.Capacity,
			payload.IsActive,
			batchID,
		),
		batch,
	)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrNotFound

		case isUniqueViolation(err):
			return nil, ErrConflict

		case isCheckViolation(err):
			return nil, ErrInvalidInput

		default:
			return nil, err
		}
	}

	return batch, nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanBatch(
	row rowScanner,
	batch *Batch,
) error {
	return row.Scan(
		&batch.ID,
		&batch.ProgramID,
		&batch.Name,
		&batch.StartTime,
		&batch.EndTime,
		&batch.Weekdays,
		&batch.MonthlyFeePaise,
		&batch.Capacity,
		&batch.IsActive,
		&batch.CreatedAt,
		&batch.UpdatedAt,
	)
}
