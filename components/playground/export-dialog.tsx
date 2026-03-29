"use client"

import * as React from "react"
import {
  Download,
  FileCode,
  FolderDown,
  Package,
  Check,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useComponentEdit } from "@/lib/component-state"
import { generateComponentCode } from "@/lib/code-generator"
import {
  detectDependencies,
  estimateFileSize,
  exportAsTsx,
  exportAsZip,
} from "@/lib/export-utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/* ── Types ──────────────────────────────────────────────────────── */

type ExportMode = "tsx" | "zip"

interface ExportDialogProps {
  slug: string
  source: string
  componentName: string
}

/* ── Component ──────────────────────────────────────────────────── */

export function ExportDialog({
  slug,
  source,
  componentName,
}: ExportDialogProps) {
  const { edit } = useComponentEdit()
  const [mode, setMode] = React.useState<ExportMode>("tsx")
  const [isExporting, setIsExporting] = React.useState(false)
  const [exported, setExported] = React.useState(false)

  // Generate the code from current state
  const generatedCode = React.useMemo(
    () =>
      generateComponentCode({
        slug,
        originalSource: source,
        customClasses: edit.customClasses,
        customVariantDefs: edit.customVariantDefs,
        activeSubComponents: edit.activeSubComponents,
        componentName,
      }),
    [slug, source, edit, componentName],
  )

  const fileSize = React.useMemo(
    () => estimateFileSize(generatedCode),
    [generatedCode],
  )

  const dependencies = React.useMemo(
    () => detectDependencies(source),
    [source],
  )

  // Reset exported state when mode changes
  React.useEffect(() => {
    setExported(false)
  }, [mode])

  const handleExport = React.useCallback(async () => {
    setIsExporting(true)
    setExported(false)

    try {
      if (mode === "tsx") {
        exportAsTsx(`${slug}.tsx`, generatedCode)
      } else {
        await exportAsZip(slug, generatedCode, dependencies)
      }
      setExported(true)
    } finally {
      setIsExporting(false)
    }
  }, [mode, slug, generatedCode, dependencies])

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setExported(false)
          setMode("tsx")
        }
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs hover:border-blue-500/50 hover:text-blue-500"
            >
              <Download className="size-3.5" />
              Export
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Export component
        </TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="size-4 text-blue-500" />
            Export {componentName}
          </DialogTitle>
          <DialogDescription>
            Download the component for use in your project.
            {!edit.isDirty && (
              <span className="mt-1 block text-xs text-muted-foreground/70">
                Exporting original component (no modifications)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 pt-2">
          {/* ── Mode selection cards ─────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <ExportModeCard
              icon={FileCode}
              label="Single .tsx"
              description="Component file with import references"
              active={mode === "tsx"}
              onClick={() => setMode("tsx")}
            />
            <ExportModeCard
              icon={FolderDown}
              label="Full bundle (.zip)"
              description="Component + all dependencies"
              active={mode === "zip"}
              onClick={() => setMode("zip")}
            />
          </div>

          {/* ── Dependency list for zip mode ──────────────────── */}
          {mode === "zip" && dependencies.length > 0 && (
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Included dependencies
              </p>
              <div className="flex flex-wrap gap-1.5">
                {dependencies.map((dep) => (
                  <Badge
                    key={dep}
                    variant="secondary"
                    className="text-xs font-mono"
                  >
                    {dep}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-xs font-mono">
                  lib/utils.ts
                </Badge>
              </div>
            </div>
          )}

          {mode === "zip" && dependencies.length === 0 && (
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                No additional shadcn/ui dependencies detected. Bundle will
                include the component and{" "}
                <code className="font-mono text-xs">lib/utils.ts</code>.
              </p>
            </div>
          )}

          <Separator />

          {/* ── File info + download ──────────────────────────── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileCode className="size-3.5" />
              <span className="font-mono">{slug}.tsx</span>
              <span className="text-muted-foreground/50">&middot;</span>
              <span>{fileSize}</span>
            </div>

            <Button
              size="sm"
              className={cn(
                "gap-1.5",
                exported &&
                  "bg-green-600 text-white hover:bg-green-600",
              )}
              disabled={isExporting}
              onClick={handleExport}
            >
              {exported ? (
                <>
                  <Check className="size-3.5" />
                  Downloaded
                </>
              ) : (
                <>
                  <Download className="size-3.5" />
                  {isExporting ? "Exporting..." : "Download"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── ExportModeCard ────────────────────────────────────────────── */

interface ExportModeCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  active: boolean
  onClick: () => void
}

function ExportModeCard({
  icon: Icon,
  label,
  description,
  active,
  onClick,
}: ExportModeCardProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-colors",
        "hover:border-blue-500/50 hover:bg-blue-500/5",
        active
          ? "border-blue-500 bg-blue-500/10"
          : "border-border bg-background",
      )}
      onClick={onClick}
    >
      <Icon
        className={cn(
          "size-5",
          active ? "text-blue-500" : "text-muted-foreground",
        )}
      />
      <div>
        <p
          className={cn(
            "text-sm font-medium",
            active ? "text-blue-500" : "text-foreground",
          )}
        >
          {label}
        </p>
        <p className="text-xs leading-tight text-muted-foreground">
          {description}
        </p>
      </div>
    </button>
  )
}
