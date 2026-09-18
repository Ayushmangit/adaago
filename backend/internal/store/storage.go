package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

var (
	ErrNotFound          = errors.New("not found")
	ErrDuplicateEmail    = errors.New("email already registered")
	ErrDuplicateUsername = errors.New("username already exists")
	ErrInvalidID         = errors.New("invalid ID")
	ErrConflict          = errors.New("resource conflict")
	ErrInvalidInput      = errors.New("invalid input")
)

const QUERY_CANCEL_DURATION = 5 * time.Second

type Storage struct {
	Users interface {
		Create(ctx context.Context, user *User) error
		GetByID(ctx context.Context, userID int64) (*User, error)
		GetByEmail(ctx context.Context, email string) (*User, error)
		DeleteByID(ctx context.Context, userID int64) error
		UpdateByID(ctx context.Context, userID int64, payload UpdateUserPayload) (*User, error)
		UpdatePassword(ctx context.Context, userID int64, password Password) error
	}
	Programs interface {
		Create(ctx context.Context, program *Program) error
		GetAll(ctx context.Context) ([]Program, error)
		GetByID(ctx context.Context, programID int64) (*Program, error)
		UpdateByID(
			ctx context.Context,
			programID int64,
			payload UpdateProgramPayload,
		) (*Program, error)
	}
	Batches interface {
		Create(
			ctx context.Context,
			batch *Batch,
		) error

		GetAll(
			ctx context.Context,
		) ([]Batch, error)

		GetByProgramID(
			ctx context.Context,
			programID int64,
		) ([]Batch, error)

		GetByID(
			ctx context.Context,
			batchID int64,
		) (*Batch, error)

		UpdateByID(
			ctx context.Context,
			batchID int64,
			payload UpdateBatchPayload,
		) (*Batch, error)
	}

	Students interface {
		CreateWithUser(
			ctx context.Context,
			user *User,
			student *Student,
		) error

		GetByID(
			ctx context.Context,
			studentID int64,
		) (*StudentWithUser, error)

		GetByUserID(
			ctx context.Context,
			userID int64,
		) (*StudentWithUser, error)

		GetAll(
			ctx context.Context,
			filter StudentFilter,
		) (*PaginatedStudents, error)

		UpdateByID(
			ctx context.Context,
			studentID int64,
			payload UpdateStudentPayload,
		) (*StudentWithUser, error)
	}
	Enrollments interface {
		Create(
			ctx context.Context,
			enrollment *Enrollment,
		) error

		GetByID(
			ctx context.Context,
			enrollmentID int64,
		) (*Enrollment, error)

		GetByStudentID(
			ctx context.Context,
			studentID int64,
		) ([]Enrollment, error)

		GetByBatchID(
			ctx context.Context,
			batchID int64,
		) ([]Enrollment, error)
		UpdateStatus(
			ctx context.Context,
			enrollmentID int64,
			payload UpdateEnrollmentPayload,
		) (*Enrollment, error)
	}
	Attendance interface {
		GetBatchRegister(
			ctx context.Context,
			batchID int64,
			attendanceDate time.Time,
		) ([]AttendanceRegisterRow, error)
		Create(
			ctx context.Context,
			attendance *Attendance,
		) error

		GetByID(
			ctx context.Context,
			attendanceID int64,
		) (*Attendance, error)

		GetByEnrollmentID(
			ctx context.Context,
			enrollmentID int64,
		) ([]Attendance, error)

		GetByBatchIDAndDate(
			ctx context.Context,
			batchID int64,
			attendanceDate time.Time,
		) ([]Attendance, error)

		GetByStudentID(
			ctx context.Context,
			studentID int64,
		) ([]Attendance, error)

		UpdateByID(
			ctx context.Context,
			attendanceID int64,
			payload UpdateAttendancePayload,
		) (*Attendance, error)

		BulkUpsert(
			ctx context.Context,
			records []BulkAttendanceRecord,
		) ([]Attendance, error)
	}
	FeeDues interface {
		Create(ctx context.Context, fee *FeeDue) error
		GetByID(ctx context.Context, feeDueID int64) (*FeeDue, error)
		GetByEnrollmentID(ctx context.Context, enrollmentID int64) ([]FeeDue, error)
		GetByUserID(ctx context.Context, userID int64) ([]FeeDueWithDetails, error)
		GetByBillingMonth(ctx context.Context, billingMonth time.Time) ([]FeeDue, error)
		GenerateMonthlyDues(ctx context.Context, billingMonth, dueDate time.Time) (*GenerateMonthlyDuesResult, error)
		UpdateByID(ctx context.Context, feeDueID int64, payload UpdateFeeDuePayload) (*FeeDue, error)
		GetRegister(ctx context.Context, filter FeeRegisterFilter) (*PaginatedFeeRegister, error)
		MarkPaid(ctx context.Context, feeDueID, adminID int64, notes *string) (*FeeDue, error)
	}
	Dashboard interface {
		GetSummary(ctx context.Context) (*DashboardSummary, error)
	}
	StudentDashboard interface {
		GetSummary(ctx context.Context, userID int64) (*StudentDashboardSummary, error)
	}
}

func NewStorage(db *sql.DB) Storage {
	return Storage{
		Users:            &UserStore{db},
		Programs:         &ProgramStore{db},
		Batches:          &BatchStore{db},
		Students:         &StudentStore{db},
		Enrollments:      &EnrollmentStore{db},
		Attendance:       &AttendanceStore{db},
		FeeDues:          &FeeDueStore{db},
		Dashboard:        &DashboardStore{db},
		StudentDashboard: &StudentDashboardStore{db},
	}
}

func withTx(db *sql.DB, ctx context.Context, fn func(*sql.Tx) error) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	if err := fn(tx); err != nil {
		_ = tx.Rollback()
		return err
	}

	return tx.Commit()
}
