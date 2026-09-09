package main

import (
	"fmt"
	"net/http"
	"time"

	_ "github.com/Ayushmangit/adaago.git/backend/docs"
	"github.com/Ayushmangit/adaago.git/backend/internal/auth"
	"github.com/Ayushmangit/adaago.git/backend/internal/env"
	"github.com/Ayushmangit/adaago.git/backend/internal/service"
	"github.com/Ayushmangit/adaago.git/backend/internal/store"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	httpSwagger "github.com/swaggo/http-swagger"
	"go.uber.org/zap"
)

type application struct {
	config        Config
	store         store.Storage
	service       service.Services
	logger        *zap.SugaredLogger
	authenticator auth.Authenticator
}

type Config struct {
	addr string
	env  string
	db   dbConfig
	auth authConfig
}

type dbConfig struct {
	addr         string
	maxIdleConns int
	maxOpenConns int
	maxIdleTime  string
}

type authConfig struct {
	token tokenConfig
}

type tokenConfig struct {
	secret string
	exp    time.Duration
	iss    string
	aud    string
}

func (app *application) mount() http.Handler {
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{
			env.GetString(
				"CORS_ALLOWED_ORIGINS",
				"http://localhost:5173",
			),
		},
		AllowedMethods: []string{
			http.MethodGet,
			http.MethodPost,
			http.MethodPatch,
			http.MethodPut,
			http.MethodDelete,
			http.MethodOptions,
		},
		AllowedHeaders: []string{
			"Accept",
			"Authorization",
			"Content-Type",
			"X-CSRF-Token",
		},
		ExposedHeaders: []string{
			"Link",
		},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Use(middleware.RequestID)
	r.Use(middleware.ClientIPFromRemoteAddr)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	r.Get(
		"/swagger/*",
		httpSwagger.Handler(
			httpSwagger.URL(
				"http://localhost:8080/swagger/doc.json",
			),
		),
	)

	r.Route("/v1", func(r chi.Router) {
		/*
			Public routes
		*/

		r.Get(
			"/health",
			app.healthCheckHandler,
		)

		r.Route("/auth", func(r chi.Router) {
			r.Post(
				"/login",
				app.loginUserHandler,
			)
		})

		/*
			Authenticated routes
		*/

		r.Group(func(r chi.Router) {
			r.Use(app.AuthTokenMiddleware)

			r.Get(
				"/me",
				app.getCurrentUserHandler,
			)

			/*
				Student routes
			*/

			r.Route("/students", func(r chi.Router) {
				r.Group(func(r chi.Router) {
					r.Use(
						app.RequireRole(
							store.RoleStudent,
						),
					)

					r.Get(
						"/profile",
						app.getStudentProfileHandler,
					)

					r.Get(
						"/profile/enrollments",
						app.getMyEnrollmentsHandler,
					)
				})

				r.Group(func(r chi.Router) {
					r.Use(
						app.RequireRole(
							store.RoleAdmin,
						),
					)

					r.Post(
						"/",
						app.createStudentHandler,
					)

					r.Get(
						"/",
						app.getStudentsHandler,
					)

					r.Get(
						"/{studentID}",
						app.getStudentHandler,
					)

					r.Patch(
						"/{studentID}",
						app.updateStudentHandler,
					)

					r.Get(
						"/{studentID}/enrollments",
						app.getStudentEnrollmentsHandler,
					)
				})
			})

			/*
				Program routes
			*/

			r.Route("/programs", func(r chi.Router) {
				/*
					Authenticated admin/student routes
				*/

				r.Get(
					"/",
					app.getProgramsHandler,
				)

				r.Get(
					"/{programID}",
					app.getProgramHandler,
				)

				r.Get(
					"/{programID}/batches",
					app.getProgramBatchesHandler,
				)

				/*
					Admin-only routes
				*/

				r.Group(func(r chi.Router) {
					r.Use(
						app.RequireRole(
							store.RoleAdmin,
						),
					)

					r.Post(
						"/",
						app.createProgramHandler,
					)

					r.Patch(
						"/{programID}",
						app.updateProgramHandler,
					)
				})
			})

			/*
				Batch routes
			*/

			r.Route("/batches", func(r chi.Router) {
				/*
					Authenticated admin/student routes
				*/

				r.Get(
					"/",
					app.getBatchesHandler,
				)

				r.Get(
					"/{batchID}",
					app.getBatchHandler,
				)

				/*
					Admin-only routes
				*/

				r.Group(func(r chi.Router) {
					r.Use(
						app.RequireRole(
							store.RoleAdmin,
						),
					)

					r.Post(
						"/",
						app.createBatchHandler,
					)

					r.Patch(
						"/{batchID}",
						app.updateBatchHandler,
					)

					/*
						Admin can view the roster /
						enrollments for a batch.
					*/

					r.Get(
						"/{batchID}/enrollments",
						app.getBatchEnrollmentsHandler,
					)
				})
			})

			/*
				Enrollment routes
			*/

			r.Route("/enrollments", func(r chi.Router) {
				r.Group(func(r chi.Router) {
					r.Use(
						app.RequireRole(
							store.RoleAdmin,
						),
					)

					r.Post(
						"/",
						app.createEnrollmentHandler,
					)

					r.Get(
						"/{enrollmentID}",
						app.getEnrollmentHandler,
					)

					r.Patch(
						"/{enrollmentID}",
						app.updateEnrollmentHandler,
					)
				})
			})
		})
	})

	return r
}

func (app *application) run(
	mux http.Handler,
) {
	srv := &http.Server{
		Addr:         app.config.addr,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	fmt.Println(
		"the server is listening on port:",
		srv.Addr,
	)

	if err := srv.ListenAndServe(); err != nil &&
		err != http.ErrServerClosed {
		app.logger.Fatalw(
			"server failed",
			"error",
			err,
		)
	}
}
