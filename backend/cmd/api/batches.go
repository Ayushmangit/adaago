package main

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/Ayushmangit/adaago.git/backend/internal/service"
	"github.com/Ayushmangit/adaago.git/backend/internal/store"
	"github.com/go-chi/chi/v5"
)

type BatchResponse struct {
	Data store.Batch `json:"data"`
}

type BatchesResponse struct {
	Data []store.Batch `json:"data"`
}

// createBatchHandler godoc
//
//	@Summary		Create batch
//	@Description	Create a batch under an active program. Admin access is required.
//	@Tags			batches
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			request	body		service.CreateBatchInput	true	"Batch details"
//	@Success		201		{object}	BatchResponse
//	@Failure		400		{object}	ErrorResponse
//	@Failure		401		{object}	ErrorResponse
//	@Failure		403		{object}	ErrorResponse
//	@Failure		404		{object}	ErrorResponse
//	@Failure		409		{object}	ErrorResponse
//	@Failure		500		{object}	ErrorResponse
//	@Router			/batches [post]
func (app *application) createBatchHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	var input service.CreateBatchInput

	if err := ReadJson(w, r, &input); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	if err := Validate.Struct(input); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	batch, err := app.service.Batches.Create(
		r.Context(),
		input,
	)
	if err != nil {
		app.handleBatchServiceError(w, r, err)
		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusCreated,
		batch,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

// getBatchesHandler godoc
//
//	@Summary		List batches
//	@Description	Returns all batches
//	@Tags			batches
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	BatchesResponse
//	@Failure		401	{object}	ErrorResponse
//	@Failure		500	{object}	ErrorResponse
//	@Router			/batches [get]
func (app *application) getBatchesHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	batches, err := app.service.Batches.GetAll(
		r.Context(),
	)
	if err != nil {
		app.InternalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		batches,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

// getBatchHandler godoc
//
//	@Summary		Get batch
//	@Description	Returns a batch by ID
//	@Tags			batches
//	@Produce		json
//	@Security		BearerAuth
//	@Param			batchID	path		int	true	"Batch ID"
//	@Success		200		{object}	BatchResponse
//	@Failure		400		{object}	ErrorResponse
//	@Failure		401		{object}	ErrorResponse
//	@Failure		404		{object}	ErrorResponse
//	@Failure		500		{object}	ErrorResponse
//	@Router			/batches/{batchID} [get]
func (app *application) getBatchHandler(
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

	batch, err := app.service.Batches.GetByID(
		r.Context(),
		batchID,
	)
	if err != nil {
		app.handleBatchServiceError(w, r, err)
		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		batch,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

// getProgramBatchesHandler godoc
//
//	@Summary		List program batches
//	@Description	Returns all batches belonging to a program
//	@Tags			batches
//	@Produce		json
//	@Security		BearerAuth
//	@Param			programID	path		int	true	"Program ID"
//	@Success		200			{object}	BatchesResponse
//	@Failure		400			{object}	ErrorResponse
//	@Failure		401			{object}	ErrorResponse
//	@Failure		404			{object}	ErrorResponse
//	@Failure		500			{object}	ErrorResponse
//	@Router			/programs/{programID}/batches [get]
func (app *application) getProgramBatchesHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	programID, err := readPositiveID(
		r,
		"programID",
	)
	if err != nil {
		app.BadRequest(w, r, err)
		return
	}

	batches, err := app.service.Batches.GetByProgramID(
		r.Context(),
		programID,
	)
	if err != nil {
		app.handleBatchServiceError(w, r, err)
		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		batches,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

// updateBatchHandler godoc
//
//	@Summary		Update batch
//	@Description	Update or deactivate a batch. Admin access is required.
//	@Tags			batches
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			batchID	path		int							true	"Batch ID"
//	@Param			request	body		service.UpdateBatchInput	true	"Batch update"
//	@Success		200		{object}	BatchResponse
//	@Failure		400		{object}	ErrorResponse
//	@Failure		401		{object}	ErrorResponse
//	@Failure		403		{object}	ErrorResponse
//	@Failure		404		{object}	ErrorResponse
//	@Failure		409		{object}	ErrorResponse
//	@Failure		500		{object}	ErrorResponse
//	@Router			/batches/{batchID} [patch]
func (app *application) updateBatchHandler(
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

	var input service.UpdateBatchInput

	if err := ReadJson(w, r, &input); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	if err := Validate.Struct(input); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	batch, err := app.service.Batches.UpdateByID(
		r.Context(),
		batchID,
		input,
	)
	if err != nil {
		app.handleBatchServiceError(w, r, err)
		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		batch,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

func (app *application) handleBatchServiceError(
	w http.ResponseWriter,
	r *http.Request,
	err error,
) {
	switch {
	case errors.Is(err, store.ErrInvalidID),
		errors.Is(err, store.ErrInvalidInput),
		errors.Is(err, service.ErrEmptyUpdate),
		errors.Is(err, service.ErrBatchNameRequired),
		errors.Is(err, service.ErrInvalidBatchTime),
		errors.Is(err, service.ErrInvalidWeekdays),
		errors.Is(err, service.ErrInvalidMonthlyFee),
		errors.Is(err, service.ErrInvalidCapacity):
		app.BadRequest(w, r, err)

	case errors.Is(err, store.ErrNotFound):
		app.NotFound(w, r, store.ErrNotFound)

	case errors.Is(err, service.ErrBatchNameConflict),
		errors.Is(err, service.ErrProgramInactive):
		app.Conflict(w, r, err)

	default:
		app.InternalServerError(w, r, err)
	}
}

func readPositiveID(
	r *http.Request,
	parameterName string,
) (int64, error) {
	value := chi.URLParam(r, parameterName)

	id, err := strconv.ParseInt(value, 10, 64)
	if err != nil || id < 1 {
		return 0, fmt.Errorf(
			"invalid %s",
			parameterName,
		)
	}

	return id, nil
}
