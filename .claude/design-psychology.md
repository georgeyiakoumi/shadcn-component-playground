# design-psychology.md — Design Psychology Reference

Reference this file when justifying design decisions, reviewing UI, or explaining trade-offs to stakeholders.
Every principle here should be applied actively, not just cited.

---

## Hick's Law

**The principle:** Decision time increases logarithmically with the number of choices. More options = slower, more effortful decisions.

**Apply it when:** Designing navigation, pricing tiers, CTAs, forms, menus, or any moment where a user must choose.

**In practice:**
- Limit primary navigation to 5–7 items max
- Highlight one recommended option in multi-tier pricing
- Use progressive disclosure: show the most common action first, hide advanced options behind a secondary interaction
- Combine rarely-used options into a single "More" or "Other" bucket
- Never surface all features at once — sequence them by frequency of use

**Questions to ask:**
- How many decisions is the user making on this screen?
- Can any be pre-selected, deferred, or removed entirely?
- Is there a clear primary action, or are all actions competing equally?

**Warning signs:** Six-button toolbars, pricing pages with five+ plans, forms that ask for everything upfront.

---

## Gestalt Principles

**The principle:** Humans automatically group visual elements by proximity, similarity, continuity, closure, and figure/ground. Design should work with these instincts, not against them.

**The five to know:**

| Principle | What it means | How to apply it |
|---|---|---|
| **Proximity** | Elements close together are perceived as a group | Use consistent spacing to group related controls; increase gap to imply separation |
| **Similarity** | Elements that look alike are perceived as related | Use colour, shape, or weight consistently across elements of the same type |
| **Continuity** | The eye follows lines and curves naturally | Align elements on a grid so the eye moves predictably through content |
| **Closure** | The mind completes incomplete shapes | You can imply containers or groups with partial borders or backgrounds |
| **Figure/Ground** | The eye separates foreground from background | Use contrast and layering to establish clear visual hierarchy |

**In practice:**
- Group form fields by topic using whitespace — no need for visible box borders
- Use a shared icon style to signal that icons are part of the same system
- Align cards and components to a grid so the layout feels intentional without labels
- Use a subtle background tint to imply a related section without a visible border

**Questions to ask:**
- Would a user know which elements belong together if the labels were removed?
- Does the visual grouping match the logical grouping?

---

## Fitts's Law

**The principle:** The time to reach a target depends on its size and distance. Larger targets that are closer are faster to interact with.

**Apply it when:** Sizing buttons, positioning CTAs, designing touch interfaces, placing navigation.

**In practice:**
- Primary action buttons should be wide, not narrow — especially on mobile (minimum 44×44px touch target)
- Place the most-used action closest to where the user's attention or cursor already is
- Put destructive actions (delete, cancel) far from primary actions and make them smaller
- Screen edges and corners are fast targets — the cursor stops there naturally (especially on desktop)
- Avoid small icon-only buttons for frequent actions

**Questions to ask:**
- Is the primary CTA the easiest thing to click on this screen?
- Are destructive actions accidentally too easy to reach?
- On mobile, are all interactive targets at least 44×44px?

**Warning signs:** Small "submit" buttons beside large "cancel" links, icon-only toolbars with 16px targets.

---

## Jakob's Law

**The principle:** Users spend most of their time on other products. They expect your product to work the way those products do. Violating conventions creates unnecessary friction.

**Apply it when:** Deciding where to place navigation, how to label common actions, how standard patterns (search, login, checkout) should behave.

**In practice:**
- Logo top-left → goes home. Don't break this.
- Search icon = magnifying glass. Cart icon = shopping bag. Don't reinvent these.
- Primary nav belongs at the top on desktop, bottom on mobile
- Login and account settings belong in the top-right
- Destructive actions (delete, remove) should be red; confirmation actions should be the brand's primary colour
- Follow platform conventions (iOS, Android, web) unless you have a very strong reason not to

**When to innovate vs. follow convention:**
Follow convention for: navigation, form behaviour, error states, icon meanings, standard flows (checkout, signup, login).
Innovate on: the product's unique value, visual personality, content presentation — things users don't have learned expectations for.

**Questions to ask:**
- Where would a user who'd never seen this product expect to find X?
- Are we departing from convention because it genuinely serves users, or because it feels more distinctive?

---

## Cognitive Load

**The principle:** Working memory is limited. Every unnecessary element, decision, or piece of information on screen consumes some of it. Good design reduces the total mental effort required.

**Three types:**
- **Intrinsic load** — the inherent complexity of the task itself (can't be eliminated, only managed)
- **Extraneous load** — complexity added by poor design (always try to eliminate)
- **Germane load** — mental effort that helps users build understanding (worth preserving)

**Apply it when:** Designing onboarding, complex forms, dashboards, or any screen with a lot of content.

**In practice:**
- Chunk long forms into labelled steps — show progress
- Use progressive disclosure to hide complexity until it's needed
- Remove decorative elements that don't carry meaning
- Use defaults intelligently — pre-fill where you can, so users only change what's different for them
- Write micro-copy that removes ambiguity at the point of decision
- Limit the number of typefaces, colours, and visual treatments on a single screen

**Questions to ask:**
- What decisions is the user making on this screen that they shouldn't have to?
- What information is shown that the user doesn't need right now?
- Does the visual design help them focus, or does it compete for attention?

**Warning signs:** Dense dashboards with 15 metrics, forms without field labels, multiple competing CTAs, walls of text with no visual hierarchy.

---

## Colour Psychology

**The principle:** Colour carries emotional and semantic weight that varies by context and culture. In product design, colour communicates meaning before text is read.

**Functional colour meanings (Western/digital context):**

| Colour | Common meaning | Use for |
|---|---|---|
| **Blue** | Trust, calm, authority | Primary brand actions, links, info states |
| **Green** | Success, safety, growth | Confirmation, positive feedback, progress |
| **Red** | Danger, urgency, error | Errors, destructive actions, alerts |
| **Amber/Orange** | Warning, energy, attention | Caution states, non-critical warnings |
| **Purple** | Premium, creativity | Premium tiers, creative tools |
| **Grey** | Neutral, disabled, secondary | Secondary actions, disabled states, metadata |

**In practice:**
- Use colour consistently — if blue means "interactive", don't use blue decoratively
- Never rely on colour alone to convey meaning — always pair with an icon or label (accessibility)
- Ensure sufficient contrast: 4.5:1 for body text (WCAG AA), 3:1 for large text and UI components
- Use colour to reinforce state changes, not create them — the layout should work in greyscale first
- Cultural note: meanings shift (red = luck in China, mourning in South Africa) — consider your user base

**Questions to ask:**
- If this design were greyscale, would the hierarchy and meaning still be clear?
- Are we using colour to communicate, or just to decorate?
- Is there enough contrast for users with colour-vision deficiency?
