all: dev

dev: frontend-dev

[working-directory: 'frontend']
install-dependencies:
  bun install

[working-directory: 'frontend']
frontend-dev: install-dependencies
  bun run dev

[working-directory: 'frontend']
frontend-build: install-dependencies
  bun run build

[working-directory: 'frontend']
frontend-serve: frontend-build
  bun run preview
