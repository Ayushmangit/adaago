package service

import (
	"context"

	"github.com/Ayushmangit/adaago.git/backend/internal/store"
)

type DashboardService struct {
	store store.Storage
}

func (s *DashboardService) GetSummary(ctx context.Context) (*store.DashboardSummary, error) {
	return s.store.Dashboard.GetSummary(ctx)
}
