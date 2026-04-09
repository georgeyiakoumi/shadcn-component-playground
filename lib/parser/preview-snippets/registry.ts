/**
 * Composition rule registry — single source of truth for which slug
 * maps to which rule.
 *
 * Lives in its own module to break the circular-import TDZ error
 * that would occur if `index.ts` tried to populate the map via
 * side-effect imports. Rule files import helpers from `./index`,
 * so the registry is lazily required by `lookupRule` at call time.
 *
 * To add a new rule: import it here and add an entry to
 * `COMPOSITION_RULES`.
 */

import type { CompositionRule } from "./index"
import { aspectRatioRule } from "./rules/aspect-ratio"
import { cardRule } from "./rules/card"
import { collapsibleRule } from "./rules/collapsible"
import { dialogRule } from "./rules/dialog"
import { hoverCardRule } from "./rules/hover-card"

export const COMPOSITION_RULES: Record<string, CompositionRule> = {
  "aspect-ratio": aspectRatioRule,
  card: cardRule,
  collapsible: collapsibleRule,
  dialog: dialogRule,
  "hover-card": hoverCardRule,
}
