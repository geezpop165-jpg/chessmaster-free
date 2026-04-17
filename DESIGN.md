# Design Brief

## Direction
Sharp, strategic, minimalist dark chess interface. Professional competitive aesthetic focused on game clarity and move analysis. Zero decoration that distracts from tactical decision-making.

## Tone & Differentiation
Premium chess tool: focused, clean, high-contrast. Move suggestion arrows in graduated color hierarchy (emerald green → sapphire blue → golden yellow) make engine analysis immediate and intuitive. No ambient effects. Game board is the hero.

## Color Palette

| Token | OKLCH Value | Purpose |
|-------|------------|---------|
| Background | `0.12 0 0` | Deep charcoal, minimal distraction |
| Foreground | `0.95 0 0` | High-contrast text for readability |
| Primary (Sapphire) | `0.7 0.18 146` | Interactive elements, focus ring |
| Secondary (Electric) | `0.55 0.15 140` | Alternative actions, secondary info |
| Accent (Emerald) | `0.6 0.2 120` | Highlights, active states |
| Muted | `0.25 0 0` | Disabled states, borders |
| Destructive | `0.65 0.19 22` | Reset/undo actions |

## Typography

| Layer | Font | Usage |
|-------|------|-------|
| Display | Bricolage Grotesque | Headers, mode selector, difficulty labels |
| Body | DM Sans | Move analysis, game status, evaluation text |
| Mono | Geist Mono | Move notation, engine scores |

## Elevation & Depth
- **Background**: flat, deep (0.12 L)
- **Card**: elevated 0.04 L above background (0.16 L), subtle border
- **Popover**: floating above card (0.2 L)
- **Board**: on-canvas, primary focal element with shadow (0 20px 40px, 0.7 alpha)
- **Evaluation pane**: glass effect (50% card + backdrop blur + subtle border)

## Structural Zones

| Zone | Treatment | Constraint |
|------|-----------|-----------|
| Header | card bg, sharp corners, flex row | Game mode + difficulty selector, minimal height |
| Board Area | board-shadow utility, canvas-based rendering | Center, 8:8 aspect, responds to viewport |
| Right Sidebar | glass-panel utility, scrollable | Top 3 moves with evaluation bars, win % |
| Footer | card bg, border-t | Game status, undo/reset, share controls |

## Component Patterns
- Buttons: primary (sapphire), secondary (electric), destructive (red), quiet states
- Move arrows: best (emerald), alt 1 (sky blue), alt 2 (amber), canvas-rendered
- Legal highlights: emerald ring with 50% opacity
- Evaluation bar: white-to-black spectrum for advantage visualization
- Difficulty selector: 5 preset buttons (Beginner → Master)

## Motion
- Smooth transitions: 300ms cubic-bezier(0.4, 0, 0.2, 1) for hover/focus
- Board updates: immediate (no animation delay on moves)
- Move suggestions: fade-in on engine response (200ms)
- No bounce, no overshoot — professional tempo

## Spacing & Rhythm
- Base unit: 4px grid
- Card padding: 1rem
- Section gaps: 1.5rem vertical, 1rem horizontal
- Tight vertical spacing in move list for density

## Custom Utilities

| Class | Effect |
|-------|--------|
| `.move-arrow-best` | Emerald stroke for best move |
| `.move-arrow-alt` | Sky blue stroke for alternatives |
| `.move-arrow-third` | Amber stroke for third move |
| `.legal-move-highlight` | Emerald ring with inset |
| `.board-shadow` | Deep elevation shadow + subtle inset |
| `.glass-panel` | Card bg + backdrop blur + soft border |

## Constraints
- Minimum contrast AA+ in both light and dark
- Game board renders at fixed aspect, responsive frame
- No gradients on functional UI (reserved for possible future hero section)
- All interactive elements ring on focus (sapphire ring)
- Move notation in mono font for clarity
