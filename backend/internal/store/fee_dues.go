package store

import "time"

type FeeStatus string

const (
	FeeStatusPending   FeeStatus = "pending"
	FeeStatusPartial   FeeStatus = "partial"
	FeeStatusPaid      FeeStatus = "paid"
	FeeStatusCancelled FeeStatus = "cancelled"
)

type FeeDue struct {
	ID              int64     `json:"id"`
	EnrollmentID    int64     `json:"enrollment_id"`
	BillingMonth    time.Time `json:"billing_month"`
	AmountPaise     int64     `json:"amount_paise"`
	PaidAmountPaise int64     `json:"paid_amount_paise"`
	DueDate         time.Time `json:"due_date"`
	Status          FeeStatus `json:"status"`
	Notes           *string   `json:"notes,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
