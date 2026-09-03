package store

import "time"

type AttendanceStatus string

const (
	AttendancePresent AttendanceStatus = "present"
	AttendanceAbsent  AttendanceStatus = "absent"
	AttendanceLeave   AttendanceStatus = "leave"
)

type Attendance struct {
	ID             int64            `json:"id"`
	EnrollmentID   int64            `json:"enrollment_id"`
	AttendanceDate time.Time        `json:"attendance_date"`
	Status         AttendanceStatus `json:"status"`
	Remarks        *string          `json:"remarks,omitempty"`
	MarkedBy       int64            `json:"marked_by"`
	MarkedAt       time.Time        `json:"marked_at"`
	UpdatedAt      time.Time        `json:"updated_at"`
}
