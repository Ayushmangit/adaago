package service

import (
	"context"
	"errors"

	"github.com/Ayushmangit/adaago.git/backend/internal/store"
)

var (
	ErrCurrentPasswordIncorrect = errors.New("current password is incorrect")
	ErrSamePassword             = errors.New("new password must be different from current password")
)

type ChangePasswordInput struct {
	CurrentPassword string `json:"current_password" validate:"required,min=8,max=72"`
	NewPassword     string `json:"new_password" validate:"required,min=8,max=72"`
}

type UserService struct {
	store store.Storage
}

func (s *UserService) ChangePassword(
	ctx context.Context,
	userID int64,
	input ChangePasswordInput,
) error {
	if userID <= 0 {
		return store.ErrNotFound
	}

	if input.CurrentPassword == input.NewPassword {
		return ErrSamePassword
	}

	user, err := s.store.Users.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	if err := user.Password.Compare(input.CurrentPassword); err != nil {
		return ErrCurrentPasswordIncorrect
	}

	if err := user.Password.Set(input.NewPassword); err != nil {
		return err
	}

	if err := s.store.Users.UpdatePassword(
		ctx,
		user.ID,
		user.Password,
	); err != nil {
		return err
	}

	return nil
}
