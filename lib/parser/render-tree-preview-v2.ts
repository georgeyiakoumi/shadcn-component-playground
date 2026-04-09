/**
 * Canvas renderer for ComponentTreeV2 — produces live React JSX for the
 * from-scratch builder's preview canvas.
 *
 * v2 equivalent of v1's `renderTreePreview` + `renderSubComponentPreview`.
 *
 * ## How the composition graph works (post-Bug 4 fix)
 *
 * v1 had two parallel structures: `subComponents[]` (the declared exports)
 * and `assemblyTree: ElementNode` (the runtime canvas composition, NOT
 * exported). When the user added a sub-component to the assembly, v1 added
 * a node to the assembly tree referencing the sub-component by name.
 *
 * v2 doesn't have a separate assembly tree. Instead, the composition is
 * **implicit from `nestInside`** on each sub-component:
 *
 * - Sub-components with `nestInside === undefined` (or matching the
 *   compound root's name) are direct children of the compound root
 * - Sub-components with `nestInside === "X"` render inside sub-component X
 * - The renderer walks this implicit graph at render time
 *
 * Inside each sub-component's preview shell, the renderer also renders any
 * **HTML/text/expression children** the user added via the AssemblyPanel
 * (these are `parts.root.children` of kind `part` / `text` / `expression`).
 *
 * The exported source has each sub-component as its own function declaration
 * with NO JSX nesting between sub-components. The user composes them in
 * their own consuming code. This matches v1's behaviour and how shadcn's
 * actual compound components (Card, Dialog, etc.) work.
 *
 * GEO-305 follow-up after George caught the silent regression in M4.
 */

import * as React from "react"
import * as LucideIcons from "lucide-react"

import type {
  ClassNameExpr,
  ComponentTreeV2,
  PartChild,
  PartNode,
  SubComponentV2,
} from "@/lib/component-tree-v2"
import {
  buildSubComponentMap,
  getPartClasses,
  makePartPath,
  type PartPath,
} from "@/lib/parser/v2-tree-path"
import { resolveColorStyles } from "@/lib/resolve-color-styles"
import { shadcnPreviewMap } from "@/lib/shadcn-preview-map"
import { lookupRule } from "@/lib/parser/preview-snippets"
import { CompositionCanvas } from "@/lib/parser/preview-snippets/canvas-wrapper"

/* ── Lucide icon namespace import ──────────────────────────────── */

/**
 * Lucide icons in shadcn source show up as `component-ref` parts with
 * names like `CheckIcon`, `ChevronDownIcon`, `XIcon`, etc. Without
 * special handling, the renderer falls back to a placeholder pill.
 *
 * We namespace-import `lucide-react` and render matching names as real
 * Lucide components on the canvas. Bundle size hit is ~400KB gzipped
 * because tree-shaking can't eliminate a namespace import — acceptable
 * for a design tool that already ships shadcn + Radix + Tailwind + the
 * whole visual editor.
 *
 * Discovered: 2026-04-08 while stabilising Checkbox / RadioGroup /
 * Dialog / DropdownMenu etc. See GEO-306 cross-cutting blocker #2.
 */
function getLucideIcon(name: string): React.ComponentType<Record<string, unknown>> | null {
  // Lucide icons are React.forwardRef components, so `typeof` returns
  // "object", not "function". We check for presence + the hallmarks of
  // a valid React component (either a function, or an object with
  // `$$typeof` which React uses to tag forwardRef / memo / etc.).
  const icon = (LucideIcons as Record<string, unknown>)[name]
  if (!icon) return null
  if (typeof icon === "function") {
    return icon as React.ComponentType<Record<string, unknown>>
  }
  if (
    typeof icon === "object" &&
    icon !== null &&
    "$$typeof" in icon
  ) {
    return icon as unknown as React.ComponentType<Record<string, unknown>>
  }
  return null
}

/* ── HTML void elements ─────────────────────────────────────────── */

/**
 * HTML void elements cannot receive children — React's `createElement`
 * will throw "X is a void element tag and must neither have `children`
 * nor use `dangerouslySetInnerHTML`" if you pass any. The renderer
 * checks this set before emitting an element: void tags render as
 * `createElement(tag, props)` with NO children argument, and they skip
 * the empty-state placeholder (which would inject a `<span>` child).
 *
 * Originally surfaced by the Input component: its parsed root is an
 * `<input>`, the renderer tried to inject a `<SubName>` placeholder
 * span as a child, and React crashed.
 */
const VOID_HTML_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
])

/**
 * Sub-component names that render as a purely visual primitive — no
 * meaningful text content, just a styled box. The renderer suppresses
 * the empty-children fallback (which would otherwise inject the
 * sub-component name as a text label) so the canvas shows the box at
 * its natural styling without the word "Skeleton" / "Separator" /
 * etc. floating in the middle.
 *
 * Discovered 2026-04-09 during the Batch 3 flat-renderer smoke-test —
 * George flagged that Skeleton + Separator both render with their
 * name as text inside, which is noise.
 */
const VISUAL_PLACEHOLDER_SUBS = new Set([
  "Skeleton",
  "Separator",
])

/* ── Radix primitive → runtime HTML tag map ─────────────────────── */

/**
 * Maps `<Primitive>.<Part>` to the HTML element it actually renders in
 * the browser, plus any extra DOM attributes (roles, etc.) that the
 * primitive sets on its rendered element.
 *
 * Used by `renderShell` to turn a `radix` base kind into a real DOM
 * element on the canvas, so parsed Checkbox / Label / RadioGroup /
 * Switch / etc. show up as actual styled interactive elements rather
 * than as empty purple placeholder pills.
 *
 * The mappings are based on Radix UI's actual runtime output (verified
 * against radix-ui source as of 2026-04-08). If a primitive/part isn't
 * in this map, the renderer falls through to the placeholder, which is
 * the correct conservative behaviour — better to show a labelled
 * placeholder than to render the wrong element.
 *
 * NOTE: Some Radix primitives (Dialog.Root, Dialog.Portal, Popover.Root,
 * etc.) don't render any DOM of their own — they're pure React context
 * providers. For those, `tag: null` tells the renderer to render the
 * children as a fragment. The placeholder fallback would be misleading
 * there — nothing crashes if you treat them as transparent wrappers.
 */
type RadixMapping = {
  /** HTML tag to render, or null for a transparent fragment */
  tag: string | null
  /** Extra attributes to set on the rendered element (e.g. `role`) */
  attrs?: Record<string, string>
  /**
   * Default Radix runtime data attributes to set on the rendered element
   * for the canvas preview. Many Radix primitives apply styling via
   * `data-[state=open]:*` / `data-[state=unchecked]:*` / `data-[side=bottom]:*`
   * / etc. selectors. At runtime these attrs are set by Radix itself based
   * on component state. On the canvas (where we have no Radix instance),
   * the attrs would normally be missing and the classes would never
   * activate, leaving Switch / Checkbox / Dialog.Content / etc. visibly
   * broken.
   *
   * The renderer does two things with these:
   * 1. Merges them into the rendered element's HTML attributes so the DOM
   *    actually has e.g. `data-state="unchecked"` set.
   * 2. Merges them into the active `variantDataAttrs` for the class
   *    resolver, so `data-[state=unchecked]:bg-input` strips its prefix
   *    at render time and emits `bg-input` as a live class (same runtime
   *    prefix-stripping mechanism we built for user-facing data-attr
   *    variants in PR #30).
   *
   * Choose defaults that show the component in its "resting" visible
   * state — e.g. `state=unchecked` for a fresh checkbox, `state=open` for
   * Dialog.Content so the modal body is visible for styling.
   */
  defaultDataAttrs?: Record<string, string>
}

const RADIX_PRIMITIVE_MAP: Record<string, RadixMapping> = {
  // Accordion
  "Accordion.Root": { tag: "div" },
  "AccordionPrimitive.Root": { tag: "div" },
  "Accordion.Item": { tag: "div", defaultDataAttrs: { "data-state": "closed" } },
  "AccordionPrimitive.Item": { tag: "div", defaultDataAttrs: { "data-state": "closed" } },
  "Accordion.Header": { tag: "h3" },
  "AccordionPrimitive.Header": { tag: "h3" },
  "Accordion.Trigger": { tag: "button", defaultDataAttrs: { "data-state": "closed" } },
  "AccordionPrimitive.Trigger": { tag: "button", defaultDataAttrs: { "data-state": "closed" } },
  "Accordion.Content": { tag: "div", defaultDataAttrs: { "data-state": "open" } },
  "AccordionPrimitive.Content": { tag: "div", defaultDataAttrs: { "data-state": "open" } },

  // AlertDialog (same DOM shape as Dialog)
  "AlertDialog.Root": { tag: null },
  "AlertDialogPrimitive.Root": { tag: null },
  "AlertDialog.Trigger": { tag: "button" },
  "AlertDialogPrimitive.Trigger": { tag: "button" },
  "AlertDialog.Portal": { tag: null },
  "AlertDialogPrimitive.Portal": { tag: null },
  "AlertDialog.Overlay": { tag: "div" },
  "AlertDialogPrimitive.Overlay": { tag: "div" },
  "AlertDialog.Content": {
    tag: "div",
    attrs: { role: "alertdialog" },
    defaultDataAttrs: { "data-state": "open" },
  },
  "AlertDialogPrimitive.Content": {
    tag: "div",
    attrs: { role: "alertdialog" },
    defaultDataAttrs: { "data-state": "open" },
  },
  "AlertDialog.Cancel": { tag: "button" },
  "AlertDialogPrimitive.Cancel": { tag: "button" },
  "AlertDialog.Action": { tag: "button" },
  "AlertDialogPrimitive.Action": { tag: "button" },
  "AlertDialog.Title": { tag: "h2" },
  "AlertDialogPrimitive.Title": { tag: "h2" },
  "AlertDialog.Description": { tag: "p" },
  "AlertDialogPrimitive.Description": { tag: "p" },

  // AspectRatio
  "AspectRatio.Root": { tag: "div" },
  "AspectRatioPrimitive.Root": { tag: "div" },

  // Avatar
  "Avatar.Root": { tag: "span" },
  "AvatarPrimitive.Root": { tag: "span" },
  "Avatar.Image": { tag: "img" },
  "AvatarPrimitive.Image": { tag: "img" },
  "Avatar.Fallback": { tag: "span" },
  "AvatarPrimitive.Fallback": { tag: "span" },

  // Checkbox
  "Checkbox.Root": {
    tag: "button",
    attrs: { role: "checkbox", type: "button" },
    defaultDataAttrs: { "data-state": "unchecked" },
  },
  "CheckboxPrimitive.Root": {
    tag: "button",
    attrs: { role: "checkbox", type: "button" },
    defaultDataAttrs: { "data-state": "unchecked" },
  },
  "Checkbox.Indicator": {
    tag: "span",
    defaultDataAttrs: { "data-state": "unchecked" },
  },
  "CheckboxPrimitive.Indicator": {
    tag: "span",
    defaultDataAttrs: { "data-state": "unchecked" },
  },

  // Collapsible
  "Collapsible.Root": { tag: "div", defaultDataAttrs: { "data-state": "closed" } },
  "CollapsiblePrimitive.Root": { tag: "div", defaultDataAttrs: { "data-state": "closed" } },
  "Collapsible.Trigger": { tag: "button", defaultDataAttrs: { "data-state": "closed" } },
  "CollapsiblePrimitive.Trigger": { tag: "button", defaultDataAttrs: { "data-state": "closed" } },
  "Collapsible.Content": { tag: "div", defaultDataAttrs: { "data-state": "open" } },
  "CollapsiblePrimitive.Content": { tag: "div", defaultDataAttrs: { "data-state": "open" } },

  // ContextMenu (same DOM shape as DropdownMenu)
  "ContextMenu.Root": { tag: null },
  "ContextMenuPrimitive.Root": { tag: null },
  "ContextMenu.Trigger": { tag: "span" },
  "ContextMenuPrimitive.Trigger": { tag: "span" },
  "ContextMenu.Portal": { tag: null },
  "ContextMenuPrimitive.Portal": { tag: null },
  "ContextMenu.Content": { tag: "div", attrs: { role: "menu" } },
  "ContextMenuPrimitive.Content": { tag: "div", attrs: { role: "menu" } },
  "ContextMenu.Item": { tag: "div", attrs: { role: "menuitem" } },
  "ContextMenuPrimitive.Item": { tag: "div", attrs: { role: "menuitem" } },
  "ContextMenu.CheckboxItem": { tag: "div", attrs: { role: "menuitemcheckbox" } },
  "ContextMenuPrimitive.CheckboxItem": { tag: "div", attrs: { role: "menuitemcheckbox" } },
  "ContextMenu.RadioItem": { tag: "div", attrs: { role: "menuitemradio" } },
  "ContextMenuPrimitive.RadioItem": { tag: "div", attrs: { role: "menuitemradio" } },
  "ContextMenu.Label": { tag: "div" },
  "ContextMenuPrimitive.Label": { tag: "div" },
  "ContextMenu.Separator": { tag: "div", attrs: { role: "separator" } },
  "ContextMenuPrimitive.Separator": { tag: "div", attrs: { role: "separator" } },
  "ContextMenu.Group": { tag: "div", attrs: { role: "group" } },
  "ContextMenuPrimitive.Group": { tag: "div", attrs: { role: "group" } },
  "ContextMenu.SubTrigger": { tag: "div", attrs: { role: "menuitem" } },
  "ContextMenuPrimitive.SubTrigger": { tag: "div", attrs: { role: "menuitem" } },
  "ContextMenu.SubContent": { tag: "div", attrs: { role: "menu" } },
  "ContextMenuPrimitive.SubContent": { tag: "div", attrs: { role: "menu" } },

  // Dialog
  "Dialog.Root": { tag: null },
  "DialogPrimitive.Root": { tag: null },
  "Dialog.Trigger": { tag: "button" },
  "DialogPrimitive.Trigger": { tag: "button" },
  "Dialog.Portal": { tag: null },
  "DialogPrimitive.Portal": { tag: null },
  "Dialog.Overlay": { tag: "div" },
  "DialogPrimitive.Overlay": { tag: "div" },
  "Dialog.Content": {
    tag: "div",
    attrs: { role: "dialog" },
    defaultDataAttrs: { "data-state": "open" },
  },
  "DialogPrimitive.Content": {
    tag: "div",
    attrs: { role: "dialog" },
    defaultDataAttrs: { "data-state": "open" },
  },
  "Dialog.Close": { tag: "button" },
  "DialogPrimitive.Close": { tag: "button" },
  "Dialog.Title": { tag: "h2" },
  "DialogPrimitive.Title": { tag: "h2" },
  "Dialog.Description": { tag: "p" },
  "DialogPrimitive.Description": { tag: "p" },

  // Drawer (third-party vaul, but often shows up as a Primitive import)
  "Drawer.Root": { tag: null },
  "DrawerPrimitive.Root": { tag: null },
  "Drawer.Trigger": { tag: "button" },
  "DrawerPrimitive.Trigger": { tag: "button" },
  "Drawer.Portal": { tag: null },
  "DrawerPrimitive.Portal": { tag: null },
  "Drawer.Overlay": { tag: "div" },
  "DrawerPrimitive.Overlay": { tag: "div" },
  "Drawer.Content": {
    tag: "div",
    attrs: { role: "dialog" },
    defaultDataAttrs: { "data-state": "open", "vaul-drawer-direction": "bottom" },
  },
  "DrawerPrimitive.Content": {
    tag: "div",
    attrs: { role: "dialog" },
    defaultDataAttrs: { "data-state": "open", "vaul-drawer-direction": "bottom" },
  },
  "Drawer.Close": { tag: "button" },
  "DrawerPrimitive.Close": { tag: "button" },
  "Drawer.Title": { tag: "h2" },
  "DrawerPrimitive.Title": { tag: "h2" },
  "Drawer.Description": { tag: "p" },
  "DrawerPrimitive.Description": { tag: "p" },

  // DropdownMenu
  "DropdownMenu.Root": { tag: null },
  "DropdownMenuPrimitive.Root": { tag: null },
  "DropdownMenu.Trigger": { tag: "button" },
  "DropdownMenuPrimitive.Trigger": { tag: "button" },
  "DropdownMenu.Portal": { tag: null },
  "DropdownMenuPrimitive.Portal": { tag: null },
  "DropdownMenu.Content": {
    tag: "div",
    attrs: { role: "menu" },
    defaultDataAttrs: { "data-state": "open", "data-side": "bottom" },
  },
  "DropdownMenuPrimitive.Content": {
    tag: "div",
    attrs: { role: "menu" },
    defaultDataAttrs: { "data-state": "open", "data-side": "bottom" },
  },
  "DropdownMenu.Item": { tag: "div", attrs: { role: "menuitem" } },
  "DropdownMenuPrimitive.Item": { tag: "div", attrs: { role: "menuitem" } },
  "DropdownMenu.CheckboxItem": {
    tag: "div",
    attrs: { role: "menuitemcheckbox" },
  },
  "DropdownMenuPrimitive.CheckboxItem": {
    tag: "div",
    attrs: { role: "menuitemcheckbox" },
  },
  "DropdownMenu.RadioItem": { tag: "div", attrs: { role: "menuitemradio" } },
  "DropdownMenuPrimitive.RadioItem": {
    tag: "div",
    attrs: { role: "menuitemradio" },
  },
  "DropdownMenu.Label": { tag: "div" },
  "DropdownMenuPrimitive.Label": { tag: "div" },
  "DropdownMenu.Separator": { tag: "div", attrs: { role: "separator" } },
  "DropdownMenuPrimitive.Separator": { tag: "div", attrs: { role: "separator" } },
  "DropdownMenu.Group": { tag: "div", attrs: { role: "group" } },
  "DropdownMenuPrimitive.Group": { tag: "div", attrs: { role: "group" } },
  "DropdownMenu.SubTrigger": { tag: "div", attrs: { role: "menuitem" } },
  "DropdownMenuPrimitive.SubTrigger": { tag: "div", attrs: { role: "menuitem" } },
  "DropdownMenu.SubContent": { tag: "div", attrs: { role: "menu" } },
  "DropdownMenuPrimitive.SubContent": { tag: "div", attrs: { role: "menu" } },
  "DropdownMenu.RadioGroup": { tag: "div", attrs: { role: "group" } },
  "DropdownMenuPrimitive.RadioGroup": { tag: "div", attrs: { role: "group" } },
  "DropdownMenu.ItemIndicator": { tag: "span" },
  "DropdownMenuPrimitive.ItemIndicator": { tag: "span" },

  // HoverCard
  "HoverCard.Root": { tag: null },
  "HoverCardPrimitive.Root": { tag: null },
  "HoverCard.Trigger": { tag: "span" },
  "HoverCardPrimitive.Trigger": { tag: "span" },
  "HoverCard.Portal": { tag: null },
  "HoverCardPrimitive.Portal": { tag: null },
  "HoverCard.Content": {
    tag: "div",
    defaultDataAttrs: { "data-state": "open", "data-side": "bottom" },
  },
  "HoverCardPrimitive.Content": {
    tag: "div",
    defaultDataAttrs: { "data-state": "open", "data-side": "bottom" },
  },

  // Label
  "Label.Root": { tag: "label" },
  "LabelPrimitive.Root": { tag: "label" },

  // Menubar
  "Menubar.Root": { tag: "div", attrs: { role: "menubar" } },
  "MenubarPrimitive.Root": { tag: "div", attrs: { role: "menubar" } },
  "Menubar.Menu": { tag: null },
  "MenubarPrimitive.Menu": { tag: null },
  "Menubar.Trigger": { tag: "button" },
  "MenubarPrimitive.Trigger": { tag: "button" },
  "Menubar.Portal": { tag: null },
  "MenubarPrimitive.Portal": { tag: null },
  "Menubar.Content": {
    tag: "div",
    attrs: { role: "menu" },
    defaultDataAttrs: { "data-state": "open", "data-side": "bottom" },
  },
  "MenubarPrimitive.Content": {
    tag: "div",
    attrs: { role: "menu" },
    defaultDataAttrs: { "data-state": "open", "data-side": "bottom" },
  },
  "Menubar.Item": { tag: "div", attrs: { role: "menuitem" } },
  "MenubarPrimitive.Item": { tag: "div", attrs: { role: "menuitem" } },
  "Menubar.CheckboxItem": { tag: "div", attrs: { role: "menuitemcheckbox" } },
  "MenubarPrimitive.CheckboxItem": { tag: "div", attrs: { role: "menuitemcheckbox" } },
  "Menubar.RadioItem": { tag: "div", attrs: { role: "menuitemradio" } },
  "MenubarPrimitive.RadioItem": { tag: "div", attrs: { role: "menuitemradio" } },
  "Menubar.Label": { tag: "div" },
  "MenubarPrimitive.Label": { tag: "div" },
  "Menubar.Separator": { tag: "div", attrs: { role: "separator" } },
  "MenubarPrimitive.Separator": { tag: "div", attrs: { role: "separator" } },
  "Menubar.Group": { tag: "div", attrs: { role: "group" } },
  "MenubarPrimitive.Group": { tag: "div", attrs: { role: "group" } },
  "Menubar.Sub": { tag: null },
  "MenubarPrimitive.Sub": { tag: null },
  "Menubar.SubTrigger": { tag: "div", attrs: { role: "menuitem" } },
  "MenubarPrimitive.SubTrigger": { tag: "div", attrs: { role: "menuitem" } },
  "Menubar.SubContent": { tag: "div", attrs: { role: "menu" } },
  "MenubarPrimitive.SubContent": { tag: "div", attrs: { role: "menu" } },
  "Menubar.RadioGroup": { tag: "div", attrs: { role: "group" } },
  "MenubarPrimitive.RadioGroup": { tag: "div", attrs: { role: "group" } },
  "Menubar.ItemIndicator": { tag: "span" },
  "MenubarPrimitive.ItemIndicator": { tag: "span" },

  // NavigationMenu
  "NavigationMenu.Root": { tag: "nav" },
  "NavigationMenuPrimitive.Root": { tag: "nav" },
  "NavigationMenu.List": { tag: "ul" },
  "NavigationMenuPrimitive.List": { tag: "ul" },
  "NavigationMenu.Item": { tag: "li" },
  "NavigationMenuPrimitive.Item": { tag: "li" },
  "NavigationMenu.Trigger": { tag: "button" },
  "NavigationMenuPrimitive.Trigger": { tag: "button" },
  "NavigationMenu.Content": {
    tag: "div",
    defaultDataAttrs: { "data-state": "open", "data-motion": "from-start" },
  },
  "NavigationMenuPrimitive.Content": {
    tag: "div",
    defaultDataAttrs: { "data-state": "open", "data-motion": "from-start" },
  },
  "NavigationMenu.Link": { tag: "a" },
  "NavigationMenuPrimitive.Link": { tag: "a" },
  "NavigationMenu.Indicator": { tag: "div" },
  "NavigationMenuPrimitive.Indicator": { tag: "div" },
  "NavigationMenu.Viewport": { tag: "div" },
  "NavigationMenuPrimitive.Viewport": { tag: "div" },

  // Popover
  "Popover.Root": { tag: null },
  "PopoverPrimitive.Root": { tag: null },
  "Popover.Trigger": { tag: "button" },
  "PopoverPrimitive.Trigger": { tag: "button" },
  "Popover.Anchor": { tag: "span" },
  "PopoverPrimitive.Anchor": { tag: "span" },
  "Popover.Portal": { tag: null },
  "PopoverPrimitive.Portal": { tag: null },
  "Popover.Content": {
    tag: "div",
    defaultDataAttrs: { "data-state": "open", "data-side": "bottom" },
  },
  "PopoverPrimitive.Content": {
    tag: "div",
    defaultDataAttrs: { "data-state": "open", "data-side": "bottom" },
  },
  "Popover.Close": { tag: "button" },
  "PopoverPrimitive.Close": { tag: "button" },
  "Popover.Arrow": { tag: "svg" },
  "PopoverPrimitive.Arrow": { tag: "svg" },

  // Progress. The Indicator's inline `style={{ transform: translateX(...) }}`
  // from source references a runtime `value` prop that doesn't exist on the
  // canvas. The renderer's general "drop parsed inline style" policy means
  // we won't apply the transform at all, so the indicator sits flush-left
  // and visibly fills the track at its full width. That's the correct
  // preview for an unfilled Progress with no styling on it.
  "Progress.Root": { tag: "div", attrs: { role: "progressbar" } },
  "ProgressPrimitive.Root": { tag: "div", attrs: { role: "progressbar" } },
  "Progress.Indicator": { tag: "div" },
  "ProgressPrimitive.Indicator": { tag: "div" },

  // RadioGroup
  "RadioGroup.Root": { tag: "div", attrs: { role: "radiogroup" } },
  "RadioGroupPrimitive.Root": { tag: "div", attrs: { role: "radiogroup" } },
  "RadioGroup.Item": {
    tag: "button",
    attrs: { role: "radio", type: "button" },
    defaultDataAttrs: { "data-state": "unchecked" },
  },
  "RadioGroupPrimitive.Item": {
    tag: "button",
    attrs: { role: "radio", type: "button" },
    defaultDataAttrs: { "data-state": "unchecked" },
  },
  "RadioGroup.Indicator": { tag: "span", defaultDataAttrs: { "data-state": "unchecked" } },
  "RadioGroupPrimitive.Indicator": { tag: "span", defaultDataAttrs: { "data-state": "unchecked" } },

  // ScrollArea
  "ScrollArea.Root": { tag: "div" },
  "ScrollAreaPrimitive.Root": { tag: "div" },
  "ScrollArea.Viewport": { tag: "div" },
  "ScrollAreaPrimitive.Viewport": { tag: "div" },
  "ScrollArea.ScrollAreaScrollbar": { tag: "div" },
  "ScrollAreaPrimitive.ScrollAreaScrollbar": { tag: "div" },
  "ScrollArea.Scrollbar": { tag: "div" },
  "ScrollAreaPrimitive.Scrollbar": { tag: "div" },
  "ScrollArea.ScrollAreaThumb": { tag: "div" },
  "ScrollAreaPrimitive.ScrollAreaThumb": { tag: "div" },
  "ScrollArea.Thumb": { tag: "div" },
  "ScrollAreaPrimitive.Thumb": { tag: "div" },
  "ScrollArea.Corner": { tag: "div" },
  "ScrollAreaPrimitive.Corner": { tag: "div" },

  // Select
  "Select.Root": { tag: null },
  "SelectPrimitive.Root": { tag: null },
  "Select.Trigger": { tag: "button" },
  "SelectPrimitive.Trigger": { tag: "button" },
  "Select.Value": { tag: "span" },
  "SelectPrimitive.Value": { tag: "span" },
  "Select.Icon": { tag: "span" },
  "SelectPrimitive.Icon": { tag: "span" },
  "Select.Portal": { tag: null },
  "SelectPrimitive.Portal": { tag: null },
  "Select.Content": {
    tag: "div",
    attrs: { role: "listbox" },
    defaultDataAttrs: { "data-state": "open", "data-side": "bottom" },
  },
  "SelectPrimitive.Content": {
    tag: "div",
    attrs: { role: "listbox" },
    defaultDataAttrs: { "data-state": "open", "data-side": "bottom" },
  },
  "Select.Viewport": { tag: "div" },
  "SelectPrimitive.Viewport": { tag: "div" },
  "Select.Item": { tag: "div", attrs: { role: "option" } },
  "SelectPrimitive.Item": { tag: "div", attrs: { role: "option" } },
  "Select.ItemText": { tag: "span" },
  "SelectPrimitive.ItemText": { tag: "span" },
  "Select.ItemIndicator": { tag: "span" },
  "SelectPrimitive.ItemIndicator": { tag: "span" },
  "Select.Group": { tag: "div", attrs: { role: "group" } },
  "SelectPrimitive.Group": { tag: "div", attrs: { role: "group" } },
  "Select.Label": { tag: "div" },
  "SelectPrimitive.Label": { tag: "div" },
  "Select.Separator": { tag: "div", attrs: { role: "separator" } },
  "SelectPrimitive.Separator": { tag: "div", attrs: { role: "separator" } },
  "Select.ScrollUpButton": { tag: "div" },
  "SelectPrimitive.ScrollUpButton": { tag: "div" },
  "Select.ScrollDownButton": { tag: "div" },
  "SelectPrimitive.ScrollDownButton": { tag: "div" },

  // Separator. Default orientation is horizontal (shadcn's source inline
  // destructures `orientation = "horizontal"` which the parser currently
  // can't see — GEO-350). Without this default the `data-[orientation=*]:`
  // classes never activate and the separator renders zero-height.
  "Separator.Root": {
    tag: "div",
    attrs: { role: "separator" },
    defaultDataAttrs: { "data-orientation": "horizontal" },
  },
  "SeparatorPrimitive.Root": {
    tag: "div",
    attrs: { role: "separator" },
    defaultDataAttrs: { "data-orientation": "horizontal" },
  },

  // Sheet uses Dialog primitive — covered by Dialog entries above

  // Slider
  "Slider.Root": { tag: "span", defaultDataAttrs: { "data-orientation": "horizontal" } },
  "SliderPrimitive.Root": { tag: "span", defaultDataAttrs: { "data-orientation": "horizontal" } },
  "Slider.Track": { tag: "span", defaultDataAttrs: { "data-orientation": "horizontal" } },
  "SliderPrimitive.Track": { tag: "span", defaultDataAttrs: { "data-orientation": "horizontal" } },
  "Slider.Range": { tag: "span", defaultDataAttrs: { "data-orientation": "horizontal" } },
  "SliderPrimitive.Range": { tag: "span", defaultDataAttrs: { "data-orientation": "horizontal" } },
  "Slider.Thumb": {
    tag: "span",
    attrs: { role: "slider", "aria-orientation": "horizontal" },
    defaultDataAttrs: { "data-orientation": "horizontal" },
  },
  "SliderPrimitive.Thumb": {
    tag: "span",
    attrs: { role: "slider", "aria-orientation": "horizontal" },
    defaultDataAttrs: { "data-orientation": "horizontal" },
  },

  // Switch
  "Switch.Root": {
    tag: "button",
    attrs: { role: "switch", type: "button" },
    defaultDataAttrs: { "data-state": "unchecked" },
  },
  "SwitchPrimitive.Root": {
    tag: "button",
    attrs: { role: "switch", type: "button" },
    defaultDataAttrs: { "data-state": "unchecked" },
  },
  "Switch.Thumb": { tag: "span", defaultDataAttrs: { "data-state": "unchecked" } },
  "SwitchPrimitive.Thumb": { tag: "span", defaultDataAttrs: { "data-state": "unchecked" } },

  // Tabs
  "Tabs.Root": { tag: "div", defaultDataAttrs: { "data-orientation": "horizontal" } },
  "TabsPrimitive.Root": { tag: "div", defaultDataAttrs: { "data-orientation": "horizontal" } },
  "Tabs.List": {
    tag: "div",
    attrs: { role: "tablist" },
    defaultDataAttrs: { "data-orientation": "horizontal" },
  },
  "TabsPrimitive.List": {
    tag: "div",
    attrs: { role: "tablist" },
    defaultDataAttrs: { "data-orientation": "horizontal" },
  },
  "Tabs.Trigger": {
    tag: "button",
    attrs: { role: "tab", type: "button" },
    defaultDataAttrs: { "data-state": "active", "data-orientation": "horizontal" },
  },
  "TabsPrimitive.Trigger": {
    tag: "button",
    attrs: { role: "tab", type: "button" },
    defaultDataAttrs: { "data-state": "active", "data-orientation": "horizontal" },
  },
  "Tabs.Content": {
    tag: "div",
    attrs: { role: "tabpanel" },
    defaultDataAttrs: { "data-state": "active", "data-orientation": "horizontal" },
  },
  "TabsPrimitive.Content": {
    tag: "div",
    attrs: { role: "tabpanel" },
    defaultDataAttrs: { "data-state": "active", "data-orientation": "horizontal" },
  },

  // Toggle
  "Toggle.Root": {
    tag: "button",
    attrs: { type: "button" },
    defaultDataAttrs: { "data-state": "off" },
  },
  "TogglePrimitive.Root": {
    tag: "button",
    attrs: { type: "button" },
    defaultDataAttrs: { "data-state": "off" },
  },

  // ToggleGroup
  "ToggleGroup.Root": { tag: "div", attrs: { role: "group" } },
  "ToggleGroupPrimitive.Root": { tag: "div", attrs: { role: "group" } },
  "ToggleGroup.Item": {
    tag: "button",
    attrs: { type: "button" },
    defaultDataAttrs: { "data-state": "off" },
  },
  "ToggleGroupPrimitive.Item": {
    tag: "button",
    attrs: { type: "button" },
    defaultDataAttrs: { "data-state": "off" },
  },

  // Tooltip
  "Tooltip.Provider": { tag: null },
  "TooltipPrimitive.Provider": { tag: null },
  "Tooltip.Root": { tag: null },
  "TooltipPrimitive.Root": { tag: null },
  "Tooltip.Trigger": { tag: "button" },
  "TooltipPrimitive.Trigger": { tag: "button" },
  "Tooltip.Portal": { tag: null },
  "TooltipPrimitive.Portal": { tag: null },
  "Tooltip.Content": {
    tag: "div",
    attrs: { role: "tooltip" },
    defaultDataAttrs: { "data-state": "delayed-open", "data-side": "top" },
  },
  "TooltipPrimitive.Content": {
    tag: "div",
    attrs: { role: "tooltip" },
    defaultDataAttrs: { "data-state": "delayed-open", "data-side": "top" },
  },
  "Tooltip.Arrow": { tag: "svg" },
  "TooltipPrimitive.Arrow": { tag: "svg" },
}

/**
 * Resolve a Radix primitive reference (e.g. `CheckboxPrimitive.Root`) to
 * its runtime HTML tag + extra attributes. Returns null if the
 * primitive/part combination isn't in the map (caller falls through
 * to a placeholder). Returns `{ tag: null }` for primitives that don't
 * render any DOM of their own (Dialog.Root, Dialog.Portal, etc.) —
 * caller should render children as a fragment.
 */
function resolveRadixTag(
  primitive: string,
  part: string,
): RadixMapping | null {
  const key = `${primitive}.${part}`
  return RADIX_PRIMITIVE_MAP[key] ?? null
}

/**
 * Apply a set of known data attributes to a class list by stripping
 * matching `data-[X=Y]:*` prefixes and dropping non-matching ones.
 * Used to resolve Radix runtime state / orientation / side classes on
 * the canvas where we set the default data attributes ourselves (no
 * Radix instance actually running to set them at runtime).
 *
 * Mirrors the prefix stripping in the dashboard's `resolveVariantClasses`
 * that was added in PR #30 for user-facing data-attr variants. We need
 * a second local pass because the dashboard's resolver only knows about
 * user-facing `variantDataAttrs` — it doesn't know about Radix's own
 * internal state defaults (`data-state`, `data-side`, `data-orientation`,
 * etc.). See RADIX_PRIMITIVE_MAP entries' `defaultDataAttrs` field.
 *
 * Rules:
 * - Bare class (no `data-[X=Y]:` prefix) → pass through unchanged
 * - `data-[X=Y]:<utility>` where X === attr name AND Y === attr value →
 *   emit bare `<utility>`
 * - `data-[X]:<utility>` where X === attr name (no `=Y` — treat as
 *   "present") → emit bare `<utility>`
 * - `data-[X=Y]:<utility>` where attrs has X but value doesn't match →
 *   drop entirely
 * - `data-[X=Y]:<utility>` where X isn't in attrs at all → pass through
 *   so the dashboard resolver or Tailwind's own safelist can handle it
 */
function stripKnownDataAttrPrefixes(
  classes: string[],
  attrs: Record<string, string>,
): string[] {
  if (Object.keys(attrs).length === 0) return classes
  const result: string[] = []
  for (const cls of classes) {
    // Try matching `data-[X=Y]:rest`
    const kvMatch = cls.match(/^data-\[([a-z][a-z0-9-]*)=([^\]]+)\]:(.+)$/)
    if (kvMatch) {
      const [, attrName, attrValue, utility] = kvMatch
      const knownValue = attrs[`data-${attrName}`]
      if (knownValue === undefined) {
        // Not a known attr — pass through for the dashboard resolver
        result.push(cls)
      } else if (knownValue === attrValue) {
        // Matching — strip prefix
        result.push(utility)
      }
      // Else: drop (known attr, non-matching value)
      continue
    }
    // Try matching `data-[X]:rest` (presence check, no value)
    const presenceMatch = cls.match(/^data-\[([a-z][a-z0-9-]*)\]:(.+)$/)
    if (presenceMatch) {
      const [, attrName, utility] = presenceMatch
      const knownValue = attrs[`data-${attrName}`]
      if (knownValue === undefined) {
        result.push(cls)
      } else {
        result.push(utility)
      }
      continue
    }
    // Not a data-attr-prefixed class — pass through
    result.push(cls)
  }
  return result
}

/* ── Render context ─────────────────────────────────────────────── */

/**
 * Everything the renderer needs from the page. Pass-through dependency
 * injection — no module-level state, no implicit access to React context.
 */
export interface RenderContextV2 {
  /** The full tree being rendered. */
  tree: ComponentTreeV2

  /** Currently selected part path, or null. */
  selectedPath: PartPath | null

  /** Set of paths the user has hidden via the AssemblyPanel. */
  hiddenPaths: Set<PartPath>

  /**
   * Resolves data-attribute variant classes to active classes based on the
   * current variant prop values. Identical to v1's `resolveVariantClasses`
   * helper — passed in to avoid duplicating the logic.
   *
   * BOUND TO THE ROOT SUB-COMPONENT's cva/data-attr strategy. For
   * compound components with per-sub variant strategies (e.g. Tabs
   * where TabsList has its own cva), use `resolveClassesForSub`
   * instead via `classesFor` in preview-snippets.
   */
  resolveVariantClasses: (classes: string[]) => string[]

  /**
   * Per-sub-component resolver. Given a specific sub-component + its
   * raw classes, returns the resolved class list including cva base +
   * active variant slot classes + raw classes. Used by the
   * preview-snippet rule layer so each sub-component's cva strategy
   * is honoured (not just the root's).
   */
  resolveClassesForSub: (
    sub: SubComponentV2,
    rawClasses: string[],
  ) => string[]

  /** Variant prop values for the data-* attributes on the root element. */
  variantDataAttrs: Record<string, string>
}

/* ── Public entry point ─────────────────────────────────────────── */

/**
 * Render the canvas preview for a `ComponentTreeV2`. The first sub-component
 * is the compound root; nested sub-components are pulled in by walking the
 * implicit composition graph from `nestInside`.
 *
 * Returns null if the tree has no sub-components.
 */
export function renderTreePreviewV2(ctx: RenderContextV2): React.ReactNode {
  const { tree } = ctx
  if (tree.subComponents.length === 0) return null

  // Composition-rule path — compound shadcn components. If the tree
  // has a rule, delegate to the CompositionCanvas which owns the
  // canvas container ref + state and invokes the rule's render
  // function with a properly populated SnippetContext.
  const rule = lookupRule(tree)
  if (rule) {
    return React.createElement(CompositionCanvas, {
      rule,
      tree,
      selectedPath: ctx.selectedPath,
      resolveVariantClasses: ctx.resolveVariantClasses,
      resolveClassesForSub: ctx.resolveClassesForSub,
    })
  }

  // Flat rendering path — simple components + from-scratch.
  //
  // Wrap in a width-constrained container so simple components
  // (Input, Button, Card, etc.) that use `w-full` in their
  // className don't span the entire canvas. The parent
  // ElementSelector is now `flex flex-1 w-full items-center
  // justify-center` to give compound components a full-canvas
  // positioning context, which means it's wide. Flat-rendered
  // components need a reasonable max-width so their natural
  // sizing looks right.
  const root = tree.subComponents[0]
  const rendered = renderSubComponent(root, ctx, ctx.variantDataAttrs)
  return React.createElement(
    "div",
    {
      className: "w-auto max-w-md",
    },
    rendered,
  )
}

/* ── Sub-component renderer ─────────────────────────────────────── */

/**
 * Render a sub-component's preview shell, plus its nested sub-components
 * (composition graph children) and HTML body children (parts.root.children).
 */
function renderSubComponent(
  sub: SubComponentV2,
  ctx: RenderContextV2,
  extraProps?: Record<string, string>,
): React.ReactNode {
  const subPath = makePartPath(sub.name, [])
  if (ctx.hiddenPaths.has(subPath)) return null

  // Find any sub-components nested inside this one (composition graph children)
  const nestedChildren = findNestedChildren(ctx.tree, sub.name)

  return renderShell(sub, sub.parts.root, subPath, ctx, nestedChildren, extraProps)
}

/**
 * Find sub-components whose `nestInside` matches the parent name.
 *
 * The compound root (`subComponents[0]`) is special: sub-components with
 * `nestInside === undefined` AND `nestInside === root.name` both nest
 * inside the root. Any other sub-component name only matches its explicit
 * children.
 */
function findNestedChildren(
  tree: ComponentTreeV2,
  parentName: string,
): SubComponentV2[] {
  const root = tree.subComponents[0]
  const isRoot = root && root.name === parentName

  return tree.subComponents.filter((sc, i) => {
    if (i === 0) return false // never include the root as a child of itself
    if (isRoot) {
      // Root: include subs with no explicit nestInside OR explicitly nested in root
      return !sc.nestInside || sc.nestInside === parentName
    }
    return sc.nestInside === parentName
  })
}

/**
 * Render a sub-component's "shell" — its parts.root rendered as JSX, with
 * the body containing both:
 *  1. Any nested sub-components (from the composition graph)
 *  2. Any html/text/expression children of parts.root
 *
 * The two are concatenated: nested sub-components first, then the body
 * children. (Order can be revisited later; this matches the natural
 * "shadcn compound component with children" pattern.)
 */
function renderShell(
  sub: SubComponentV2,
  part: PartNode,
  path: PartPath,
  ctx: RenderContextV2,
  nestedSubs: SubComponentV2[],
  extraProps?: Record<string, string>,
): React.ReactNode {
  // Resolve the rendered HTML tag for this sub-component's root.
  //
  // The from-scratch builder always produces an `html` base, so the
  // common case is `part.base.tag` directly. Parsed shadcn components
  // can have other base kinds:
  //
  // - `dynamic-ref`: a local var like Button's
  //   `const Comp = asChild ? Slot.Root : "button"`. We extract the
  //   default-branch HTML tag from the sub-component's passthrough so
  //   the canvas renders an actual <button> instead of a placeholder
  //   pill. Covers Button, Badge, Toggle, AlertDialog, etc.
  // - `radix`: a Radix primitive reference like
  //   `CheckboxPrimitive.Root`. We resolve these via RADIX_PRIMITIVE_MAP
  //   so parsed Checkbox / Label / RadioGroup / Switch / etc. render
  //   as their actual runtime DOM elements (button[role=checkbox],
  //   label, div[role=radiogroup], button[role=switch], ...). Primitives
  //   that render no DOM of their own (Dialog.Root, Popover.Portal, ...)
  //   return { tag: null } → we render the children as a fragment.
  // - `third-party` / `component-ref`: genuinely can't be rendered
  //   without instantiating the underlying component. Falls through
  //   to the placeholder.
  let resolvedTag: string | null = null
  let radixAttrs: Record<string, string> | undefined
  let radixDefaultDataAttrs: Record<string, string> | undefined
  let isTransparentRadix = false
  if (part.base.kind === "html") {
    resolvedTag = part.base.tag
  } else if (part.base.kind === "dynamic-ref") {
    resolvedTag = extractDefaultTagFromPassthrough(sub, part.base.localName)
  } else if (part.base.kind === "radix") {
    const mapping = resolveRadixTag(part.base.primitive, part.base.part)
    if (mapping) {
      if (mapping.tag === null) {
        // Transparent wrapper (Dialog.Root, Popover.Portal, etc.) —
        // no DOM element of its own, just renders children.
        isTransparentRadix = true
      } else {
        resolvedTag = mapping.tag
        radixAttrs = mapping.attrs
        radixDefaultDataAttrs = mapping.defaultDataAttrs
      }
    }
  }

  // Transparent Radix wrappers: render children as a fragment, no
  // placeholder, no DOM of our own.
  if (isTransparentRadix) {
    const children: React.ReactNode[] = []
    for (const nested of nestedSubs) {
      const rendered = renderSubComponent(nested, ctx, undefined)
      if (rendered !== null) children.push(rendered)
    }
    for (let i = 0; i < part.children.length; i++) {
      const child = part.children[i]
      const childRendered = renderBodyChild(child, path, i, ctx)
      if (childRendered !== null) children.push(childRendered)
    }
    if (children.length === 0) {
      // Empty transparent wrapper — render a placeholder so the user
      // can still see and select this sub-component on the canvas.
      return renderPlaceholder(sub.name, path)
    }
    return React.createElement(React.Fragment, { key: path }, ...children)
  }

  if (resolvedTag === null) {
    return renderPlaceholder(sub.name, path)
  }

  const isSelected = ctx.selectedPath === path
  const rawClasses = getPartClasses(part)
  // First: the dashboard's resolver handles user-facing data-attr variants
  // (cva slots, runtime prefix stripping from PR #30). Then: a local pass
  // strips Radix's own default state/orientation/side data attrs so
  // `data-[state=unchecked]:bg-input` → `bg-input` etc. activate on the
  // canvas without a real Radix instance.
  const afterDashboardResolve = ctx.resolveVariantClasses(rawClasses)
  const resolved = radixDefaultDataAttrs
    ? stripKnownDataAttrPrefixes(afterDashboardResolve, radixDefaultDataAttrs)
    : afterDashboardResolve
  const { remainingClasses, style: colorStyle } = resolveColorStyles(resolved)
  const allClasses = [
    ...remainingClasses,
    isSelected ? "ring-2 ring-blue-500 ring-offset-1" : "",
  ].filter(Boolean)
  const className = allClasses.length > 0 ? allClasses.join(" ") : undefined
  const inlineStyle =
    Object.keys(colorStyle).length > 0 ? colorStyle : undefined

  const tag = resolvedTag
  const isPascalCase = /^[A-Z]/.test(tag)
  if (isPascalCase && shadcnPreviewMap[tag]) {
    return React.createElement(
      "div",
      {
        key: path,
        "data-node-id": path,
        className: isSelected
          ? "ring-2 ring-blue-500 ring-offset-1 rounded"
          : undefined,
      },
      shadcnPreviewMap[tag](),
    )
  }

  // Defensive: bail out if `tag` is PascalCase but not in the preview map
  // (would crash React with "incorrect casing"). Render as a placeholder.
  if (isPascalCase) {
    return renderPlaceholder(`<${tag}>`, path)
  }

  // Void HTML elements (input, img, br, hr, etc.) cannot receive children.
  // React's createElement will throw "<tag> is a void element tag and must
  // neither have `children` nor use `dangerouslySetInnerHTML`." We render
  // void elements with the two-argument createElement form and skip the
  // empty-children placeholder entirely — a properly classed <input> or
  // <img> renders at its natural dimensions and is visible on the canvas
  // without any content.
  const isVoid = VOID_HTML_ELEMENTS.has(tag)

  const baseProps: Record<string, unknown> = {
    key: path,
    className,
    style: inlineStyle,
    "data-node-id": path,
    ...(radixAttrs ?? {}),
    ...(radixDefaultDataAttrs ?? {}),
    ...extraProps,
  }

  if (isVoid) {
    return React.createElement(
      tag as keyof React.JSX.IntrinsicElements,
      baseProps,
    )
  }

  // Render nested sub-components first
  const children: React.ReactNode[] = []
  for (const nested of nestedSubs) {
    const rendered = renderSubComponent(nested, ctx, undefined)
    if (rendered !== null) children.push(rendered)
  }

  // Then render html/text/expression children of this sub-component's body
  for (let i = 0; i < part.children.length; i++) {
    const child = part.children[i]
    const childRendered = renderBodyChild(child, path, i, ctx)
    if (childRendered !== null) children.push(childRendered)
  }

  // Empty placeholder if no children rendered. Three flavours:
  //
  // - Parsed sub-components (tree.originalSource is set): render the
  //   sub-component name as a bare TEXT node. The rendered element
  //   already has its resolved classes from source (cva, data-attr,
  //   or plain cn()), so a parsed Button shows up as a styled button
  //   labelled "Button" — like a real button you'd encounter in the
  //   wild — instead of an empty button that collapses to zero size.
  //
  //   CRITICAL: for parsed sub-components we must NOT inject a
  //   `<span class="text-xs">` wrapper. The span's text-xs overrides
  //   any text-sm / text-lg / text-2xl set on the parent's className,
  //   which silently defeats the font-size context picker. Discovered
  //   by George while testing Label. See the lesson in memory file
  //   `feedback_empty_placeholder_must_not_override_parent_classes.md`.
  //
  // - From-scratch sub-components (html base, no cva): render the
  //   `<SubName>` placeholder span at very-low-opacity so the designer
  //   sees there's a sub-component slot here even when it's empty.
  //   This is a builder authoring affordance, not a preview hint —
  //   only makes sense when the user is constructing components from
  //   nothing.
  if (children.length === 0) {
    const isParsed = ctx.tree.originalSource !== undefined
    const isVisualPlaceholder = VISUAL_PLACEHOLDER_SUBS.has(sub.name)
    if (isVisualPlaceholder) {
      // Visual primitives (Skeleton, Separator, etc.) render as bare
      // styled boxes with no text — the box's intrinsic dimensions
      // come from its source classes (h-4 w-full / h-px w-full / etc.).
    } else if (isParsed) {
      children.push(sub.name)
    } else {
      children.push(
        React.createElement(
          "span",
          {
            key: "__empty__",
            className: "text-xs text-muted-foreground/40 select-none",
          },
          `<${sub.name}>`,
        ),
      )
    }
  }

  // <textarea> can't accept children — React requires `defaultValue`
  // (or `value`) instead. If the empty-children fallback added the
  // sub-component name as a text label, hoist it into `defaultValue`
  // so the textarea still shows something on the canvas without
  // tripping React's "use defaultValue/value props instead of setting
  // children on <textarea>" warning. Discovered 2026-04-09.
  if (tag === "textarea") {
    const textChildren = children.filter(
      (c) => typeof c === "string",
    ) as string[]
    if (textChildren.length > 0 && baseProps.defaultValue === undefined) {
      baseProps.defaultValue = textChildren.join("")
    }
    return React.createElement(
      tag as keyof React.JSX.IntrinsicElements,
      baseProps,
    )
  }

  return React.createElement(
    tag as keyof React.JSX.IntrinsicElements,
    baseProps,
    ...children,
  )
}

/* ── Body children renderer (html/text/expression children of a sub-component) ── */

/**
 * Render a single PartChild (the things inside a sub-component's body):
 * raw HTML parts, text, expressions. NOT used for nested sub-components
 * (those go through `renderSubComponent` directly via the composition graph).
 */
function renderBodyChild(
  child: PartChild,
  parentPath: PartPath,
  childIndex: number,
  ctx: RenderContextV2,
): React.ReactNode {
  if (child.kind === "part") {
    const childPath = appendIndexToPath(parentPath, childIndex)
    return renderBodyPart(child.part, childPath, ctx)
  }
  if (child.kind === "text") {
    return child.value
  }
  if (child.kind === "expression") {
    // For PARSED components we suppress JSX expression source text
    // (e.g. `children ?? <ChevronRight />`, `{children}`,
    // `Array.from(...).map(...)`) — the expression isn't real DOM and
    // dumping it as italic text leaks parser internals into the canvas
    // (see Breadcrumb separator, ToggleGroup context provider,
    // Slider thumb generator). The italic-debug fallback is still
    // useful for the from-scratch builder where the user is actively
    // composing JSX, so we keep it for non-parsed trees.
    const isParsed = ctx.tree.originalSource !== undefined
    if (isParsed) return null
    return React.createElement(
      "span",
      {
        key: `expr-${childIndex}`,
        className: "text-xs text-muted-foreground/60 select-none italic",
      },
      child.source,
    )
  }
  // jsx-comment and passthrough don't render in the preview
  return null
}

/**
 * Render a non-sub-component PartNode — the things the user adds via the
 * AssemblyPanel's HTML/shadcn picker into a sub-component's body.
 *
 * Distinct from `renderShell` because:
 * - These don't have nested sub-components from the composition graph
 * - They're not the "root" of a sub-component, just JSX children inside one
 */
function renderBodyPart(
  part: PartNode,
  path: PartPath,
  ctx: RenderContextV2,
): React.ReactNode {
  if (ctx.hiddenPaths.has(path)) return null

  // component-ref → try Lucide first (real icon SVG), then shadcn
  // preview map, then Context.Provider (transparent fragment), then
  // placeholder. We deliberately do NOT recurse into other
  // sub-components from here (composition graph nesting is handled by
  // renderShell + nestInside).
  if (part.base.kind === "component-ref") {
    const name = part.base.name
    const LucideIcon = getLucideIcon(name)
    if (LucideIcon) {
      return renderLucideIcon(LucideIcon, part, path, ctx)
    }
    if (shadcnPreviewMap[name]) {
      return renderShadcnPreview(name, path, ctx)
    }
    // React Context.Provider components have no DOM of their own — they
    // just inject a value and pass children through. Detect them by
    // the `.Provider` suffix and render as a Fragment so the children
    // (the actual JSX inside the Provider) come through to the canvas.
    // Fixes ToggleGroup whose root has
    // `<ToggleGroupContext.Provider value={...}>{children}</ToggleGroupContext.Provider>`
    // and was previously rendered as a placeholder pill that hid the
    // entire toggle group. Discovered 2026-04-09.
    if (name.endsWith(".Provider")) {
      const providerChildren: React.ReactNode[] = []
      for (let i = 0; i < part.children.length; i++) {
        const child = part.children[i]
        const childRendered = renderBodyChild(child, path, i, ctx)
        if (childRendered !== null) providerChildren.push(childRendered)
      }
      return React.createElement(
        React.Fragment,
        { key: path },
        ...providerChildren,
      )
    }
    return renderPlaceholder(name, path)
  }

  // Radix primitive nested inside a sub-component's body.
  // Resolve via RADIX_PRIMITIVE_MAP so parsed Checkbox.Indicator,
  // Switch.Thumb, Progress.Indicator, Select.Value, etc. render as
  // real DOM elements with their classes instead of as placeholder
  // pills overlaying the parent. Mirrors the root-level fix in
  // renderShell but stays self-contained (no nested sub-components,
  // only body children).
  if (part.base.kind === "radix") {
    const mapping = resolveRadixTag(part.base.primitive, part.base.part)
    if (mapping === null) {
      // Unknown primitive — conservative fallback
      return renderPlaceholder(
        `${part.base.primitive}.${part.base.part}`,
        path,
      )
    }
    return renderRadixBodyPart(part, path, ctx, mapping)
  }

  if (part.base.kind === "dynamic-ref") {
    return renderPlaceholder(part.base.localName, path)
  }

  if (part.base.kind === "third-party") {
    return renderPlaceholder(part.base.component, path)
  }

  // html base
  return renderHtmlPart(part, path, ctx)
}

/**
 * Render a Radix primitive part (nested inside a sub-component's body)
 * as a real DOM element with its own classes, inline styles, children,
 * and optional ARIA attributes from the Radix map.
 *
 * Structured like `renderHtmlPart` but resolves the tag + attrs from
 * the Radix map instead of reading `part.base.tag` directly.
 *
 * Transparent wrappers (mapping.tag === null) render their children
 * as a fragment — see renderShell for the same pattern at the root
 * level.
 */
function renderRadixBodyPart(
  part: PartNode,
  path: PartPath,
  ctx: RenderContextV2,
  mapping: RadixMapping,
): React.ReactNode {
  // Transparent wrapper (e.g. Dialog.Root, Popover.Portal) — no DOM
  // of its own, just render children as a fragment.
  if (mapping.tag === null) {
    const children: React.ReactNode[] = []
    for (let i = 0; i < part.children.length; i++) {
      const child = part.children[i]
      const childRendered = renderBodyChild(child, path, i, ctx)
      if (childRendered !== null) children.push(childRendered)
    }
    if (children.length === 0) {
      // Empty transparent wrapper — fall back to a labelled placeholder
      // so the user can still see + select it on the canvas.
      if (part.base.kind !== "radix") return renderPlaceholder("?", path)
      return renderPlaceholder(
        `${part.base.primitive}.${part.base.part}`,
        path,
      )
    }
    return React.createElement(React.Fragment, { key: path }, ...children)
  }

  const tag = mapping.tag
  const isSelected = ctx.selectedPath === path
  const rawClasses = getPartClasses(part)
  // Same two-pass resolution as renderShell: dashboard resolver first
  // (user-facing variants), then a local strip for Radix's own default
  // state/orientation/side data attributes.
  const afterDashboardResolve = ctx.resolveVariantClasses(rawClasses)
  const resolved = mapping.defaultDataAttrs
    ? stripKnownDataAttrPrefixes(afterDashboardResolve, mapping.defaultDataAttrs)
    : afterDashboardResolve
  const { remainingClasses, style: colorStyle } = resolveColorStyles(resolved)
  const allClasses = [
    ...remainingClasses,
    isSelected ? "ring-2 ring-blue-500 ring-offset-1" : "",
  ].filter(Boolean)
  const className = allClasses.length > 0 ? allClasses.join(" ") : undefined
  const inlineStyle =
    Object.keys(colorStyle).length > 0 ? colorStyle : undefined

  const baseProps: Record<string, unknown> = {
    key: path,
    className,
    style: inlineStyle,
    "data-node-id": path,
    ...(mapping.attrs ?? {}),
    ...(mapping.defaultDataAttrs ?? {}),
  }

  // Void element guard (e.g. Avatar.Image → <img>)
  if (VOID_HTML_ELEMENTS.has(tag)) {
    return React.createElement(
      tag as keyof React.JSX.IntrinsicElements,
      baseProps,
    )
  }

  // Render body children (text / expression / nested parts)
  const children: React.ReactNode[] = []
  for (let i = 0; i < part.children.length; i++) {
    const child = part.children[i]
    const childRendered = renderBodyChild(child, path, i, ctx)
    if (childRendered !== null) children.push(childRendered)
  }

  return React.createElement(
    tag as keyof React.JSX.IntrinsicElements,
    baseProps,
    ...children,
  )
}

function renderHtmlPart(
  part: PartNode,
  path: PartPath,
  ctx: RenderContextV2,
): React.ReactNode {
  if (part.base.kind !== "html") return null

  const isSelected = ctx.selectedPath === path
  const rawClasses = getPartClasses(part)
  const resolved = ctx.resolveVariantClasses(rawClasses)
  const { remainingClasses, style: colorStyle } = resolveColorStyles(resolved)
  const allClasses = [
    ...remainingClasses,
    isSelected ? "ring-2 ring-blue-500 ring-offset-1" : "",
  ].filter(Boolean)
  const className = allClasses.length > 0 ? allClasses.join(" ") : undefined
  const inlineStyle =
    Object.keys(colorStyle).length > 0 ? colorStyle : undefined

  const tag = part.base.tag
  const isPascalCase = /^[A-Z]/.test(tag)

  // PascalCase HTML tag — route through shadcn preview map or fall back
  // to a placeholder. Don't let React.createElement crash.
  if (isPascalCase) {
    if (shadcnPreviewMap[tag]) {
      return renderShadcnPreview(tag, path, ctx)
    }
    return renderPlaceholder(`<${tag}>`, path)
  }

  const baseProps: Record<string, unknown> = {
    key: path,
    className,
    style: inlineStyle,
    "data-node-id": path,
  }

  // Void HTML elements cannot receive children (see VOID_HTML_ELEMENTS
  // for the full list and the root-renderer equivalent).
  if (VOID_HTML_ELEMENTS.has(tag)) {
    return React.createElement(
      tag as keyof React.JSX.IntrinsicElements,
      baseProps,
    )
  }

  const children: React.ReactNode[] = []
  for (let i = 0; i < part.children.length; i++) {
    const child = part.children[i]
    const childRendered = renderBodyChild(child, path, i, ctx)
    if (childRendered !== null) children.push(childRendered)
  }

  if (children.length === 0) {
    children.push(
      React.createElement(
        "span",
        {
          key: "__empty__",
          className: "text-xs text-muted-foreground/40 select-none",
        },
        `<${tag}>`,
      ),
    )
  }

  return React.createElement(
    tag as keyof React.JSX.IntrinsicElements,
    baseProps,
    ...children,
  )
}

function renderShadcnPreview(
  name: string,
  path: PartPath,
  ctx: RenderContextV2,
): React.ReactNode {
  const isSelected = ctx.selectedPath === path
  return React.createElement(
    "div",
    {
      key: path,
      "data-node-id": path,
      className: isSelected
        ? "ring-2 ring-blue-500 ring-offset-1 rounded"
        : undefined,
    },
    shadcnPreviewMap[name](),
  )
}

/**
 * Render a Lucide icon as a real SVG component on the canvas. Carries
 * the part's resolved classes through so `size-4`, `text-primary`,
 * `shrink-0`, etc. all work as they would in real source. Adds the
 * selection ring when this path is selected.
 */
function renderLucideIcon(
  Icon: React.ComponentType<Record<string, unknown>>,
  part: PartNode,
  path: PartPath,
  ctx: RenderContextV2,
): React.ReactNode {
  const isSelected = ctx.selectedPath === path
  const rawClasses = getPartClasses(part)
  const resolved = ctx.resolveVariantClasses(rawClasses)
  const { remainingClasses, style: colorStyle } = resolveColorStyles(resolved)
  const allClasses = [
    ...remainingClasses,
    isSelected ? "ring-2 ring-blue-500 ring-offset-1 rounded" : "",
  ].filter(Boolean)
  const className = allClasses.length > 0 ? allClasses.join(" ") : undefined
  const inlineStyle =
    Object.keys(colorStyle).length > 0 ? colorStyle : undefined

  return React.createElement(Icon, {
    key: path,
    "data-node-id": path,
    className,
    style: inlineStyle,
  })
}

/* ── Helpers ────────────────────────────────────────────────────── */

function renderPlaceholder(label: string, path: PartPath): React.ReactNode {
  return React.createElement(
    "span",
    {
      key: path,
      "data-node-id": path,
      className:
        "rounded bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-500",
    },
    label,
  )
}

function appendIndexToPath(path: PartPath, index: number): PartPath {
  if (path.endsWith("/")) {
    return `${path}${index}`
  }
  return `${path}/${index}`
}

/**
 * Look at a sub-component's passthrough statements for a `const <name>`
 * declaration of the form `const <name> = <cond> ? <something> : "<htmlTag>"`
 * (or with the literal in the THEN branch instead of the ELSE branch)
 * and return the literal HTML tag.
 *
 * Used by `renderShell` to resolve a `dynamic-ref` base back to its
 * default-branch tag at render time. The most common shape is shadcn's
 * `asChild` pattern:
 *
 *   const Comp = asChild ? Slot.Root : "button"
 *
 * Returns null when no matching declaration is found, or when the
 * literal isn't a plain HTML tag (e.g. both branches are PascalCase
 * components — we'd hit a placeholder anyway).
 *
 * Heuristic and string-based; covers Button, Badge, Toggle,
 * AlertDialog, Item, Label, NavigationMenu, Pagination, Sheet,
 * Sidebar, Tabs (the entire `asChild` family in the registry as of
 * 2026-04-08). A future iteration could promote this to a parser-time
 * field on the `dynamic-ref` Base kind, but the heuristic is reliable
 * enough for v1 and avoids touching the frozen parser file.
 */
function extractDefaultTagFromPassthrough(
  sub: SubComponentV2,
  localName: string,
): string | null {
  // The passthrough statements are stored verbatim — see
  // parse-source-v2.ts where bodyStmt.getText() is captured.
  for (const passthrough of sub.passthrough) {
    if (passthrough.kind !== "statement") continue
    const src = passthrough.source

    // Cheap prefix check before reaching for a regex.
    if (!src.includes(`const ${localName}`)) continue

    // Match `const <localName> = ... ? ... : "<tag>"` (literal in else)
    // or                        ... ? "<tag>" : ...   (literal in then)
    // The tag must look like a valid HTML element name (lowercase
    // letters, optional digits) so we don't accidentally pick up a
    // CSS class string or some other quoted value.
    const elsePattern = new RegExp(
      `const\\s+${localName}\\s*=\\s*[^?]+\\?[^:]+:\\s*"([a-z][a-z0-9-]*)"`,
    )
    const thenPattern = new RegExp(
      `const\\s+${localName}\\s*=\\s*[^?]+\\?\\s*"([a-z][a-z0-9-]*)"\\s*:`,
    )

    const elseMatch = src.match(elsePattern)
    if (elseMatch) return elseMatch[1]

    const thenMatch = src.match(thenPattern)
    if (thenMatch) return thenMatch[1]
  }
  return null
}
