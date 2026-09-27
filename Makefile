.PHONY: dev dev-backend dev-frontend test seed migrate build

dev:
	npm run dev

dev-backend:
	cd backend && npm run dev

seed:
	cd backend && npm run prisma:seed

test:
	cd backend && npm test

build:
	npm run build && cd backend && npm run build
