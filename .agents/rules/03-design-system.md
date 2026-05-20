---
name: DESIGN.md Enforcement
scope: global
activation: always_on
---
# UI & Styling Constraints
- The agent MUST ALWAYS consult the root `DESIGN.md` file and the extended `tailwind.config.ts` before creating or modifying any React UI components.
- Strictly adhere to the semantic color names (e.g., `bg-primary`, `text-secondary`, `bg-ibf-white-executive`, `text-ibf-midnight-boardroom`) and typography rules defined in the design system.
- Never hallucinate arbitrary hex codes or raw Tailwind colors (like `bg-blue-500`, `text-indigo-600`) unless explicitly instructed.

## Geometry Constraints
- **Rounded corners are strictly forbidden.** All interactive elements (buttons, inputs, cards, borders) must have sharp corners (`border-radius: 0px`). Do not use Tailwind's default rounded classes (e.g., do NOT use `rounded`, `rounded-md`, `rounded-lg`, etc.).

## Style & Visual Restrictions
- **No Opacity, Shadows, or Gradients.** Do not inject box shadows, gradients, or any custom opacities over IBF base colors.
- Maintain flat, clinical, transparent, and structured brutalist layouts. Master backgrounds must remain pure white (#FFFFFF).
