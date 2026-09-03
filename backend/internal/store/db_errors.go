package store

import (
	"errors"

	"github.com/lib/pq"
)

const (
	postgresUniqueViolation     pq.ErrorCode = "23505"
	postgresForeignKeyViolation pq.ErrorCode = "23503"
	postgresNotNullViolation    pq.ErrorCode = "23502"
	postgresCheckViolation      pq.ErrorCode = "23514"
)

func getPostgresError(err error) (*pq.Error, bool) {
	var pqError *pq.Error

	if !errors.As(err, &pqError) {
		return nil, false
	}

	return pqError, true
}

func isUniqueViolation(err error) bool {
	pqError, ok := getPostgresError(err)

	return ok && pqError.Code == postgresUniqueViolation
}

func isForeignKeyViolation(err error) bool {
	pqError, ok := getPostgresError(err)

	return ok && pqError.Code == postgresForeignKeyViolation
}

func isNotNullViolation(err error) bool {
	pqError, ok := getPostgresError(err)

	return ok && pqError.Code == postgresNotNullViolation
}

func isCheckViolation(err error) bool {
	pqError, ok := getPostgresError(err)

	return ok && pqError.Code == postgresCheckViolation
}

func postgresConstraint(err error) string {
	pqError, ok := getPostgresError(err)
	if !ok {
		return ""
	}

	return pqError.Constraint
}
