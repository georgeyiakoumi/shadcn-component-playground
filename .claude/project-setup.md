# project-setup.md — Project Startup Routine

Run this routine at the start of every new project, or when picking up a project for the first time in a session.
Work through each phase in order. Do not skip ahead to design or code until phases 1 and 2 are complete.

---

## Phase 1 — MCP connectivity check

Before anything else, verify that the required MCPs are reachable. Report the status of each clearly.

**Required connections:**

| MCP | Purpose | Required? | When needed |
|---|---|---|---|
| Linear | Project tracking, issues, milestones | Yes | Phase 4 onwards |
| GitHub | Repo access, branch status, PR state | Yes | Phase 4 onwards |
| Notion | Master plan documentation | Yes | Phase 3 onwards |
| Excalidraw | IA diagrams and user flows | Yes | Phase 5 (IA/flows) |
| Netlify | Deployment status and environment config | If project uses Netlify | Deployment stage |

**How to check (important — follow this order):**

1. **First, search for available tools** using the tool search / deferred tools mechanism. Cloud MCPs (Linear, Notion, Netlify, Excalidraw, GitHub) are loaded as deferred tools and may not appear until you explicitly search for them. Search for each by name before concluding it's missing.

2. **Then attempt a lightweight call** to each found MCP (e.g. list teams in Linear, search in Notion, list commits in GitHub, read_me in Excalidraw). A successful response confirms the connection is live.

3. **Distinguish between three states:**
   - ✅ **Connected** — tool found and call succeeded
   - ⚠️ **Temporarily unavailable** — tool found but call returned an error (502, timeout, etc.). This is usually a transient proxy issue — note it and retry later. Do not block on this.
   - ❌ **Not configured** — tool not found even after searching. Flag to George.

4. **Do not block project scoping on transient errors.** If an MCP returns a 502 or timeout, note it and proceed. These are cloud-hosted MCPs that may have momentary outages. Only stop if the MCP is genuinely not configured (no tools found at all).

5. Also list any additional MCPs that are connected beyond the required set, in case they're relevant.

**Expected output:**
```
MCP Status
──────────
✅ Linear     — connected (workspace: [name])
✅ GitHub     — connected (repo: [name])
✅ Notion     — connected
✅ Excalidraw — connected
✅ Netlify    — connected
⚠️ [Other]   — connected but verify it's needed
```

**If an MCP is not configured (❌):**
- Flag it to George with the specific MCP name
- George can add it via the MCP servers panel in VS Code (Claude Code extension settings)
- All required MCPs are cloud MCPs managed through the Claude AI integration — they are added via the VS Code extension, not config files
- Once added, it will be available in all projects automatically

---

## Phase 2 — Project scoping

Before creating anything in Linear or Notion, establish the project scope through conversation. Ask George for any details that aren't already clear:

**Scoping questions (ask only what isn't already known):**
- What is the project? One-sentence description.
- Who is it for? Primary user type(s).
- What does success look like? Key outcomes, not features.
- What's the rough timeline or deadline?
- Are there any known constraints — technical, design, or otherwise?
- Which design reference files apply? (Check against `CLAUDE.md` routing table)

Do not over-question. If context from the conversation already answers these, skip them.

---

## Phase 3 — Master plan (Notion)

Once scope is clear, create the master plan document in Notion. This is the single source of truth for what the project is and why — Linear tracks the how and when.

**Notion document structure:**
```
# [Project Name]

## Overview
One paragraph: what this is, who it's for, what success looks like.

## Goals
- Primary goal
- Secondary goals (max 3)

## Users
- [Persona name] — [one-line description of their need]

## Scope
### In scope
- [Feature / capability]

### Out of scope
- [Explicit exclusions — prevents scope creep]

## Constraints
- Technical, timeline, design, or resource constraints

## Design principles
- 2–4 product-specific principles that govern decisions on this project
- These sit alongside the global principles in CLAUDE.md

## Milestones
| Milestone | Description | Target |
|---|---|---|
| M1 | [Name] | [Date or sprint] |
| M2 | [Name] | [Date or sprint] |

## Open questions
- Questions that need answers before specific tasks can be completed
```

After creating the document, share the Notion URL with George for review before proceeding to Linear.

---

## Phase 4 — Linear project + issues

Once George has confirmed the Notion plan, create the corresponding structure in Linear.

**What to create:**

1. **A new Linear project** named `[Project Name]`
   - Add a description (pull from the Notion Overview section)
   - Link to the Notion document in the project description

2. **One issue per discrete task**, grouped by milestone where milestones exist

**Issue format:**
```
Title:       [Short, action-oriented — "Build report export flow" not "Export"]
Description: [What needs to be done and why — 2–4 sentences]
             [Link to relevant Notion section if applicable]
Labels:      [design / frontend / backend / research / content]
Priority:    [Urgent / High / Medium / Low]
Milestone:   [M1 / M2 / etc. if defined]
```

**Issue granularity guide:**
- One issue = one reviewable unit of work (something that can be PR'd, tested, or signed off independently)
- If an issue would take more than 2–3 days, split it
- If an issue would take less than 30 minutes, consider combining it with a related one

**After creating all issues:**
- Confirm the total issue count and project structure with George
- Flag any dependencies between issues (i.e. issue B cannot start until issue A is complete)
- Identify any open questions from Notion that are blocking specific issues

---

## Phase 5 — Begin work

With MCPs verified, plan documented in Notion, and issues created in Linear, begin the first task following the order below. Do not skip ahead — each stage feeds the next.

### Stage 1 — UX process (always first)
Load [`ux-process.md`](./ux-process.md). Before any interface is designed, the following must be established:

1. **Research** — what do we know about the users? What assumptions need validating? → Document findings in **Notion** (one page per research round)
2. **Strategy** — does the feature align to a clear user goal and business outcome? → Record in the **Notion** master plan under Goals and Design principles
3. **Personas** — which persona(s) does this task serve? Reference them in every design decision → One **Notion** page per persona, linked from the master plan
4. **Brand identity** — establish tone of voice, colour direction, typography system, and icon style as a cohesive set → Document on a **Notion** page titled `[Project Name] — Brand Identity`, linked from the master plan. Then configure: colours in `globals.css`, fonts in `layout.tsx` + `tailwind.config.ts`, icon library swap if needed via `npm run swap-icons`
5. **User stories** — write stories for all in-scope functionality before opening Figma or writing code → Draft in **Notion** first, then mirror each story as a **Linear** issue
6. **Information architecture** — define the structure and navigation before laying out screens → Generate as an **Excalidraw** board via MCP; embed link in Notion
7. **User flows** — map the full flow (happy path + errors + edge cases) before designing individual screens → Generate as an **Excalidraw** board via MCP (one board per flow); embed link in Notion and the relevant Linear issue

Do not proceed to Stage 2 until flows are mapped and reviewed.

### Stage 2 — Design psychology (runs throughout, starts here)
Load [`design-psychology.md`](./design-psychology.md). Before producing any UI, apply the relevant principles to the flows and structure established in Stage 1:

- Run each screen or flow through the checklist: Hick's Law, Gestalt grouping, Fitts's Law, Jakob's Law, Cognitive Load, Colour Psychology
- Flag any points in the flow where a principle is being violated — resolve at the flow level before moving to UI
- Document which principles are driving key decisions — these become the rationale when reviewing with stakeholders

Design psychology continues to apply through Stage 3. It is not a one-time gate.

### Stage 3 — UI standards (last)
Load [`ui-standards.md`](./ui-standards.md). Only once structure and psychology have been validated, apply the visual layer using the brand identity decisions from Stage 1:

1. **Layout** — translate flows into screen layouts using Tailwind grid/flex
2. **Components** — reach for shadcn primitives first; compose or extend as needed
3. **Colour** — apply the brand palette via shadcn tokens in `globals.css`; verify dark mode and WCAG AA contrast
4. **Typography** — apply the brand's font system; confirm hierarchy reads clearly across the type scale
5. **Iconography** — use the project's chosen icon library; confirm sizing (`size-*`), labels, and accessibility attributes
6. **Spacing** — apply Tailwind spacing scale; confirm groupings read correctly

### Throughout all stages
- Update the relevant Linear issue status as work progresses
- Log decisions and trade-offs as comments on the Linear issue — not just in conversation
- If scope changes materially, update the Notion document first, then adjust Linear issues to match
