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
import { alertRule } from "./rules/alert"
import { alertDialogRule } from "./rules/alert-dialog"
import { aspectRatioRule } from "./rules/aspect-ratio"
import { avatarRule } from "./rules/avatar"
import { breadcrumbRule } from "./rules/breadcrumb"
import { calendarRule } from "./rules/calendar"
import { cardRule } from "./rules/card"
import { carouselRule } from "./rules/carousel"
import { checkboxRule } from "./rules/checkbox"
import { collapsibleRule } from "./rules/collapsible"
import { commandRule } from "./rules/command"
import { contextMenuRule } from "./rules/context-menu"
import { dialogRule } from "./rules/dialog"
import { drawerRule } from "./rules/drawer"
import { dropdownMenuRule } from "./rules/dropdown-menu"
import { hoverCardRule } from "./rules/hover-card"
import { itemRule } from "./rules/item"
import { menubarRule } from "./rules/menubar"
import { navigationMenuRule } from "./rules/navigation-menu"
import { paginationRule } from "./rules/pagination"
import { popoverRule } from "./rules/popover"
import { progressRule } from "./rules/progress"
import { resizableRule } from "./rules/resizable"
import { scrollAreaRule } from "./rules/scroll-area"
import { selectRule } from "./rules/select"
import { sheetRule } from "./rules/sheet"
import { sliderRule } from "./rules/slider"
import { sonnerRule } from "./rules/sonner"
import { switchRule } from "./rules/switch"
import { tableRule } from "./rules/table"
import { tabsRule } from "./rules/tabs"
import { toggleGroupRule } from "./rules/toggle-group"
import { tooltipRule } from "./rules/tooltip"

export const COMPOSITION_RULES: Record<string, CompositionRule> = {
  accordion: accordionRule,
  alert: alertRule,
  "alert-dialog": alertDialogRule,
  "aspect-ratio": aspectRatioRule,
  avatar: avatarRule,
  breadcrumb: breadcrumbRule,
  calendar: calendarRule,
  card: cardRule,
  carousel: carouselRule,
  checkbox: checkboxRule,
  collapsible: collapsibleRule,
  command: commandRule,
  "context-menu": contextMenuRule,
  dialog: dialogRule,
  drawer: drawerRule,
  "dropdown-menu": dropdownMenuRule,
  "hover-card": hoverCardRule,
  item: itemRule,
  menubar: menubarRule,
  "navigation-menu": navigationMenuRule,
  pagination: paginationRule,
  popover: popoverRule,
  progress: progressRule,
  resizable: resizableRule,
  "scroll-area": scrollAreaRule,
  select: selectRule,
  sheet: sheetRule,
  slider: sliderRule,
  sonner: sonnerRule,
  switch: switchRule,
  table: tableRule,
  tabs: tabsRule,
  "toggle-group": toggleGroupRule,
  tooltip: tooltipRule,
}
