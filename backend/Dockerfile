FROM golang:1.25 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY backend ./backend

RUN CGO_ENABLED=0 GOOS=linux go build -o api ./backend/cmd/api


FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/api .

EXPOSE 8080

CMD ["./api"]
