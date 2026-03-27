"use client"

import * as React from "react"

/* ── Types ──────────────────────────────────────────────────────── */

export interface ElementInfo {
  tagName: string
  textContent: string
  currentClasses: string[]
  elementPath: string
  rect: DOMRect
}

interface ElementSelectorProps {
  children: React.ReactNode
  isActive: boolean
  onSelect: (element: ElementInfo) => void
  onHover: (element: ElementInfo | null) => void
}

/* ── Helpers ────────────────────────────────────────────────────── */

/**
 * Walk up from a target element to find the nearest meaningful element
 * (skip text nodes, skip the container wrapper itself).
 */
function findMeaningfulElement(
  target: EventTarget | null,
  container: HTMLElement,
): HTMLElement | null {
  if (!(target instanceof HTMLElement)) return null

  let el: HTMLElement | null = target

  // Walk up but stop before the container
  while (el && el !== container) {
    const tag = el.tagName.toLowerCase()
    // Skip purely structural wrappers that are part of our overlay
    if (el.dataset.selectorOverlay === "true") return null
    // Accept real elements
    if (tag !== "slot") return el
    el = el.parentElement
  }

  return null
}

/**
 * Build a CSS-like path string for an element relative to a container.
 */
function buildElementPath(el: HTMLElement, container: HTMLElement): string {
  const parts: string[] = []
  let current: HTMLElement | null = el

  while (current && current !== container) {
    const tag = current.tagName.toLowerCase()
    parts.unshift(tag)
    current = current.parentElement
  }

  return parts.join(" > ")
}

/**
 * Extract ElementInfo from an HTMLElement.
 */
function extractElementInfo(
  el: HTMLElement,
  container: HTMLElement,
): ElementInfo {
  const classes = el.className
    ? typeof el.className === "string"
      ? el.className.split(/\s+/).filter(Boolean)
      : []
    : []

  return {
    tagName: el.tagName.toLowerCase(),
    textContent: (el.textContent ?? "").trim().slice(0, 60),
    currentClasses: classes,
    elementPath: buildElementPath(el, container),
    rect: el.getBoundingClientRect(),
  }
}

/* ── Component ──────────────────────────────────────────────────── */

export function ElementSelector({
  children,
  isActive,
  onSelect,
  onHover,
}: ElementSelectorProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [hoveredRect, setHoveredRect] = React.useState<DOMRect | null>(null)
  const [selectedRect, setSelectedRect] = React.useState<DOMRect | null>(null)

  // Clear highlights when deactivated
  React.useEffect(() => {
    if (!isActive) {
      setHoveredRect(null)
      setSelectedRect(null)
    }
  }, [isActive])

  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      if (!isActive || !containerRef.current) return

      e.preventDefault()
      e.stopPropagation()

      const el = findMeaningfulElement(e.target, containerRef.current)
      if (!el) return

      const info = extractElementInfo(el, containerRef.current)
      setSelectedRect(info.rect)
      onSelect(info)
    },
    [isActive, onSelect],
  )

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (!isActive || !containerRef.current) return

      const el = findMeaningfulElement(e.target, containerRef.current)
      if (!el) {
        setHoveredRect(null)
        onHover(null)
        return
      }

      const info = extractElementInfo(el, containerRef.current)
      setHoveredRect(info.rect)
      onHover(info)
    },
    [isActive, onHover],
  )

  const handleMouseLeave = React.useCallback(() => {
    if (!isActive) return
    setHoveredRect(null)
    onHover(null)
  }, [isActive, onHover])

  const containerRect = containerRef.current?.getBoundingClientRect()

  return (
    <div
      ref={containerRef}
      className="relative"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isActive ? "crosshair" : undefined }}
    >
      {children}

      {/* ── Overlay layer for highlights ─────────────────── */}
      {isActive && containerRect && (
        <div
          data-selector-overlay="true"
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: 50 }}
        >
          {/* Hover highlight */}
          {hoveredRect && (
            <div
              className="absolute border-2 border-blue-400/60 bg-blue-400/10 transition-all duration-75"
              style={{
                top: hoveredRect.top - containerRect.top,
                left: hoveredRect.left - containerRect.left,
                width: hoveredRect.width,
                height: hoveredRect.height,
              }}
            />
          )}

          {/* Selection highlight */}
          {selectedRect && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-500/10"
              style={{
                top: selectedRect.top - containerRect.top,
                left: selectedRect.left - containerRect.left,
                width: selectedRect.width,
                height: selectedRect.height,
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}
