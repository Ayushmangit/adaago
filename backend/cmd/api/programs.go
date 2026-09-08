package main

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/Ayushmangit/adaago.git/backend/internal/service"
	"github.com/Ayushmangit/adaago.git/backend/internal/store"
	"github.com/go-chi/chi/v5"
)

type ProgramResponse struct {
	store.Program `json:"program"`
}
type ProgramsResponse struct {
	Data []store.Program `json:"data"`
}

// createProgramHandler godoc
//
//	@Summary		Create program
//	@Description	Create a new sports program
//	@Tags			programs
//	@Accept			json
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			request	body		service.CreateProgramInput	true	"Program details"
//	@Success		201		{object}	ProgramResponse
//	@Failure		400		{object}	ErrorResponse
//	@Failure		401		{object}	ErrorResponse
//	@Failure		403		{object}	ErrorResponse
//	@Failure		409		{object}	ErrorResponse
//	@Failure		500		{object}	ErrorResponse
//	@Router			/programs [post]
func (app *application) createProgramHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	var input service.CreateProgramInput

	if err := ReadJson(w, r, &input); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	if err := Validate.Struct(input); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	program, err := app.service.Programs.Create(
		r.Context(),
		input,
	)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrProgramNameRequired):
			app.BadRequest(w, r, err)

		case errors.Is(err, service.ErrProgramNameConflict):
			app.Conflict(w, r, err)

		default:
			app.InternalServerError(w, r, err)
		}

		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusCreated,
		program,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

// getProgramsHandler godoc
//
//	@Summary		List programs
//	@Description	Returns all sports programs
//	@Tags			programs
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Success		200	{object}	ProgramsResponse
//	@Failure		401	{object}	ErrorResponse
//	@Failure		500	{object}	ErrorResponse
//	@Router			/programs [get]
func (app *application) getProgramsHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	programs, err := app.service.Programs.GetAll(r.Context())
	if err != nil {
		app.InternalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		programs,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

// getProgramHandler godoc
//
//	@Summary		Get program
//	@Description	Returns a sports program by ID
//	@Tags			programs
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			programID	path		int	true	"Program ID"
//	@Success		200			{object}	ProgramResponse
//	@Failure		400			{object}	ErrorResponse
//	@Failure		401			{object}	ErrorResponse
//	@Failure		404			{object}	ErrorResponse
//	@Failure		500			{object}	ErrorResponse
//	@Router			/programs/{programID} [get]
func (app *application) getProgramHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	programID, err := strconv.ParseInt(
		chi.URLParam(r, "programID"),
		10,
		64,
	)
	if err != nil || programID < 1 {
		app.BadRequest(
			w,
			r,
			errors.New("invalid program ID"),
		)
		return
	}

	program, err := app.service.Programs.GetByID(
		r.Context(),
		programID,
	)
	if err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			app.NotFound(w, r, store.ErrNotFound)

		default:
			app.InternalServerError(w, r, err)
		}

		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		program,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

// updateProgramHandler godoc
//
//	@Summary		Update program
//	@Description	Update or deactivate a sports program. Admin access is required.
//	@Tags			programs
//	@Accept			json
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			programID	path		int							true	"Program ID"
//	@Param			request		body		service.UpdateProgramInput	true	"Program update"
//	@Success		200			{object}	ProgramResponse
//	@Failure		400			{object}	ErrorResponse
//	@Failure		401			{object}	ErrorResponse
//	@Failure		403			{object}	ErrorResponse
//	@Failure		404			{object}	ErrorResponse
//	@Failure		409			{object}	ErrorResponse
//	@Failure		500			{object}	ErrorResponse
//	@Router			/programs/{programID} [patch]
func (app *application) updateProgramHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	programID, err := strconv.ParseInt(
		chi.URLParam(r, "programID"),
		10,
		64,
	)
	if err != nil || programID < 1 {
		app.BadRequest(
			w,
			r,
			errors.New("invalid program ID"),
		)
		return
	}

	var input service.UpdateProgramInput

	if err := ReadJson(w, r, &input); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	if err := Validate.Struct(input); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	program, err := app.service.Programs.UpdateByID(
		r.Context(),
		programID,
		input,
	)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrEmptyUpdate):
			app.BadRequest(w, r, err)

		case errors.Is(err, service.ErrProgramNameRequired):
			app.BadRequest(w, r, err)

		case errors.Is(err, service.ErrProgramNameConflict):
			app.Conflict(w, r, err)

		case errors.Is(err, store.ErrNotFound):
			app.NotFound(w, r, store.ErrNotFound)

		default:
			app.InternalServerError(w, r, err)
		}

		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		program,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}
