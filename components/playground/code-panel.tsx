"use client"

import * as React from "react"
import { Check, Clipboard } from "lucide-react"

import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"

/* ── Types ──────────────────────────────────────────────────────── */

interface CodePanelProps {
  code: string
  language?: string
  /** Line number to scroll to and highlight (1-based) */
  highlightLine?: number | null
  className?: string
}

/* ── Component ──────────────────────────────────────────────────── */

export function CodePanel({ code, language = "tsx", highlightLine, className }: CodePanelProps) {
  const [highlightedHtml, setHighlightedHtml] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [copied, setCopied] = React.useState(false)
  const codeBodyRef = React.useRef<HTMLDivElement>(null)

  // Scroll to and highlight the target line
  React.useEffect(() => {
    if (!highlightLine || !codeBodyRef.current) return

    const lines = codeBodyRef.current.querySelectorAll(".line")
    const targetLine = lines[highlightLine - 1] as HTMLElement | undefined
    if (!targetLine) return

    // Scroll into view
    targetLine.scrollIntoView({ behavior: "smooth", block: "center" })

    // Flash highlight
    targetLine.style.backgroundColor = "rgba(59, 130, 246, 0.2)"
    targetLine.style.transition = "background-color 0.3s"
    const timer = setTimeout(() => {
      targetLine.style.backgroundColor = ""
    }, 2000)

    return () => clearTimeout(timer)
  }, [highlightLine])

  React.useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    async function highlight() {
      const { codeToHtml } = await import("shiki/bundle/web")
      const html = await codeToHtml(code, {
        lang: language,
        theme: "github-dark",
      })

      if (!cancelled) {
        setHighlightedHtml(html)
        setIsLoading(false)
      }
    }

    highlight()
    return () => {
      cancelled = true
    }
  }, [code, language])

  const handleCopy = React.useCallback(async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b px-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Code
        </span>
        <TooltipProvider delayDuration={300}>
          <Tooltip open={copied ? true : undefined}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="size-3.5 text-green-500" />
                ) : (
                  <Clipboard className="size-3.5" />
                )}
                <span className="sr-only">Copy code</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              {copied ? "Copied!" : "Copy to clipboard"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* ── Code body ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-[#0d1117]">
        {isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-3/4 bg-white/5" />
            <Skeleton className="h-4 w-1/2 bg-white/5" />
            <Skeleton className="h-4 w-5/6 bg-white/5" />
            <Skeleton className="h-4 w-2/3 bg-white/5" />
            <Skeleton className="h-4 w-3/5 bg-white/5" />
            <Skeleton className="h-4 w-4/5 bg-white/5" />
            <Skeleton className="h-4 w-1/3 bg-white/5" />
          </div>
        ) : (
          <div
            ref={codeBodyRef}
            className="code-panel-shiki min-w-max text-sm font-mono p-4 [&_pre]:!bg-transparent [&_code]:!bg-transparent [&_code]:[counter-reset:line] [&_.line]:table-row [&_.line]:[counter-increment:line] [&_.line::before]:table-cell [&_.line::before]:pr-4 [&_.line::before]:text-right [&_.line::before]:text-white/20 [&_.line::before]:select-none [&_.line::before]:[content:counter(line)] [&_.line::before]:min-w-[2rem]"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        )}
      </div>
    </div>
  )
}
