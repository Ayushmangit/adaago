package main

import (
	"errors"
	"net/http"

	"github.com/Ayushmangit/adaago.git/backend/internal/service"
	"github.com/Ayushmangit/adaago.git/backend/internal/store"
)

type StudentResponse struct {
	Data store.Student `json:"data"`
}

type StudentWithUserResponse struct {
	Data store.StudentWithUser `json:"data"`
}

type StudentsResponse struct {
	Data []store.StudentWithUser `json:"data"`
}

// createStudentProfileHandler godoc
//
//	@Summary		Complete student profile
//	@Description	Create a profile for the authenticated student
//	@Tags			students
//	@Accept			json
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			request	body		service.CreateStudentProfileInput	true	"Student information"
//	@Success		201		{object}	StudentResponse
//	@Failure		400		{object}	ErrorResponse
//	@Failure		401		{object}	ErrorResponse
//	@Failure		403		{object}	ErrorResponse
//	@Failure		409		{object}	ErrorResponse
//	@Failure		500		{object}	ErrorResponse
//	@Router			/students/profile [post]
func (app *application) createStudentProfileHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	user := getUserFromCtx(r)
	if user == nil {
		app.UnAuthorized(
			w,
			r,
			errors.New("authentication required"),
		)
		return
	}

	var input service.CreateStudentProfileInput

	if err := ReadJson(w, r, &input); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	if err := Validate.Struct(input); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	student, err := app.service.Students.CreateProfile(
		r.Context(),
		user,
		input,
	)
	if err != nil {
		app.handleStudentServiceError(w, r, err)
		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusCreated,
		student,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

// getStudentProfileHandler godoc
//
//	@Summary		Get student profile
//	@Description	Return the authenticated student's profile
//	@Tags			students
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Success		200	{object}	StudentWithUserResponse
//	@Failure		401	{object}	ErrorResponse
//	@Failure		403	{object}	ErrorResponse
//	@Failure		404	{object}	ErrorResponse
//	@Failure		500	{object}	ErrorResponse
//	@Router			/students/profile [get]
func (app *application) getStudentProfileHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	user := getUserFromCtx(r)
	if user == nil {
		app.UnAuthorized(
			w,
			r,
			errors.New("authentication required"),
		)
		return
	}

	student, err := app.service.Students.GetProfile(
		r.Context(),
		user.ID,
	)
	if err != nil {
		app.handleStudentServiceError(w, r, err)
		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		student,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

// updateStudentProfileHandler godoc
//
//	@Summary		Update student profile
//	@Description	Update the authenticated student's profile
//	@Tags			students
//	@Accept			json
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			request	body		service.UpdateStudentProfileInput	true	"Profile update"
//	@Success		200		{object}	StudentWithUserResponse
//	@Failure		400		{object}	ErrorResponse
//	@Failure		401		{object}	ErrorResponse
//	@Failure		403		{object}	ErrorResponse
//	@Failure		404		{object}	ErrorResponse
//	@Failure		500		{object}	ErrorResponse
//	@Router			/students/profile [patch]
func (app *application) updateStudentProfileHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	user := getUserFromCtx(r)
	if user == nil {
		app.UnAuthorized(
			w,
			r,
			errors.New("authentication required"),
		)
		return
	}

	var input service.UpdateStudentProfileInput

	if err := ReadJson(w, r, &input); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	if err := Validate.Struct(input); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	student, err := app.service.Students.UpdateProfile(
		r.Context(),
		user.ID,
		input,
	)
	if err != nil {
		app.handleStudentServiceError(w, r, err)
		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		student,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

// getStudentsHandler godoc
//
//	@Summary		List students
//	@Description	Return all student profiles. Admin access is required.
//	@Tags			students
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Success		200	{object}	StudentsResponse
//	@Failure		401	{object}	ErrorResponse
//	@Failure		403	{object}	ErrorResponse
//	@Failure		500	{object}	ErrorResponse
//	@Router			/students [get]
func (app *application) getStudentsHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	students, err := app.service.Students.GetAll(
		r.Context(),
	)
	if err != nil {
		app.InternalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		students,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

// getStudentHandler godoc
//
//	@Summary		Get student
//	@Description	Return a student by ID. Admin access is required.
//	@Tags			students
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			studentID	path		int	true	"Student ID"
//	@Success		200			{object}	StudentWithUserResponse
//	@Failure		400			{object}	ErrorResponse
//	@Failure		401			{object}	ErrorResponse
//	@Failure		403			{object}	ErrorResponse
//	@Failure		404			{object}	ErrorResponse
//	@Failure		500			{object}	ErrorResponse
//	@Router			/students/{studentID} [get]
func (app *application) getStudentHandler(
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

	student, err := app.service.Students.GetByID(
		r.Context(),
		studentID,
	)
	if err != nil {
		app.handleStudentServiceError(w, r, err)
		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		student,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

// updateStudentHandler godoc
//
//	@Summary		Update student
//	@Description	Update a student by ID. Admin access is required.
//	@Tags			students
//	@Accept			json
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			studentID	path		int								true	"Student ID"
//	@Param			request		body		service.AdminUpdateStudentInput	true	"Student update"
//	@Success		200			{object}	StudentWithUserResponse
//	@Failure		400			{object}	ErrorResponse
//	@Failure		401			{object}	ErrorResponse
//	@Failure		403			{object}	ErrorResponse
//	@Failure		404			{object}	ErrorResponse
//	@Failure		500			{object}	ErrorResponse
//	@Router			/students/{studentID} [patch]
func (app *application) updateStudentHandler(
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

	var input service.AdminUpdateStudentInput

	if err := ReadJson(w, r, &input); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	if err := Validate.Struct(input); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	student, err := app.service.Students.UpdateByID(
		r.Context(),
		studentID,
		input,
	)
	if err != nil {
		app.handleStudentServiceError(w, r, err)
		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		student,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

func (app *application) handleStudentServiceError(
	w http.ResponseWriter,
	r *http.Request,
	err error,
) {
	switch {
	case errors.Is(err, store.ErrInvalidID),
		errors.Is(err, store.ErrInvalidInput),
		errors.Is(err, service.ErrEmptyUpdate),
		errors.Is(err, service.ErrStudentNameRequired),
		errors.Is(err, service.ErrInvalidDateOfBirth),
		errors.Is(err, service.ErrFutureDateOfBirth),
		errors.Is(err, service.ErrInvalidStudentStatus):
		app.BadRequest(w, r, err)

	case errors.Is(err, service.ErrStudentRoleRequired):
		app.ForbiddenResponse(w, r)

	case errors.Is(err, store.ErrNotFound):
		app.NotFound(w, r, store.ErrNotFound)

	case errors.Is(err, service.ErrStudentProfileExists),
		errors.Is(err, store.ErrStudentProfileExists):
		app.ConflictResponse(w, r, err)

	default:
		app.InternalServerError(w, r, err)
	}
}
