.PHONY: up down logs backend frontend dev stop

# ─── Infrastructure ──────────────────────────────────────────────
up:
	@echo "🐳 Starting Postgres & Redis..."
	docker compose up -d
	@echo "✅ Postgres on :5433 | Redis on :6379"

down:
	@echo "🛑 Stopping all containers..."
	docker compose down

logs:
	docker compose logs -f

# ─── Individual Servers ──────────────────────────────────────────
backend:
	@echo "🚀 Starting Go backend on :3000..."
	cd backend-go && go run cmd/main.go

frontend:
	@echo "🎨 Starting React frontend on :5173..."
	cd frontend && npm run dev

# ─── Full Dev Stack ───────────────────────────────────────────────
dev: up
	@echo "Starting backend and frontend in parallel..."
	@make -j 2 backend frontend

# ─── Database ────────────────────────────────────────────────────
psql:
	@echo "🗄️  Connecting to Postgres..."
	docker exec -it earnsaga-postgres psql -U root earnsaga

redis-cli:
	@echo "🔴 Connecting to Redis..."
	docker exec -it earnsaga-redis redis-cli

# ─── Sync Offers ────────────────────────────────────────────────
sync:
	@echo "🔄 Syncing offers from PubScale..."
	curl -s -X POST http://localhost:3000/api/offers/sync | python3 -m json.tool

seed:
	@echo "🌱 Seeding demo offers..."
	curl -s -X POST http://localhost:3000/api/seed | python3 -m json.tool

stop:
	@echo "🛑 Stopping containers..."
	docker compose down
	@pkill -f "go run cmd/main.go" 2>/dev/null || true
	@pkill -f "vite" 2>/dev/null || true
	@echo "✅ All stopped"
