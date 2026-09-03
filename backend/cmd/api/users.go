package main

import (
	"errors"
	"net/http"

	"github.com/Ayushmangit/adaago.git/backend/internal/store"
)

type MeResponse struct {
	*store.User
}

// getCurrentUserHandler godoc
//
//	@Summary		Get current user
//	@Description	Returns the currently authenticated user's account information
//	@Tags			users
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Success		200	{object}	MeResponse
//	@Failure		401	{object}	ErrorResponse
//	@Failure		500	{object}	ErrorResponse
//	@Router			/me [get]
func (app *application) getCurrentUserHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromCtx(r)
	if user == nil {
		app.UnAuthorized(w, r, errors.New("unauthorized"))
		return
	}
	response := MeResponse{
		user,
	}
	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.InternalServerError(w, r, err)
		return
	}
}
