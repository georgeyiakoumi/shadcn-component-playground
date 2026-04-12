"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { PanelLeft } from "lucide-react"

import { PlaygroundSidebar } from "@/components/playground/sidebar"
import { DragHandle } from "@/components/playground/drag-handle"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ComponentMeta } from "@/lib/registry"

const MIN_WIDTH = 200
const MAX_WIDTH = 480
const DEFAULT_WIDTH = 280

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarWidth, setSidebarWidth] = React.useState(DEFAULT_WIDTH)
  // Sidebar starts collapsed unless on the index page
  const [sidebarOpen, setSidebarOpen] = React.useState(pathname === "/playground")

  // Collapse sidebar when navigating to a component page
  React.useEffect(() => {
    if (pathname !== "/playground") {
      setSidebarOpen(false)
    }
  }, [pathname])

  function handleSelectComponent(component: ComponentMeta) {
    router.push(`/playground/${component.slug}` as `/playground/${string}`)
  }

  function handleSelectCustomComponent(slug: string) {
    router.push(`/playground/custom/${slug}`)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* ── Sidebar toggle (visible when collapsed) ────────── */}
      {!sidebarOpen && (
        <TooltipProvider delayDuration={300}>
          <div className="flex shrink-0 flex-col border-r bg-background">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="m-1 size-8"
                  onClick={() => setSidebarOpen(true)}
                >
                  <PanelLeft className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                Show components
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      )}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      {sidebarOpen && (
        <>
          <div
            className="shrink-0"
            style={{ width: sidebarWidth }}
          >
            <PlaygroundSidebar
              onSelectComponent={handleSelectComponent}
              onSelectCustomComponent={handleSelectCustomComponent}
              onCollapse={() => setSidebarOpen(false)}
            />
          </div>

          {/* ── Resize handle ──────────────────────────────────── */}
          <DragHandle
            width={sidebarWidth}
            minWidth={MIN_WIDTH}
            maxWidth={MAX_WIDTH}
            onWidthChange={setSidebarWidth}
            side="left"
          />
        </>
      )}

      {/* ── Main content area ────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
