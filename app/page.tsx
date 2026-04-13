"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/* ── Feature data ──────────────────────────────────────────────── */

const features = [
  {
    id: "browse",
    label: "Browse",
    heading: "See how every shadcn component actually works.",
    image: "/screenshots/browse.jpg",
  },
  {
    id: "build",
    label: "Build",
    heading: "Pick a base element, add props and variants.",
    image: "/screenshots/build.jpg",
  },
] as const

/* ── Shared components ─────────────────────────────────────────── */

function Hero() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-medium tracking-tight sm:text-4xl lg:text-4xl">
        Component lab
      </h1>
      <p className="max-w-md text-base text-muted-foreground sm:text-lg lg:text-xl">
        The visual workspace for shadcn/ui. Explore components, build
        new ones, and export production-ready code.
      </p>
      <Button asChild size="lg" className="hidden lg:inline-flex">
        <Link href="/playground">
          Launch Component Lab
          <ArrowRight className="ml-2 size-4" />
        </Link>
      </Button>
      <Button size="lg" disabled className="lg:hidden">
        Desktop only
      </Button>
    </div>
  )
}

function Screenshot({
  features: feats,
  featureIndex,
}: {
  features: typeof features
  featureIndex: number
}) {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-sm border border-border shadow-2xl">
      {feats.map((feature, i) => (
        <Image
          key={feature.id}
          src={feature.image}
          alt={`${feature.label} screenshot`}
          fill
          className={cn(
            "object-cover object-left-top transition-opacity duration-500",
            i === featureIndex ? "opacity-100" : "opacity-0",
          )}
          priority={i === 0}
        />
      ))}
    </div>
  )
}

function FeatureTabs({
  features: feats,
  featureIndex,
  onSelect,
  heading,
  className,
}: {
  features: typeof features
  featureIndex: number
  onSelect: (i: number) => void
  heading: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-4">
        {feats.map((feature, i) => (
          <button
            key={feature.id}
            type="button"
            onClick={() => onSelect(i)}
            className={cn(
              "cursor-pointer font-medium transition-colors",
              i === featureIndex
                ? "text-foreground"
                : "text-muted-foreground/40 hover:text-muted-foreground",
            )}
          >
            {feature.label}
          </button>
        ))}
      </div>
      <h2 className="mt-2 text-muted-foreground">
        {heading}
      </h2>
    </div>
  )
}

function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("text-xs text-muted-foreground", className)}>
      Built with{" "}
      <a href="https://ui.shadcn.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">shadcn/ui</a>
      {" · "}
      <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">Next.js</a>
      {" · "}
      <a href="https://tailwindcss.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">Tailwind CSS</a>
      {" · "}
      <a href="https://www.radix-ui.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">Radix</a>
      {" · "}
      <a href="https://lucide.dev" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">Lucide</a>
      {" · "}
      <a href="https://shiki.style" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">Shiki</a>
    </footer>
  )
}

/* ── Page ──────────────────────────────────────────────────────── */

export default function Home() {
  const [featureIndex, setFeatureIndex] = React.useState(0)
  const current = features[featureIndex]

  return (
    <>
      {/* ── Mobile / Tablet layout ────────────────────────────── */}
      <main className="flex min-h-screen flex-col p-8 sm:p-10 lg:hidden">
        <Hero />

        <div className="mt-8 flex-1">
          <Screenshot features={features} featureIndex={featureIndex} />
        </div>

        <FeatureTabs
          features={features}
          featureIndex={featureIndex}
          onSelect={setFeatureIndex}
          heading={current.heading}
          className="mt-4"
        />

        <Footer className="mt-8" />
      </main>

      {/* ── Desktop layout ────────────────────────────────────── */}
      <main className="hidden h-screen w-screen overflow-hidden lg:flex">
        {/* Left column */}
        <div className="flex w-[45%] flex-col justify-center bg-muted p-14">
          <Hero />
          <Footer className="mt-auto pt-8" />
        </div>

        {/* Right column */}
        <div className="flex w-[55%] flex-col p-14">
          <div className="flex flex-1 items-center justify-center">
            <Screenshot features={features} featureIndex={featureIndex} />
          </div>
          <FeatureTabs
            features={features}
            featureIndex={featureIndex}
            onSelect={setFeatureIndex}
            heading={current.heading}
            className="mt-4 items-end text-right"
          />
        </div>
      </main>
    </>
  )
}
