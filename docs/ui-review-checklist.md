# UI Review Checklist

- Visual hierarchy: toolbar, widget title, widget body, and secondary copy are distinct.
- Spacing and alignment: grid margin, card padding, form spacing, and stub grid spacing remain consistent.
- Typography: controls, headings, captions, and widget body text use intentional sizes and weights.
- Color consistency: use Apple tokens, avoid one-off component colors.
- Component consistency: new widgets should use `WidgetFrame` and shared form/list styles where possible.
- Responsiveness: check desktop, tablet, and mobile grid breakpoints.
- Accessibility: labelled inputs, labelled icon-only buttons, semantic regions, and usable focus states.
- Empty/loading/error states: future data-backed modules need explicit states before activation.
- Persistence: layout changes must go through the storage adapter boundary.
