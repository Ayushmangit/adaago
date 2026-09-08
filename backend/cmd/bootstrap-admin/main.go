package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/Ayushmangit/adaago.git/backend/internal/db"
	"github.com/Ayushmangit/adaago.git/backend/internal/env"
	"github.com/Ayushmangit/adaago.git/backend/internal/store"
)

func main() {
	dbAddr := env.GetString(
		"DB_ADDR",
		"postgres://admin:adminpassword@localhost:5435/adaa?sslmode=disable",
	)

	maxIdleConns := env.GetInt(
		"DB_MAX_IDLE_CONNS",
		30,
	)

	maxOpenConns := env.GetInt(
		"DB_MAX_OPEN_CONNS",
		30,
	)

	maxIdleTime := env.GetString(
		"DB_MAX_IDLE_TIME",
		"15m",
	)

	adminEmail := strings.ToLower(
		strings.TrimSpace(
			env.GetString(
				"ADMIN_EMAIL",
				"admin@adaago.com",
			),
		),
	)

	adminUsername := strings.TrimSpace(
		env.GetString(
			"ADMIN_USERNAME",
			"admin",
		),
	)

	adminPassword := env.GetString(
		"ADMIN_PASSWORD",
		"changeme@123",
	)

	database, err := db.New(
		dbAddr,
		maxOpenConns,
		maxIdleConns,
		maxIdleTime,
	)
	if err != nil {
		log.Fatal(
			"failed to connect to database: ",
			err,
		)
	}
	defer database.Close()

	storage := store.NewStorage(database)

	ctx, cancel := context.WithTimeout(
		context.Background(),
		10*time.Second,
	)
	defer cancel()

	existingAdmin, err := storage.Users.GetByEmail(
		ctx,
		adminEmail,
	)

	if err == nil {
		fmt.Printf(
			"admin already exists: id=%d email=%s\n",
			existingAdmin.ID,
			existingAdmin.Email,
		)

		return
	}

	if !errors.Is(err, store.ErrNotFound) {
		log.Fatal(
			"failed to check existing admin: ",
			err,
		)
	}

	admin := &store.User{
		Username: adminUsername,
		Email:    adminEmail,
		Role:     store.RoleAdmin,
	}

	if err := admin.Password.Set(
		adminPassword,
	); err != nil {
		log.Fatal(
			"failed to hash admin password: ",
			err,
		)
	}

	if err := storage.Users.Create(
		ctx,
		admin,
	); err != nil {
		log.Fatal(
			"failed to create admin: ",
			err,
		)
	}

	fmt.Println("admin account created successfully")

	fmt.Printf(
		"id: %d\nusername: %s\nemail: %s\nrole: %s\n",
		admin.ID,
		admin.Username,
		admin.Email,
		admin.Role,
	)
}
