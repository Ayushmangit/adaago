package main

import "net/http"

type HealthResponse struct {
	Status  string `json:"status"`
	Env     string `json:"env"`
	Version string `json:"version"`
}

// healthCheckHandler godoc
//
//	@Summary		Health check
//	@Description	Returns the API's current status, environment, and version
//	@Tags			health
//	@Produce		json
//	@Success		200	{object}	HealthResponse
//	@Failure		500	{object}	ErrorResponse
//	@Router			/health [get]
func (app *application) healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	response := HealthResponse{
		Status:  "ok",
		Env:     app.config.env,
		Version: version,
	}
	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.InternalServerError(w, r, err)
		return
	}
}
