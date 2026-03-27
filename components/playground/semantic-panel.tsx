"use client"

import * as React from "react"
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  FileCode,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  checkSemanticHtml,
  type SemanticIssue,
  type SemanticSeverity,
} from "@/lib/semantic-checker"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

/* ── Severity config ───────────────────────────────────────────────── */

const severityConfig: Record<
  SemanticSeverity,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  error: {
    icon: AlertTriangle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    label: "Errors",
  },
  warning: {
    icon: AlertCircle,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    label: "Warnings",
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    label: "Info",
  },
}

/* ── Issue Card ────────────────────────────────────────────────────── */

function IssueCard({ issue }: { issue: SemanticIssue }) {
  const config = severityConfig[issue.severity]
  const Icon = config.icon

  return (
    <div className="space-y-2 p-4">
      <div className="flex items-start gap-2">
        <Icon className={cn("mt-0.5 size-4 shrink-0", config.color)} />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium">{issue.title}</p>
          <p className="text-xs text-muted-foreground">{issue.description}</p>
          {issue.element && (
            <code className="block rounded bg-muted px-2 py-1 text-xs">
              {issue.element}
            </code>
          )}
          <div className={cn("rounded px-2 py-1.5 text-xs", config.bg)}>
            {issue.suggestion}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Panel ─────────────────────────────────────────────────────────── */

interface SemanticPanelProps {
  source: string
}

export function SemanticPanel({ source }: SemanticPanelProps) {
  const issues = React.useMemo(() => checkSemanticHtml(source), [source])

  const errors = issues.filter((i) => i.severity === "error")
  const warnings = issues.filter((i) => i.severity === "warning")
  const infos = issues.filter((i) => i.severity === "info")

  const hasProblems = errors.length > 0 || warnings.length > 0

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        {/* ── Summary bar ────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <FileCode className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Semantic HTML</span>
          <div className="ml-auto flex items-center gap-2">
            {errors.length > 0 && (
              <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                {errors.length} {errors.length === 1 ? "error" : "errors"}
              </Badge>
            )}
            {warnings.length > 0 && (
              <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                {warnings.length} {warnings.length === 1 ? "warning" : "warnings"}
              </Badge>
            )}
            {infos.length > 0 && (
              <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                {infos.length} info
              </Badge>
            )}
          </div>
        </div>

        <Separator className="my-3" />

        {/* ── Success state ──────────────────────────────────── */}
        {!hasProblems && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2 className="size-8 text-green-500" />
            <p className="text-sm font-medium">Semantic HTML looks good</p>
            <p className="text-xs text-muted-foreground">
              No semantic issues detected.
            </p>
          </div>
        )}

        {/* ── Issues ─────────────────────────────────────────── */}
        {errors.length > 0 && (
          <div>
            {errors.map((issue, i) => (
              <React.Fragment key={issue.id + i}>
                <IssueCard issue={issue} />
                {i < errors.length - 1 && <Separator />}
              </React.Fragment>
            ))}
            {(warnings.length > 0 || infos.length > 0) && (
              <Separator className="my-2" />
            )}
          </div>
        )}

        {warnings.length > 0 && (
          <div>
            {warnings.map((issue, i) => (
              <React.Fragment key={issue.id + i}>
                <IssueCard issue={issue} />
                {i < warnings.length - 1 && <Separator />}
              </React.Fragment>
            ))}
            {infos.length > 0 && <Separator className="my-2" />}
          </div>
        )}

        {infos.length > 0 && (
          <div>
            {infos.map((issue, i) => (
              <React.Fragment key={issue.id + i}>
                <IssueCard issue={issue} />
                {i < infos.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
