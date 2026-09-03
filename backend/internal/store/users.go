package store

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type UserStore struct {
	db *sql.DB
}

type RoleType string

const (
	RoleAdmin   RoleType = "admin"
	RoleStudent RoleType = "student"
)

type User struct {
	ID        int64     `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Password  Password  `json:"-"`
	Role      RoleType  `json:"role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
type Password struct {
	hash []byte
}

func (p *Password) Set(pwd string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(pwd), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	p.hash = hash
	return nil
}

func (p *Password) Compare(pwd string) error {
	return bcrypt.CompareHashAndPassword(p.hash, []byte(pwd))
}

func (s *UserStore) Create(ctx context.Context, user *User) error {
	ctx, cancel := context.WithTimeout(ctx, QUERY_CANCEL_DURATION)
	defer cancel()

	query := `INSERT 
				INTO 
					users(username,email,password,role) 
				values($1,$2,$3,$4) 
				RETURNING id,created_at,updated_at
	`
	err := s.db.QueryRowContext(ctx, query,
		user.Username,
		user.Email,
		user.Password.hash,
		user.Role,
	).Scan(
		&user.ID,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return err
	}

	return nil
}

func (s *UserStore) GetByID(ctx context.Context, userID int64) (*User, error) {
	ctx, cancel := context.WithTimeout(ctx, QUERY_CANCEL_DURATION)
	defer cancel()

	query := `
	SELECT 
	id,
	username,
	email,
	password,
	role,
	created_at,
	updated_at 
	FROM 
		users
	WHERE id=$1
	`

	user := &User{}

	err := s.db.QueryRowContext(ctx, query, userID).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.Password.hash,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return user, nil
}

type UpdateUserPayload struct {
	Email    *string `json:"email" validate:"omitempty,email"`
	Username *string `json:"username" validate:"omitempty,min=3,max=50"`
}

func (s *UserStore) UpdateByID(ctx context.Context, userID int64, payload UpdateUserPayload) (*User, error) {
	ctx, cancel := context.WithTimeout(ctx, QUERY_CANCEL_DURATION)
	defer cancel()

	query := `
		UPDATE users
		SET
			email = COALESCE($1, email),
			username = COALESCE($2, username),
			updated_at = NOW()
		WHERE id = $3
		RETURNING
			id,
			username,
			email,
			created_at,
			updated_at
	`

	user := &User{}

	err := s.db.QueryRowContext(
		ctx,
		query,
		payload.Email,
		payload.Username,
		userID,
	).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return user, nil
}

func (s *UserStore) GetByEmail(ctx context.Context, email string) (*User, error) {
	ctx, cancel := context.WithTimeout(ctx, QUERY_CANCEL_DURATION)
	defer cancel()

	query := `
	SELECT 
	id,
	username,
	email,
	password,
	role,
	created_at,
	updated_at 
	FROM 
		users
	WHERE email=$1
	`

	user := &User{}

	err := s.db.QueryRowContext(ctx, query, email).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.Password.hash,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return user, nil
}

func (s *UserStore) DeleteByID(ctx context.Context, userID int64) error {
	ctx, cancel := context.WithTimeout(ctx, QUERY_CANCEL_DURATION)
	defer cancel()
	query := `DELETE FROM users where id = $1`
	result, err := s.db.ExecContext(ctx, query, userID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}
