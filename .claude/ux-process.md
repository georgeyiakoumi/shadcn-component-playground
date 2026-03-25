# ux-process.md — UX Process Reference

Reference this file when working upstream of high-fidelity design: research, strategy, personas, flows, IA, or testing.
These are the activities that happen before pixels — and the ones that make pixels defensible.

---

## Artifact storage reference

| Artifact | Tool | Notes |
|---|---|---|
| Research findings, insight statements, affinity maps | **Notion** | One page per research round, linked from the master plan |
| UX strategy, experience principles, opportunity maps | **Notion** | Stored in the master plan document under Goals / Design principles |
| User personas | **Notion** | One page per persona, linked from the master plan |
| User stories | **Notion → Linear** | Written in Notion first; each story then mirrored as a Linear issue |
| Information architecture (site maps) | **Excalidraw** | Generated via MCP; link embedded in the relevant Notion page |
| User flows | **Excalidraw** | Generated via MCP; one board per flow, link embedded in Notion |
| Brand identity (tone, colour, type, icons) | **Notion** | One page in the master plan; decisions flow into `globals.css`, `tailwind.config.ts`, and `ui-standards.md` |
| Usability test plans + findings | **Notion** | One page per test round, findings logged with severity ratings |

---

## UX Research

**The principle:** Design decisions should be grounded in observed user behaviour, not assumed preferences. Research de-risks decisions by surfacing what you don't know before it's too late to change.

**Research methods by question type:**

| Question | Method |
|---|---|
| What do users do? | Analytics review, session recordings, diary studies |
| Why do users do it? | User interviews, contextual enquiry |
| Can users complete a task? | Usability testing (moderated or unmoderated) |
| What do users prefer? | Preference testing, surveys |
| How does this perform? | A/B testing, multivariate testing |

**Research output formats:**
- **Insight statement:** What we observed, what it means, what we should do about it
- **Affinity map:** Clustered observations from qualitative sessions
- **Research report:** Methodology, participants, key findings, recommendations

**Insight statement format:**
```
Observation: [What users did or said]
Meaning:     [What this reveals about their mental model or need]
Implication: [What design should consider or change as a result]
```

**Questions to ask before any research:**
- What decision will this research inform?
- What do we already know? What's the gap?
- Who are the right participants — and how many do we need?
- What's the minimum viable research to reduce risk on this decision?

**5-user rule:** For qualitative usability testing, 5 participants reveal ~85% of usability problems. More users = diminishing returns for discovery; more rounds of testing > more participants per round.

**Where it lives:** Notion — one page per research round, structured as: methodology → participants → key findings (as insight statements) → recommendations. Link the page from the master plan.

---

## UX Strategy

**The principle:** UX strategy aligns the experience with business outcomes and user needs over time. Without it, design becomes a series of disconnected feature requests.

**The three questions UX strategy answers:**
1. Who are we designing for, and what do they actually need?
2. What experience would genuinely differentiate us?
3. How do we sequence and prioritise the work to get there?

**Strategic framing format:**
```
User goal:    [What the user is trying to accomplish]
Business goal: [What the business needs this to achieve]
Opportunity:  [Where the user goal and business goal align — this is the design space]
Success looks like: [How we'd know we got it right]
```

**Common strategy outputs:**
- Experience principles (not "be simple" — "make the first step feel effortless even if the task is complex")
- Jobs To Be Done framework: "When I [situation], I want to [motivation], so I can [expected outcome]"
- Opportunity maps: user needs plotted against how well the current product serves them

**Questions to ask:**
- If we built this perfectly, what would change for the user?
- What's the one experience we want users to describe when they recommend this product?
- Are we solving a real problem or building a feature because someone asked for it?

**Where it lives:** Notion — strategy outputs live inside the master plan document (Goals, Design principles, and Milestones sections). Do not create a separate document; keep it co-located with the plan so it's referenced, not forgotten.

---

## User Personas

**The principle:** Personas are decision-making tools, not deliverables. A good persona makes it faster to align a team around a specific user's needs. A bad persona is a stock photo with a name and a list of demographics that nobody uses.

**What makes a persona useful:**
- Based on real research (interviews, analytics, observations) — not invented
- Focused on goals, behaviours, and frustrations — not demographics
- Small in number: 2–4 primary personas per product; more dilutes focus
- Used actively in design reviews ("Would Jamie actually encounter this scenario?")

**Persona structure:**
```
Name + role:      [First name, job or life context]
Core goal:        [What they're ultimately trying to accomplish — in one sentence]
Key behaviours:   [How they currently handle this problem — tools, workarounds, habits]
Frustrations:     [What breaks down for them today]
Success looks like: [What good looks like from their perspective]
Quote:            [A representative thing they said in research — real or composite]
```

**Anti-patterns to avoid:**
- Personas built without user research (they just reflect internal assumptions)
- More than 4–5 primary personas (team loses focus)
- Demographic-heavy personas that focus on age/gender/salary instead of behaviour
- Personas that live in a deck and are never referenced again

**Where it lives:** Notion — one page per persona using the structure above. Link all persona pages from the master plan. Reference persona names explicitly in Linear issue descriptions and design reviews.

---

## Brand Identity

**The principle:** Brand identity is established before any UI work begins. It is not decoration applied at the end — it is a set of decisions that constrain and guide every visual and verbal choice. Tone of voice shapes copy. Colour psychology shapes the palette. Typography shapes hierarchy and personality. Icon style shapes interaction feel. These decisions are made together, as a system, not piecemeal.

### Tone of voice

Tone defines how the product speaks. It influences every piece of copy — from headings to button labels to error messages to empty states.

**Tone definition format:**
```
Personality traits:  [3–5 adjectives — e.g. confident, approachable, concise, warm, expert]
Formality:           [Casual ←——→ Formal — pick a point on the scale]
Humour:              [None / Light / Present — and when to use it]
Audience assumption: [What does the reader already know? What needs explaining?]
```

**Tone do/don't format (write 3–5 of each):**
```
DO:    "Get started in under a minute" — direct, benefit-led, concise
DON'T: "Welcome to our platform! We're so excited to have you here" — filler, no information
```

**Where tone applies:**
- Headings and subheadings
- Button labels and CTAs
- Form labels and placeholder text
- Error messages and validation
- Empty states and onboarding
- Notifications and confirmation messages
- Metadata and helper text

**Questions to ask:**
- If this product were a person, how would they talk?
- What's the one word a user would use to describe how this product communicates?
- Are we talking to experts or beginners? Does that change across different parts of the product?

### Colour direction

Colour decisions are driven by colour psychology (see `design-psychology.md`) and mapped to shadcn CSS variable tokens. The palette is not aesthetic preference — it is communication.

**Colour decision process:**
1. **Start with psychology** — what emotions and associations does the brand need to convey? (trustworthy → blue, energetic → orange, premium → dark/gold, natural → green)
2. **Choose a primary hue** — this becomes `--primary`. It carries the brand's core identity.
3. **Choose a secondary/accent hue** — this becomes `--accent`. It complements or contrasts the primary for emphasis moments.
4. **Define the neutral scale** — warm neutrals (friendly, organic), cool neutrals (professional, technical), or true greys (minimal, modern).
5. **Set destructive** — typically red, but the shade should harmonise with the palette.
6. **Test contrast** — all pairings must meet WCAG AA (4.5:1 body text, 3:1 large text / UI).
7. **Define both modes** — light (`:root`) and dark (`.dark`) variants in `globals.css`.

**Colour output format:**
```
Primary:     [Hue + rationale — e.g. "Deep blue (#1e40af) — trust, stability, professionalism"]
Accent:      [Hue + rationale — e.g. "Amber (#f59e0b) — warmth, optimism, call to action"]
Neutrals:    [Warm / Cool / True grey + rationale]
Destructive: [Shade + note on harmony with palette]
Radius:      [Sharp 0.25rem / Default 0.5rem / Rounded 0.75rem — and why]
```

**Where it lands in code:** `app/globals.css` — edit the HSL values for `:root` and `.dark`. Use [ui.shadcn.com/themes](https://ui.shadcn.com/themes) to generate a full token set visually, then fine-tune.

### Typography system

Font choices shape how the product feels before a single word is read. Typography is selected based on brand personality, then configured in the codebase.

**Font role decisions:**

| Pattern | When to use | Example |
|---|---|---|
| 1 sans for everything | Apps, dashboards, tools — clean and functional | Inter |
| 1 display for headings + 1 sans for body | Marketing sites, landing pages — adds hierarchy and character | Clash Display + Inter |
| + 1 mono for code | Any project with code blocks or technical content | JetBrains Mono |
| + 1 serif for long-form | Content-heavy sites, editorial, blogs — readability for sustained reading | Lora, Merriweather |

**Font selection process:**
1. **Define personality** — refer to the brand personality traits. Is it geometric and modern? Humanist and warm? High-contrast and editorial?
2. **Pick the primary font** — this is the body font that carries 80% of the text. Prioritise readability, x-height, and character at `text-sm` / `text-base`.
3. **Pick supporting fonts** — heading font (if different) should contrast the body font in weight, width, or style. Do not pair two fonts from the same category (e.g. two geometric sans).
4. **Test the pairing** — check at `text-xs` through `text-4xl`. Do they share a compatible x-height? Do they feel like they belong together?
5. **Source from Google Fonts** — all fonts must be free and available via `next/font/google` for zero-layout-shift loading.

**Font pairing principles:**
- **Contrast over similarity** — pair a geometric sans with a humanist serif, not two geometric sans
- **Match x-height** — fonts with similar x-heights look harmonious at the same size
- **Era compatibility** — a 1920s display face with a 2020s geometric sans can feel disjointed unless intentional
- **Weight range** — ensure the font family offers enough weights (at minimum: 400, 500, 600, 700)
- **Language support** — verify the font covers the character sets your users need

**Font personality reference:**

| Personality | Font direction | Google Fonts examples |
|---|---|---|
| Modern & minimal | Geometric sans | Inter, Geist, DM Sans, Plus Jakarta Sans |
| Warm & approachable | Humanist / rounded sans | Nunito, Quicksand, Rubik, Outfit |
| Bold & expressive | High-impact display | Clash Display, Space Grotesk, Syne, Unbounded |
| Editorial & refined | Serif or serif + sans pair | Playfair Display, Fraunces, Libre Baskerville |
| Technical & precise | Monospace-influenced | IBM Plex Sans, JetBrains Mono, Source Code Pro |
| Playful & creative | Quirky or hand-drawn feel | Baloo 2, Fredoka, Patrick Hand |

**Typography output format:**
```
Body (sans):     [Font name — rationale tied to personality]
Headings:        [Font name or "same as body" — rationale]
Mono (if needed): [Font name — for code blocks, technical content]
Long-form (if needed): [Font name — for articles, blog posts]
```

**Where it lands in code:**
1. `app/layout.tsx` — import fonts via `next/font/google`, assign CSS variables
2. `tailwind.config.ts` — map CSS variables to `fontFamily.sans`, `fontFamily.serif`, `fontFamily.mono`
3. `app/globals.css` — apply the font variable to `body` (already wired by shadcn)

**Implementation pattern:**
```tsx
// layout.tsx
import { Inter, Playfair_Display } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-heading',
})

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

```ts
// tailwind.config.ts
fontFamily: {
  sans: ['var(--font-sans)', ...fontFamily.sans],
  heading: ['var(--font-heading)', ...fontFamily.sans],
}
```

### Icon style

Icon style is a brand decision, not a technical default. The icon library should match the product's personality.

**Available libraries:**

| Library | Style | Personality fit | Package |
|---|---|---|---|
| Lucide React | Clean line icons, 1 weight | Minimal, neutral, functional | `lucide-react` (shadcn default) |
| Phosphor Icons | 6 weights inc. duotone | Layered, modern, expressive | `@phosphor-icons/react` |
| Tabler Icons | Outline + filled, adjustable stroke | Versatile, professional, comprehensive | `@tabler/icons-react` |

**Icon decision process:**
1. **Match to personality** — clean and minimal → Lucide. Modern with personality → Phosphor (duotone). Bold and expressive → Tabler (filled) or Phosphor (bold).
2. **Consider weight needs** — if the UI needs subtle decorative icons AND bold action icons, Phosphor's 6 weights give the most range from a single set.
3. **Confirm** — once chosen, the icon library is exclusive. Do not mix libraries.

**If switching from Lucide (the default):**
1. Install the new package: `npm install @phosphor-icons/react` or `npm install @tabler/icons-react`
2. Remove Lucide: `npm uninstall lucide-react`
3. Swap existing shadcn component icons: `npm run swap-icons`
4. Update `ui-standards.md` Iconography section to match the new library
5. Update the Icons row in `CLAUDE.md` stack table

**Icon output format:**
```
Library:         [Name — rationale tied to personality]
Primary weight:  [e.g. "regular" for Phosphor, "1.5 stroke" for Tabler, default for Lucide]
Accent weight:   [e.g. "duotone" for featured moments, "filled" for active states]
```

**Where it lives:** Notion — brand identity page in the master plan. Icon decision documented alongside tone, colour, and typography so the full system is visible in one place.

### Bringing it together

All four brand decisions — tone, colour, typography, icons — should be presented as a cohesive proposal and documented on a single Notion page titled `[Project Name] — Brand Identity`. This page is linked from the master plan and referenced throughout design and development.

**Brand identity review format:**
```
Tone:       [3–5 personality traits + formality level]
Colour:     [Primary + accent + neutral direction + rationale]
Typography: [Font roles + specific fonts + rationale]
Icons:      [Library + primary weight + rationale]
Radius:     [Sharp / Default / Rounded + rationale]
```

**Questions to ask before finalising:**
- Do all four decisions tell the same story about the brand?
- If you showed someone just the colour palette, font pairing, and icon style — with no copy — would they guess the product's personality correctly?
- Does the tone of voice feel natural coming from a product that looks like this?

---

## User Stories

**The principle:** User stories keep development focused on user outcomes rather than system features. They force the team to articulate who wants something and why, not just what to build.

**Format:**
```
As a [specific user type],
I want to [specific action or capability],
So that [the outcome or value this creates for them].
```

**Acceptance criteria format (to pair with each story):**
```
Given [context or starting condition],
When [the user takes this action],
Then [the expected outcome].
```

**Good user stories:**
- Specific about the user type — not "a user", but "an admin managing multiple accounts"
- Focused on the outcome, not the implementation ("so I can see my usage at a glance" not "so there is a chart on the dashboard")
- Small enough to be completed in a sprint — split epics into stories

**Epic → Story → Task hierarchy:**
```
Epic:  Users can manage their subscription
Story: As a paying user, I want to upgrade my plan, so that I can access premium features
Task:  Design upgrade modal / Update billing API / Write confirmation email
```

**Where it lives:** Notion first, then mirrored to Linear.

1. Write all stories in a Notion page titled `[Project Name] — User Stories`, grouped by epic
2. Include acceptance criteria alongside each story in Notion
3. Once reviewed, create a corresponding Linear issue for each story using the issue format in `project-setup.md`
4. Paste the Notion story URL into the Linear issue description so both stay linked
5. Acceptance criteria in Notion become the Linear issue's definition of done — do not rewrite them, reference them

---

## Layouts & Information Architecture (IA)

**The principle:** IA defines how content and functionality is structured, labelled, and navigated before any visual design is applied. Good IA makes a product feel intuitive; bad IA makes users feel lost even if the UI is beautiful.

**IA methods:**

| Method | What it reveals |
|---|---|
| Card sorting (open) | How users naturally group and label content |
| Card sorting (closed) | Whether your proposed structure makes sense to users |
| Tree testing | Whether users can find things in your proposed navigation |
| First-click testing | Whether users start in the right place for a given task |

**Site map structure format:**
```
Level 1: Top-level navigation (Home / Product / Pricing / About)
Level 2: Section pages (Product → Features / Integrations / Security)
Level 3: Detail pages (Features → Analytics / Reporting / Alerts)
```

**IA principles:**
- **Findability** — can users locate what they need without help?
- **Clarity** — do navigation labels mean what users expect them to mean?
- **Depth vs breadth trade-off** — fewer top-level items (broad) vs more top-level items with less depth (flat)
- **Consistent placement** — things that appear in multiple places should appear in the same place every time

**Questions to ask:**
- Where would a first-time user expect to find X?
- Are navigation labels based on user language or internal company language?
- If the product doubled in size, would this structure still hold?

**Where it lives:** Excalidraw — generated via MCP using the site map format above. Use one board per product area if the IA is large. Once generated, embed the Excalidraw link in the relevant Notion page (typically under the master plan's Scope section). When updating the IA, update the Excalidraw board and note the change as a comment on the relevant Linear issue.

---

## User Flows

**The principle:** User flows map the steps a user takes to complete a specific task — from entry point to success state. They expose missing steps, dead ends, and error states before any screens are designed.

**Flow notation:**
```
[Rounded rect] = screen or page
[Diamond]      = decision point (yes/no, logged in/out)
[Arrow]        = user action or system transition
[Rectangle]    = system action (email sent, data saved)
```

**What a complete flow includes:**
- Entry point (how does the user arrive here?)
- Happy path (the ideal route to task completion)
- Error states (what happens if something goes wrong?)
- Edge cases (what if the user is a guest? What if the account is expired?)
- Exit points (where does the user end up after completing the task?)

**User flow checklist:**
- [ ] Entry points defined (direct link, email, navigation, search)
- [ ] Happy path clear with no unnecessary steps
- [ ] All decision points accounted for
- [ ] Error states designed (not just happy path)
- [ ] Success state defined (what does the user see when done?)

**Questions to ask:**
- How many steps does this task take? Could any be removed or combined?
- What happens if the user makes a mistake at each step?
- Is there a way for the user to get irreversibly stuck?

**Where it lives:** Excalidraw — generated via MCP, one board per distinct user flow. Name boards clearly: `[Project] — [Flow name] flow` (e.g. `Acme — Onboarding flow`). Embed the link in the corresponding Notion user story page and in the relevant Linear issue description. If a flow changes materially after being drawn, redraw it — do not annotate over a stale version.

---

## User Testing

**The principle:** Usability testing replaces assumptions with observations. It is the single highest-ROI activity in UX — catching problems before development is orders of magnitude cheaper than fixing them after launch.

**Testing types:**

| Type | When to use | Fidelity needed |
|---|---|---|
| Concept testing | Early — validate the problem/solution | Sketches, paper prototypes |
| Task-based usability | Mid — can users complete key tasks? | Clickable prototype |
| Comparative testing | Mid — which version performs better? | Two parallel prototypes |
| Regression testing | Post-launch — did a change break anything? | Live product |

**Session structure (moderated test):**
1. Welcome + briefing (5 min) — explain the purpose, reassure them you're testing the design not them
2. Warm-up questions (5 min) — understand their context and familiarity
3. Tasks (20–30 min) — give specific tasks, ask them to think aloud, do not help
4. Debrief (10 min) — ask overall impressions, anything confusing, anything missing

**Think-aloud prompt:** "Please say out loud what you're thinking as you go — there are no wrong answers."

**Finding severity rating:**
```
Critical:   Prevents task completion — fix immediately
Major:      Causes significant difficulty or errors — fix before launch
Minor:      Causes mild confusion — fix when possible
Enhancement: Positive feedback or opportunity — consider for future
```

**Analysis format:**
```
Task:      [What the user was asked to do]
Observed:  [What they actually did]
Finding:   [The underlying usability issue]
Severity:  [Critical / Major / Minor / Enhancement]
Recommendation: [Specific design change to address it]
```

**Questions to ask after testing:**
- Were there tasks that multiple participants failed or struggled with?
- Were there moments of visible hesitation or confusion?
- Did participants verbalise assumptions we didn't anticipate?
- What surprised us?

**Where it lives:** Notion — one page per test round, structured as: test plan → participants → tasks → findings (using the analysis format above with severity ratings) → recommendations. Link findings to the relevant Linear issues so fixes are tracked. If a finding results in a scope change, update the master plan first.
