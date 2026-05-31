.PHONY: run build test lint clean docker

BINARY=myservice
BUILD_DIR=bin

run:
	go run ./cmd/serve

build:
	go build -o $(BUILD_DIR)/$(BINARY) ./cmd/serve

test:
	go test -v -race -coverprofile=coverage.out ./...

lint:
	golangci-lint run ./...

clean:
	rm -rf $(BUILD_DIR) coverage.out

docker:
	docker build -t $(BINARY):latest .

migrate:
	migrate -path db/migrations -database "$(DATABASE_URL)" up
