package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type FeeDueStatus string

const (
	FeeDueStatusPending   FeeDueStatus = "pending"
	FeeDueStatusPartial   FeeDueStatus = "partial"
	FeeDueStatusPaid      FeeDueStatus = "paid"
	FeeDueStatusCancelled FeeDueStatus = "cancelled"
)

type FeeDue struct {
	ID           int64        `json:"id"`
	EnrollmentID int64        `json:"enrollment_id"`
	BillingMonth time.Time    `json:"billing_month"`
	AmountPaise  int64        `json:"amount_paise"`
	DueDate      time.Time    `json:"due_date"`
	Status       FeeDueStatus `json:"status"`
	Notes        *string      `json:"notes,omitempty"`
	PaidAt       *time.Time   `json:"paid_at,omitempty"`
	MarkedPaidBy *int64       `json:"marked_paid_by,omitempty"`
	CreatedAt    time.Time    `json:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at"`
}

type FeeDueWithDetails struct {
	ID           int64        `json:"id"`
	EnrollmentID int64        `json:"enrollment_id"`
	StudentID    int64        `json:"student_id"`
	StudentName  string       `json:"student_name"`
	BatchID      int64        `json:"batch_id"`
	BatchName    string       `json:"batch_name"`
	ProgramID    int64        `json:"program_id"`
	ProgramName  string       `json:"program_name"`
	BillingMonth time.Time    `json:"billing_month"`
	AmountPaise  int64        `json:"amount_paise"`
	DueDate      time.Time    `json:"due_date"`
	Status       FeeDueStatus `json:"status"`
	Notes        *string      `json:"notes,omitempty"`
	PaidAt       *time.Time   `json:"paid_at,omitempty"`
	MarkedPaidBy *int64       `json:"marked_paid_by,omitempty"`
	CreatedAt    time.Time    `json:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at"`
}

type FeeRegisterFilter struct {
	BillingMonth time.Time
	Search       string
	Status       FeeDueStatus
	Page         int
	PageSize     int
}

type PaginatedFeeRegister struct {
	Fees     []FeeDueWithDetails `json:"fees"`
	Total    int64               `json:"total"`
	Page     int                 `json:"page"`
	PageSize int                 `json:"page_size"`
}

type GenerateMonthlyDuesResult struct {
	Created int64 `json:"created"`
}

type UpdateFeeDuePayload struct {
	Status FeeDueStatus
	Notes  *string
}

type FeeDueStore struct {
	db *sql.DB
}

func (s *FeeDueStore) Create(ctx context.Context, fee *FeeDue) error {
	ctx, cancel := context.WithTimeout(ctx, QUERY_CANCEL_DURATION)
	defer cancel()

	query := `
		INSERT INTO fee_dues (
			enrollment_id,
			billing_month,
			amount_paise,
			due_date,
			status,
			notes
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`

	err := s.db.QueryRowContext(
		ctx,
		query,
		fee.EnrollmentID,
		fee.BillingMonth,
		fee.AmountPaise,
		fee.DueDate,
		fee.Status,
		fee.Notes,
	).Scan(
		&fee.ID,
		&fee.CreatedAt,
		&fee.UpdatedAt,
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

func (s *FeeDueStore) GetByID(ctx context.Context, feeDueID int64) (*FeeDue, error) {
	ctx, cancel := context.WithTimeout(ctx, QUERY_CANCEL_DURATION)
	defer cancel()

	query := `
		SELECT
			id,
			enrollment_id,
			billing_month,
			amount_paise,
			due_date,
			status,
			notes,
			paid_at,
			marked_paid_by,
			created_at,
			updated_at
		FROM fee_dues
		WHERE id = $1
	`

	fee := &FeeDue{}

	err := s.db.QueryRowContext(ctx, query, feeDueID).Scan(
		&fee.ID,
		&fee.EnrollmentID,
		&fee.BillingMonth,
		&fee.AmountPaise,
		&fee.DueDate,
		&fee.Status,
		&fee.Notes,
		&fee.PaidAt,
		&fee.MarkedPaidBy,
		&fee.CreatedAt,
		&fee.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}

		return nil, err
	}

	return fee, nil
}

func (s *FeeDueStore) GetByEnrollmentID(ctx context.Context, enrollmentID int64) ([]FeeDue, error) {
	ctx, cancel := context.WithTimeout(ctx, QUERY_CANCEL_DURATION)
	defer cancel()

	query := `
		SELECT
			id,
			enrollment_id,
			billing_month,
			amount_paise,
			due_date,
			status,
			notes,
			paid_at,
			marked_paid_by,
			created_at,
			updated_at
		FROM fee_dues
		WHERE enrollment_id = $1
		ORDER BY billing_month DESC
	`

	rows, err := s.db.QueryContext(ctx, query, enrollmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	fees := make([]FeeDue, 0)

	for rows.Next() {
		var fee FeeDue

		if err := rows.Scan(
			&fee.ID,
			&fee.EnrollmentID,
			&fee.BillingMonth,
			&fee.AmountPaise,
			&fee.DueDate,
			&fee.Status,
			&fee.Notes,
			&fee.PaidAt,
			&fee.MarkedPaidBy,
			&fee.CreatedAt,
			&fee.UpdatedAt,
		); err != nil {
			return nil, err
		}

		fees = append(fees, fee)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return fees, nil
}

func (s *FeeDueStore) GetByUserID(ctx context.Context, userID int64) ([]FeeDueWithDetails, error) {
	ctx, cancel := context.WithTimeout(ctx, QUERY_CANCEL_DURATION)
	defer cancel()

	query := `
		SELECT
			fd.id,
			fd.enrollment_id,
			s.id,
			s.full_name,
			b.id,
			b.name,
			p.id,
			p.name,
			fd.billing_month,
			fd.amount_paise,
			fd.due_date,
			fd.status,
			fd.notes,
			fd.created_at,
			fd.updated_at
		FROM fee_dues fd
		JOIN enrollments e ON e.id = fd.enrollment_id
		JOIN students s ON s.id = e.student_id
		JOIN users u ON u.id = s.user_id
		JOIN batches b ON b.id = e.batch_id
		JOIN programs p ON p.id = b.program_id
		WHERE u.id = $1
		ORDER BY fd.billing_month DESC, fd.id DESC
	`

	rows, err := s.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	fees := make([]FeeDueWithDetails, 0)

	for rows.Next() {
		var fee FeeDueWithDetails

		if err := rows.Scan(
			&fee.ID,
			&fee.EnrollmentID,
			&fee.StudentID,
			&fee.StudentName,
			&fee.BatchID,
			&fee.BatchName,
			&fee.ProgramID,
			&fee.ProgramName,
			&fee.BillingMonth,
			&fee.AmountPaise,
			&fee.DueDate,
			&fee.Status,
			&fee.Notes,
			&fee.CreatedAt,
			&fee.UpdatedAt,
		); err != nil {
			return nil, err
		}

		fees = append(fees, fee)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return fees, nil
}

func (s *FeeDueStore) GetByBillingMonth(ctx context.Context, billingMonth time.Time) ([]FeeDue, error) {
	ctx, cancel := context.WithTimeout(ctx, QUERY_CANCEL_DURATION)
	defer cancel()

	query := `
		SELECT
			id,
			enrollment_id,
			billing_month,
			amount_paise,
			due_date,
			status,
			notes,
			paid_at,
			marked_paid_by,
			created_at,
			updated_at
		FROM fee_dues
		WHERE billing_month = $1
		ORDER BY due_date ASC, id ASC
	`

	rows, err := s.db.QueryContext(ctx, query, billingMonth)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	fees := make([]FeeDue, 0)

	for rows.Next() {
		var fee FeeDue

		if err := rows.Scan(
			&fee.ID,
			&fee.EnrollmentID,
			&fee.BillingMonth,
			&fee.AmountPaise,
			&fee.DueDate,
			&fee.Status,
			&fee.Notes,
			&fee.PaidAt,
			&fee.MarkedPaidBy,
			&fee.CreatedAt,
			&fee.UpdatedAt,
		); err != nil {
			return nil, err
		}

		fees = append(fees, fee)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return fees, nil
}

func (s *FeeDueStore) UpdateByID(ctx context.Context, feeDueID int64, payload UpdateFeeDuePayload) (*FeeDue, error) {
	ctx, cancel := context.WithTimeout(ctx, QUERY_CANCEL_DURATION)
	defer cancel()

	query := `
		UPDATE fee_dues
		SET
			status = $1,
			notes = $2,
			updated_at = NOW()
		WHERE id = $3
		RETURNING
			id,
			enrollment_id,
			billing_month,
			amount_paise,
			due_date,
			status,
			notes,
			paid_at,
			marked_paid_by,
			created_at,
			updated_at
	`

	fee := &FeeDue{}

	err := s.db.QueryRowContext(
		ctx,
		query,
		payload.Status,
		payload.Notes,
		feeDueID,
	).Scan(
		&fee.ID,
		&fee.EnrollmentID,
		&fee.BillingMonth,
		&fee.AmountPaise,
		&fee.DueDate,
		&fee.Status,
		&fee.Notes,
		&fee.PaidAt,
		&fee.MarkedPaidBy,
		&fee.CreatedAt,
		&fee.UpdatedAt,
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

	return fee, nil
}

func (s *FeeDueStore) GenerateMonthlyDues(ctx context.Context, billingMonth, dueDate time.Time) (*GenerateMonthlyDuesResult, error) {
	ctx, cancel := context.WithTimeout(ctx, QUERY_CANCEL_DURATION)
	defer cancel()

	nextMonth := billingMonth.AddDate(0, 1, 0)

	query := `
		INSERT INTO fee_dues (
			enrollment_id,
			billing_month,
			amount_paise,
			due_date,
			status
		)
		SELECT
			e.id,
			$1,
			b.monthly_fee_paise,
			$2,
			'pending'
		FROM enrollments e
		JOIN batches b ON b.id = e.batch_id
		WHERE
			e.joined_at < $3
			AND (
				e.left_at IS NULL
				OR e.left_at >= $1
			)
			AND e.status != 'cancelled'
		ON CONFLICT (enrollment_id, billing_month)
		DO NOTHING
	`

	result, err := s.db.ExecContext(ctx, query, billingMonth, dueDate, nextMonth)
	if err != nil {
		switch {
		case isForeignKeyViolation(err):
			return nil, ErrNotFound
		case isCheckViolation(err):
			return nil, ErrInvalidInput
		default:
			return nil, err
		}
	}

	created, err := result.RowsAffected()
	if err != nil {
		return nil, err
	}

	return &GenerateMonthlyDuesResult{
		Created: created,
	}, nil
}

func (s *FeeDueStore) GetRegister(ctx context.Context, filter FeeRegisterFilter) (*PaginatedFeeRegister, error) {
	ctx, cancel := context.WithTimeout(ctx, QUERY_CANCEL_DURATION)
	defer cancel()

	search := "%" + filter.Search + "%"
	offset := (filter.Page - 1) * filter.PageSize

	countQuery := `
		SELECT COUNT(*)
		FROM fee_dues fd
		JOIN enrollments e ON e.id = fd.enrollment_id
		JOIN students s ON s.id = e.student_id
		JOIN users u ON u.id = s.user_id
		JOIN batches b ON b.id = e.batch_id
		JOIN programs p ON p.id = b.program_id
		WHERE fd.billing_month = $1
			AND ($2 = '' OR fd.status = $2)
			AND (
				$3 = '' OR
				s.full_name ILIKE $4 OR
				u.username ILIKE $4 OR
				u.email ILIKE $4 OR
				b.name ILIKE $4 OR
				p.name ILIKE $4
			)
	`

	var total int64

	if err := s.db.QueryRowContext(
		ctx,
		countQuery,
		filter.BillingMonth,
		filter.Status,
		filter.Search,
		search,
	).Scan(&total); err != nil {
		return nil, err
	}

	query := `
		SELECT
			fd.id,
			fd.enrollment_id,
			s.id,
			s.full_name,
			b.id,
			b.name,
			p.id,
			p.name,
			fd.billing_month,
			fd.amount_paise,
			fd.due_date,
			fd.status,
			fd.notes,
			fd.paid_at,
			fd.marked_paid_by,
			fd.created_at,
			fd.updated_at
		FROM fee_dues fd
		JOIN enrollments e ON e.id = fd.enrollment_id
		JOIN students s ON s.id = e.student_id
		JOIN users u ON u.id = s.user_id
		JOIN batches b ON b.id = e.batch_id
		JOIN programs p ON p.id = b.program_id
		WHERE fd.billing_month = $1
			AND ($2 = '' OR fd.status = $2)
			AND (
				$3 = '' OR
				s.full_name ILIKE $4 OR
				u.username ILIKE $4 OR
				u.email ILIKE $4 OR
				b.name ILIKE $4 OR
				p.name ILIKE $4
			)
		ORDER BY s.full_name ASC, fd.id ASC
		LIMIT $5 OFFSET $6
	`

	rows, err := s.db.QueryContext(
		ctx,
		query,
		filter.BillingMonth,
		filter.Status,
		filter.Search,
		search,
		filter.PageSize,
		offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	fees := make([]FeeDueWithDetails, 0, filter.PageSize)

	for rows.Next() {
		var fee FeeDueWithDetails

		if err := rows.Scan(
			&fee.ID,
			&fee.EnrollmentID,
			&fee.StudentID,
			&fee.StudentName,
			&fee.BatchID,
			&fee.BatchName,
			&fee.ProgramID,
			&fee.ProgramName,
			&fee.BillingMonth,
			&fee.AmountPaise,
			&fee.DueDate,
			&fee.Status,
			&fee.Notes,
			&fee.PaidAt,
			&fee.MarkedPaidBy,
			&fee.CreatedAt,
			&fee.UpdatedAt,
		); err != nil {
			return nil, err
		}

		fees = append(fees, fee)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &PaginatedFeeRegister{
		Fees:     fees,
		Total:    total,
		Page:     filter.Page,
		PageSize: filter.PageSize,
	}, nil
}

func (s *FeeDueStore) MarkPaid(ctx context.Context, feeDueID, adminID int64, notes *string) (*FeeDue, error) {
	ctx, cancel := context.WithTimeout(ctx, QUERY_CANCEL_DURATION)
	defer cancel()

	query := `
		UPDATE fee_dues
		SET
			status = 'paid',
			paid_at = NOW(),
			marked_paid_by = $1,
			notes = COALESCE($2, notes),
			updated_at = NOW()
		WHERE id = $3
			AND status = 'pending'
		RETURNING
			id,
			enrollment_id,
			billing_month,
			amount_paise,
			due_date,
			status,
			notes,
			paid_at,
			marked_paid_by,
			created_at,
			updated_at
	`

	fee := &FeeDue{}

	err := s.db.QueryRowContext(ctx, query, adminID, notes, feeDueID).Scan(
		&fee.ID,
		&fee.EnrollmentID,
		&fee.BillingMonth,
		&fee.AmountPaise,
		&fee.DueDate,
		&fee.Status,
		&fee.Notes,
		&fee.PaidAt,
		&fee.MarkedPaidBy,
		&fee.CreatedAt,
		&fee.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}

		if isForeignKeyViolation(err) {
			return nil, ErrNotFound
		}

		return nil, err
	}

	return fee, nil
}
