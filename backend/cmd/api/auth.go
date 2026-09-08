package main

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/Ayushmangit/adaago.git/backend/internal/store"
	"github.com/golang-jwt/jwt/v5"
)

var ErrInvalidCredentials = errors.New(
	"invalid email or password",
)

type LoginUserPayload struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8,max=72"`
}

type LoginResponse struct {
	User        *store.User `json:"user"`
	AccessToken string      `json:"access_token"`
}

// loginUserHandler godoc
//
//	@Summary		Login user
//	@Description	Login and return an access token and profile status
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			request	body		LoginUserPayload	true	"Login payload"
//	@Success		200		{object}	LoginResponse		"Login successful"
//	@Failure		400		{object}	ErrorResponse		"Invalid request"
//	@Failure		401		{object}	ErrorResponse		"Invalid credentials"
//	@Failure		500		{object}	ErrorResponse		"Internal server error"
//	@Router			/auth/login [post]
func (app *application) loginUserHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	var payload LoginUserPayload

	if err := ReadJson(w, r, &payload); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	email := strings.ToLower(
		strings.TrimSpace(payload.Email),
	)

	app.logger.Infow("email login", "email", payload.Email)

	user, err := app.store.Users.GetByEmail(
		r.Context(),
		email,
	)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.UnAuthorized(
				w,
				r,
				ErrInvalidCredentials,
			)
			return
		}

		app.InternalServerError(w, r, err)
		return
	}

	if err := user.Password.Compare(payload.Password); err != nil {
		app.UnAuthorized(
			w,
			r,
			ErrInvalidCredentials,
		)
		return
	}

	accessToken, err := app.generateAccessToken(user)
	if err != nil {
		app.InternalServerError(w, r, err)
		return
	}

	response := LoginResponse{
		User:        user,
		AccessToken: accessToken,
	}

	if err := app.jsonResponse(
		w,
		http.StatusOK,
		response,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

func (app *application) generateAccessToken(
	user *store.User,
) (string, error) {
	now := time.Now()

	claims := jwt.MapClaims{
		"sub":  user.ID,
		"role": user.Role,
		"exp":  now.Add(app.config.auth.token.exp).Unix(),
		"iat":  now.Unix(),
		"nbf":  now.Unix(),
		"iss":  app.config.auth.token.iss,
		"aud":  app.config.auth.token.aud,
	}

	return app.authenticator.GenerateToken(claims)
}
