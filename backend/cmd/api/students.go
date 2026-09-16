package main

import (
	"errors"
	"net/http"
	"strconv"

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
	Data     []store.StudentWithUser `json:"data"`
	Total    int64                   `json:"total"`
	Page     int                     `json:"page"`
	PageSize int                     `json:"page_size"`
}

// createStudentHandler godoc
//
//	@Summary		Create student
//	@Description	Create a student account and profile. Admin access is required.
//	@Tags			students
//	@Accept			json
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			request	body		service.CreateStudentInput	true	"Student information"
//	@Success		201		{object}	StudentWithUserResponse
//	@Failure		400		{object}	ErrorResponse
//	@Failure		401		{object}	ErrorResponse
//	@Failure		403		{object}	ErrorResponse
//	@Failure		409		{object}	ErrorResponse
//	@Failure		500		{object}	ErrorResponse
//	@Router			/students [post]
func (app *application) createStudentHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	var input service.CreateStudentInput

	if err := ReadJson(w, r, &input); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	if err := Validate.Struct(input); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	student, err := app.service.Students.Create(
		r.Context(),
		input,
	)
	if err != nil {
		app.handleStudentServiceError(
			w,
			r,
			err,
		)
		return
	}

	response := StudentWithUserResponse{
		Data: *student,
	}

	if err := app.jsonResponse(
		w,
		http.StatusCreated,
		response,
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
		app.handleStudentServiceError(
			w,
			r,
			err,
		)
		return
	}

	response := StudentWithUserResponse{
		Data: *student,
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		response,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

// getStudentsHandler godoc
//
//	@Summary		List students
//	@Description	Return paginated student profiles. Admin access is required.
//	@Tags			students
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			page		query		int		false	"Page number"		default(1)
//	@Param			page_size	query		int		false	"Students per page"	default(20)
//	@Param			search		query		string	false	"Search by name, username or email"
//	@Success		200			{object}	StudentsResponse
//	@Failure		400			{object}	ErrorResponse
//	@Failure		401			{object}	ErrorResponse
//	@Failure		403			{object}	ErrorResponse
//	@Failure		500			{object}	ErrorResponse
//	@Router			/students [get]
func (app *application) getStudentsHandler(w http.ResponseWriter, r *http.Request) {
	page := 1
	pageSize := 20
	search := r.URL.Query().Get("search")

	if value := r.URL.Query().Get("page"); value != "" {
		parsedPage, err := strconv.Atoi(value)
		if err != nil || parsedPage < 1 {
			app.BadRequest(w, r, errors.New("page must be a positive integer"))
			return
		}
		page = parsedPage
	}

	if value := r.URL.Query().Get("page_size"); value != "" {
		parsedPageSize, err := strconv.Atoi(value)
		if err != nil || parsedPageSize < 1 || parsedPageSize > 100 {
			app.BadRequest(w, r, errors.New("page_size must be between 1 and 100"))
			return
		}
		pageSize = parsedPageSize
	}

	result, err := app.service.Students.GetAll(
		r.Context(),
		service.GetStudentsInput{
			Search:   search,
			Page:     page,
			PageSize: pageSize,
		},
	)
	if err != nil {
		app.InternalServerError(w, r, err)
		return
	}

	response := StudentsResponse{
		Data:     result.Students,
		Total:    result.Total,
		Page:     result.Page,
		PageSize: result.PageSize,
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
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
		app.handleStudentServiceError(
			w,
			r,
			err,
		)
		return
	}

	response := StudentWithUserResponse{
		Data: *student,
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		response,
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
		app.handleStudentServiceError(
			w,
			r,
			err,
		)
		return
	}

	response := StudentWithUserResponse{
		Data: *student,
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		response,
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

	case errors.Is(err, store.ErrNotFound):
		app.NotFound(
			w,
			r,
			store.ErrNotFound,
		)

	case errors.Is(err, store.ErrDuplicateEmail),
		errors.Is(err, store.ErrDuplicateUsername),
		errors.Is(err, store.ErrConflict),
		errors.Is(err, store.ErrStudentProfileExists):
		app.Conflict(
			w,
			r,
			err,
		)

	default:
		app.InternalServerError(
			w,
			r,
			err,
		)
	}
}
