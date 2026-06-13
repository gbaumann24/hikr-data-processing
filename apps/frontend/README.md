# Hikr Frontend

React/Vite workspace for the Hikr data processing UI.

## Structure

- `src/app`: application composition, providers, and routing.
- `src/components`: cross-feature layout components.
- `src/config`: environment parsing and app-level configuration.
- `src/features`: feature-owned pages, components, hooks, and data access.
- `src/services`: shared service clients such as API transport.
- `src/shared`: low-level reusable components, utilities, and types.
- `src/styles`: global CSS and design tokens once a visual system exists.

## Scripts

- `bun run dev`: start the Vite development server.
- `bun run build`: typecheck and build production assets.
- `bun run preview`: serve the production build locally.
- `bun run typecheck`: run TypeScript without emitting files.

Set `VITE_API_BASE_URL` to point the frontend at a non-local API.
