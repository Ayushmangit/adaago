package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/Ayushmangit/adaago.git/backend/internal/store"
)

var (
	ErrInvalidBillingMonth = errors.New("invalid billing month")
	ErrInvalidDueDate      = errors.New("invalid due date")
)

type FeeDueService struct {
	store store.Storage
}

func NewFeeDueService(store store.Storage) *FeeDueService {
	return &FeeDueService{store: store}
}

type GenerateFeeDuesInput struct {
	BillingMonth time.Time
	DueDate      time.Time
}

func (s *FeeDueService) GenerateForEnrollment(ctx context.Context, enrollmentID int64, input GenerateFeeDuesInput) (*store.FeeDue, error) {
	if enrollmentID <= 0 {
		return nil, store.ErrInvalidID
	}

	if input.BillingMonth.IsZero() {
		return nil, ErrInvalidBillingMonth
	}

	billingMonth := normalizeMonth(input.BillingMonth)

	if input.DueDate.IsZero() {
		return nil, ErrInvalidDueDate
	}

	enrollment, err := s.store.Enrollments.GetByID(ctx, enrollmentID)
	if err != nil {
		return nil, err
	}

	if enrollment.Status != store.EnrollmentStatusActive {
		return nil, errors.New("enrollment is not active")
	}

	if enrollment.JoinedAt.After(endOfMonth(billingMonth)) {
		return nil, errors.New("student was not enrolled during billing month")
	}

	batch, err := s.store.Batches.GetByID(ctx, enrollment.BatchID)
	if err != nil {
		return nil, err
	}

	fee := &store.FeeDue{
		EnrollmentID: enrollment.ID,
		BillingMonth: billingMonth,
		AmountPaise:  batch.MonthlyFeePaise,
		DueDate:      input.DueDate,
		Status:       store.FeeDueStatusPending,
	}

	if err := s.store.FeeDues.Create(ctx, fee); err != nil {
		return nil, err
	}

	return fee, nil
}

func (s *FeeDueService) GetByID(ctx context.Context, feeDueID int64) (*store.FeeDue, error) {
	if feeDueID <= 0 {
		return nil, store.ErrInvalidID
	}

	return s.store.FeeDues.GetByID(ctx, feeDueID)
}

func (s *FeeDueService) GetByEnrollmentID(ctx context.Context, enrollmentID int64) ([]store.FeeDue, error) {
	if enrollmentID <= 0 {
		return nil, store.ErrInvalidID
	}

	return s.store.FeeDues.GetByEnrollmentID(ctx, enrollmentID)
}

func (s *FeeDueService) GetByBillingMonth(ctx context.Context, billingMonth time.Time) ([]store.FeeDue, error) {
	if billingMonth.IsZero() {
		return nil, ErrInvalidBillingMonth
	}

	return s.store.FeeDues.GetByBillingMonth(ctx, normalizeMonth(billingMonth))
}

func normalizeMonth(value time.Time) time.Time {
	return time.Date(
		value.Year(),
		value.Month(),
		1,
		0,
		0,
		0,
		0,
		value.Location(),
	)
}

func endOfMonth(value time.Time) time.Time {
	return normalizeMonth(value).
		AddDate(0, 1, 0).
		Add(-time.Nanosecond)
}

type GenerateMonthlyFeeDuesResult struct {
	Created int `json:"created"`
	Skipped int `json:"skipped"`
}

func (s *FeeDueService) GenerateMonthlyDues(ctx context.Context, input GenerateFeeDuesInput) (*store.GenerateMonthlyDuesResult, error) {
	if input.BillingMonth.IsZero() {
		return nil, ErrInvalidBillingMonth
	}

	if input.DueDate.IsZero() {
		return nil, ErrInvalidDueDate
	}

	billingMonth := normalizeMonth(input.BillingMonth)

	if input.DueDate.Before(billingMonth) {
		return nil, ErrInvalidDueDate
	}

	return s.store.FeeDues.GenerateMonthlyDues(
		ctx,
		billingMonth,
		input.DueDate,
	)
}

type GetFeeRegisterInput struct {
	BillingMonth time.Time
	Search       string
	Status       store.FeeDueStatus
	Page         int
	PageSize     int
}

func (s *FeeDueService) GetRegister(ctx context.Context, input GetFeeRegisterInput) (*store.PaginatedFeeRegister, error) {
	if input.BillingMonth.IsZero() {
		return nil, ErrInvalidBillingMonth
	}

	if input.Page <= 0 {
		input.Page = 1
	}

	if input.PageSize <= 0 {
		input.PageSize = 20
	}

	if input.PageSize > 100 {
		input.PageSize = 100
	}

	input.Search = strings.TrimSpace(input.Search)

	return s.store.FeeDues.GetRegister(ctx, store.FeeRegisterFilter{
		BillingMonth: normalizeMonth(input.BillingMonth),
		Search:       input.Search,
		Status:       input.Status,
		Page:         input.Page,
		PageSize:     input.PageSize,
	})
}

func (s *FeeDueService) MarkPaid(ctx context.Context, feeDueID, adminID int64, notes *string) (*store.FeeDue, error) {
	if feeDueID <= 0 || adminID <= 0 {
		return nil, store.ErrInvalidID
	}

	return s.store.FeeDues.MarkPaid(ctx, feeDueID, adminID, notes)
}
