.PHONY: dev dev-backend build build-firefox zip zip-firefox test test-extension test-backend deploy db-migrate-local db-migrate secret install clean

# Extension
dev:
	pnpm dev

build:
	pnpm build

build-firefox:
	pnpm build:firefox

zip:
	pnpm zip

zip-firefox:
	pnpm zip:firefox

# Backend
dev-backend:
	cd backend && pnpm dev

deploy:
	cd backend && pnpm run publish

db-migrate-local:
	cd backend && pnpm db:migrate:local

db-migrate:
	cd backend && pnpm db:migrate:remote

secret:
	cd backend && wrangler secret put OPENROUTER_API_KEY

# Testing
test: test-extension test-backend

test-extension:
	pnpm test

test-backend:
	cd backend && pnpm test

# Setup
install:
	pnpm install
	cd backend && pnpm install

clean:
	rm -rf .output .wxt
