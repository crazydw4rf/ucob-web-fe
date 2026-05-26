all: dev

dev: frontend-dev

[working-directory: 'frontend']
frontend-dev:
  bun run dev

[working-directory: 'frontend']
frontend-build:
  bun run build

[working-directory: 'frontend']
frontend-serve:
  bun run preview
