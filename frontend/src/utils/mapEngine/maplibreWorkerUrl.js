// AI-GENERATED — not an architecture reference
// Where MapLibre's worker lives once Vite has built it. MapLibre looks for the worker next to
// its own file (`new URL('./maplibre-gl-worker.mjs', import.meta.url)`), which in the built
// wallet points at a file that does not exist; `?worker&url` has Vite build the worker as a
// file of its own and hands over its address (measured with the repo's Vite 5.4, 16.09.2026).
// A module of its own so that a test can put a plain string in its place - otherwise Vitest
// would try to build the worker.
export { default } from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
