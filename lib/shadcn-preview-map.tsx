"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

/**
 * Map of PascalCase shadcn component names to render functions.
 * Used by the canvas preview to render actual shadcn components
 * added via the assembly picker (preview-only, not exported to .tsx).
 */
export const shadcnPreviewMap: Record<string, () => React.ReactNode> = {
  Button: () => <Button>Button</Button>,
  Badge: () => <Badge>Badge</Badge>,
  Input: () => <Input placeholder="Input..." className="max-w-xs" />,
  Label: () => <Label>Label</Label>,
  Separator: () => <Separator />,
  Checkbox: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="preview" />
      <Label htmlFor="preview">Checkbox</Label>
    </div>
  ),
  Switch: () => (
    <div className="flex items-center gap-2">
      <Switch id="preview-switch" />
      <Label htmlFor="preview-switch">Switch</Label>
    </div>
  ),
  Slider: () => <Slider defaultValue={[50]} max={100} className="max-w-xs" />,
  Progress: () => <Progress value={60} className="max-w-xs" />,
  Skeleton: () => <Skeleton className="h-8 w-32 rounded-md" />,
  Avatar: () => (
    <Avatar>
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
}
