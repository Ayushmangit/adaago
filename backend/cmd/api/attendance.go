package main

import (
	"errors"
	"net/http"
	"strings"

	"github.com/Ayushmangit/adaago.git/backend/internal/service"
	"github.com/Ayushmangit/adaago.git/backend/internal/store"
)

type AttendanceResponse struct {
	Data store.Attendance `json:"data"`
}

type AttendancesResponse struct {
	Data []store.Attendance `json:"data"`
}

// createAttendanceHandler godoc
//
//	@Summary		Mark attendance
//	@Description	Mark attendance for an enrollment. Admin access is required.
//	@Tags			attendance
//	@Accept			json
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			request	body		service.CreateAttendanceInput	true	"Attendance details"
//	@Success		201		{object}	AttendanceResponse
//	@Failure		400		{object}	ErrorResponse
//	@Failure		401		{object}	ErrorResponse
//	@Failure		403		{object}	ErrorResponse
//	@Failure		404		{object}	ErrorResponse
//	@Failure		409		{object}	ErrorResponse
//	@Failure		500		{object}	ErrorResponse
//	@Router			/attendance [post]
func (app *application) createAttendanceHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	user := getUserFromCtx(r)

	if user == nil {
		app.UnAuthorized(
			w,
			r,
			errors.New("unauthorized"),
		)
		return
	}

	var input service.CreateAttendanceInput

	if err := ReadJson(
		w,
		r,
		&input,
	); err != nil {
		app.BadRequest(
			w,
			r,
			err,
		)
		return
	}

	if err := Validate.Struct(
		input,
	); err != nil {
		app.BadRequest(
			w,
			r,
			err,
		)
		return
	}

	attendance, err := app.service.Attendance.Create(
		r.Context(),
		user.ID,
		input,
	)
	if err != nil {
		app.handleAttendanceServiceError(
			w,
			r,
			err,
		)
		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusCreated,
		AttendanceResponse{
			Data: *attendance,
		},
	); err != nil {
		app.InternalServerError(
			w,
			r,
			err,
		)
	}
}

// getAttendanceHandler godoc
//
//	@Summary		Get attendance
//	@Description	Get a single attendance record by ID. Admin access is required.
//	@Tags			attendance
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			attendanceID	path		int	true	"Attendance ID"
//	@Success		200				{object}	AttendanceResponse
//	@Failure		400				{object}	ErrorResponse
//	@Failure		401				{object}	ErrorResponse
//	@Failure		403				{object}	ErrorResponse
//	@Failure		404				{object}	ErrorResponse
//	@Failure		500				{object}	ErrorResponse
//	@Router			/attendance/{attendanceID} [get]
func (app *application) getAttendanceHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	attendanceID, err := readPositiveID(
		r,
		"attendanceID",
	)
	if err != nil {
		app.BadRequest(
			w,
			r,
			err,
		)
		return
	}

	attendance, err := app.service.Attendance.GetByID(
		r.Context(),
		attendanceID,
	)
	if err != nil {
		app.handleAttendanceServiceError(
			w,
			r,
			err,
		)
		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		AttendanceResponse{
			Data: *attendance,
		},
	); err != nil {
		app.InternalServerError(
			w,
			r,
			err,
		)
	}
}

// getEnrollmentAttendanceHandler godoc
//
//	@Summary		List enrollment attendance
//	@Description	Returns attendance history for an enrollment. Admin access is required.
//	@Tags			attendance
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			enrollmentID	path		int	true	"Enrollment ID"
//	@Success		200				{object}	AttendancesResponse
//	@Failure		400				{object}	ErrorResponse
//	@Failure		401				{object}	ErrorResponse
//	@Failure		403				{object}	ErrorResponse
//	@Failure		404				{object}	ErrorResponse
//	@Failure		500				{object}	ErrorResponse
//	@Router			/enrollments/{enrollmentID}/attendance [get]
func (app *application) getEnrollmentAttendanceHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	enrollmentID, err := readPositiveID(
		r,
		"enrollmentID",
	)
	if err != nil {
		app.BadRequest(
			w,
			r,
			err,
		)
		return
	}

	records, err := app.service.Attendance.GetByEnrollmentID(
		r.Context(),
		enrollmentID,
	)
	if err != nil {
		app.handleAttendanceServiceError(
			w,
			r,
			err,
		)
		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		AttendancesResponse{
			Data: records,
		},
	); err != nil {
		app.InternalServerError(
			w,
			r,
			err,
		)
	}
}

// getBatchAttendanceHandler godoc
//
//	@Summary		List batch attendance
//	@Description	Returns attendance records for a batch on a specific date. Admin access is required.
//	@Tags			attendance
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			batchID	path		int		true	"Batch ID"
//	@Param			date	query		string	true	"Attendance date (YYYY-MM-DD)"
//	@Success		200		{object}	AttendancesResponse
//	@Failure		400		{object}	ErrorResponse
//	@Failure		401		{object}	ErrorResponse
//	@Failure		403		{object}	ErrorResponse
//	@Failure		404		{object}	ErrorResponse
//	@Failure		500		{object}	ErrorResponse
//	@Router			/batches/{batchID}/attendance [get]
func (app *application) getBatchAttendanceHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	batchID, err := readPositiveID(
		r,
		"batchID",
	)
	if err != nil {
		app.BadRequest(
			w,
			r,
			err,
		)
		return
	}

	date := strings.TrimSpace(
		r.URL.Query().Get("date"),
	)

	if date == "" {
		app.BadRequest(
			w,
			r,
			errors.New("date query parameter is required"),
		)
		return
	}

	records, err := app.service.Attendance.GetByBatchAndDate(
		r.Context(),
		batchID,
		date,
	)
	if err != nil {
		app.handleAttendanceServiceError(
			w,
			r,
			err,
		)
		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		AttendancesResponse{
			Data: records,
		},
	); err != nil {
		app.InternalServerError(
			w,
			r,
			err,
		)
	}
}

// getMyAttendanceHandler godoc
//
//	@Summary		Get logged-in student's attendance
//	@Description	Returns attendance history belonging to the currently authenticated student.
//	@Tags			attendance
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Success		200	{object}	AttendancesResponse
//	@Failure		401	{object}	ErrorResponse
//	@Failure		403	{object}	ErrorResponse
//	@Failure		404	{object}	ErrorResponse
//	@Failure		500	{object}	ErrorResponse
//	@Router			/students/profile/attendance [get]
func (app *application) getMyAttendanceHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	user := getUserFromCtx(r)

	if user == nil {
		app.UnAuthorized(
			w,
			r,
			errors.New("unauthorized"),
		)
		return
	}

	records, err := app.service.Attendance.GetForUser(
		r.Context(),
		user.ID,
	)
	if err != nil {
		app.handleAttendanceServiceError(
			w,
			r,
			err,
		)
		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		AttendancesResponse{
			Data: records,
		},
	); err != nil {
		app.InternalServerError(
			w,
			r,
			err,
		)
	}
}

// updateAttendanceHandler godoc
//
//	@Summary		Update attendance
//	@Description	Update the status or remarks of an attendance record. Admin access is required.
//	@Tags			attendance
//	@Accept			json
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			attendanceID	path		int								true	"Attendance ID"
//	@Param			request			body		service.UpdateAttendanceInput	true	"Attendance update payload"
//	@Success		200				{object}	AttendanceResponse
//	@Failure		400				{object}	ErrorResponse
//	@Failure		401				{object}	ErrorResponse
//	@Failure		403				{object}	ErrorResponse
//	@Failure		404				{object}	ErrorResponse
//	@Failure		500				{object}	ErrorResponse
//	@Router			/attendance/{attendanceID} [patch]
func (app *application) updateAttendanceHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	attendanceID, err := readPositiveID(
		r,
		"attendanceID",
	)
	if err != nil {
		app.BadRequest(
			w,
			r,
			err,
		)
		return
	}

	var input service.UpdateAttendanceInput

	if err := ReadJson(
		w,
		r,
		&input,
	); err != nil {
		app.BadRequest(
			w,
			r,
			err,
		)
		return
	}

	if err := Validate.Struct(
		input,
	); err != nil {
		app.BadRequest(
			w,
			r,
			err,
		)
		return
	}

	attendance, err := app.service.Attendance.UpdateByID(
		r.Context(),
		attendanceID,
		input,
	)
	if err != nil {
		app.handleAttendanceServiceError(
			w,
			r,
			err,
		)
		return
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		AttendanceResponse{
			Data: *attendance,
		},
	); err != nil {
		app.InternalServerError(
			w,
			r,
			err,
		)
	}
}

func (app *application) handleAttendanceServiceError(
	w http.ResponseWriter,
	r *http.Request,
	err error,
) {
	switch {
	case errors.Is(
		err,
		store.ErrInvalidID,
	),
		errors.Is(
			err,
			store.ErrInvalidInput,
		),
		errors.Is(
			err,
			service.ErrInvalidAttendanceDate,
		),
		errors.Is(
			err,
			service.ErrFutureAttendanceDate,
		),
		errors.Is(
			err,
			service.ErrAttendanceBeforeEnrollment,
		),
		errors.Is(
			err,
			service.ErrAttendanceAfterEnrollment,
		),
		errors.Is(
			err,
			service.ErrAttendanceNotBatchDay,
		),
		errors.Is(
			err,
			service.ErrInvalidAttendanceStatus,
		),
		errors.Is(
			err,
			service.ErrRemarksTooLong,
		):
		app.BadRequest(
			w,
			r,
			err,
		)

	case errors.Is(err, store.ErrNotFound):
		app.NotFound(
			w,
			r,
			store.ErrNotFound,
		)

	case errors.Is(
		err,
		service.ErrAttendanceAlreadyMarked,
	):
		app.Conflict(
			w,
			r,
			err,
		)
	case errors.Is(
		err,
		service.ErrDuplicateAttendanceEnrollment,
	):
		app.BadRequest(w, r, err)

	case errors.Is(
		err,
		service.ErrEnrollmentNotInAttendanceBatch,
	):
		app.BadRequest(w, r, err)

	default:
		app.InternalServerError(
			w,
			r,
			err,
		)
	}
}

// bulkAttendanceHandler godoc
//
//	@Summary		Mark attendance for a batch
//	@Description	Create or update attendance for multiple enrollments in a batch
//	@Tags			attendance
//	@Accept			json
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Param			batchID	path		int							true	"Batch ID"
//	@Param			request	body		service.BulkAttendanceInput	true	"Bulk attendance payload"
//	@Success		200		{object}	AttendancesResponse
//	@Failure		400		{object}	ErrorResponse
//	@Failure		401		{object}	ErrorResponse
//	@Failure		403		{object}	ErrorResponse
//	@Failure		404		{object}	ErrorResponse
//	@Failure		500		{object}	ErrorResponse
//	@Router			/batches/{batchID}/attendance/bulk [post]
func (app *application) bulkAttendanceHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	batchID, err := readPositiveID(r, "batchID")
	if err != nil {
		app.BadRequest(w, r, err)
		return
	}

	user := getUserFromCtx(r)
	if user == nil {
		app.UnAuthorized(
			w,
			r,
			errors.New("unauthorized"),
		)
		return
	}

	var input service.BulkAttendanceInput

	if err := ReadJson(
		w,
		r,
		&input,
	); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	if err := Validate.Struct(input); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	records, err := app.service.Attendance.BulkUpsert(
		r.Context(),
		batchID,
		user.ID,
		input,
	)
	if err != nil {
		app.handleAttendanceServiceError(
			w,
			r,
			err,
		)
		return
	}

	response := AttendancesResponse{
		Data: records,
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		response,
	); err != nil {
		app.InternalServerError(
			w,
			r,
			err,
		)
	}
}
