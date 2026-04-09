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
import { accordionRule } from "./rules/accordion"
import { alertDialogRule } from "./rules/alert-dialog"
import { aspectRatioRule } from "./rules/aspect-ratio"
import { cardRule } from "./rules/card"
import { collapsibleRule } from "./rules/collapsible"
import { dialogRule } from "./rules/dialog"
import { drawerRule } from "./rules/drawer"
import { hoverCardRule } from "./rules/hover-card"
import { popoverRule } from "./rules/popover"
import { sheetRule } from "./rules/sheet"
import { tabsRule } from "./rules/tabs"
import { tooltipRule } from "./rules/tooltip"

export const COMPOSITION_RULES: Record<string, CompositionRule> = {
  accordion: accordionRule,
  "alert-dialog": alertDialogRule,
  "aspect-ratio": aspectRatioRule,
  card: cardRule,
  collapsible: collapsibleRule,
  dialog: dialogRule,
  drawer: drawerRule,
  "hover-card": hoverCardRule,
  popover: popoverRule,
  sheet: sheetRule,
  tabs: tabsRule,
  tooltip: tooltipRule,
}
