"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"

import { PlaygroundSidebar } from "@/components/playground/sidebar"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  Sidebar,
} from "@/components/ui/sidebar"
import type { ComponentMeta } from "@/lib/registry"

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
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
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
      className="h-screen !min-h-0"
    >
      <Sidebar collapsible="offcanvas">
        <PlaygroundSidebar
          onSelectComponent={handleSelectComponent}
          onSelectCustomComponent={handleSelectCustomComponent}
          selectedSlug={
            pathname.startsWith("/playground/custom/")
              ? `custom/${pathname.split("/").pop()}`
              : pathname.replace("/playground/", "")
          }
        />
      </Sidebar>

      <SidebarInset className="overflow-hidden">
        {!sidebarOpen && (
          <div className="flex shrink-0 items-center border-b px-2 py-1.5">
            <SidebarTrigger />
          </div>
        )}
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
