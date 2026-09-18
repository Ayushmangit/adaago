package main

import (
	"errors"
	"net/http"

	"github.com/Ayushmangit/adaago.git/backend/internal/store"
)

// getStudentDashboardHandler godoc
//
//	@Summary		Get student dashboard
//	@Description	Get dashboard summary for the currently authenticated student
//	@Tags			students
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Success		200	{object}	store.StudentDashboardSummary
//	@Failure		404	{object}	ErrorResponse
//	@Failure		500	{object}	ErrorResponse
//	@Router			/students/profile/dashboard [get]
func (app *application) getStudentDashboardHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromCtx(r)

	summary, err := app.service.StudentDashboard.GetSummary(r.Context(), user.ID)
	if err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			app.NotFound(w, r, err)
		default:
			app.InternalServerError(w, r, err)
		}
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, summary); err != nil {
		app.InternalServerError(w, r, err)
	}
}
