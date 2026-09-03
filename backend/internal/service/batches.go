package service

import (
	"context"
	"errors"
	"slices"
	"strings"
	"time"

	"github.com/Ayushmangit/adaago.git/backend/internal/store"
	"github.com/lib/pq"
)

var (
	ErrBatchNameRequired = errors.New("batch name is required")
	ErrBatchNameConflict = errors.New("batch name already exists for this program")
	ErrInvalidBatchTime  = errors.New("end time must be later than start time")
	ErrInvalidWeekdays   = errors.New("weekdays must contain values between 1 and 7")
	ErrInvalidMonthlyFee = errors.New("monthly fee must be greater than zero")
	ErrInvalidCapacity   = errors.New("capacity must be greater than zero")
	ErrProgramInactive   = errors.New("cannot create a batch under an inactive program")
)

type BatchService struct {
	store store.Storage
}

type CreateBatchInput struct {
	ProgramID       int64   `json:"program_id" validate:"required,min=1"`
	Name            string  `json:"name" validate:"required,min=2,max=100"`
	StartTime       string  `json:"start_time" validate:"required"`
	EndTime         string  `json:"end_time" validate:"required"`
	Weekdays        []int64 `json:"weekdays" validate:"required,min=1,dive,min=1,max=7"`
	MonthlyFeePaise int64   `json:"monthly_fee_paise" validate:"required,min=1"`
	Capacity        *int    `json:"capacity" validate:"omitempty,min=1"`
}

func (s *BatchService) Create(
	ctx context.Context,
	input CreateBatchInput,
) (*store.Batch, error) {
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return nil, ErrBatchNameRequired
	}

	program, err := s.store.Programs.GetByID(ctx, input.ProgramID)
	if err != nil {
		return nil, err
	}

	if !program.IsActive {
		return nil, ErrProgramInactive
	}

	startTime, err := parseBatchTime(input.StartTime)
	if err != nil {
		return nil, err
	}

	endTime, err := parseBatchTime(input.EndTime)
	if err != nil {
		return nil, err
	}

	if !endTime.After(startTime) {
		return nil, ErrInvalidBatchTime
	}

	weekdays, err := normalizeWeekdays(input.Weekdays)
	if err != nil {
		return nil, err
	}

	if input.MonthlyFeePaise <= 0 {
		return nil, ErrInvalidMonthlyFee
	}

	if input.Capacity != nil && *input.Capacity <= 0 {
		return nil, ErrInvalidCapacity
	}

	batch := &store.Batch{
		ProgramID:       input.ProgramID,
		Name:            name,
		StartTime:       formatBatchTime(startTime),
		EndTime:         formatBatchTime(endTime),
		Weekdays:        pq.Int64Array(weekdays),
		MonthlyFeePaise: input.MonthlyFeePaise,
		Capacity:        input.Capacity,
		IsActive:        true,
	}

	if err := s.store.Batches.Create(ctx, batch); err != nil {
		switch {
		case errors.Is(err, store.ErrConflict):
			return nil, ErrBatchNameConflict

		case errors.Is(err, store.ErrInvalidInput):
			return nil, ErrInvalidBatchTime

		default:
			return nil, err
		}
	}

	return batch, nil
}

func parseBatchTime(value string) (time.Time, error) {
	parsedTime, err := time.Parse("15:04", strings.TrimSpace(value))
	if err != nil {
		return time.Time{}, errors.New(
			"time must use HH:MM format",
		)
	}

	return parsedTime, nil
}

func formatBatchTime(value time.Time) string {
	return value.Format("15:04")
}

func normalizeWeekdays(
	weekdays []int64,
) ([]int64, error) {
	if len(weekdays) == 0 {
		return nil, ErrInvalidWeekdays
	}

	seen := make(map[int64]struct{}, len(weekdays))
	normalized := make([]int64, 0, len(weekdays))

	for _, weekday := range weekdays {
		if weekday < 1 || weekday > 7 {
			return nil, ErrInvalidWeekdays
		}

		if _, exists := seen[weekday]; exists {
			continue
		}

		seen[weekday] = struct{}{}
		normalized = append(normalized, weekday)
	}

	slices.Sort(normalized)

	return normalized, nil
}

func (s *BatchService) GetAll(
	ctx context.Context,
) ([]store.Batch, error) {
	return s.store.Batches.GetAll(ctx)
}

func (s *BatchService) GetByProgramID(
	ctx context.Context,
	programID int64,
) ([]store.Batch, error) {
	if programID < 1 {
		return nil, store.ErrInvalidID
	}

	// Ensure the program actually exists.
	if _, err := s.store.Programs.GetByID(
		ctx,
		programID,
	); err != nil {
		return nil, err
	}

	return s.store.Batches.GetByProgramID(
		ctx,
		programID,
	)
}

func (s *BatchService) GetByID(
	ctx context.Context,
	batchID int64,
) (*store.Batch, error) {
	if batchID < 1 {
		return nil, store.ErrInvalidID
	}

	return s.store.Batches.GetByID(ctx, batchID)
}

type UpdateBatchInput struct {
	Name            *string `json:"name" validate:"omitempty,min=2,max=100"`
	StartTime       *string `json:"start_time"`
	EndTime         *string `json:"end_time"`
	Weekdays        []int64 `json:"weekdays" validate:"omitempty,min=1,dive,min=1,max=7"`
	MonthlyFeePaise *int64  `json:"monthly_fee_paise" validate:"omitempty,min=1"`
	Capacity        *int    `json:"capacity" validate:"omitempty,min=1"`
	IsActive        *bool   `json:"is_active"`
}

func (s *BatchService) UpdateByID(
	ctx context.Context,
	batchID int64,
	input UpdateBatchInput,
) (*store.Batch, error) {
	if batchID < 1 {
		return nil, store.ErrInvalidID
	}

	if input.Name == nil &&
		input.StartTime == nil &&
		input.EndTime == nil &&
		input.Weekdays == nil &&
		input.MonthlyFeePaise == nil &&
		input.Capacity == nil &&
		input.IsActive == nil {
		return nil, ErrEmptyUpdate
	}

	currentBatch, err := s.store.Batches.GetByID(
		ctx,
		batchID,
	)
	if err != nil {
		return nil, err
	}

	var name *string

	if input.Name != nil {
		normalizedName := strings.TrimSpace(*input.Name)

		if normalizedName == "" {
			return nil, ErrBatchNameRequired
		}

		name = &normalizedName
	}

	startTime, err := parseStoredBatchTime(
		currentBatch.StartTime,
	)
	if err != nil {
		return nil, err
	}

	endTime, err := parseStoredBatchTime(
		currentBatch.EndTime,
	)
	if err != nil {
		return nil, err
	}

	var normalizedStartTime *string

	if input.StartTime != nil {
		startTime, err = parseBatchTime(*input.StartTime)
		if err != nil {
			return nil, err
		}

		value := formatBatchTime(startTime)
		normalizedStartTime = &value
	}

	var normalizedEndTime *string

	if input.EndTime != nil {
		endTime, err = parseBatchTime(*input.EndTime)
		if err != nil {
			return nil, err
		}

		value := formatBatchTime(endTime)
		normalizedEndTime = &value
	}

	if !endTime.After(startTime) {
		return nil, ErrInvalidBatchTime
	}

	var weekdays *pq.Int64Array

	if input.Weekdays != nil {
		normalizedWeekdays, err := normalizeWeekdays(
			input.Weekdays,
		)
		if err != nil {
			return nil, err
		}

		value := pq.Int64Array(normalizedWeekdays)
		weekdays = &value
	}

	if input.MonthlyFeePaise != nil &&
		*input.MonthlyFeePaise <= 0 {
		return nil, ErrInvalidMonthlyFee
	}

	if input.Capacity != nil && *input.Capacity <= 0 {
		return nil, ErrInvalidCapacity
	}

	payload := store.UpdateBatchPayload{
		Name:            name,
		StartTime:       normalizedStartTime,
		EndTime:         normalizedEndTime,
		Weekdays:        weekdays,
		MonthlyFeePaise: input.MonthlyFeePaise,
		Capacity:        input.Capacity,
		IsActive:        input.IsActive,
	}

	batch, err := s.store.Batches.UpdateByID(
		ctx,
		batchID,
		payload,
	)
	if err != nil {
		switch {
		case errors.Is(err, store.ErrConflict):
			return nil, ErrBatchNameConflict

		case errors.Is(err, store.ErrInvalidInput):
			return nil, ErrInvalidBatchTime

		default:
			return nil, err
		}
	}

	return batch, nil
}

func parseStoredBatchTime(value string) (time.Time, error) {
	value = strings.TrimSpace(value)

	formats := []string{
		"15:04",
		"15:04:05",
	}

	for _, format := range formats {
		parsedTime, err := time.Parse(format, value)
		if err == nil {
			return parsedTime, nil
		}
	}

	return time.Time{}, errors.New(
		"stored batch time has an invalid format",
	)
}
