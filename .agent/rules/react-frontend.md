# React Frontend Guidelines

- **Framework:** Next.js App Router is mandatory. Do not use the Pages router.
- **TypeScript:** Strict mode must be enabled and enforced. Avoid `any` types.
- **Components:** Prioritize Server Components for performance and SEO. Only use Client Components (`"use client"`) when interactivity or state management is explicitly required.
- **Styling:** Use Tailwind CSS for all styling. Rely on `shadcn/ui` for foundational UI components (Cards, Tables, Badges, etc.).
