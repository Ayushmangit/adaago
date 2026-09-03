package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

var ErrStudentProfileExists = errors.New(
	"student profile already exists",
)

type StudentStatus string

const (
	StudentStatusActive   StudentStatus = "active"
	StudentStatusInactive StudentStatus = "inactive"
)

type StudentStore struct {
	db *sql.DB
}

type Student struct {
	ID            int64         `json:"id"`
	UserID        int64         `json:"user_id"`
	FullName      string        `json:"full_name"`
	Phone         *string       `json:"phone,omitempty"`
	DateOfBirth   *time.Time    `json:"date_of_birth,omitempty"`
	GuardianName  *string       `json:"guardian_name,omitempty"`
	GuardianPhone *string       `json:"guardian_phone,omitempty"`
	Address       *string       `json:"address,omitempty"`
	JoinedAt      time.Time     `json:"joined_at"`
	Status        StudentStatus `json:"status"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`
}

type StudentWithUser struct {
	Student

	Username string   `json:"username"`
	Email    string   `json:"email"`
	Role     RoleType `json:"role"`
}

type UpdateStudentPayload struct {
	FullName      *string        `json:"full_name"`
	Phone         *string        `json:"phone"`
	DateOfBirth   *time.Time     `json:"date_of_birth"`
	GuardianName  *string        `json:"guardian_name"`
	GuardianPhone *string        `json:"guardian_phone"`
	Address       *string        `json:"address"`
	Status        *StudentStatus `json:"status"`
}

func (s *StudentStore) Create(
	ctx context.Context,
	student *Student,
) error {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		INSERT INTO students (
			user_id,
			full_name,
			phone,
			date_of_birth,
			guardian_name,
			guardian_phone,
			address,
			joined_at,
			status
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING
			id,
			created_at,
			updated_at
	`

	err := s.db.QueryRowContext(
		ctx,
		query,
		student.UserID,
		student.FullName,
		student.Phone,
		student.DateOfBirth,
		student.GuardianName,
		student.GuardianPhone,
		student.Address,
		student.JoinedAt,
		student.Status,
	).Scan(
		&student.ID,
		&student.CreatedAt,
		&student.UpdatedAt,
	)
	if err != nil {
		switch {
		case isUniqueViolation(err):
			return ErrStudentProfileExists

		case isForeignKeyViolation(err):
			return ErrNotFound

		case isNotNullViolation(err),
			isCheckViolation(err):
			return ErrInvalidInput

		default:
			return err
		}
	}

	return nil
}

func (s *StudentStore) ExistsByUserID(
	ctx context.Context,
	userID int64,
) (bool, error) {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		SELECT EXISTS (
			SELECT 1
			FROM students
			WHERE user_id = $1
		)
	`

	var exists bool

	err := s.db.QueryRowContext(
		ctx,
		query,
		userID,
	).Scan(&exists)
	if err != nil {
		return false, err
	}

	return exists, nil
}

func (s *StudentStore) GetByID(
	ctx context.Context,
	studentID int64,
) (*StudentWithUser, error) {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		SELECT
			s.id,
			s.user_id,
			s.full_name,
			s.phone,
			s.date_of_birth,
			s.guardian_name,
			s.guardian_phone,
			s.address,
			s.joined_at,
			s.status,
			s.created_at,
			s.updated_at,
			u.username,
			u.email,
			u.role
		FROM students s
		INNER JOIN users u
			ON u.id = s.user_id
		WHERE s.id = $1
	`

	student := &StudentWithUser{}

	err := scanStudentWithUser(
		s.db.QueryRowContext(
			ctx,
			query,
			studentID,
		),
		student,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}

		return nil, err
	}

	return student, nil
}

func (s *StudentStore) GetByUserID(
	ctx context.Context,
	userID int64,
) (*StudentWithUser, error) {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		SELECT
			s.id,
			s.user_id,
			s.full_name,
			s.phone,
			s.date_of_birth,
			s.guardian_name,
			s.guardian_phone,
			s.address,
			s.joined_at,
			s.status,
			s.created_at,
			s.updated_at,
			u.username,
			u.email,
			u.role
		FROM students s
		INNER JOIN users u
			ON u.id = s.user_id
		WHERE s.user_id = $1
	`

	student := &StudentWithUser{}

	err := scanStudentWithUser(
		s.db.QueryRowContext(
			ctx,
			query,
			userID,
		),
		student,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}

		return nil, err
	}

	return student, nil
}

func (s *StudentStore) GetAll(
	ctx context.Context,
) ([]StudentWithUser, error) {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		SELECT
			s.id,
			s.user_id,
			s.full_name,
			s.phone,
			s.date_of_birth,
			s.guardian_name,
			s.guardian_phone,
			s.address,
			s.joined_at,
			s.status,
			s.created_at,
			s.updated_at,
			u.username,
			u.email,
			u.role
		FROM students s
		INNER JOIN users u
			ON u.id = s.user_id
		ORDER BY s.full_name ASC
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	students := make([]StudentWithUser, 0)

	for rows.Next() {
		var student StudentWithUser

		if err := scanStudentWithUser(
			rows,
			&student,
		); err != nil {
			return nil, err
		}

		students = append(students, student)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return students, nil
}

func (s *StudentStore) UpdateByID(
	ctx context.Context,
	studentID int64,
	payload UpdateStudentPayload,
) (*StudentWithUser, error) {
	ctx, cancel := context.WithTimeout(
		ctx,
		QUERY_CANCEL_DURATION,
	)
	defer cancel()

	query := `
		UPDATE students
		SET
			full_name = COALESCE($1, full_name),
			phone = COALESCE($2, phone),
			date_of_birth =
				COALESCE($3, date_of_birth),
			guardian_name =
				COALESCE($4, guardian_name),
			guardian_phone =
				COALESCE($5, guardian_phone),
			address = COALESCE($6, address),
			status = COALESCE($7, status),
			updated_at = NOW()
		WHERE id = $8
		RETURNING id
	`

	var updatedStudentID int64

	err := s.db.QueryRowContext(
		ctx,
		query,
		payload.FullName,
		payload.Phone,
		payload.DateOfBirth,
		payload.GuardianName,
		payload.GuardianPhone,
		payload.Address,
		payload.Status,
		studentID,
	).Scan(&updatedStudentID)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrNotFound

		case isCheckViolation(err),
			isNotNullViolation(err):
			return nil, ErrInvalidInput

		default:
			return nil, err
		}
	}

	return s.getByID(ctx, updatedStudentID)
}

func (s *StudentStore) getByID(
	ctx context.Context,
	studentID int64,
) (*StudentWithUser, error) {
	query := `
		SELECT
			s.id,
			s.user_id,
			s.full_name,
			s.phone,
			s.date_of_birth,
			s.guardian_name,
			s.guardian_phone,
			s.address,
			s.joined_at,
			s.status,
			s.created_at,
			s.updated_at,
			u.username,
			u.email,
			u.role
		FROM students s
		INNER JOIN users u
			ON u.id = s.user_id
		WHERE s.id = $1
	`

	student := &StudentWithUser{}

	err := scanStudentWithUser(
		s.db.QueryRowContext(
			ctx,
			query,
			studentID,
		),
		student,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}

		return nil, err
	}

	return student, nil
}

type studentRowScanner interface {
	Scan(dest ...any) error
}

func scanStudentWithUser(
	row studentRowScanner,
	student *StudentWithUser,
) error {
	return row.Scan(
		&student.ID,
		&student.UserID,
		&student.FullName,
		&student.Phone,
		&student.DateOfBirth,
		&student.GuardianName,
		&student.GuardianPhone,
		&student.Address,
		&student.JoinedAt,
		&student.Status,
		&student.CreatedAt,
		&student.UpdatedAt,
		&student.Username,
		&student.Email,
		&student.Role,
	)
}
