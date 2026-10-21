// AI-GENERATED — not an architecture reference

// What TypeScript cannot know on its own: a .vue file is a component. Until the last one has
// become a .tsx, a .tsx file imports them through this declaration, without their props.
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent
  // biome-ignore lint/style/noDefaultExport: a .vue file exports its component as default
  export default component
}

// vite-plugin-graphql-loader exports each operation of a .graphql file under its own name.
// It generates no types, so the names cannot be declared here and the imports stay untyped.
declare module '*.graphql'
