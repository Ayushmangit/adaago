package store

import (
	"context"
	"database/sql"
)

type DashboardBatch struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	ProgramID   int64  `json:"program_id"`
	ProgramName string `json:"program_name"`
	StartTime   string `json:"start_time"`
	EndTime     string `json:"end_time"`
	Capacity    *int   `json:"capacity"`
}

type DashboardSummary struct {
	TotalStudents  int64            `json:"total_students"`
	ActiveStudents int64            `json:"active_students"`
	TotalPrograms  int64            `json:"total_programs"`
	ActivePrograms int64            `json:"active_programs"`
	TotalBatches   int64            `json:"total_batches"`
	ActiveBatches  int64            `json:"active_batches"`
	TotalCapacity  int64            `json:"total_capacity"`
	Batches        []DashboardBatch `json:"batches"`
}

type DashboardStore struct {
	db *sql.DB
}

func (s *DashboardStore) GetSummary(ctx context.Context) (*DashboardSummary, error) {
	ctx, cancel := context.WithTimeout(ctx, QUERY_CANCEL_DURATION)
	defer cancel()

	summaryQuery := `
		SELECT
			(SELECT COUNT(*) FROM students),
			(SELECT COUNT(*) FROM students WHERE status = 'active'),
			(SELECT COUNT(*) FROM programs),
			(SELECT COUNT(*) FROM programs WHERE is_active = true),
			(SELECT COUNT(*) FROM batches),
			(SELECT COUNT(*) FROM batches WHERE is_active = true),
			(
				SELECT COALESCE(SUM(capacity), 0)
				FROM batches
				WHERE is_active = true
				AND capacity IS NOT NULL
			)
	`

	var summary DashboardSummary

	err := s.db.QueryRowContext(ctx, summaryQuery).Scan(
		&summary.TotalStudents,
		&summary.ActiveStudents,
		&summary.TotalPrograms,
		&summary.ActivePrograms,
		&summary.TotalBatches,
		&summary.ActiveBatches,
		&summary.TotalCapacity,
	)
	if err != nil {
		return nil, err
	}

	batchesQuery := `
		SELECT
			b.id,
			b.name,
			b.program_id,
			p.name,
			b.start_time,
			b.end_time,
			b.capacity
		FROM batches b
		JOIN programs p ON p.id = b.program_id
		WHERE b.is_active = true
		ORDER BY b.id DESC
		LIMIT 5
	`

	rows, err := s.db.QueryContext(ctx, batchesQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	summary.Batches = make([]DashboardBatch, 0, 5)

	for rows.Next() {
		var batch DashboardBatch

		err := rows.Scan(
			&batch.ID,
			&batch.Name,
			&batch.ProgramID,
			&batch.ProgramName,
			&batch.StartTime,
			&batch.EndTime,
			&batch.Capacity,
		)
		if err != nil {
			return nil, err
		}

		summary.Batches = append(summary.Batches, batch)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &summary, nil
}
