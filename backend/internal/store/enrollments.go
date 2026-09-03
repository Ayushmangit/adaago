package store

import "time"

type EnrollmentStatus string

const (
	EnrollmentStatusActive    EnrollmentStatus = "active"
	EnrollmentStatusCompleted EnrollmentStatus = "completed"
	EnrollmentStatusCancelled EnrollmentStatus = "cancelled"
)

type Enrollment struct {
	ID        int64            `json:"id"`
	StudentID int64            `json:"student_id"`
	BatchID   int64            `json:"batch_id"`
	JoinedAt  time.Time        `json:"joined_at"`
	LeftAt    *time.Time       `json:"left_at,omitempty"`
	Status    EnrollmentStatus `json:"status"`
	CreatedAt time.Time        `json:"created_at"`
	UpdatedAt time.Time        `json:"updated_at"`
}
