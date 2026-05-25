---
name: Nocturnal Focus
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#c1c6d7'
  on-secondary: '#2b303d'
  secondary-container: '#434957'
  on-secondary-container: '#b3b8c8'
  tertiary: '#bec6e0'
  on-tertiary: '#283044'
  tertiary-container: '#9ea6bf'
  on-tertiary-container: '#343c50'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#dde2f3'
  secondary-fixed-dim: '#c1c6d7'
  on-secondary-fixed: '#161c28'
  on-secondary-fixed-variant: '#414754'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style
The design system is engineered for the "Deep Night" scholar—the professional balancing a rigorous career with the technical demands of the GATE CSE 2027 examination. The aesthetic is **Disciplined Minimalism** meets **Technical Modernism**, prioritizing cognitive ease and visual endurance.

The brand personality is elite and scientific. It avoids the "gamified" clutter of typical education apps in favor of a workspace that feels like a mission control center. Every element is designed to minimize eye strain in low-light environments ("Sleep Caves") while maintaining a high-contrast hierarchy that remains legible even under mental fatigue. The mood is calm, authoritative, and intensely focused.

## Colors
This design system utilizes a "Deep Night" palette designed for extreme focus in dark environments. 

- **Primary (Focus Blue):** Cyan 500 is the sole interactive driver. It signals action, progress, and current focus.
- **Secondary/Tertiary (Deep Night):** A combination of Indigo 950 and Slate 900 creates the background architecture, providing enough tonal variance to distinguish surfaces without breaking the dark-room immersion.
- **Accents:** Emerald 400 (Success) and Amber 400 (Alert) are used sparingly as data-driven signals for progress tracking and priority management.
- **Neutral:** Slate 400 is used for secondary text, while Slate 50 is reserved for primary content to ensure a high-contrast, accessible reading experience.

## Typography
The design system relies exclusively on **Inter** for its systematic, utilitarian precision. The hierarchy is intentionally stark to help users parse complex technical data (algorithms, discrete mathematics, OS kernels) quickly.

- **Headlines:** Use Bold and Semi-Bold weights with slight negative letter-spacing to create a "dense," authoritative feel.
- **Body:** Generous line-heights are employed to prevent "text crowding," which is critical for long-form study sessions in low light.
- **Labels:** Uppercase labels with increased letter-spacing are used for metadata, syllabus categories, and status indicators to differentiate them from core learning content.

## Layout & Spacing
The layout model follows a **Fixed Grid** approach for desktop to contain focus within a central "work zone," while utilizing a **Fluid Grid** for mobile devices.

- **The Focus Zone:** On desktop, content is capped at 1280px to prevent excessive horizontal eye movement.
- **Rhythm:** An 8px base unit governs all dimensions.
- **Hierarchy of Space:** Use `stack-lg` (24px) to separate distinct study modules (e.g., Video Player vs. Notes). Use `stack-sm` (8px) for tightly coupled technical data like formula lists or code snippets.
- **Adaptive Reflow:** On mobile, sidebars collapse into a bottom-anchored navigation bar to keep the primary viewport dedicated to learning materials.

## Elevation & Depth
In a dark-mode environment, depth is established through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows, which can feel muddy.

- **Level 0 (Background):** Indigo 950 (#030712).
- **Level 1 (Cards/Surface):** Slate 900 (#0f172a).
- **Level 2 (Overlays/Popovers):** Slate 800 (#1e293b).
- **Defining Borders:** Instead of shadows, use 1px solid borders using Slate 800 for inactive cards and Cyan 500 for active/focused states. 
- **Focus Glow:** Interactive elements may use a subtle, 4px blur "Focus Blue" outer glow only when in an active state to draw the eye without causing glare.

## Shapes
The shape language is **Soft (Level 1)**. Elements use a 0.25rem (4px) base radius. This maintains a professional, rigid, and "engineered" feel suitable for a CSE application. 

- **Base Radius (4px):** Applied to input fields, small buttons, and tags.
- **Large Radius (8px):** Applied to content cards and modal containers.
- **Strictness:** Avoid pill-shapes or high-radius curves to keep the UI looking like a high-performance tool rather than a consumer social app.

## Components
Consistent component styling ensures the user can navigate the complex syllabus without friction.

- **Cards:** The primary container for syllabus topics. Background: Slate 900; Border: 1px Slate 800. On hover, the border transitions to Slate 700.
- **Buttons:** 
    - *Primary:* Solid Cyan 500 with Indigo 950 text for maximum legibility.
    - *Secondary:* Ghost style with Cyan 500 border and text.
- **Inputs:** Dark backgrounds (Indigo 950) with 1px Slate 700 borders. The focus state must clearly use a 2px Cyan 500 border.
- **Progress Indicators:** Use thin, 4px linear bars. Completed segments use Emerald 400; remaining segments use Slate 800.
- **Chips:** Small, Slate 800 background tags with Label-SM typography for categorizing topics (e.g., "Data Structures," "High Priority").
- **Focus Mode UI:** A specific state where all navigation is hidden, leaving only the primary content and a "Minimalist Exit" button. Backgrounds dim further to absolute black (#000000) to isolate the content.