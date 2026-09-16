package main

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/Ayushmangit/adaago.git/backend/internal/service"
	"github.com/Ayushmangit/adaago.git/backend/internal/store"
	"github.com/go-chi/chi/v5"
)

type GenerateMonthlyFeeDuesPayload struct {
	BillingMonth string `json:"billing_month" validate:"required"`
	DueDate      string `json:"due_date" validate:"required"`
}

// generateMonthlyFeeDuesHandler godoc
//
//	@Summary		Generate monthly fee dues
//	@Description	Generate fee dues for all enrollments that overlap the specified billing month
//	@Tags			fees
//	@Accept			json
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			request	body		GenerateMonthlyFeeDuesPayload	true	"Generate monthly fee dues"
//	@Success		201		{object}	store.GenerateMonthlyDuesResult
//	@Failure		400		{object}	error
//	@Failure		401		{object}	error
//	@Failure		403		{object}	error
//	@Failure		500		{object}	error
//	@Router			/fees/generate [post]
func (app *application) generateMonthlyFeeDuesHandler(w http.ResponseWriter, r *http.Request) {
	var payload GenerateMonthlyFeeDuesPayload

	if err := ReadJson(w, r, &payload); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	billingMonth, err := time.Parse("2006-01-02", payload.BillingMonth)
	if err != nil {
		app.BadRequest(w, r, errors.New("billing_month must use YYYY-MM-DD format"))
		return
	}

	dueDate, err := time.Parse("2006-01-02", payload.DueDate)
	if err != nil {
		app.BadRequest(w, r, errors.New("due_date must use YYYY-MM-DD format"))
		return
	}

	result, err := app.service.FeeDues.GenerateMonthlyDues(r.Context(), service.GenerateFeeDuesInput{
		BillingMonth: billingMonth,
		DueDate:      dueDate,
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidBillingMonth),
			errors.Is(err, service.ErrInvalidDueDate),
			errors.Is(err, store.ErrInvalidInput):
			app.BadRequest(w, r, err)
		default:
			app.InternalServerError(w, r, err)
		}
		return
	}

	if err := app.jsonResponse(w, http.StatusCreated, result); err != nil {
		app.InternalServerError(w, r, err)
	}
}

// getFeeRegisterHandler godoc
//
//	@Summary		Get monthly fee register
//	@Description	Get paginated monthly fee dues with student, batch and program details
//	@Tags			fees
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			month		query		string	true	"Billing month"	example(2026-09-01)
//	@Param			page		query		int		false	"Page"			default(1)
//	@Param			page_size	query		int		false	"Page size"		default(20)
//	@Param			search		query		string	false	"Search student, username, email, batch or program"
//	@Param			status		query		string	false	"Fee status"	Enums(pending,partial,paid,cancelled)
//	@Success		200			{object}	store.PaginatedFeeRegister
//	@Failure		400			{object}	error
//	@Failure		401			{object}	error
//	@Failure		403			{object}	error
//	@Failure		500			{object}	error
//	@Router			/fees [get]
func (app *application) getFeeRegisterHandler(w http.ResponseWriter, r *http.Request) {
	month := r.URL.Query().Get("month")
	if month == "" {
		app.BadRequest(w, r, errors.New("month is required"))
		return
	}

	billingMonth, err := time.Parse("2006-01-02", month)
	if err != nil || billingMonth.Day() != 1 {
		app.BadRequest(w, r, errors.New("month must be the first day of the month in YYYY-MM-DD format"))
		return
	}

	page := 1
	pageSize := 20

	if value := r.URL.Query().Get("page"); value != "" {
		page, err = strconv.Atoi(value)
		if err != nil || page <= 0 {
			app.BadRequest(w, r, errors.New("invalid page"))
			return
		}
	}

	if value := r.URL.Query().Get("page_size"); value != "" {
		pageSize, err = strconv.Atoi(value)
		if err != nil || pageSize <= 0 || pageSize > 100 {
			app.BadRequest(w, r, errors.New("page_size must be between 1 and 100"))
			return
		}
	}

	status := store.FeeDueStatus(r.URL.Query().Get("status"))

	switch status {
	case "", store.FeeDueStatusPending, store.FeeDueStatusPartial, store.FeeDueStatusPaid, store.FeeDueStatusCancelled:
	default:
		app.BadRequest(w, r, errors.New("invalid fee status"))
		return
	}

	result, err := app.service.FeeDues.GetRegister(r.Context(), service.GetFeeRegisterInput{
		BillingMonth: billingMonth,
		Search:       r.URL.Query().Get("search"),
		Status:       status,
		Page:         page,
		PageSize:     pageSize,
	})
	if err != nil {
		app.InternalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, result); err != nil {
		app.InternalServerError(w, r, err)
	}
}

type MarkFeePaidPayload struct {
	Notes *string `json:"notes"`
}

// markFeePaidHandler godoc
//
//	@Summary		Mark fee as paid
//	@Description	Mark a monthly fee due as paid
//	@Tags			fees
//	@Accept			json
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			feeDueID	path		int					true	"Fee Due ID"
//	@Param			request		body		MarkFeePaidPayload	false	"Payment notes"
//	@Success		200			{object}	store.FeeDue
//	@Failure		400			{object}	error
//	@Failure		401			{object}	error
//	@Failure		403			{object}	error
//	@Failure		404			{object}	error
//	@Failure		500			{object}	error
//	@Router			/fees/{feeDueID}/paid [patch]
func (app *application) markFeePaidHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromCtx(r)

	feeDueID, err := strconv.ParseInt(chi.URLParam(r, "feeDueID"), 10, 64)
	if err != nil || feeDueID <= 0 {
		app.BadRequest(w, r, errors.New("invalid fee due id"))
		return
	}

	payload := MarkFeePaidPayload{}

	if err := ReadJson(w, r, &payload); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	fee, err := app.service.FeeDues.MarkPaid(
		r.Context(),
		feeDueID,
		user.ID,
		payload.Notes,
	)
	if err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			app.NotFound(w, r, err)

		case errors.Is(err, store.ErrInvalidID):
			app.BadRequest(w, r, err)

		default:
			app.InternalServerError(w, r, err)
		}

		return
	}

	if err := app.jsonResponse(w, http.StatusOK, fee); err != nil {
		app.InternalServerError(w, r, err)
	}
}
