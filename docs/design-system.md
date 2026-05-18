# Design System

## Tokens

The primary token source is `src/styles/apple-tokens.css`.

- Background: `--apple-bg`, `--apple-bg-elevated`
- Surfaces: `--apple-surface`, `--apple-surface-strong`, `--apple-surface-muted`
- Text: `--apple-text`, `--apple-text-muted`, `--apple-text-faint`
- Borders: `--apple-border`, `--apple-border-strong`
- Accents: blue, green, orange, pink, purple, slate
- Elevation: `--apple-shadow-soft`, `--apple-shadow-control`
- Shape: card radius 28px, panel radius 22px, control radius 999px
- Effects: `--apple-blur` for translucent widget surfaces

## Component Rules

- Widget cards use `WidgetFrame` and should remain draggable from the handle only.
- Dashboard controls use icon buttons with titles and accessible labels.
- Collapsed panels use `CollapsePanel` for non-primary module groups.
- Inputs use rounded fields, shared focus ring, and compact dashboard sizing.
- Future widgets should enter through `WidgetDefinition` plus a layout entry instead of direct grid markup.

## Theme Rules

- Light and dark themes are both CSS-variable based.
- Theme selection is user-controlled in `WidgetToolbar`.
- New colors should be introduced as tokens before component-level use.
