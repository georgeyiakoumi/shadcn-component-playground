// Component Registry — metadata for all shadcn/ui components
// GEO-219: Build component registry and loader

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ComponentMeta = {
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly category: string;
  readonly isCompound: boolean;
  readonly subComponents: readonly string[];
  readonly variants: readonly string[];
  readonly keywords: readonly string[];
};

export type Category = {
  readonly name: string;
  readonly slug: string;
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const categories = [
  { name: "Inputs", slug: "inputs" },
  { name: "Layout", slug: "layout" },
  { name: "Feedback", slug: "feedback" },
  { name: "Navigation", slug: "navigation" },
  { name: "Data Display", slug: "data-display" },
  { name: "Typography", slug: "typography" },
] as const satisfies readonly Category[];

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const registry: readonly ComponentMeta[] = [
  // ── Inputs ───────────────────────────────────────────────────────────
  {
    name: "Button",
    slug: "button",
    description:
      "A clickable element that triggers an action or submits a form.",
    category: "Inputs",
    isCompound: false,
    subComponents: [],
    variants: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    keywords: ["click", "action", "submit", "cta", "press", "tap"],
  },
  {
    name: "Checkbox",
    slug: "checkbox",
    description:
      "A toggle control that lets users select one or more options from a set.",
    category: "Inputs",
    isCompound: false,
    subComponents: [],
    variants: [],
    keywords: ["tick", "check", "select", "option", "boolean", "toggle"],
  },
  {
    name: "Input",
    slug: "input",
    description:
      "A single-line text field for capturing short-form user input.",
    category: "Inputs",
    isCompound: false,
    subComponents: [],
    variants: [],
    keywords: [
      "text field",
      "text box",
      "form field",
      "type",
      "enter",
      "search bar",
    ],
  },
  {
    name: "Label",
    slug: "label",
    description:
      "An accessible text label that describes a form control.",
    category: "Inputs",
    isCompound: false,
    subComponents: [],
    variants: [],
    keywords: ["form label", "field name", "caption", "accessibility"],
  },
  {
    name: "RadioGroup",
    slug: "radio-group",
    description:
      "A set of mutually exclusive options where only one can be selected at a time.",
    category: "Inputs",
    isCompound: true,
    subComponents: ["RadioGroupItem"],
    variants: [],
    keywords: [
      "radio",
      "option",
      "single select",
      "choice",
      "pick one",
      "exclusive",
    ],
  },
  {
    name: "Select",
    slug: "select",
    description:
      "A dropdown menu that lets users pick a single value from a predefined list.",
    category: "Inputs",
    isCompound: true,
    subComponents: [
      "SelectTrigger",
      "SelectValue",
      "SelectContent",
      "SelectGroup",
      "SelectItem",
      "SelectLabel",
      "SelectSeparator",
    ],
    variants: [],
    keywords: [
      "dropdown",
      "picker",
      "combo box",
      "choose",
      "list",
      "option list",
    ],
  },
  {
    name: "Slider",
    slug: "slider",
    description:
      "A draggable control for selecting a numeric value within a range.",
    category: "Inputs",
    isCompound: false,
    subComponents: [],
    variants: [],
    keywords: ["range", "scrubber", "volume", "progress", "numeric", "drag"],
  },
  {
    name: "Switch",
    slug: "switch",
    description:
      "A binary toggle for turning a setting on or off with immediate effect.",
    category: "Inputs",
    isCompound: false,
    subComponents: [],
    variants: [],
    keywords: [
      "toggle",
      "on off",
      "boolean",
      "flip",
      "setting",
      "preference",
    ],
  },
  {
    name: "Textarea",
    slug: "textarea",
    description:
      "A multi-line text field for longer-form user input such as comments or messages.",
    category: "Inputs",
    isCompound: false,
    subComponents: [],
    variants: [],
    keywords: [
      "multiline",
      "text area",
      "comment box",
      "message",
      "paragraph",
      "long text",
    ],
  },
  {
    name: "Toggle",
    slug: "toggle",
    description:
      "A two-state button that can be switched on or off, like bold or italic formatting.",
    category: "Inputs",
    isCompound: false,
    subComponents: [],
    variants: ["default", "outline"],
    keywords: [
      "toggle button",
      "pressed",
      "active",
      "on off",
      "formatting",
      "toolbar",
    ],
  },
  {
    name: "ToggleGroup",
    slug: "toggle-group",
    description:
      "A set of toggle buttons where one or multiple can be active, useful for toolbars.",
    category: "Inputs",
    isCompound: true,
    subComponents: ["ToggleGroupItem"],
    variants: ["default", "outline"],
    keywords: [
      "button group",
      "toolbar",
      "segmented control",
      "multi toggle",
      "option bar",
    ],
  },

  // ── Layout ───────────────────────────────────────────────────────────
  {
    name: "Accordion",
    slug: "accordion",
    description:
      "A vertically stacked set of collapsible sections for organising content.",
    category: "Layout",
    isCompound: true,
    subComponents: ["AccordionItem", "AccordionTrigger", "AccordionContent"],
    variants: [],
    keywords: [
      "expandable",
      "collapsible",
      "faq",
      "disclosure",
      "fold",
      "expand",
    ],
  },
  {
    name: "AspectRatio",
    slug: "aspect-ratio",
    description:
      "A container that maintains a consistent width-to-height ratio for its content.",
    category: "Layout",
    isCompound: false,
    subComponents: [],
    variants: [],
    keywords: [
      "ratio",
      "responsive",
      "image container",
      "video frame",
      "proportion",
      "16:9",
    ],
  },
  {
    name: "Card",
    slug: "card",
    description:
      "A bordered container that groups related content and actions into a single unit.",
    category: "Layout",
    isCompound: true,
    subComponents: [
      "CardHeader",
      "CardTitle",
      "CardDescription",
      "CardContent",
      "CardFooter",
    ],
    variants: [],
    keywords: ["container", "panel", "tile", "box", "surface", "group"],
  },
  {
    name: "Collapsible",
    slug: "collapsible",
    description:
      "A panel that can be expanded or collapsed to show or hide its content.",
    category: "Layout",
    isCompound: true,
    subComponents: ["CollapsibleTrigger", "CollapsibleContent"],
    variants: [],
    keywords: [
      "expand",
      "collapse",
      "show hide",
      "toggle content",
      "disclosure",
    ],
  },
  {
    name: "Resizable",
    slug: "resizable",
    description:
      "A layout primitive that lets users resize panels by dragging a handle.",
    category: "Layout",
    isCompound: true,
    subComponents: ["ResizablePanelGroup", "ResizablePanel", "ResizableHandle"],
    variants: [],
    keywords: [
      "resize",
      "drag",
      "split",
      "panel",
      "pane",
      "adjustable",
      "splitter",
    ],
  },
  {
    name: "ScrollArea",
    slug: "scroll-area",
    description:
      "A styled scrollable container with custom scrollbar appearance.",
    category: "Layout",
    isCompound: true,
    subComponents: ["ScrollBar"],
    variants: [],
    keywords: [
      "scroll",
      "overflow",
      "scrollbar",
      "scrollable",
      "container",
      "viewport",
    ],
  },
  {
    name: "Separator",
    slug: "separator",
    description:
      "A horizontal or vertical line that visually divides sections of content.",
    category: "Layout",
    isCompound: false,
    subComponents: [],
    variants: [],
    keywords: ["divider", "line", "hr", "rule", "border", "split"],
  },
  {
    name: "Table",
    slug: "table",
    description:
      "A structured grid for displaying rows and columns of tabular data.",
    category: "Layout",
    isCompound: true,
    subComponents: [
      "TableHeader",
      "TableBody",
      "TableFooter",
      "TableHead",
      "TableRow",
      "TableCell",
      "TableCaption",
    ],
    variants: [],
    keywords: [
      "grid",
      "data table",
      "spreadsheet",
      "rows",
      "columns",
      "tabular",
    ],
  },

  // ── Feedback ─────────────────────────────────────────────────────────
  {
    name: "Alert",
    slug: "alert",
    description:
      "A static banner that displays an important message such as a warning or success notice.",
    category: "Feedback",
    isCompound: true,
    subComponents: ["AlertTitle", "AlertDescription"],
    variants: ["default", "destructive"],
    keywords: [
      "banner",
      "notice",
      "warning",
      "info",
      "message",
      "callout",
      "notification",
    ],
  },
  {
    name: "AlertDialog",
    slug: "alert-dialog",
    description:
      "A modal dialog that interrupts the user to confirm a critical action before proceeding.",
    category: "Feedback",
    isCompound: true,
    subComponents: [
      "AlertDialogTrigger",
      "AlertDialogContent",
      "AlertDialogHeader",
      "AlertDialogFooter",
      "AlertDialogTitle",
      "AlertDialogDescription",
      "AlertDialogAction",
      "AlertDialogCancel",
    ],
    variants: [],
    keywords: [
      "confirm",
      "confirmation",
      "modal",
      "prompt",
      "are you sure",
      "destructive action",
    ],
  },
  {
    name: "Dialog",
    slug: "dialog",
    description:
      "A modal overlay that focuses the user's attention on a self-contained task or message.",
    category: "Feedback",
    isCompound: true,
    subComponents: [
      "DialogTrigger",
      "DialogContent",
      "DialogHeader",
      "DialogFooter",
      "DialogTitle",
      "DialogDescription",
      "DialogClose",
    ],
    variants: [],
    keywords: ["modal", "popup", "overlay", "lightbox", "window", "prompt"],
  },
  {
    name: "Drawer",
    slug: "drawer",
    description:
      "A panel that slides in from the edge of the screen, commonly used on mobile for menus or forms.",
    category: "Feedback",
    isCompound: true,
    subComponents: [
      "DrawerTrigger",
      "DrawerContent",
      "DrawerHeader",
      "DrawerFooter",
      "DrawerTitle",
      "DrawerDescription",
      "DrawerClose",
    ],
    variants: [],
    keywords: [
      "slide",
      "bottom sheet",
      "panel",
      "mobile menu",
      "tray",
      "slide up",
    ],
  },
  {
    name: "HoverCard",
    slug: "hover-card",
    description:
      "A floating card that appears on hover to preview supplementary content.",
    category: "Feedback",
    isCompound: true,
    subComponents: ["HoverCardTrigger", "HoverCardContent"],
    variants: [],
    keywords: [
      "preview",
      "hover",
      "popup",
      "info card",
      "profile card",
      "floating",
    ],
  },
  {
    name: "Popover",
    slug: "popover",
    description:
      "A floating panel anchored to a trigger element, used for contextual content or controls.",
    category: "Feedback",
    isCompound: true,
    subComponents: ["PopoverTrigger", "PopoverContent"],
    variants: [],
    keywords: [
      "popup",
      "floating",
      "bubble",
      "dropdown",
      "contextual",
      "anchor",
    ],
  },
  {
    name: "Sheet",
    slug: "sheet",
    description:
      "A side panel that slides in from any edge of the viewport for secondary content.",
    category: "Feedback",
    isCompound: true,
    subComponents: [
      "SheetTrigger",
      "SheetContent",
      "SheetHeader",
      "SheetFooter",
      "SheetTitle",
      "SheetDescription",
      "SheetClose",
    ],
    variants: [],
    keywords: [
      "side panel",
      "sidebar",
      "slide over",
      "drawer",
      "off-canvas",
      "panel",
    ],
  },
  {
    name: "Tooltip",
    slug: "tooltip",
    description:
      "A small text popup that appears on hover or focus to describe an element.",
    category: "Feedback",
    isCompound: true,
    subComponents: ["TooltipTrigger", "TooltipContent", "TooltipProvider"],
    variants: [],
    keywords: [
      "hint",
      "help text",
      "hover text",
      "info",
      "description",
      "label",
    ],
  },
  {
    name: "Sonner",
    slug: "sonner",
    description:
      "A toast notification system powered by the Sonner library with stacking and swipe-to-dismiss.",
    category: "Feedback",
    isCompound: false,
    subComponents: [],
    variants: [],
    keywords: [
      "toast",
      "notification",
      "snackbar",
      "stack",
      "sonner",
      "flash",
    ],
  },

  // ── Navigation ───────────────────────────────────────────────────────
  {
    name: "Breadcrumb",
    slug: "breadcrumb",
    description:
      "A trail of links showing the user's current location within a site hierarchy.",
    category: "Navigation",
    isCompound: true,
    subComponents: [
      "BreadcrumbList",
      "BreadcrumbItem",
      "BreadcrumbLink",
      "BreadcrumbPage",
      "BreadcrumbSeparator",
      "BreadcrumbEllipsis",
    ],
    variants: [],
    keywords: [
      "breadcrumbs",
      "path",
      "trail",
      "hierarchy",
      "location",
      "crumbs",
    ],
  },
  {
    name: "Command",
    slug: "command",
    description:
      "A searchable command palette for quickly finding and executing actions.",
    category: "Navigation",
    isCompound: true,
    subComponents: [
      "CommandInput",
      "CommandList",
      "CommandEmpty",
      "CommandGroup",
      "CommandItem",
      "CommandSeparator",
      "CommandShortcut",
      "CommandDialog",
    ],
    variants: [],
    keywords: [
      "command palette",
      "search",
      "spotlight",
      "launcher",
      "quick actions",
      "cmdk",
      "omnibar",
    ],
  },
  {
    name: "ContextMenu",
    slug: "context-menu",
    description:
      "A right-click menu that provides contextual actions for the targeted element.",
    category: "Navigation",
    isCompound: true,
    subComponents: [
      "ContextMenuTrigger",
      "ContextMenuContent",
      "ContextMenuItem",
      "ContextMenuCheckboxItem",
      "ContextMenuRadioItem",
      "ContextMenuRadioGroup",
      "ContextMenuLabel",
      "ContextMenuSeparator",
      "ContextMenuShortcut",
      "ContextMenuSub",
      "ContextMenuSubTrigger",
      "ContextMenuSubContent",
    ],
    variants: [],
    keywords: [
      "right click",
      "context",
      "menu",
      "actions",
      "secondary click",
    ],
  },
  {
    name: "DropdownMenu",
    slug: "dropdown-menu",
    description:
      "A menu that opens from a trigger button, offering a list of actions or options.",
    category: "Navigation",
    isCompound: true,
    subComponents: [
      "DropdownMenuTrigger",
      "DropdownMenuContent",
      "DropdownMenuItem",
      "DropdownMenuCheckboxItem",
      "DropdownMenuRadioItem",
      "DropdownMenuRadioGroup",
      "DropdownMenuLabel",
      "DropdownMenuSeparator",
      "DropdownMenuShortcut",
      "DropdownMenuGroup",
      "DropdownMenuSub",
      "DropdownMenuSubTrigger",
      "DropdownMenuSubContent",
    ],
    variants: [],
    keywords: [
      "dropdown",
      "menu",
      "actions menu",
      "kebab menu",
      "more options",
      "overflow",
    ],
  },
  {
    name: "Menubar",
    slug: "menubar",
    description:
      "A horizontal menu bar with dropdown sub-menus, similar to desktop application menus.",
    category: "Navigation",
    isCompound: true,
    subComponents: [
      "MenubarMenu",
      "MenubarTrigger",
      "MenubarContent",
      "MenubarItem",
      "MenubarCheckboxItem",
      "MenubarRadioItem",
      "MenubarRadioGroup",
      "MenubarLabel",
      "MenubarSeparator",
      "MenubarShortcut",
      "MenubarSub",
      "MenubarSubTrigger",
      "MenubarSubContent",
    ],
    variants: [],
    keywords: [
      "menu bar",
      "app menu",
      "file menu",
      "toolbar",
      "top bar",
      "desktop menu",
    ],
  },
  {
    name: "NavigationMenu",
    slug: "navigation-menu",
    description:
      "A site-wide navigation component with support for dropdowns, mega menus, and link groups.",
    category: "Navigation",
    isCompound: true,
    subComponents: [
      "NavigationMenuList",
      "NavigationMenuItem",
      "NavigationMenuTrigger",
      "NavigationMenuContent",
      "NavigationMenuLink",
      "NavigationMenuIndicator",
      "NavigationMenuViewport",
    ],
    variants: [],
    keywords: [
      "nav",
      "navigation",
      "header nav",
      "mega menu",
      "site menu",
      "primary nav",
    ],
  },
  {
    name: "Pagination",
    slug: "pagination",
    description:
      "A set of controls for navigating between pages of content.",
    category: "Navigation",
    isCompound: true,
    subComponents: [
      "PaginationContent",
      "PaginationItem",
      "PaginationLink",
      "PaginationPrevious",
      "PaginationNext",
      "PaginationEllipsis",
    ],
    variants: [],
    keywords: [
      "pages",
      "paging",
      "page numbers",
      "next previous",
      "page navigation",
    ],
  },
  {
    name: "Sidebar",
    slug: "sidebar",
    description:
      "A collapsible side navigation panel for app-level routing and section organisation.",
    category: "Navigation",
    isCompound: true,
    subComponents: [
      "SidebarContent",
      "SidebarFooter",
      "SidebarGroup",
      "SidebarGroupContent",
      "SidebarGroupLabel",
      "SidebarHeader",
      "SidebarMenu",
      "SidebarMenuButton",
      "SidebarMenuItem",
      "SidebarProvider",
      "SidebarTrigger",
    ],
    variants: [],
    keywords: [
      "side nav",
      "sidebar",
      "navigation panel",
      "app nav",
      "left nav",
      "rail",
    ],
  },
  {
    name: "Tabs",
    slug: "tabs",
    description:
      "A set of layered content panels activated by tab triggers, showing one panel at a time.",
    category: "Navigation",
    isCompound: true,
    subComponents: ["TabsList", "TabsTrigger", "TabsContent"],
    variants: [],
    keywords: [
      "tab",
      "tab bar",
      "tab panel",
      "switch view",
      "sections",
      "segmented",
    ],
  },

  // ── Data Display ─────────────────────────────────────────────────────
  {
    name: "Avatar",
    slug: "avatar",
    description:
      "A circular image or fallback initials representing a user or entity.",
    category: "Data Display",
    isCompound: true,
    subComponents: ["AvatarImage", "AvatarFallback"],
    variants: [],
    keywords: [
      "profile picture",
      "user image",
      "photo",
      "initials",
      "headshot",
      "pfp",
    ],
  },
  {
    name: "Badge",
    slug: "badge",
    description:
      "A small inline label used to highlight a status, category, or count.",
    category: "Data Display",
    isCompound: false,
    subComponents: [],
    variants: ["default", "secondary", "destructive", "outline"],
    keywords: ["tag", "chip", "label", "status", "pill", "count", "indicator"],
  },
  {
    name: "Calendar",
    slug: "calendar",
    description:
      "A date picker grid that lets users view and select dates.",
    category: "Data Display",
    isCompound: false,
    subComponents: [],
    variants: [],
    keywords: [
      "date picker",
      "date",
      "datepicker",
      "schedule",
      "day",
      "month",
    ],
  },
  {
    name: "Carousel",
    slug: "carousel",
    description:
      "A horizontally scrollable set of content slides with previous and next controls.",
    category: "Data Display",
    isCompound: true,
    subComponents: [
      "CarouselContent",
      "CarouselItem",
      "CarouselPrevious",
      "CarouselNext",
    ],
    variants: [],
    keywords: [
      "slider",
      "slideshow",
      "gallery",
      "swipe",
      "image carousel",
      "rotator",
    ],
  },
  {
    name: "Chart",
    slug: "chart",
    description:
      "A themed wrapper around Recharts for rendering accessible, styled data visualisations.",
    category: "Data Display",
    isCompound: true,
    subComponents: ["ChartContainer", "ChartTooltip", "ChartTooltipContent", "ChartLegend", "ChartLegendContent"],
    variants: [],
    keywords: [
      "graph",
      "chart",
      "visualisation",
      "bar chart",
      "line chart",
      "pie chart",
      "analytics",
      "data viz",
    ],
  },
  {
    name: "DataTable",
    slug: "data-table",
    description:
      "A feature-rich table built on TanStack Table with sorting, filtering, and pagination.",
    category: "Data Display",
    isCompound: false,
    subComponents: [],
    variants: [],
    keywords: [
      "data grid",
      "sortable table",
      "filterable table",
      "spreadsheet",
      "tanstack",
      "rows",
    ],
  },
  {
    name: "Progress",
    slug: "progress",
    description:
      "A horizontal bar that indicates the completion progress of a task.",
    category: "Data Display",
    isCompound: false,
    subComponents: [],
    variants: [],
    keywords: [
      "progress bar",
      "loading",
      "percentage",
      "completion",
      "status bar",
      "meter",
    ],
  },
  {
    name: "Skeleton",
    slug: "skeleton",
    description:
      "A placeholder animation that mimics content layout while data is loading.",
    category: "Data Display",
    isCompound: false,
    subComponents: [],
    variants: [],
    keywords: [
      "loading",
      "placeholder",
      "shimmer",
      "ghost",
      "content loader",
      "skeleton screen",
    ],
  },
] as const satisfies readonly ComponentMeta[];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fuzzy-search the registry by matching `query` against a component's name,
 * description, keywords, and category. Matching is case-insensitive and
 * checks whether the query is a substring of any searchable field.
 */
export function searchComponents(query: string): ComponentMeta[] {
  if (!query.trim()) return [...registry];

  const normalised = query.toLowerCase().trim();

  return registry.filter((component) => {
    const haystack = [
      component.name,
      component.slug,
      component.description,
      component.category,
      ...component.keywords,
    ]
      .join(" ")
      .toLowerCase();

    // Check if every word in the query appears somewhere in the haystack
    // This gives a basic fuzzy feel: "date pick" matches Calendar's "date picker"
    const words = normalised.split(/\s+/);
    return words.every((word) => haystack.includes(word));
  });
}

/**
 * Groups all registry entries by their category, preserving the category
 * order defined in the `categories` array.
 */
export function getComponentsByCategory(): Map<string, ComponentMeta[]> {
  const grouped = new Map<string, ComponentMeta[]>();

  // Seed the map in the canonical category order
  for (const cat of categories) {
    grouped.set(cat.name, []);
  }

  for (const component of registry) {
    const bucket = grouped.get(component.category);
    if (bucket) {
      bucket.push(component);
    }
  }

  return grouped;
}
