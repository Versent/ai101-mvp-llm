.PHONY: up down restart clean logs ps pull setup prune

# Default to no profile (eg. install ollama on your laptop)
PROFILE ?= ""

# Colors for pretty output
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RESET := \033[0m

help:
	@echo "$(CYAN)Available commands:$(RESET)"
	@echo "  make setup           - Initialize environment file from example"
	@echo "  make up              - Start all services with CPU profile"
	@echo "  make up PROFILE=gpu-nvidia  - Start all services with GPU profile"
	@echo "  make down            - Stop all services"
	@echo "  make restart         - Restart all services"
	@echo "  make clean           - Remove orphaned containers and volumes"
	@echo "  make prune           - Remove all unused Docker data to free disk space"

setup:
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Creating .env file from .env.example...$(RESET)"; \
		cp .env.example .env; \
		echo "$(GREEN)Created .env file. Please review and adjust values as needed.$(RESET)"; \
	else \
		echo "$(YELLOW).env file already exists. Skipping...$(RESET)"; \
	fi

up: setup
	@echo "$(CYAN)Starting services with $(PROFILE) profile...$(RESET)"
	docker compose --profile $(PROFILE) up -d --build

down:
	@echo "$(CYAN)Stopping services...$(RESET)"
	docker compose --profile $(PROFILE) down

restart: down up

clean:
	@echo "$(CYAN)Cleaning up orphaned containers and volumes...$(RESET)"
	docker compose --profile $(PROFILE) down --volumes --remove-orphans

prune:
	@echo "$(CYAN)Cleaning up unused Docker data...$(RESET)"
	docker system prune -af --volumes
