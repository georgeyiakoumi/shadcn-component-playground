"use client"

import * as React from "react"
import { Download, FileCode, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { estimateFileSize, exportAsTsx } from "@/lib/export-utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/* ── Types ──────────────────────────────────────────────────────── */

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
  const [isExporting, setIsExporting] = React.useState(false)
  const [exported, setExported] = React.useState(false)

  const generatedCode = source

  const fileSize = React.useMemo(
    () => estimateFileSize(generatedCode),
    [generatedCode],
  )

  const handleExport = React.useCallback(async () => {
    setIsExporting(true)
    setExported(false)

    try {
      exportAsTsx(`${slug}.tsx`, generatedCode)
      setExported(true)
    } finally {
      setIsExporting(false)
    }
  }, [slug, generatedCode])

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) setExported(false)
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 gap-1.5 text-xs">
              <Download className="size-3.5" />
              Export
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Export component
        </TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Export {componentName}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileCode className="size-4" />
          <span className="font-mono">{slug}.tsx</span>
          <span className="text-muted-foreground/50">&middot;</span>
          <span>{fileSize}</span>
        </div>

        <DialogFooter>
          <Button
            className={cn(
              "w-full gap-1.5",
              exported && "bg-green-600 text-white hover:bg-green-600",
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
                {isExporting ? "Exporting..." : "Download .tsx"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
