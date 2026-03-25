# ui-standards.md — UI Standards Reference

Reference this file when producing high-fidelity design decisions: components, tokens, visual language, or design system work.

**Default stack:** shadcn/ui · Tailwind CSS · Lucide icons. Do not introduce alternative component libraries, custom token systems, or separate icon sets unless explicitly instructed. Everything below is written against this stack.

---

## Layout

**The principle:** Layout creates hierarchy and flow. A well-structured layout guides the eye without the user noticing.

**Standards:**
- Use Tailwind's grid and flex utilities exclusively — no custom CSS layout unless Tailwind cannot achieve it
- Establish a clear visual hierarchy: one primary focal point per screen, secondary content clearly subordinate
- Use whitespace as a design element — space implies relationship. Prefer `gap-*` and `space-y-*` over manual margins
- Left-align body content by default (`text-left`); centre only for short standalone headings or empty states (`text-center`)
- Group related content into logical regions; separate with whitespace before reaching for visible dividers

**Tailwind layout utilities:**
```
Grid:       grid grid-cols-12 gap-4 (web) / grid-cols-4 (mobile)
Flex:       flex items-center justify-between gap-2
Container:  container mx-auto px-4 md:px-6 lg:px-8
Sections:   space-y-8 (between major sections) / space-y-4 (within sections)
```

**Layout patterns to know:**
- **F-pattern** — users scan in an F shape on content-heavy pages; put key info top-left
- **Z-pattern** — users scan in a Z on sparse layouts (landing pages); put CTA at the end of the Z
- **Card grid** — `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` for equal-weight items
- **Master/detail** — `grid grid-cols-[280px_1fr]` for list + detail panels

**Questions to ask:**
- Is there one clear starting point on this screen?
- Does the visual hierarchy match the information hierarchy?
- Does the layout still work at the smallest breakpoint (`sm:`)? Test it.

---

## Colours

**The principle:** Use shadcn's CSS variable token system exclusively. Never hardcode hex values in components. All colours must adapt correctly in both light and dark mode.

**shadcn colour tokens — use these names in all code and design discussions:**

| Token | Usage |
|---|---|
| `background` / `foreground` | Page background and primary text |
| `card` / `card-foreground` | Card surfaces and their text |
| `primary` / `primary-foreground` | Primary actions, key CTAs |
| `secondary` / `secondary-foreground` | Secondary actions, supporting UI |
| `muted` / `muted-foreground` | Disabled states, placeholder text, metadata |
| `accent` / `accent-foreground` | Hover states, selected items |
| `destructive` / `destructive-foreground` | Delete, remove, irreversible actions |
| `border` | Default border colour |
| `input` | Input field border |
| `ring` | Focus ring colour |

**In Tailwind classes, these map as:**
```
bg-background        text-foreground
bg-card              text-card-foreground
bg-primary           text-primary-foreground
bg-secondary         text-secondary-foreground
bg-muted             text-muted-foreground
bg-accent            text-accent-foreground
bg-destructive       text-destructive-foreground
border-border        border-input        ring-ring
```

**Rules:**
- Customise the palette by editing CSS variables in `globals.css` — not by overriding individual component classes
- Always define both `:root` (light) and `.dark` variants when adding custom tokens
- Maintain WCAG AA contrast: 4.5:1 for body text, 3:1 for UI components and large text
- Use `destructive` for all destructive actions — never red as a one-off colour choice
- Use colour to reinforce meaning, not as decoration — if a colour isn't communicating something, remove it

**Questions to ask:**
- Are we using shadcn token names, or hardcoded hex values?
- Does this work correctly in dark mode?
- Does the layout communicate clearly in greyscale?

---

## Typography

**The principle:** Use Tailwind's type scale throughout. Do not introduce custom font sizes outside the scale. Hierarchy is established through size, weight, and colour token combinations — not bespoke values.

**Tailwind type scale — standard usage:**

| Role | Classes | Notes |
|---|---|---|
| Display | `text-4xl font-semibold tracking-tight` | Hero headings only |
| H1 | `text-3xl font-semibold tracking-tight` | Page titles |
| H2 | `text-2xl font-semibold tracking-tight` | Section headings |
| H3 | `text-xl font-semibold` | Card titles, subsections |
| H4 | `text-lg font-medium` | Minor headings |
| Body | `text-base text-foreground` | Default body text |
| Small | `text-sm text-muted-foreground` | Supporting text, descriptions |
| Caption | `text-xs text-muted-foreground` | Metadata, timestamps, labels |

**Rules:**
- Use `font-semibold` (600) for headings, `font-medium` (500) for labels and emphasis, `font-normal` (400) for body
- Line height defaults are handled by Tailwind's scale — do not override with arbitrary values
- Maximum line length: add `max-w-prose` on body text containers (Tailwind sets this to ~65ch)
- Never use font size alone to convey importance — pair with weight and colour token

**Questions to ask:**
- Is every text element using a class from the standard scale above?
- Is the typographic hierarchy clear if you squint — do the levels read as distinct?
- Is body text constrained to `max-w-prose` where readability matters?

---

## Iconography

**The principle:** Lucide icons exclusively. Do not mix in Heroicons, Phosphor, Font Awesome, or any other library. Lucide is the default icon set for shadcn and ensures visual consistency across stroke weight and style.

**Usage:**
```tsx
import { Search, Settings, ChevronRight, Trash2 } from 'lucide-react'

// Standard sizing
<Search className="size-4" />            // inline / small UI
<Settings className="size-5" />          // default for most contexts
<ChevronRight className="size-6" />      // prominent / navigation

// With colour token
<Trash2 className="size-4 text-destructive" />
<Search className="size-4 text-muted-foreground" />
```

**Sizing conventions:**

| Context | Size class |
|---|---|
| Inline in text / buttons | `size-4` |
| Default UI (nav, list items) | `size-5` |
| Prominent actions, empty states | `size-6` |
| Decorative / illustration-weight | `size-8` or `size-10` |

**Rules:**
- Minimum touch target for interactive icons: wrap in a button with `p-2` padding to reach 44×44px
- Always pair icons with a visible label for primary actions — icon-only acceptable only for universally understood symbols (`X`, `Search`, `ChevronLeft`) or persistent nav with nearby labels
- Use `text-muted-foreground` for decorative/supporting icons, `text-foreground` for primary, `text-destructive` for destructive
- Add `aria-label` to icon-only interactive elements; add `aria-hidden="true"` to decorative icons

**Icon checklist:**
- [ ] All icons imported from `lucide-react` — no other sources
- [ ] Interactive icons have a minimum 44×44px touch target (use `p-2` padding on the wrapper)
- [ ] Primary actions have a visible text label alongside the icon
- [ ] Icon-only buttons have an `aria-label`
- [ ] Decorative icons have `aria-hidden="true"`

---

## Spacing

**The principle:** Use Tailwind's spacing scale exclusively. Arbitrary values (`p-[13px]`) are a last resort — if you're reaching for one, question whether the layout decision is correct first.

**Tailwind spacing scale — standard usage:**

| Token | px value | Use for |
|---|---|---|
| `1` | 4px | Tight internal gaps (icon to label) |
| `2` | 8px | Default internal padding, small gaps |
| `3` | 12px | Form field gaps, compact list items |
| `4` | 16px | Default component padding, standard gaps |
| `6` | 24px | Section padding, card padding |
| `8` | 32px | Between related sections |
| `12` | 48px | Between major page sections |
| `16` | 64px | Page-level vertical rhythm |

**Spacing rhythm conventions:**
```
Icon ↔ label:                    gap-1.5 or gap-2
Items in a list:                 space-y-1 or space-y-2
Form fields:                     space-y-4
Card internal padding:           p-4 or p-6
Between cards in a grid:         gap-4
Between page sections:           space-y-8 or space-y-12
Page horizontal padding:         px-4 (mobile) / px-6 (md) / px-8 (lg)
```

**Rules:**
- Never use arbitrary spacing values unless Tailwind's scale genuinely cannot achieve the result
- Use `gap-*` for flex/grid children rather than applying margins to individual items
- Use `space-y-*` for stacked vertical content where a gap utility isn't applicable
- Increase spacing between unrelated sections relative to spacing within them — whitespace communicates grouping

**Questions to ask:**
- Are all spacing values from the Tailwind scale, or are there arbitrary values that should be revisited?
- Does the spacing visually imply the correct groupings (more space = less related)?

---

## Design systems

**The principle:** shadcn/ui is the component foundation. Before building a custom component, check whether a shadcn primitive already exists or can be composed to meet the need.

**Component decision order:**
1. Use an existing shadcn component as-is
2. Compose multiple shadcn primitives into a new pattern
3. Extend a shadcn component with additional Tailwind classes via `cn()`
4. Build a custom component only when shadcn cannot meet the requirement — document why

**Using `cn()` for variants:**
```tsx
import { cn } from '@/lib/utils'

// Extend a shadcn component without overriding its base styles
<Button className={cn("w-full", isDestructive && "bg-destructive text-destructive-foreground")}>
```

**Component state checklist — every interactive component must have:**
- [ ] Default
- [ ] Hover (`hover:`)
- [ ] Focus (`focus-visible:ring-2 ring-ring ring-offset-2`)
- [ ] Active / pressed (`active:`)
- [ ] Disabled (`disabled:opacity-50 disabled:pointer-events-none`)
- [ ] Error (where applicable — use `destructive` token)
- [ ] Dark mode (inherited from shadcn tokens — verify it works)

**Rules:**
- Do not override shadcn component internals directly — customise via the `className` prop and `cn()`
- Variants should be added to the component's `cva()` definition, not as one-off class overrides at usage sites
- Keep token names in Figma identical to shadcn CSS variable names — `--primary`, `--muted-foreground`, etc.

**Questions to ask:**
- Does a shadcn component already exist for this? (`Button`, `Card`, `Dialog`, `Select`, `Sheet`, `Table`, `Tabs`…)
- If extending, am I using `cn()` or fighting the component's base styles?
- Do all states work correctly — including focus ring and dark mode?

---

## Charts (if enabled)

**The principle:** Charts use shadcn's `ChartContainer`, `ChartTooltip`, and `ChartLegend` wrappers around Recharts primitives. Charts inherit the brand palette through `--chart-*` CSS variables in `globals.css`, so they automatically adapt to light/dark mode.

**Setup (already done if charts were enabled at project creation):**
- `recharts` is installed as a dependency
- `components/ui/chart.tsx` exists (added via `npx shadcn add chart`)
- `--chart-1` through `--chart-5` tokens are defined in `globals.css` for both `:root` and `.dark`

**Usage pattern:**
```tsx
"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  expenses: { label: "Expenses", color: "var(--chart-2)" },
} satisfies ChartConfig

export function RevenueChart({ data }: { data: { month: string; revenue: number; expenses: number }[] }) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
```

**Key conventions:**
- `"use client"` is required — Recharts uses browser APIs
- `ChartContainer` generates `--color-{key}` CSS variables from the config — reference these in Recharts `fill` and `stroke` props
- `accessibilityLayer` prop on the Recharts root adds keyboard navigation and screen reader support
- Edit `--chart-1` through `--chart-5` in `globals.css` to match your brand palette
- Available chart types: `BarChart`, `LineChart`, `AreaChart`, `PieChart`, `RadarChart`, `RadialBarChart`
- Tooltip `indicator` accepts `"dot"`, `"line"`, or `"dashed"`

**Chart checklist:**
- [ ] All charts use `ChartContainer` wrapper (not raw Recharts)
- [ ] Chart colours reference `--chart-*` tokens, not hardcoded hex values
- [ ] Both light and dark mode chart tokens are defined in `globals.css`
- [ ] `accessibilityLayer` prop is present on the Recharts root
- [ ] Charts render correctly at mobile widths (test `min-h-[200px] w-full`)
- [ ] `"use client"` directive is present on chart components

---

## Visual branding

**The principle:** Brand personality is expressed by customising shadcn's CSS variable layer — not by adding one-off styles outside the system. Brand decisions (tone, colour, typography, icons) are established during the UX process (see `ux-process.md` → Brand Identity) and applied here through the stack.

**How to apply brand through the stack:**
- **Colour:** Edit `--primary`, `--secondary`, `--accent` in `globals.css` using the palette from the brand identity page. Both `:root` and `.dark` must be updated. Use [ui.shadcn.com/themes](https://ui.shadcn.com/themes) to generate a full token set, then fine-tune.
- **Radius:** Edit `--radius` in `globals.css`. shadcn scales all component radii off this single value (`rounded-md` = `calc(var(--radius) - 2px)`, `rounded-lg` = `var(--radius)`). Sharp = `0.25rem`, default = `0.5rem`, rounded = `0.75rem`.
- **Typography:** Import fonts via `next/font/google` in `layout.tsx`, assign CSS variables, and map them in `tailwind.config.ts` under `fontFamily`. See `ux-process.md` → Typography system for the implementation pattern.
- **Icons:** If the brand identity calls for a library other than Lucide, swap the package (`npm install` / `npm uninstall`), run `npm run swap-icons` to update shadcn components, and update the Iconography section in this file.
- **Motion:** Define transition durations consistently — `duration-150` for micro-interactions, `duration-300` for panel/modal transitions. Do not mix arbitrary durations.

**Brand expression checklist:**
- [ ] Brand identity page exists in Notion with tone, colour, typography, and icon decisions
- [ ] Brand colours are set via `--primary` / `--accent` CSS variables in `globals.css`, not hardcoded in components
- [ ] `--radius` is set to reflect brand personality
- [ ] Fonts are imported via `next/font/google` in `layout.tsx` and mapped in `tailwind.config.ts`
- [ ] Dark mode colour variables are defined alongside light mode variables
- [ ] Icon library matches the brand identity decision; `ui-standards.md` Iconography section is up to date
- [ ] Motion and transition durations are consistent across components
- [ ] Tone of voice is applied consistently across all copy (headings, buttons, errors, empty states)
