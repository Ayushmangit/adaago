package main

import (
	"time"

	"github.com/Ayushmangit/adaago.git/backend/internal/auth"
	"github.com/Ayushmangit/adaago.git/backend/internal/db"
	"github.com/Ayushmangit/adaago.git/backend/internal/env"
	"github.com/Ayushmangit/adaago.git/backend/internal/service"
	"github.com/Ayushmangit/adaago.git/backend/internal/store"
	"go.uber.org/zap"
)

const version = "0.0.1"

//	@title			adaa Api
//	@description	API for adaa ,ERP for adaa
//	@termsOfService	http://swagger.io/terms/

//	@contact.name	API Support
//	@contact.url	http://www.swagger.io/support
//	@contact.email	support@swagger.io

//	@license.name	Apache 2.0
//	@license.url	http://www.apache.org/licenses/LICENSE-2.0.html

//	@BasePath					/v1
//
//	@securityDefinitions.apikey	ApiKeyAuth
//	@in							header
//	@name						Authorization
//	@description

func main() {
	cfg := Config{
		addr: env.GetString("ADDR", ":8080"),
		env:  env.GetString("ENV", "development"),
		db: dbConfig{
			addr:         env.GetString("DB_ADDR", "postgres://admin:adminpassword@localhost:5434/boardGO?sslmode=disable"),
			maxIdleConns: env.GetInt("DB_MAX_IDLE_CONNS", 30),
			maxOpenConns: env.GetInt("DB_MAX_OPEN_CONNS", 30),
			maxIdleTime:  env.GetString("DB_MAX_IDLE_TIME", "15m"),
		},
		auth: authConfig{
			token: tokenConfig{
				secret: env.GetString("JWT_SECRET", "asdhpasdhfgljkdshfjashdf"),
				exp:    time.Hour * 24 * 3, // 3 days,
				iss:    env.GetString("TOKEN_HOST", "boardGO"),
				aud:    env.GetString("TOKEN_HOST", "boardGO"),
			},
		},
	}

	logger := zap.Must(zap.NewProduction()).Sugar()
	defer logger.Sync() // flushes any buffered logs entries

	db, err := db.New(cfg.db.addr, cfg.db.maxIdleConns, cfg.db.maxIdleConns, cfg.db.maxIdleTime)
	if err != nil {
		logger.Fatal(err)
	}

	logger.Info("DB connection is Established")

	store := store.NewStorage(db)
	service := service.NewServices(store)
	auth := auth.NewJWTAuthenticator(cfg.auth.token.secret, cfg.auth.token.aud, cfg.auth.token.iss)

	app := application{
		config:        cfg,
		store:         store,
		service:       service,
		authenticator: auth,
		logger:        logger,
	}

	app.run(app.mount())
}
