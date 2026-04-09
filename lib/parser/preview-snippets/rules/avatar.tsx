/**
 * Avatar composition rule.
 *
 * Source: https://ui.shadcn.com/docs/components/avatar
 * Fetched: 2026-04-09
 *
 * Docs canonical example:
 *
 *     <Avatar>
 *       <AvatarImage src="https://github.com/shadcn.png" />
 *       <AvatarFallback>CN</AvatarFallback>
 *     </Avatar>
 *
 * Avatar exports 6 sub-components total: Avatar, AvatarImage,
 * AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount. To
 * make all 6 selectable in the AssemblyPanel, this rule renders an
 * AvatarGroup containing 3 Avatars + an AvatarGroupCount, with one
 * of the Avatars carrying an AvatarBadge.
 *
 * ## Implementation notes
 *
 * The flat-renderer failure mode for Avatar was a "<dge>" text leak —
 * the parser captured the source's `data-slot="avatar-badge"` text
 * fragment and the renderer's empty-children fallback was injecting
 * sub-component names into adjacent boxes. The composition rule
 * fixes this by emitting the proper hierarchy.
 *
 * AvatarImage is intentionally NOT rendered with a real `src` —
 * the network request would 404 in environments without internet,
 * and Radix's Avatar primitive auto-falls-back to AvatarFallback
 * when the image fails to load. To show the fallback reliably we
 * just render the fallback directly without an Image. The composition
 * tree still lists AvatarImage so users can select + style it.
 *
 * AvatarBadge uses `group-data-[size=*]/avatar:` selectors that key
 * off the parent Avatar's `data-size` attribute. We set
 * `data-size="default"` on the parent so the size-2.5 selector matches
 * and the badge has visible dimensions.
 */

"use client"

import * as React from "react"
import { Check } from "lucide-react"

import {
  classesFor,
  pathFor,
  withSelectionRing,
  type CompositionRule,
  type SnippetContext,
} from "../index"

function AvatarRender(ctx: SnippetContext): React.ReactNode {
  const avatarCls = classesFor(ctx, "Avatar")
  const imageCls = classesFor(ctx, "AvatarImage")
  const fallbackCls = classesFor(ctx, "AvatarFallback")
  const badgeCls = classesFor(ctx, "AvatarBadge")
  const groupCls = classesFor(ctx, "AvatarGroup")
  const groupCountCls = classesFor(ctx, "AvatarGroupCount")

  const avatarPath = pathFor(ctx, "Avatar")
  const imagePath = pathFor(ctx, "AvatarImage")
  const fallbackPath = pathFor(ctx, "AvatarFallback")
  const badgePath = pathFor(ctx, "AvatarBadge")
  const groupPath = pathFor(ctx, "AvatarGroup")
  const groupCountPath = pathFor(ctx, "AvatarGroupCount")

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div
        data-node-id={groupPath}
        className={withSelectionRing(
          groupCls,
          ctx.selectedPath === groupPath,
        )}
      >
        {/*
          First Avatar — the canonical docs example. Carries the
          AvatarBadge so all 6 sub-components are selectable from
          this single avatar's hierarchy.
        */}
        <span
          data-slot="avatar"
          data-size="default"
          data-node-id={avatarPath}
          className={withSelectionRing(
            avatarCls,
            ctx.selectedPath === avatarPath,
          )}
        >
          {/*
            AvatarImage placeholder div — the source uses Radix's
            AvatarPrimitive.Image which would auto-hide on load
            failure. We render a styled div instead so the user
            can still select + style "AvatarImage" via the
            AssemblyPanel without making a network request.
          */}
          <div
            data-slot="avatar-image"
            data-node-id={imagePath}
            className={withSelectionRing(
              imageCls,
              ctx.selectedPath === imagePath,
            )}
            style={{ display: "none" }}
          />
          <span
            data-slot="avatar-fallback"
            data-node-id={fallbackPath}
            className={withSelectionRing(
              fallbackCls,
              ctx.selectedPath === fallbackPath,
            )}
          >
            CN
          </span>
          <span
            data-slot="avatar-badge"
            data-node-id={badgePath}
            className={withSelectionRing(
              badgeCls,
              ctx.selectedPath === badgePath,
            )}
          >
            <Check />
          </span>
        </span>

        {/* Second Avatar — fallback only, no badge */}
        <span data-slot="avatar" data-size="default" className={avatarCls}>
          <span data-slot="avatar-fallback" className={fallbackCls}>
            EW
          </span>
        </span>

        {/* Third Avatar — fallback only */}
        <span data-slot="avatar" data-size="default" className={avatarCls}>
          <span data-slot="avatar-fallback" className={fallbackCls}>
            JP
          </span>
        </span>

        {/* AvatarGroupCount showing "+3" more */}
        <div
          data-slot="avatar-group-count"
          data-node-id={groupCountPath}
          className={withSelectionRing(
            groupCountCls,
            ctx.selectedPath === groupCountPath,
          )}
        >
          +3
        </div>
      </div>
    </div>
  )
}

export const avatarRule: CompositionRule = {
  slug: "avatar",
  source: "https://ui.shadcn.com/docs/components/avatar (fetched 2026-04-09)",
  composition: {
    name: "Avatar",
    children: [
      { name: "AvatarImage" },
      { name: "AvatarFallback" },
      { name: "AvatarBadge" },
      { name: "AvatarGroup" },
      { name: "AvatarGroupCount" },
    ],
  },
  render: AvatarRender,
}
