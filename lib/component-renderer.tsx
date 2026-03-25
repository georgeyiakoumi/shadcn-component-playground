"use client"

import * as React from "react"

// ── Inputs ──────────────────────────────────────────────────────────────────
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

// ── Layout ──────────────────────────────────────────────────────────────────
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ── Feedback ────────────────────────────────────────────────────────────────
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ── Data Display ────────────────────────────────────────────────────────────
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

// ── Navigation ──────────────────────────────────────────────────────────────
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// ── Icons ───────────────────────────────────────────────────────────────────
import {
  AlertCircle,
  Bold,
  ChevronDown,
  CreditCard,
  Info,
  Italic,
  LogOut,
  Mail,
  MoreHorizontal,
  Settings,
  Terminal,
  Trash2,
  Underline,
  User,
} from "lucide-react"

/* ── Types ──────────────────────────────────────────────────────── */

interface RenderableComponent {
  /** Render function that receives the current variant props */
  render: (props: Record<string, string>) => React.ReactNode
}

/* ── Preview container ──────────────────────────────────────────── */

function PreviewContainer({ children }: { children: React.ReactNode }) {
  return <div className="w-full p-6 space-y-4">{children}</div>
}

/* ── Renderable component map ──────────────────────────────────── */

const renderableComponents: Record<string, RenderableComponent> = {
  // ── Components with cva variants ──────────────────────────────

  button: {
    render: (props) => {
      const v = (props.variant ?? "default") as
        | "default"
        | "destructive"
        | "outline"
        | "secondary"
        | "ghost"
        | "link"
      const s = (props.size ?? "default") as "default" | "sm" | "lg" | "icon"

      return (
        <PreviewContainer>
          <div className="flex items-center justify-center">
            <Button variant={v} size={s}>
              {s === "icon" ? (
                <Mail className="h-4 w-4" />
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Button
                </>
              )}
            </Button>
          </div>
        </PreviewContainer>
      )
    },
  },

  badge: {
    render: (props) => {
      const v = (props.variant ?? "default") as
        | "default"
        | "secondary"
        | "destructive"
        | "outline"

      const labelMap: Record<string, string> = {
        default: "New feature",
        secondary: "In progress",
        destructive: "Breaking",
        outline: "v2.0.0",
      }

      return (
        <PreviewContainer>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={v}>{labelMap[v] ?? v}</Badge>
            <Badge variant={v}>Status</Badge>
            <Badge variant={v}>Label</Badge>
          </div>
        </PreviewContainer>
      )
    },
  },

  alert: {
    render: (props) => {
      const v = (props.variant ?? "default") as "default" | "destructive"
      const isDestructive = v === "destructive"

      return (
        <PreviewContainer>
          <Alert variant={v}>
            {isDestructive ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Terminal className="h-4 w-4" />
            )}
            <AlertTitle>{isDestructive ? "Error" : "Heads up!"}</AlertTitle>
            <AlertDescription>
              {isDestructive
                ? "Your session has expired. Please log in again to continue."
                : "You can add components to your project using the CLI."}
            </AlertDescription>
          </Alert>
        </PreviewContainer>
      )
    },
  },

  toggle: {
    render: (props) => {
      const v = (props.variant ?? "default") as "default" | "outline"
      const s = (props.size ?? "default") as "default" | "sm" | "lg"

      return (
        <PreviewContainer>
          <div className="flex items-center gap-2">
            <Toggle variant={v} size={s} aria-label="Toggle bold">
              <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle variant={v} size={s} aria-label="Toggle italic">
              <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle variant={v} size={s} aria-label="Toggle info">
              <Info className="h-4 w-4" />
              Info
            </Toggle>
            <Toggle variant={v} size={s} disabled aria-label="Disabled toggle">
              <Settings className="h-4 w-4" />
            </Toggle>
          </div>
        </PreviewContainer>
      )
    },
  },

  "toggle-group": {
    render: (props) => {
      const v = (props.variant ?? "default") as "default" | "outline"
      const s = (props.size ?? "default") as "default" | "sm" | "lg"

      return (
        <PreviewContainer>
          <ToggleGroup type="multiple" variant={v} size={s}>
            <ToggleGroupItem value="bold" aria-label="Toggle bold">
              <Bold className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Toggle italic">
              <Italic className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Toggle underline">
              <Underline className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </PreviewContainer>
      )
    },
  },

  // ── Simple components (no cva variants) ───────────────────────

  input: {
    render: () => (
      <PreviewContainer>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disabled">Disabled input</Label>
            <Input id="disabled" placeholder="You cannot edit this" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Upload a file</Label>
            <Input id="file" type="file" />
          </div>
        </div>
      </PreviewContainer>
    ),
  },

  textarea: {
    render: () => (
      <PreviewContainer>
        <div className="space-y-2">
          <Label htmlFor="message">Your message</Label>
          <Textarea
            id="message"
            placeholder="Type your message here. We'll get back to you within 24 hours."
          />
          <p className="text-sm text-muted-foreground">
            Your message will be sent to our support team.
          </p>
        </div>
      </PreviewContainer>
    ),
  },

  checkbox: {
    render: () => (
      <PreviewContainer>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" defaultChecked />
            <Label htmlFor="terms">Accept terms and conditions</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="notifications" />
            <Label htmlFor="notifications">Send me email notifications</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="disabled" disabled />
            <Label htmlFor="disabled">This option is disabled</Label>
          </div>
        </div>
      </PreviewContainer>
    ),
  },

  switch: {
    render: () => (
      <PreviewContainer>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="airplane-mode">Airplane mode</Label>
            <Switch id="airplane-mode" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode">Dark mode</Label>
            <Switch id="dark-mode" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="disabled-switch">Disabled</Label>
            <Switch id="disabled-switch" disabled />
          </div>
        </div>
      </PreviewContainer>
    ),
  },

  slider: {
    render: () => (
      <PreviewContainer>
        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Volume</Label>
            <Slider defaultValue={[50]} max={100} step={1} />
          </div>
          <div className="space-y-3">
            <Label>Price range</Label>
            <Slider defaultValue={[25, 75]} max={100} step={5} />
          </div>
        </div>
      </PreviewContainer>
    ),
  },

  separator: {
    render: () => (
      <PreviewContainer>
        <div>
          <div className="space-y-1">
            <h4 className="text-sm font-medium leading-none">
              Radix Primitives
            </h4>
            <p className="text-sm text-muted-foreground">
              An open-source UI component library.
            </p>
          </div>
          <Separator className="my-4" />
          <div className="flex h-5 items-center space-x-4 text-sm">
            <div>Blog</div>
            <Separator orientation="vertical" />
            <div>Docs</div>
            <Separator orientation="vertical" />
            <div>Source</div>
          </div>
        </div>
      </PreviewContainer>
    ),
  },

  avatar: {
    render: () => (
      <PreviewContainer>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>GD</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
        <p className="text-sm text-muted-foreground pt-1">
          Avatars display an image with a fallback when the image fails to load.
        </p>
      </PreviewContainer>
    ),
  },

  progress: {
    render: () => (
      <PreviewContainer>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>25% complete</Label>
            <Progress value={25} />
          </div>
          <div className="space-y-2">
            <Label>60% complete</Label>
            <Progress value={60} />
          </div>
          <div className="space-y-2">
            <Label>100% complete</Label>
            <Progress value={100} />
          </div>
        </div>
      </PreviewContainer>
    ),
  },

  skeleton: {
    render: () => (
      <PreviewContainer>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </PreviewContainer>
    ),
  },

  label: {
    render: () => (
      <PreviewContainer>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label-demo">Email address</Label>
            <Input id="label-demo" type="email" placeholder="you@example.com" />
          </div>
        </div>
      </PreviewContainer>
    ),
  },

  // ── Compound components (pre-built examples) ──────────────────

  select: {
    render: () => (
      <PreviewContainer>
        <div className="space-y-2">
          <Label>Favourite framework</Label>
          <Select>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a framework" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="next">Next.js</SelectItem>
              <SelectItem value="remix">Remix</SelectItem>
              <SelectItem value="astro">Astro</SelectItem>
              <SelectItem value="nuxt">Nuxt</SelectItem>
              <SelectItem value="svelte">SvelteKit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PreviewContainer>
    ),
  },

  card: {
    render: () => (
      <PreviewContainer>
        <Card>
          <CardHeader>
            <CardTitle>Create a new project</CardTitle>
            <CardDescription>
              Set up your project details to get started with your team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project name</Label>
                <Input id="project-name" placeholder="My awesome project" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-desc">Description</Label>
                <Textarea
                  id="project-desc"
                  placeholder="Briefly describe what this project is about"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Create project</Button>
          </CardFooter>
        </Card>
      </PreviewContainer>
    ),
  },

  accordion: {
    render: () => (
      <PreviewContainer>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Is it accessible?</AccordionTrigger>
            <AccordionContent>
              Yes. It adheres to the WAI-ARIA design pattern for accordions,
              including keyboard navigation and focus management.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Is it styled?</AccordionTrigger>
            <AccordionContent>
              Yes. It ships with default styles that match your theme and can be
              customised using Tailwind utility classes.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Can I animate it?</AccordionTrigger>
            <AccordionContent>
              Yes. The open and close transitions are built in using CSS
              animations, so content expands and collapses smoothly.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </PreviewContainer>
    ),
  },

  tabs: {
    render: () => (
      <PreviewContainer>
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="tabs-name">Name</Label>
              <Input id="tabs-name" defaultValue="George" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tabs-email">Email</Label>
              <Input id="tabs-email" defaultValue="george@example.com" />
            </div>
          </TabsContent>
          <TabsContent value="password" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="current-pw">Current password</Label>
              <Input id="current-pw" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pw">New password</Label>
              <Input id="new-pw" type="password" />
            </div>
          </TabsContent>
          <TabsContent value="settings" className="pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="marketing-switch">Marketing emails</Label>
              <Switch id="marketing-switch" />
            </div>
          </TabsContent>
        </Tabs>
      </PreviewContainer>
    ),
  },

  table: {
    render: () => (
      <PreviewContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">INV-001</TableCell>
              <TableCell>
                <Badge variant="secondary">Paid</Badge>
              </TableCell>
              <TableCell>Credit Card</TableCell>
              <TableCell className="text-right">$250.00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">INV-002</TableCell>
              <TableCell>
                <Badge variant="outline">Pending</Badge>
              </TableCell>
              <TableCell>PayPal</TableCell>
              <TableCell className="text-right">$150.00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">INV-003</TableCell>
              <TableCell>
                <Badge variant="destructive">Overdue</Badge>
              </TableCell>
              <TableCell>Bank Transfer</TableCell>
              <TableCell className="text-right">$350.00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </PreviewContainer>
    ),
  },

  dialog: {
    render: () => (
      <PreviewContainer>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Edit profile</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you are done.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="dialog-name">Display name</Label>
                <Input id="dialog-name" defaultValue="George" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog-username">Username</Label>
                <Input id="dialog-username" defaultValue="@george" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PreviewContainer>
    ),
  },

  "alert-dialog": {
    render: () => (
      <PreviewContainer>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Yes, delete account</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PreviewContainer>
    ),
  },

  tooltip: {
    render: () => (
      <PreviewContainer>
        <TooltipProvider>
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>This is a helpful tooltip</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>More information</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </PreviewContainer>
    ),
  },

  "dropdown-menu": {
    render: () => (
      <PreviewContainer>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreHorizontal className="mr-2 h-4 w-4" />
              Options
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CreditCard className="mr-2 h-4 w-4" />
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PreviewContainer>
    ),
  },
}

/* ── Public API ─────────────────────────────────────────────────── */

/**
 * Renders a component by slug with the given variant props.
 * Returns a fallback message if the component is not in the renderable map.
 */
export function renderComponent(
  slug: string,
  props: Record<string, string>,
): React.ReactNode {
  const entry = renderableComponents[slug]

  if (entry) {
    return entry.render(props)
  }

  // Fallback for components without a dedicated renderer
  const name = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("")

  return (
    <PreviewContainer>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">{name}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Preview not yet available
        </p>
      </div>
    </PreviewContainer>
  )
}
