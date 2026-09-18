package main

import (
	"net/http"

	"github.com/Ayushmangit/adaago.git/backend/internal/store"
)

type DashboardSummaryResponse struct {
	Data store.DashboardSummary `json:"data"`
}

// getDashboardSummaryHandler godoc
//
//	@Summary		Get admin dashboard summary
//	@Description	Returns aggregate statistics for the admin dashboard.
//	@Tags			dashboard
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Success		200	{object}	DashboardSummaryResponse
//	@Failure		401	{object}	ErrorResponse
//	@Failure		403	{object}	ErrorResponse
//	@Failure		500	{object}	ErrorResponse
//	@Router			/dashboard/summary [get]
func (app *application) getDashboardSummaryHandler(w http.ResponseWriter, r *http.Request) {
	summary, err := app.service.Dashboard.GetSummary(r.Context())
	if err != nil {
		app.InternalServerError(w, r, err)
		return
	}

	response := DashboardSummaryResponse{
		Data: *summary,
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.InternalServerError(w, r, err)
	}
}
