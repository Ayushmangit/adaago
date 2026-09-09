package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/Ayushmangit/adaago.git/backend/internal/store"
)

var (
	ErrInvalidAttendanceDate = errors.New(
		"attendance_date must use YYYY-MM-DD format",
	)

	ErrFutureAttendanceDate = errors.New(
		"attendance cannot be marked for a future date",
	)

	ErrAttendanceBeforeEnrollment = errors.New(
		"attendance date cannot be before enrollment joined_at",
	)

	ErrAttendanceAfterEnrollment = errors.New(
		"attendance date cannot be after enrollment left_at",
	)

	ErrAttendanceNotBatchDay = errors.New(
		"attendance date is not a scheduled day for this batch",
	)

	ErrAttendanceAlreadyMarked = errors.New(
		"attendance has already been marked for this enrollment and date",
	)

	ErrInvalidAttendanceStatus = errors.New(
		"attendance status must be present, absent, or leave",
	)

	ErrRemarksTooLong = errors.New(
		"remarks cannot exceed 255 characters",
	)
)

type AttendanceService struct {
	store store.Storage
}

type CreateAttendanceInput struct {
	EnrollmentID   int64                  `json:"enrollment_id" validate:"required,min=1"`
	AttendanceDate string                 `json:"attendance_date" validate:"required"`
	Status         store.AttendanceStatus `json:"status" validate:"required,oneof=present absent leave"`
	Remarks        *string                `json:"remarks" validate:"omitempty,max=255"`
}

func (s *AttendanceService) Create(
	ctx context.Context,
	markedBy int64,
	input CreateAttendanceInput,
) (*store.Attendance, error) {
	if markedBy < 1 || input.EnrollmentID < 1 {
		return nil, store.ErrInvalidID
	}

	if !validAttendanceStatus(input.Status) {
		return nil, ErrInvalidAttendanceStatus
	}

	attendanceDate, err := parseAttendanceDate(
		input.AttendanceDate,
	)
	if err != nil {
		return nil, err
	}

	enrollment, err := s.store.Enrollments.GetByID(
		ctx,
		input.EnrollmentID,
	)
	if err != nil {
		return nil, err
	}

	if attendanceDate.Before(
		dateOnly(enrollment.JoinedAt),
	) {
		return nil, ErrAttendanceBeforeEnrollment
	}

	if enrollment.LeftAt != nil &&
		attendanceDate.After(
			dateOnly(*enrollment.LeftAt),
		) {
		return nil, ErrAttendanceAfterEnrollment
	}

	batch, err := s.store.Batches.GetByID(
		ctx,
		enrollment.BatchID,
	)
	if err != nil {
		return nil, err
	}

	if !isBatchWeekday(
		attendanceDate,
		batch.Weekdays,
	) {
		return nil, ErrAttendanceNotBatchDay
	}

	remarks := normalizeRemarks(input.Remarks)

	if remarks != nil && len(*remarks) > 255 {
		return nil, ErrRemarksTooLong
	}

	attendance := &store.Attendance{
		EnrollmentID:   input.EnrollmentID,
		AttendanceDate: attendanceDate,
		Status:         input.Status,
		Remarks:        remarks,
		MarkedBy:       markedBy,
	}

	if err := s.store.Attendance.Create(
		ctx,
		attendance,
	); err != nil {
		switch {
		case errors.Is(err, store.ErrConflict):
			return nil, ErrAttendanceAlreadyMarked

		case errors.Is(err, store.ErrNotFound):
			return nil, store.ErrNotFound

		case errors.Is(err, store.ErrInvalidInput):
			return nil, store.ErrInvalidInput

		default:
			return nil, err
		}
	}

	return attendance, nil
}

func (s *AttendanceService) GetByID(
	ctx context.Context,
	attendanceID int64,
) (*store.Attendance, error) {
	if attendanceID < 1 {
		return nil, store.ErrInvalidID
	}

	return s.store.Attendance.GetByID(
		ctx,
		attendanceID,
	)
}

func (s *AttendanceService) GetByEnrollmentID(
	ctx context.Context,
	enrollmentID int64,
) ([]store.Attendance, error) {
	if enrollmentID < 1 {
		return nil, store.ErrInvalidID
	}

	if _, err := s.store.Enrollments.GetByID(
		ctx,
		enrollmentID,
	); err != nil {
		return nil, err
	}

	return s.store.Attendance.GetByEnrollmentID(
		ctx,
		enrollmentID,
	)
}

func (s *AttendanceService) GetByBatchAndDate(
	ctx context.Context,
	batchID int64,
	date string,
) ([]store.Attendance, error) {
	if batchID < 1 {
		return nil, store.ErrInvalidID
	}

	if _, err := s.store.Batches.GetByID(
		ctx,
		batchID,
	); err != nil {
		return nil, err
	}

	attendanceDate, err := parseAttendanceDate(
		date,
	)
	if err != nil {
		return nil, err
	}

	return s.store.Attendance.GetByBatchIDAndDate(
		ctx,
		batchID,
		attendanceDate,
	)
}

func (s *AttendanceService) GetForUser(
	ctx context.Context,
	userID int64,
) ([]store.Attendance, error) {
	if userID < 1 {
		return nil, store.ErrInvalidID
	}

	student, err := s.store.Students.GetByUserID(
		ctx,
		userID,
	)
	if err != nil {
		return nil, err
	}

	return s.store.Attendance.GetByStudentID(
		ctx,
		student.ID,
	)
}

type UpdateAttendanceInput struct {
	Status  store.AttendanceStatus `json:"status" validate:"required,oneof=present absent leave"`
	Remarks *string                `json:"remarks" validate:"omitempty,max=255"`
}

func (s *AttendanceService) UpdateByID(
	ctx context.Context,
	attendanceID int64,
	input UpdateAttendanceInput,
) (*store.Attendance, error) {
	if attendanceID < 1 {
		return nil, store.ErrInvalidID
	}

	if !validAttendanceStatus(input.Status) {
		return nil, ErrInvalidAttendanceStatus
	}

	// Make sure the record exists first.
	if _, err := s.store.Attendance.GetByID(
		ctx,
		attendanceID,
	); err != nil {
		return nil, err
	}

	remarks := normalizeRemarks(
		input.Remarks,
	)

	if remarks != nil &&
		len(*remarks) > 255 {
		return nil, ErrRemarksTooLong
	}

	return s.store.Attendance.UpdateByID(
		ctx,
		attendanceID,
		store.UpdateAttendancePayload{
			Status:  input.Status,
			Remarks: remarks,
		},
	)
}

func parseAttendanceDate(
	value string,
) (time.Time, error) {
	value = strings.TrimSpace(value)

	date, err := time.Parse(
		"2006-01-02",
		value,
	)
	if err != nil {
		return time.Time{},
			ErrInvalidAttendanceDate
	}

	now := time.Now().UTC()

	today := time.Date(
		now.Year(),
		now.Month(),
		now.Day(),
		0,
		0,
		0,
		0,
		time.UTC,
	)

	if date.After(today) {
		return time.Time{},
			ErrFutureAttendanceDate
	}

	return date, nil
}

func validAttendanceStatus(
	status store.AttendanceStatus,
) bool {
	return status == store.AttendancePresent ||
		status == store.AttendanceAbsent ||
		status == store.AttendanceLeave
}

func normalizeRemarks(
	value *string,
) *string {
	if value == nil {
		return nil
	}

	normalized := strings.TrimSpace(
		*value,
	)

	if normalized == "" {
		return nil
	}

	return &normalized
}

func dateOnly(
	value time.Time,
) time.Time {
	value = value.UTC()

	return time.Date(
		value.Year(),
		value.Month(),
		value.Day(),
		0,
		0,
		0,
		0,
		time.UTC,
	)
}

func isBatchWeekday(
	date time.Time,
	weekdays []int64,
) bool {
	weekday := int64(
		date.Weekday(),
	)

	// Go:
	// Sunday = 0
	//
	// Your batch convention:
	// Monday = 1 ... Sunday = 7
	if weekday == 0 {
		weekday = 7
	}

	for _, day := range weekdays {
		if day == weekday {
			return true
		}
	}

	return false
}

var (
	ErrDuplicateAttendanceEnrollment = errors.New(
		"an enrollment can only appear once in a bulk attendance request",
	)

	ErrEnrollmentNotInAttendanceBatch = errors.New(
		"one or more enrollments do not belong to the selected batch",
	)
)

type BulkAttendanceRecordInput struct {
	EnrollmentID int64                  `json:"enrollment_id" validate:"required,min=1"`
	Status       store.AttendanceStatus `json:"status" validate:"required,oneof=present absent leave"`
	Remarks      *string                `json:"remarks" validate:"omitempty,max=255"`
}

type BulkAttendanceInput struct {
	AttendanceDate string                      `json:"attendance_date" validate:"required"`
	Records        []BulkAttendanceRecordInput `json:"records" validate:"required,min=1,dive"`
}

func (s *AttendanceService) BulkUpsert(
	ctx context.Context,
	batchID int64,
	markedBy int64,
	input BulkAttendanceInput,
) ([]store.Attendance, error) {
	if batchID < 1 || markedBy < 1 {
		return nil, store.ErrInvalidID
	}

	attendanceDate, err := parseAttendanceDate(
		input.AttendanceDate,
	)
	if err != nil {
		return nil, err
	}

	batch, err := s.store.Batches.GetByID(
		ctx,
		batchID,
	)
	if err != nil {
		return nil, err
	}

	if !isBatchWeekday(
		attendanceDate,
		batch.Weekdays,
	) {
		return nil, ErrAttendanceNotBatchDay
	}

	enrollments, err := s.store.Enrollments.GetByBatchID(
		ctx,
		batchID,
	)
	if err != nil {
		return nil, err
	}

	enrollmentMap := make(
		map[int64]store.Enrollment,
		len(enrollments),
	)

	for _, enrollment := range enrollments {
		enrollmentMap[enrollment.ID] = enrollment
	}

	seen := make(
		map[int64]struct{},
		len(input.Records),
	)

	records := make(
		[]store.BulkAttendanceRecord,
		0,
		len(input.Records),
	)

	for _, inputRecord := range input.Records {
		if inputRecord.EnrollmentID < 1 {
			return nil, store.ErrInvalidID
		}

		if !validAttendanceStatus(
			inputRecord.Status,
		) {
			return nil, ErrInvalidAttendanceStatus
		}

		if _, exists := seen[inputRecord.EnrollmentID]; exists {
			return nil, ErrDuplicateAttendanceEnrollment
		}

		seen[inputRecord.EnrollmentID] = struct{}{}

		enrollment, exists := enrollmentMap[inputRecord.EnrollmentID]

		if !exists {
			return nil, ErrEnrollmentNotInAttendanceBatch
		}

		if attendanceDate.Before(
			dateOnly(enrollment.JoinedAt),
		) {
			return nil, ErrAttendanceBeforeEnrollment
		}

		if enrollment.LeftAt != nil &&
			attendanceDate.After(
				dateOnly(*enrollment.LeftAt),
			) {
			return nil, ErrAttendanceAfterEnrollment
		}

		remarks := normalizeRemarks(
			inputRecord.Remarks,
		)

		if remarks != nil &&
			len(*remarks) > 255 {
			return nil, ErrRemarksTooLong
		}

		records = append(
			records,
			store.BulkAttendanceRecord{
				EnrollmentID:   inputRecord.EnrollmentID,
				AttendanceDate: attendanceDate,
				Status:         inputRecord.Status,
				Remarks:        remarks,
				MarkedBy:       markedBy,
			},
		)
	}

	return s.store.Attendance.BulkUpsert(
		ctx,
		records,
	)
}

func normalizeAttendanceDateValue(
	value time.Time,
) time.Time {
	year, month, day := value.Date()

	return time.Date(
		year,
		month,
		day,
		0,
		0,
		0,
		0,
		time.UTC,
	)
}
