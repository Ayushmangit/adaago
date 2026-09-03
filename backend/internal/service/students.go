package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/Ayushmangit/adaago.git/backend/internal/store"
)

var (
	ErrStudentProfileExists = errors.New(
		"student profile already exists",
	)
	ErrStudentRoleRequired = errors.New(
		"only student accounts can create a student profile",
	)
	ErrStudentNameRequired = errors.New(
		"student full name is required",
	)
	ErrInvalidDateOfBirth = errors.New(
		"date_of_birth must use YYYY-MM-DD format",
	)
	ErrFutureDateOfBirth = errors.New(
		"date of birth cannot be in the future",
	)
	ErrInvalidStudentStatus = errors.New(
		"student status must be active or inactive",
	)
)

type StudentService struct {
	store store.Storage
}

type CreateStudentProfileInput struct {
	FullName      string  `json:"full_name" validate:"required,min=2,max=100"`
	Phone         *string `json:"phone" validate:"omitempty,max=20"`
	DateOfBirth   *string `json:"date_of_birth"`
	GuardianName  *string `json:"guardian_name" validate:"omitempty,max=100"`
	GuardianPhone *string `json:"guardian_phone" validate:"omitempty,max=20"`
	Address       *string `json:"address" validate:"omitempty,max=500"`
}

func (s *StudentService) CreateProfile(
	ctx context.Context,
	user *store.User,
	input CreateStudentProfileInput,
) (*store.Student, error) {
	if user.Role != store.RoleStudent {
		return nil, ErrStudentRoleRequired
	}

	exists, err := s.store.Students.ExistsByUserID(
		ctx,
		user.ID,
	)
	if err != nil {
		return nil, err
	}

	if exists {
		return nil, ErrStudentProfileExists
	}

	fullName := strings.TrimSpace(input.FullName)
	if fullName == "" {
		return nil, ErrStudentNameRequired
	}

	dateOfBirth, err := parseOptionalDate(
		input.DateOfBirth,
	)
	if err != nil {
		return nil, err
	}

	student := &store.Student{
		UserID:        user.ID,
		FullName:      fullName,
		Phone:         normalizeStudentString(input.Phone),
		DateOfBirth:   dateOfBirth,
		GuardianName:  normalizeStudentString(input.GuardianName),
		GuardianPhone: normalizeStudentString(input.GuardianPhone),
		Address:       normalizeStudentString(input.Address),
		JoinedAt:      time.Now().UTC(),
		Status:        store.StudentStatusActive,
	}

	if err := s.store.Students.Create(
		ctx,
		student,
	); err != nil {
		if errors.Is(
			err,
			store.ErrStudentProfileExists,
		) {
			return nil, ErrStudentProfileExists
		}

		return nil, err
	}

	return student, nil
}

func (s *StudentService) GetProfile(
	ctx context.Context,
	userID int64,
) (*store.StudentWithUser, error) {
	if userID < 1 {
		return nil, store.ErrInvalidID
	}

	return s.store.Students.GetByUserID(
		ctx,
		userID,
	)
}

type UpdateStudentProfileInput struct {
	FullName      *string `json:"full_name" validate:"omitempty,min=2,max=100"`
	Phone         *string `json:"phone" validate:"omitempty,max=20"`
	DateOfBirth   *string `json:"date_of_birth"`
	GuardianName  *string `json:"guardian_name" validate:"omitempty,max=100"`
	GuardianPhone *string `json:"guardian_phone" validate:"omitempty,max=20"`
	Address       *string `json:"address" validate:"omitempty,max=500"`
}

func (s *StudentService) UpdateProfile(
	ctx context.Context,
	userID int64,
	input UpdateStudentProfileInput,
) (*store.StudentWithUser, error) {
	if userID < 1 {
		return nil, store.ErrInvalidID
	}

	if input.FullName == nil &&
		input.Phone == nil &&
		input.DateOfBirth == nil &&
		input.GuardianName == nil &&
		input.GuardianPhone == nil &&
		input.Address == nil {
		return nil, ErrEmptyUpdate
	}

	currentStudent, err := s.store.Students.GetByUserID(
		ctx,
		userID,
	)
	if err != nil {
		return nil, err
	}

	var fullName *string

	if input.FullName != nil {
		value := strings.TrimSpace(*input.FullName)
		if value == "" {
			return nil, ErrStudentNameRequired
		}

		fullName = &value
	}

	dateOfBirth, err := parseOptionalDate(
		input.DateOfBirth,
	)
	if err != nil {
		return nil, err
	}

	payload := store.UpdateStudentPayload{
		FullName:      fullName,
		Phone:         normalizeStudentString(input.Phone),
		DateOfBirth:   dateOfBirth,
		GuardianName:  normalizeStudentString(input.GuardianName),
		GuardianPhone: normalizeStudentString(input.GuardianPhone),
		Address:       normalizeStudentString(input.Address),
	}

	return s.store.Students.UpdateByID(
		ctx,
		currentStudent.ID,
		payload,
	)
}

func (s *StudentService) GetAll(
	ctx context.Context,
) ([]store.StudentWithUser, error) {
	return s.store.Students.GetAll(ctx)
}

func (s *StudentService) GetByID(
	ctx context.Context,
	studentID int64,
) (*store.StudentWithUser, error) {
	if studentID < 1 {
		return nil, store.ErrInvalidID
	}

	return s.store.Students.GetByID(
		ctx,
		studentID,
	)
}

type AdminUpdateStudentInput struct {
	FullName      *string              `json:"full_name" validate:"omitempty,min=2,max=100"`
	Phone         *string              `json:"phone" validate:"omitempty,max=20"`
	DateOfBirth   *string              `json:"date_of_birth"`
	GuardianName  *string              `json:"guardian_name" validate:"omitempty,max=100"`
	GuardianPhone *string              `json:"guardian_phone" validate:"omitempty,max=20"`
	Address       *string              `json:"address" validate:"omitempty,max=500"`
	Status        *store.StudentStatus `json:"status" validate:"omitempty,oneof=active inactive"`
}

func (s *StudentService) UpdateByID(
	ctx context.Context,
	studentID int64,
	input AdminUpdateStudentInput,
) (*store.StudentWithUser, error) {
	if studentID < 1 {
		return nil, store.ErrInvalidID
	}

	if input.FullName == nil &&
		input.Phone == nil &&
		input.DateOfBirth == nil &&
		input.GuardianName == nil &&
		input.GuardianPhone == nil &&
		input.Address == nil &&
		input.Status == nil {
		return nil, ErrEmptyUpdate
	}

	var fullName *string

	if input.FullName != nil {
		value := strings.TrimSpace(*input.FullName)
		if value == "" {
			return nil, ErrStudentNameRequired
		}

		fullName = &value
	}

	dateOfBirth, err := parseOptionalDate(
		input.DateOfBirth,
	)
	if err != nil {
		return nil, err
	}

	if input.Status != nil &&
		*input.Status != store.StudentStatusActive &&
		*input.Status != store.StudentStatusInactive {
		return nil, ErrInvalidStudentStatus
	}

	payload := store.UpdateStudentPayload{
		FullName:      fullName,
		Phone:         normalizeStudentString(input.Phone),
		DateOfBirth:   dateOfBirth,
		GuardianName:  normalizeStudentString(input.GuardianName),
		GuardianPhone: normalizeStudentString(input.GuardianPhone),
		Address:       normalizeStudentString(input.Address),
		Status:        input.Status,
	}

	return s.store.Students.UpdateByID(
		ctx,
		studentID,
		payload,
	)
}

func parseOptionalDate(
	value *string,
) (*time.Time, error) {
	if value == nil {
		return nil, nil
	}

	date, err := time.Parse(
		"2006-01-02",
		strings.TrimSpace(*value),
	)
	if err != nil {
		return nil, ErrInvalidDateOfBirth
	}

	now := time.Now().UTC()

	if date.After(now) {
		return nil, ErrFutureDateOfBirth
	}

	return &date, nil
}

func normalizeStudentString(
	value *string,
) *string {
	if value == nil {
		return nil
	}

	normalized := strings.TrimSpace(*value)
	return &normalized
}
