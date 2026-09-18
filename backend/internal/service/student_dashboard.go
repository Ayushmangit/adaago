package service

import (
	"context"

	"github.com/Ayushmangit/adaago.git/backend/internal/store"
)

type StudentDashboardService struct {
	store store.Storage
}

func (s *StudentDashboardService) GetSummary(ctx context.Context, userID int64) (*store.StudentDashboardSummary, error) {
	return s.store.StudentDashboard.GetSummary(ctx, userID)
}
