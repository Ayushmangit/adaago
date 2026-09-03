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

type RegisterUserPayload struct {
	Email    string `json:"email" validate:"required,email"`
	Username string `json:"username" validate:"required,min=3,max=50"`
	Password string `json:"password" validate:"required,min=8,max=72"`
}

type RegisterResponse struct {
	User             *store.User `json:"user"`
	AccessToken      string      `json:"access_token"`
	ProfileCompleted bool        `json:"profile_completed"`
}

// registerUserHandler godoc
//
//	@Summary		Register student
//	@Description	Register a student account and return an access token
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			request	body		RegisterUserPayload	true	"Registration payload"
//	@Success		201		{object}	RegisterResponse	"Student registered"
//	@Failure		400		{object}	ErrorResponse		"Invalid request"
//	@Failure		409		{object}	ErrorResponse		"Email or username already exists"
//	@Failure		500		{object}	ErrorResponse		"Internal server error"
//	@Router			/auth/register [post]
func (app *application) registerUserHandler(
	w http.ResponseWriter,
	r *http.Request,
) {
	var payload RegisterUserPayload

	if err := ReadJson(w, r, &payload); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.BadRequest(w, r, err)
		return
	}

	user := &store.User{
		Username: strings.TrimSpace(payload.Username),
		Email: strings.ToLower(
			strings.TrimSpace(payload.Email),
		),
		Role: store.RoleStudent,
	}

	if err := user.Password.Set(payload.Password); err != nil {
		app.InternalServerError(w, r, err)
		return
	}

	if err := app.store.Users.Create(
		r.Context(),
		user,
	); err != nil {
		switch {
		case errors.Is(err, store.ErrDuplicateEmail),
			errors.Is(err, store.ErrDuplicateUsername),
			errors.Is(err, store.ErrConflict):
			app.Conflict(w, r, err)

		default:
			app.InternalServerError(w, r, err)
		}

		return
	}

	accessToken, err := app.generateAccessToken(user)
	if err != nil {
		app.InternalServerError(w, r, err)
		return
	}

	response := RegisterResponse{
		User:             user,
		AccessToken:      accessToken,
		ProfileCompleted: false,
	}

	if err := app.jsonResponse(
		w,
		http.StatusCreated,
		response,
	); err != nil {
		app.InternalServerError(w, r, err)
	}
}

type LoginUserPayload struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8,max=72"`
}

type LoginResponse struct {
	User             *store.User `json:"user"`
	AccessToken      string      `json:"access_token"`
	ProfileCompleted bool        `json:"profile_completed"`
}

// loginUserHandler godoc
//
//	@Summary		Login user
//	@Description	Login and return an access token and profile status
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			request	body		LoginUserPayload	true	"Login payload"
//	@Success		200		{object}	LoginResponse	"Login successful"
//	@Failure		400		{object}	ErrorResponse	"Invalid request"
//	@Failure		401		{object}	ErrorResponse	"Invalid credentials"
//	@Failure		500		{object}	ErrorResponse	"Internal server error"
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

	profileCompleted := true

	if user.Role == store.RoleStudent {
		profileCompleted, err = app.store.Students.ExistsByUserID(
			r.Context(),
			user.ID,
		)
		if err != nil {
			app.InternalServerError(w, r, err)
			return
		}
	}

	accessToken, err := app.generateAccessToken(user)
	if err != nil {
		app.InternalServerError(w, r, err)
		return
	}

	response := LoginResponse{
		User:             user,
		AccessToken:      accessToken,
		ProfileCompleted: profileCompleted,
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
