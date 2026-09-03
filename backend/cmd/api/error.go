package main

import "net/http"

func (app *application) UnAuthorizedBasicError(
	w http.ResponseWriter,
	r *http.Request,
	err error,
) {
	app.logger.Errorw(
		"unauthorized basic authentication",
		"method", r.Method,
		"path", r.URL.Path,
		"error", err,
	)

	w.Header().Set(
		"WWW-Authenticate",
		`Basic realm="restricted", charset="UTF-8"`,
	)

	WriteJsonError(w, http.StatusUnauthorized, "unauthorized")
}

func (app *application) UnAuthorized(
	w http.ResponseWriter,
	r *http.Request,
	err error,
) {
	app.logger.Warnw(
		"unauthorized request",
		"method", r.Method,
		"path", r.URL.Path,
		"error", err,
	)

	WriteJsonError(w, http.StatusUnauthorized, "unauthorized")
}

func (app *application) InternalServerError(
	w http.ResponseWriter,
	r *http.Request,
	err error,
) {
	app.logger.Errorw(
		"internal server error",
		"method", r.Method,
		"path", r.URL.Path,
		"error", err,
	)

	WriteJsonError(
		w,
		http.StatusInternalServerError,
		"the server encountered a problem",
	)
}

func (app *application) BadRequest(
	w http.ResponseWriter,
	r *http.Request,
	err error,
) {
	app.logger.Warnw(
		"bad request",
		"method", r.Method,
		"path", r.URL.Path,
		"error", err,
	)

	WriteJsonError(w, http.StatusBadRequest, err.Error())
}

func (app *application) NotFound(
	w http.ResponseWriter,
	r *http.Request,
	err error,
) {
	app.logger.Warnw(
		"resource not found",
		"method", r.Method,
		"path", r.URL.Path,
		"error", err,
	)

	WriteJsonError(w, http.StatusNotFound, "not found")
}

func (app *application) ForbiddenResponse(
	w http.ResponseWriter,
	r *http.Request,
) {
	app.logger.Warnw(
		"forbidden request",
		"method", r.Method,
		"path", r.URL.Path,
	)

	WriteJsonError(w, http.StatusForbidden, "forbidden request")
}

func (app *application) RateLimitExceeded(
	w http.ResponseWriter,
	r *http.Request,
	retryAfter string,
) {
	app.logger.Warnw(
		"rate limit exceeded",
		"method", r.Method,
		"path", r.URL.Path,
		"retry_after", retryAfter,
	)

	w.Header().Set("Retry-After", retryAfter)

	WriteJsonError(
		w,
		http.StatusTooManyRequests,
		"rate limit exceeded",
	)
}

func (app *application) Conflict(
	w http.ResponseWriter,
	r *http.Request,
	err error,
) {
	app.logger.Warnw(
		"conflict",
		"method", r.Method,
		"path", r.URL.Path,
		"error", err,
	)

	WriteJsonError(w, http.StatusConflict, err.Error())
}
