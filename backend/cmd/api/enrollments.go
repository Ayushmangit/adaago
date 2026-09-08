package main

import (
	"errors"
	"net/http"

	"github.com/Ayushmangit/adaago.git/backend/internal/service"
	"github.com/Ayushmangit/adaago.git/backend/internal/store"
)

type EnrollmentResponse struct {
	Data store.Enrollment `json:"data"`
}

type EnrollmentsResponse struct {
	Data []store.Enrollment `json:"data"`
}

// createEnrollmentHandler godoc
//
//	@Summary		Create enrollment
//	@Description	Enroll a student into a batch. Admin access is required.
//	@Tags			enrollments
//	@Accept			json
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			request	body		service.CreateEnrollmentInput	true	"Enrollment details"
//	@Success		201		{object}	EnrollmentResponse
//	@Failure		400		{object}	ErrorResponse
//	@Failure		401		{object}	ErrorResponse
//	@Failure		403		{object}	ErrorResponse
//	@Failure		404		{object}	ErrorResponse
//	@Failure		409		{object}	ErrorResponse
//	@Failure		500		{object}	ErrorResponse
//	@Router			/enrollments [post]
func (app *application) createEnrollmentHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	var input service.CreateEnrollmentInput

	if err := ReadJson(w, r, &input); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	if err := Validate.Struct(input); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	enrollment, err := app.service.Enrollments.Create(
		r.Context(),
		input,
	)
	if err != nil {
		app.handleEnrollmentServiceError(
			w,
			r,
			err,
		)
		return
	}

	response := EnrollmentResponse{
		Data: *enrollment,
	}

	if err := app.jsonResponse(
		w,
		http.StatusCreated,
		response,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

// getEnrollmentHandler godoc
//
//	@Summary		Get enrollment
//	@Description	Returns an enrollment by ID. Admin access is required.
//	@Tags			enrollments
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			enrollmentID	path		int	true	"Enrollment ID"
//	@Success		200				{object}	EnrollmentResponse
//	@Failure		400				{object}	ErrorResponse
//	@Failure		401				{object}	ErrorResponse
//	@Failure		403				{object}	ErrorResponse
//	@Failure		404				{object}	ErrorResponse
//	@Failure		500				{object}	ErrorResponse
//	@Router			/enrollments/{enrollmentID} [get]
func (app *application) getEnrollmentHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	enrollmentID, err := readPositiveID(
		r,
		"enrollmentID",
	)
	if err != nil {
		app.BadRequest(w, r, err)
		return
	}

	enrollment, err := app.service.Enrollments.GetByID(
		r.Context(),
		enrollmentID,
	)
	if err != nil {
		app.handleEnrollmentServiceError(
			w,
			r,
			err,
		)
		return
	}

	response := EnrollmentResponse{
		Data: *enrollment,
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		response,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

// getStudentEnrollmentsHandler godoc
//
//	@Summary		List student enrollments
//	@Description	Returns enrollment history for a student. Admin access is required.
//	@Tags			enrollments
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			studentID	path		int	true	"Student ID"
//	@Success		200			{object}	EnrollmentsResponse
//	@Failure		400			{object}	ErrorResponse
//	@Failure		401			{object}	ErrorResponse
//	@Failure		403			{object}	ErrorResponse
//	@Failure		404			{object}	ErrorResponse
//	@Failure		500			{object}	ErrorResponse
//	@Router			/students/{studentID}/enrollments [get]
func (app *application) getStudentEnrollmentsHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	studentID, err := readPositiveID(
		r,
		"studentID",
	)
	if err != nil {
		app.BadRequest(w, r, err)
		return
	}

	enrollments, err := app.service.Enrollments.GetByStudentID(
		r.Context(),
		studentID,
	)
	if err != nil {
		app.handleEnrollmentServiceError(
			w,
			r,
			err,
		)
		return
	}

	response := EnrollmentsResponse{
		Data: enrollments,
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		response,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

// getBatchEnrollmentsHandler godoc
//
//	@Summary		List batch enrollments
//	@Description	Returns all enrollments belonging to a batch. Admin access is required.
//	@Tags			enrollments
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			batchID	path		int	true	"Batch ID"
//	@Success		200		{object}	EnrollmentsResponse
//	@Failure		400		{object}	ErrorResponse
//	@Failure		401		{object}	ErrorResponse
//	@Failure		403		{object}	ErrorResponse
//	@Failure		404		{object}	ErrorResponse
//	@Failure		500		{object}	ErrorResponse
//	@Router			/batches/{batchID}/enrollments [get]
func (app *application) getBatchEnrollmentsHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	batchID, err := readPositiveID(
		r,
		"batchID",
	)
	if err != nil {
		app.BadRequest(w, r, err)
		return
	}

	enrollments, err := app.service.Enrollments.GetByBatchID(
		r.Context(),
		batchID,
	)
	if err != nil {
		app.handleEnrollmentServiceError(
			w,
			r,
			err,
		)
		return
	}

	response := EnrollmentsResponse{
		Data: enrollments,
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		response,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

func (app *application) handleEnrollmentServiceError(
	w http.ResponseWriter,
	r *http.Request,
	err error,
) {
	switch {
	case errors.Is(err, store.ErrInvalidID),
		errors.Is(err, store.ErrInvalidInput),
		errors.Is(err, service.ErrInvalidEnrollmentDate),
		errors.Is(err, service.ErrFutureEnrollmentDate):
		app.BadRequest(w, r, err)

	case errors.Is(err, store.ErrNotFound):
		app.NotFound(w, r, store.ErrNotFound)

	case errors.Is(err, service.ErrEnrollmentExists),
		errors.Is(err, service.ErrStudentInactive),
		errors.Is(err, service.ErrBatchInactive),
		errors.Is(err, service.ErrProgramInactive),
		errors.Is(err, service.ErrBatchFull):
		app.Conflict(w, r, err)

	default:
		app.InternalServerError(w, r, err)
	}
}
