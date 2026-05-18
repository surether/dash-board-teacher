# App Design Profile

## Context

- App type: Web dashboard for teacher productivity widgets.
- Target users: Teachers who need quick-glance classroom utilities during the school day.
- Platform: Browser-based React app.
- UI framework: React + Vite with CSS tokens and `react-grid-layout`.
- Main tasks: Check time, jot notes, track tasks, manage simple reminders, and later connect school data modules.

## Direction

- Visual tone: Apple-style calm utility, light translucent surfaces, soft shadows, restrained motion.
- Density: Medium. Widgets should be glanceable without becoming sparse.
- Typography: System UI stack, clear labels, compact widget headings, no viewport-scaled body text.
- Layout: Drag-resizable widget grid with fixed row rhythm and responsive breakpoints.
- Navigation: Single dashboard surface for this phase.
- Component rules: Rounded glass cards, icon buttons for controls, native form controls styled through shared tokens.
- Animation: Subtle hover and transform transitions only.
- Accessibility: Semantic landmarks, labelled form controls, visible focus treatment through border and shadow states.

## Open Assumptions

- The product should feel professional and teacher-facing rather than student-playful.
- Korean school-system modules are reserved for later, but this phase keeps UI copy in English to avoid premature localization decisions.
- `localStorage` is acceptable for layout persistence until a SQLite-backed adapter is introduced.
