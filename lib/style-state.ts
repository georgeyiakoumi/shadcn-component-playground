/**
 * Style state management — parsing Tailwind classes into a structured
 * ControlState object and serialising back. Extracted from visual-editor.tsx
 * to keep the data/logic layer separate from the UI layer.
 */

import type { StyleContext } from "@/lib/style-context"
import { stripPrefix, addPrefix, hasPrefix } from "@/lib/style-context"
import {
  getNativeDisplay,
  TW_SWATCH_COLORS,
  PLACE_ITEMS_MAP,
  DISPLAY_OPTIONS,
  DIRECTION_OPTIONS,
  JUSTIFY_OPTIONS,
  ALIGN_OPTIONS,
  GAP_OPTIONS,
  GAP_X_OPTIONS,
  GAP_Y_OPTIONS,
  GRID_COLS_OPTIONS,
  GRID_ROWS_OPTIONS,
  GRID_FLOW_OPTIONS,
  AUTO_ROWS_OPTIONS,
  AUTO_COLS_OPTIONS,
  JUSTIFY_ITEMS_OPTIONS,
  JUSTIFY_SELF_OPTIONS,
  COL_SPAN_OPTIONS,
  ROW_SPAN_OPTIONS,
  COL_START_OPTIONS,
  COL_END_OPTIONS,
  ROW_START_OPTIONS,
  ROW_END_OPTIONS,
  FLEX_WRAP_OPTIONS,
  FLEX_SHORTHAND_OPTIONS,
  ALIGN_CONTENT_OPTIONS,
  FLEX_GROW_OPTIONS,
  FLEX_SHRINK_OPTIONS,
  FLEX_BASIS_OPTIONS,
  ALIGN_SELF_OPTIONS,
  ORDER_OPTIONS,
  POSITION_OPTIONS,
  OVERFLOW_OPTIONS,
  Z_INDEX_OPTIONS,
  INSET_OPTIONS,
  INSET_X_OPTIONS,
  INSET_Y_OPTIONS,
  TOP_OPTIONS,
  RIGHT_OPTIONS,
  BOTTOM_OPTIONS,
  LEFT_OPTIONS,
  VISIBILITY_OPTIONS,
  ASPECT_RATIO_OPTIONS,
  FLOAT_OPTIONS,
  CLEAR_OPTIONS,
  ISOLATION_OPTIONS,
  OBJECT_FIT_OPTIONS,
  OBJECT_POSITION_OPTIONS,
  SPACE_Y_OPTIONS,
  SPACE_X_OPTIONS,
  SPACE_X_REVERSE,
  SPACE_Y_REVERSE,
  WIDTH_OPTIONS,
  HEIGHT_OPTIONS,
  MIN_WIDTH_OPTIONS,
  MAX_WIDTH_OPTIONS,
  MIN_HEIGHT_OPTIONS,
  MAX_HEIGHT_OPTIONS,
  SIZE_OPTIONS,
  PADDING_SCALE,
  PADDING_X_SCALE,
  PADDING_Y_SCALE,
  PADDING_SIDES,
  MARGIN_SCALE,
  MARGIN_X_SCALE,
  MARGIN_Y_SCALE,
  MARGIN_SIDES,
  FONT_SIZE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  FONT_FAMILY_OPTIONS,
  FONT_STYLE_OPTIONS,
  TEXT_ALIGN_OPTIONS,
  TEXT_DECORATION_OPTIONS,
  TEXT_DECORATION_STYLE_OPTIONS,
  TEXT_DECORATION_THICKNESS_OPTIONS,
  TEXT_UNDERLINE_OFFSET_OPTIONS,
  TEXT_TRANSFORM_OPTIONS,
  TEXT_OVERFLOW_OPTIONS,
  TEXT_WRAP_OPTIONS,
  TEXT_INDENT_OPTIONS,
  LINE_HEIGHT_OPTIONS,
  LETTER_SPACING_OPTIONS,
  WORD_BREAK_OPTIONS,
  WHITESPACE_OPTIONS,
  HYPHENS_OPTIONS,
  LINE_CLAMP_OPTIONS,
  VERTICAL_ALIGN_OPTIONS,
  LIST_STYLE_TYPE_OPTIONS,
  LIST_STYLE_POSITION_OPTIONS,
  FONT_VARIANT_NUMERIC_OPTIONS,
  TEXT_COLOR_OPTIONS,
  BG_COLOR_OPTIONS,
  BORDER_COLOR_OPTIONS,
  RING_COLOR_OPTIONS,
  RING_OFFSET_COLOR_OPTIONS,
  OUTLINE_COLOR_OPTIONS,
  OPACITY_OPTIONS,
  GRADIENT_DIRECTION_OPTIONS,
  GRADIENT_FROM_OPTIONS,
  GRADIENT_VIA_OPTIONS,
  GRADIENT_TO_OPTIONS,
  BORDER_RADIUS_OPTIONS,
  BORDER_RADIUS_TL_OPTIONS,
  BORDER_RADIUS_TR_OPTIONS,
  BORDER_RADIUS_BR_OPTIONS,
  BORDER_RADIUS_BL_OPTIONS,
  BORDER_WIDTH_OPTIONS,
  BORDER_WIDTH_T_OPTIONS,
  BORDER_WIDTH_R_OPTIONS,
  BORDER_WIDTH_B_OPTIONS,
  BORDER_WIDTH_L_OPTIONS,
  BORDER_STYLE_OPTIONS,
  RING_WIDTH_OPTIONS,
  RING_OFFSET_WIDTH_OPTIONS,
  OUTLINE_WIDTH_OPTIONS,
  OUTLINE_STYLE_OPTIONS,
  OUTLINE_OFFSET_OPTIONS,
  DIVIDE_X_OPTIONS,
  DIVIDE_Y_OPTIONS,
  DIVIDE_STYLE_OPTIONS,
  DIVIDE_REVERSE_OPTIONS,
  SHADOW_OPTIONS,
  TEXT_SHADOW_OPTIONS,
  MIX_BLEND_OPTIONS,
  BG_BLEND_OPTIONS,
  MASK_CLIP_OPTIONS,
  MASK_COMPOSITE_OPTIONS,
  MASK_IMAGE_OPTIONS,
  MASK_MODE_OPTIONS,
  MASK_ORIGIN_OPTIONS,
  MASK_POSITION_OPTIONS,
  MASK_REPEAT_OPTIONS,
  MASK_SIZE_OPTIONS,
  MASK_TYPE_OPTIONS,
  BLUR_OPTIONS,
  BRIGHTNESS_OPTIONS,
  CONTRAST_OPTIONS,
  GRAYSCALE_OPTIONS,
  HUE_ROTATE_OPTIONS,
  INVERT_OPTIONS,
  SATURATE_OPTIONS,
  SEPIA_OPTIONS,
  DROP_SHADOW_OPTIONS,
  BACKDROP_BLUR_OPTIONS,
  BACKDROP_BRIGHTNESS_OPTIONS,
  BACKDROP_CONTRAST_OPTIONS,
  BACKDROP_GRAYSCALE_OPTIONS,
  BACKDROP_HUE_ROTATE_OPTIONS,
  BACKDROP_INVERT_OPTIONS,
  BACKDROP_OPACITY_OPTIONS,
  BACKDROP_SATURATE_OPTIONS,
  BACKDROP_SEPIA_OPTIONS,
  TRANSITION_PROPERTY_OPTIONS,
  TRANSITION_BEHAVIOR_OPTIONS,
  TRANSITION_DURATION_OPTIONS,
  TRANSITION_TIMING_OPTIONS,
  TRANSITION_DELAY_OPTIONS,
  ANIMATION_OPTIONS,
  SCALE_OPTIONS,
  SCALE_X_OPTIONS,
  SCALE_Y_OPTIONS,
  ROTATE_OPTIONS,
  TRANSLATE_X_OPTIONS,
  TRANSLATE_Y_OPTIONS,
  SKEW_X_OPTIONS,
  SKEW_Y_OPTIONS,
  TRANSFORM_ORIGIN_OPTIONS,
} from "@/lib/tailwind-options"

/* ── ControlState interface ──────────────────────────────────────── */

export interface ControlState {
  // Layout — shared
  display: string
  // Layout — flex/grid only
  direction: string
  justify: string
  align: string
  gap: string
  gapX: string
  gapY: string
  // Layout — flex container
  flexWrap: string
  alignContent: string
  // Layout — grid container
  gridCols: string
  gridRows: string
  gridFlow: string
  autoRows: string
  autoCols: string
  justifyItems: string
  // Layout — child (flex OR grid — always available)
  justifySelf: string
  // Layout — child (flex OR grid — always available)
  colSpan: string
  rowSpan: string
  colStart: string
  colEnd: string
  rowStart: string
  rowEnd: string
  // Layout — flex child
  flexShorthand: string
  flexGrow: string
  flexShrink: string
  flexBasis: string
  alignSelf: string
  order: string
  // Layout — positioning
  position: string
  overflow: string
  zIndex: string
  inset: string
  insetX: string
  insetY: string
  top: string
  right: string
  bottom: string
  left: string
  // Layout — visibility + misc
  visibility: string
  aspectRatio: string
  float: string
  clear: string
  isolation: string
  objectFit: string
  objectPosition: string
  // Layout — block children / flex spacing
  spaceY: string
  spaceX: string
  // Sizing
  width: string
  height: string
  minWidth: string
  maxWidth: string
  minHeight: string
  maxHeight: string
  size: string
  // Space reverse
  spaceXReverse: string
  spaceYReverse: string
  // Spacing
  padding: string
  paddingX: string
  paddingY: string
  paddingTop: string
  paddingRight: string
  paddingBottom: string
  paddingLeft: string
  margin: string
  marginX: string
  marginY: string
  marginTop: string
  marginRight: string
  marginBottom: string
  marginLeft: string
  // Typography
  fontSize: string
  fontWeight: string
  fontFamily: string
  fontStyle: string
  textAlign: string
  textDecoration: string
  textDecorationStyle: string
  textDecorationThickness: string
  textUnderlineOffset: string
  textTransform: string
  textOverflow: string
  textWrap: string
  textIndent: string
  lineHeight: string
  letterSpacing: string
  wordBreak: string
  whitespace: string
  hyphens: string
  lineClamp: string
  verticalAlign: string
  listStyleType: string
  listStylePosition: string
  fontVariantNumeric: string
  // Colours
  textColor: string
  bgColor: string
  borderColor: string
  ringColor: string
  ringOffsetColor: string
  outlineColor: string
  opacity: string
  gradientDirection: string
  gradientFrom: string
  gradientVia: string
  gradientTo: string
  // Borders
  borderRadius: string
  borderRadiusTL: string
  borderRadiusTR: string
  borderRadiusBR: string
  borderRadiusBL: string
  borderWidth: string
  borderWidthT: string
  borderWidthR: string
  borderWidthB: string
  borderWidthL: string
  borderStyle: string
  ringWidth: string
  ringOffsetWidth: string
  outlineWidth: string
  outlineStyle: string
  outlineOffset: string
  divideX: string
  divideY: string
  divideStyle: string
  divideReverse: string
  // Effects
  shadow: string
  shadowColor: string
  textShadow: string
  mixBlend: string
  bgBlend: string
  maskClip: string
  maskComposite: string
  maskImage: string
  maskMode: string
  maskOrigin: string
  maskPosition: string
  maskRepeat: string
  maskSize: string
  maskType: string
  // Filters
  blur: string
  brightness: string
  contrast: string
  grayscale: string
  hueRotate: string
  invert: string
  saturate: string
  sepia: string
  dropShadow: string
  backdropBlur: string
  backdropBrightness: string
  backdropContrast: string
  backdropGrayscale: string
  backdropHueRotate: string
  backdropInvert: string
  backdropOpacity: string
  backdropSaturate: string
  backdropSepia: string
  // Transitions & Animation
  transitionProperty: string
  transitionBehavior: string
  transitionDuration: string
  transitionTiming: string
  transitionDelay: string
  animation: string
  // Transforms
  scale: string
  scaleX: string
  scaleY: string
  rotate: string
  rotateX: string
  rotateY: string
  translateX: string
  translateY: string
  skewX: string
  skewY: string
  transformOrigin: string
}

/* ── Parsing helpers ─────────────────────────────────────────────── */

export function findMatch(classes: string[], options: string[]): string {
  return classes.find((c) => options.includes(c)) ?? ""
}

/** Known colour suffixes — shadcn tokens, Tailwind specials, and palette colours */
export const COLOR_SUFFIXES = new Set([
  "inherit", "current", "transparent", "black", "white",
  // shadcn tokens
  "foreground", "primary", "secondary", "secondary-foreground",
  "muted", "muted-foreground", "accent", "accent-foreground",
  "destructive", "destructive-foreground", "background",
  "card", "card-foreground", "popover", "popover-foreground",
  "border", "input", "ring",
  "primary-foreground",
])

/** Check if a class suffix is a valid Tailwind colour (token, special, or palette shade) */
export function isColorSuffix(suffix: string): boolean {
  if (COLOR_SUFFIXES.has(suffix)) return true
  // Check for palette: {color}-{shade}
  const lastDash = suffix.lastIndexOf("-")
  if (lastDash === -1) return false
  const color = suffix.slice(0, lastDash)
  const shade = suffix.slice(lastDash + 1)
  return !!TW_SWATCH_COLORS[color]?.[shade]
}

/** Find a colour class by prefix — matches prefix-based (e.g. any "text-" colour class) */
export function findPrefixColorMatch(classes: string[], prefix: string): string {
  return classes.find((c) => {
    if (!c.startsWith(`${prefix}-`)) return false
    const suffix = c.slice(prefix.length + 1)
    return isColorSuffix(suffix)
  }) ?? ""
}

/* ── Class-to-state parsing ──────────────────────────────────────── */

export function classesToControlState(classes: string[], context: StyleContext = "default"): ControlState {
  // Filter to only classes matching the current context, then strip the prefix
  classes = classes
    .map((c) => stripPrefix(c, context))
    .filter((c): c is string => c !== null)
  // Parse place-items shorthand back into justify + align
  const placeItems = classes.find((c) => c.startsWith("place-items-"))
  let parsedJustify = findMatch(classes, JUSTIFY_OPTIONS)
  let parsedAlign = findMatch(classes, ALIGN_OPTIONS)

  if (placeItems && !parsedJustify && !parsedAlign) {
    const axis = placeItems.replace("place-items-", "")
    parsedJustify = `justify-${axis}`
    parsedAlign = `items-${axis}`
  }

  return {
    display: findMatch(classes, DISPLAY_OPTIONS),
    direction: findMatch(classes, DIRECTION_OPTIONS),
    justify: parsedJustify,
    align: parsedAlign,
    gap: findMatch(classes, GAP_OPTIONS),
    gapX: findMatch(classes, GAP_X_OPTIONS),
    gapY: findMatch(classes, GAP_Y_OPTIONS),
    flexWrap: findMatch(classes, FLEX_WRAP_OPTIONS),
    alignContent: findMatch(classes, ALIGN_CONTENT_OPTIONS),
    gridCols: findMatch(classes, GRID_COLS_OPTIONS),
    gridRows: findMatch(classes, GRID_ROWS_OPTIONS),
    gridFlow: findMatch(classes, GRID_FLOW_OPTIONS),
    autoRows: findMatch(classes, AUTO_ROWS_OPTIONS),
    autoCols: findMatch(classes, AUTO_COLS_OPTIONS),
    justifyItems: findMatch(classes, JUSTIFY_ITEMS_OPTIONS),
    justifySelf: findMatch(classes, JUSTIFY_SELF_OPTIONS),
    colSpan: findMatch(classes, COL_SPAN_OPTIONS),
    rowSpan: findMatch(classes, ROW_SPAN_OPTIONS),
    colStart: findMatch(classes, COL_START_OPTIONS),
    colEnd: findMatch(classes, COL_END_OPTIONS),
    rowStart: findMatch(classes, ROW_START_OPTIONS),
    rowEnd: findMatch(classes, ROW_END_OPTIONS),
    flexShorthand: findMatch(classes, FLEX_SHORTHAND_OPTIONS),
    flexGrow: findMatch(classes, FLEX_GROW_OPTIONS),
    flexShrink: findMatch(classes, FLEX_SHRINK_OPTIONS),
    flexBasis: findMatch(classes, FLEX_BASIS_OPTIONS),
    alignSelf: findMatch(classes, ALIGN_SELF_OPTIONS),
    order: findMatch(classes, ORDER_OPTIONS),
    position: findMatch(classes, POSITION_OPTIONS),
    overflow: findMatch(classes, OVERFLOW_OPTIONS),
    zIndex: findMatch(classes, Z_INDEX_OPTIONS),
    inset: findMatch(classes, INSET_OPTIONS),
    insetX: findMatch(classes, INSET_X_OPTIONS),
    insetY: findMatch(classes, INSET_Y_OPTIONS),
    top: findMatch(classes, TOP_OPTIONS),
    right: findMatch(classes, RIGHT_OPTIONS),
    bottom: findMatch(classes, BOTTOM_OPTIONS),
    left: findMatch(classes, LEFT_OPTIONS),
    visibility: findMatch(classes, VISIBILITY_OPTIONS),
    aspectRatio: findMatch(classes, ASPECT_RATIO_OPTIONS),
    float: findMatch(classes, FLOAT_OPTIONS),
    clear: findMatch(classes, CLEAR_OPTIONS),
    isolation: findMatch(classes, ISOLATION_OPTIONS),
    objectFit: findMatch(classes, OBJECT_FIT_OPTIONS),
    objectPosition: findMatch(classes, OBJECT_POSITION_OPTIONS),
    spaceY: findMatch(classes, SPACE_Y_OPTIONS),
    spaceX: findMatch(classes, SPACE_X_OPTIONS),
    width: findMatch(classes, WIDTH_OPTIONS),
    height: findMatch(classes, HEIGHT_OPTIONS),
    minWidth: findMatch(classes, MIN_WIDTH_OPTIONS),
    maxWidth: findMatch(classes, MAX_WIDTH_OPTIONS),
    minHeight: findMatch(classes, MIN_HEIGHT_OPTIONS),
    maxHeight: findMatch(classes, MAX_HEIGHT_OPTIONS),
    size: findMatch(classes, SIZE_OPTIONS),
    spaceXReverse: findMatch(classes, [SPACE_X_REVERSE]),
    spaceYReverse: findMatch(classes, [SPACE_Y_REVERSE]),
    padding: findMatch(classes, PADDING_SCALE),
    paddingX: findMatch(classes, PADDING_X_SCALE),
    paddingY: findMatch(classes, PADDING_Y_SCALE),
    paddingTop: findMatch(classes, [...PADDING_SIDES.paddingTop]),
    paddingRight: findMatch(classes, [...PADDING_SIDES.paddingRight]),
    paddingBottom: findMatch(classes, [...PADDING_SIDES.paddingBottom]),
    paddingLeft: findMatch(classes, [...PADDING_SIDES.paddingLeft]),
    margin: findMatch(classes, MARGIN_SCALE),
    marginX: findMatch(classes, MARGIN_X_SCALE),
    marginY: findMatch(classes, MARGIN_Y_SCALE),
    marginTop: findMatch(classes, [...MARGIN_SIDES.marginTop]),
    marginRight: findMatch(classes, [...MARGIN_SIDES.marginRight]),
    marginBottom: findMatch(classes, [...MARGIN_SIDES.marginBottom]),
    marginLeft: findMatch(classes, [...MARGIN_SIDES.marginLeft]),
    fontSize: findMatch(classes, FONT_SIZE_OPTIONS),
    fontWeight: findMatch(classes, FONT_WEIGHT_OPTIONS),
    fontFamily: findMatch(classes, FONT_FAMILY_OPTIONS),
    fontStyle: findMatch(classes, FONT_STYLE_OPTIONS),
    textAlign: findMatch(classes, TEXT_ALIGN_OPTIONS),
    textDecoration: findMatch(classes, TEXT_DECORATION_OPTIONS),
    textDecorationStyle: findMatch(classes, TEXT_DECORATION_STYLE_OPTIONS),
    textDecorationThickness: findMatch(classes, TEXT_DECORATION_THICKNESS_OPTIONS),
    textUnderlineOffset: findMatch(classes, TEXT_UNDERLINE_OFFSET_OPTIONS),
    textTransform: findMatch(classes, TEXT_TRANSFORM_OPTIONS),
    textOverflow: findMatch(classes, TEXT_OVERFLOW_OPTIONS),
    textWrap: findMatch(classes, TEXT_WRAP_OPTIONS),
    textIndent: findMatch(classes, TEXT_INDENT_OPTIONS),
    lineHeight: findMatch(classes, LINE_HEIGHT_OPTIONS),
    letterSpacing: findMatch(classes, LETTER_SPACING_OPTIONS),
    wordBreak: findMatch(classes, WORD_BREAK_OPTIONS),
    whitespace: findMatch(classes, WHITESPACE_OPTIONS),
    hyphens: findMatch(classes, HYPHENS_OPTIONS),
    lineClamp: findMatch(classes, LINE_CLAMP_OPTIONS),
    verticalAlign: findMatch(classes, VERTICAL_ALIGN_OPTIONS),
    listStyleType: findMatch(classes, LIST_STYLE_TYPE_OPTIONS),
    listStylePosition: findMatch(classes, LIST_STYLE_POSITION_OPTIONS),
    fontVariantNumeric: findMatch(classes, FONT_VARIANT_NUMERIC_OPTIONS),
    textColor: findPrefixColorMatch(classes, "text"),
    bgColor: findPrefixColorMatch(classes, "bg"),
    borderColor: findPrefixColorMatch(classes, "border"),
    ringColor: findPrefixColorMatch(classes, "ring"),
    ringOffsetColor: findPrefixColorMatch(classes, "ring-offset"),
    outlineColor: findPrefixColorMatch(classes, "outline"),
    opacity: findMatch(classes, OPACITY_OPTIONS),
    gradientDirection: findMatch(classes, GRADIENT_DIRECTION_OPTIONS),
    gradientFrom: findPrefixColorMatch(classes, "from"),
    gradientVia: findPrefixColorMatch(classes, "via"),
    gradientTo: findPrefixColorMatch(classes, "to"),
    borderRadius: findMatch(classes, BORDER_RADIUS_OPTIONS),
    borderRadiusTL: findMatch(classes, BORDER_RADIUS_TL_OPTIONS),
    borderRadiusTR: findMatch(classes, BORDER_RADIUS_TR_OPTIONS),
    borderRadiusBR: findMatch(classes, BORDER_RADIUS_BR_OPTIONS),
    borderRadiusBL: findMatch(classes, BORDER_RADIUS_BL_OPTIONS),
    borderWidth: findMatch(classes, BORDER_WIDTH_OPTIONS),
    borderWidthT: findMatch(classes, BORDER_WIDTH_T_OPTIONS),
    borderWidthR: findMatch(classes, BORDER_WIDTH_R_OPTIONS),
    borderWidthB: findMatch(classes, BORDER_WIDTH_B_OPTIONS),
    borderWidthL: findMatch(classes, BORDER_WIDTH_L_OPTIONS),
    borderStyle: findMatch(classes, BORDER_STYLE_OPTIONS),
    ringWidth: findMatch(classes, RING_WIDTH_OPTIONS),
    ringOffsetWidth: findMatch(classes, RING_OFFSET_WIDTH_OPTIONS),
    outlineWidth: findMatch(classes, OUTLINE_WIDTH_OPTIONS),
    outlineStyle: findMatch(classes, OUTLINE_STYLE_OPTIONS),
    outlineOffset: findMatch(classes, OUTLINE_OFFSET_OPTIONS),
    divideX: findMatch(classes, DIVIDE_X_OPTIONS),
    divideY: findMatch(classes, DIVIDE_Y_OPTIONS),
    divideStyle: findMatch(classes, DIVIDE_STYLE_OPTIONS),
    divideReverse: findMatch(classes, DIVIDE_REVERSE_OPTIONS),
    shadow: findMatch(classes, SHADOW_OPTIONS),
    shadowColor: findPrefixColorMatch(classes, "shadow"),
    textShadow: findMatch(classes, TEXT_SHADOW_OPTIONS),
    mixBlend: findMatch(classes, MIX_BLEND_OPTIONS),
    bgBlend: findMatch(classes, BG_BLEND_OPTIONS),
    maskClip: findMatch(classes, MASK_CLIP_OPTIONS),
    maskComposite: findMatch(classes, MASK_COMPOSITE_OPTIONS),
    maskImage: findMatch(classes, MASK_IMAGE_OPTIONS),
    maskMode: findMatch(classes, MASK_MODE_OPTIONS),
    maskOrigin: findMatch(classes, MASK_ORIGIN_OPTIONS),
    maskPosition: findMatch(classes, MASK_POSITION_OPTIONS),
    maskRepeat: findMatch(classes, MASK_REPEAT_OPTIONS),
    maskSize: findMatch(classes, MASK_SIZE_OPTIONS),
    maskType: findMatch(classes, MASK_TYPE_OPTIONS),
    blur: findMatch(classes, BLUR_OPTIONS),
    brightness: findMatch(classes, BRIGHTNESS_OPTIONS),
    contrast: findMatch(classes, CONTRAST_OPTIONS),
    grayscale: findMatch(classes, GRAYSCALE_OPTIONS),
    hueRotate: findMatch(classes, HUE_ROTATE_OPTIONS),
    invert: findMatch(classes, INVERT_OPTIONS),
    saturate: findMatch(classes, SATURATE_OPTIONS),
    sepia: findMatch(classes, SEPIA_OPTIONS),
    dropShadow: findMatch(classes, DROP_SHADOW_OPTIONS),
    backdropBlur: findMatch(classes, BACKDROP_BLUR_OPTIONS),
    backdropBrightness: findMatch(classes, BACKDROP_BRIGHTNESS_OPTIONS),
    backdropContrast: findMatch(classes, BACKDROP_CONTRAST_OPTIONS),
    backdropGrayscale: findMatch(classes, BACKDROP_GRAYSCALE_OPTIONS),
    backdropHueRotate: findMatch(classes, BACKDROP_HUE_ROTATE_OPTIONS),
    backdropInvert: findMatch(classes, BACKDROP_INVERT_OPTIONS),
    backdropOpacity: findMatch(classes, BACKDROP_OPACITY_OPTIONS),
    backdropSaturate: findMatch(classes, BACKDROP_SATURATE_OPTIONS),
    backdropSepia: findMatch(classes, BACKDROP_SEPIA_OPTIONS),
    transitionProperty: findMatch(classes, TRANSITION_PROPERTY_OPTIONS),
    transitionBehavior: findMatch(classes, TRANSITION_BEHAVIOR_OPTIONS),
    transitionDuration: findMatch(classes, TRANSITION_DURATION_OPTIONS),
    transitionTiming: findMatch(classes, TRANSITION_TIMING_OPTIONS),
    transitionDelay: findMatch(classes, TRANSITION_DELAY_OPTIONS),
    animation: findMatch(classes, ANIMATION_OPTIONS),
    scale: findMatch(classes, SCALE_OPTIONS),
    scaleX: findMatch(classes, SCALE_X_OPTIONS),
    scaleY: findMatch(classes, SCALE_Y_OPTIONS),
    rotate: findMatch(classes, ROTATE_OPTIONS),
    rotateX: classes.find((c) => c.match(/^-?rotate-x-/)) ?? "",
    rotateY: classes.find((c) => c.match(/^-?rotate-y-/)) ?? "",
    translateX: findMatch(classes, TRANSLATE_X_OPTIONS),
    translateY: findMatch(classes, TRANSLATE_Y_OPTIONS),
    skewX: findMatch(classes, SKEW_X_OPTIONS),
    skewY: findMatch(classes, SKEW_Y_OPTIONS),
    transformOrigin: findMatch(classes, TRANSFORM_ORIGIN_OPTIONS),
  }
}

/* ── State-to-class serialisation ────────────────────────────────── */

/** All class prefixes that the visual editor manages. */
export const MANAGED_PREFIXES = [
  ...DISPLAY_OPTIONS,
  ...DIRECTION_OPTIONS,
  ...JUSTIFY_OPTIONS,
  ...ALIGN_OPTIONS,
  ...GAP_OPTIONS,
  ...GAP_X_OPTIONS,
  ...GAP_Y_OPTIONS,
  ...GRID_COLS_OPTIONS,
  ...GRID_ROWS_OPTIONS,
  ...GRID_FLOW_OPTIONS,
  ...AUTO_ROWS_OPTIONS,
  ...AUTO_COLS_OPTIONS,
  ...JUSTIFY_ITEMS_OPTIONS,
  ...JUSTIFY_SELF_OPTIONS,
  ...COL_SPAN_OPTIONS,
  ...ROW_SPAN_OPTIONS,
  ...COL_START_OPTIONS,
  ...COL_END_OPTIONS,
  ...ROW_START_OPTIONS,
  ...ROW_END_OPTIONS,
  ...FLEX_WRAP_OPTIONS,
  ...FLEX_SHORTHAND_OPTIONS,
  ...ALIGN_CONTENT_OPTIONS,
  ...FLEX_GROW_OPTIONS,
  ...FLEX_SHRINK_OPTIONS,
  ...FLEX_BASIS_OPTIONS,
  ...ALIGN_SELF_OPTIONS,
  ...ORDER_OPTIONS,
  ...POSITION_OPTIONS,
  ...OVERFLOW_OPTIONS,
  ...Z_INDEX_OPTIONS,
  ...INSET_OPTIONS,
  ...INSET_X_OPTIONS,
  ...INSET_Y_OPTIONS,
  ...TOP_OPTIONS,
  ...RIGHT_OPTIONS,
  ...BOTTOM_OPTIONS,
  ...LEFT_OPTIONS,
  ...VISIBILITY_OPTIONS,
  ...ASPECT_RATIO_OPTIONS,
  ...FLOAT_OPTIONS,
  ...CLEAR_OPTIONS,
  ...ISOLATION_OPTIONS,
  ...OBJECT_FIT_OPTIONS,
  ...OBJECT_POSITION_OPTIONS,
  ...SPACE_Y_OPTIONS,
  ...SPACE_X_OPTIONS,
  SPACE_X_REVERSE,
  SPACE_Y_REVERSE,
  ...WIDTH_OPTIONS,
  ...HEIGHT_OPTIONS,
  ...MIN_WIDTH_OPTIONS,
  ...MAX_WIDTH_OPTIONS,
  ...MIN_HEIGHT_OPTIONS,
  ...MAX_HEIGHT_OPTIONS,
  ...SIZE_OPTIONS,
  ...PADDING_SCALE,
  ...PADDING_X_SCALE,
  ...PADDING_Y_SCALE,
  ...Object.values(PADDING_SIDES).flat(),
  ...MARGIN_SCALE,
  ...MARGIN_X_SCALE,
  ...MARGIN_Y_SCALE,
  ...Object.values(MARGIN_SIDES).flat(),
  ...FONT_SIZE_OPTIONS,
  ...FONT_WEIGHT_OPTIONS,
  ...FONT_FAMILY_OPTIONS,
  ...FONT_STYLE_OPTIONS,
  ...TEXT_ALIGN_OPTIONS,
  ...TEXT_DECORATION_OPTIONS,
  ...TEXT_DECORATION_STYLE_OPTIONS,
  ...TEXT_DECORATION_THICKNESS_OPTIONS,
  ...TEXT_UNDERLINE_OFFSET_OPTIONS,
  ...TEXT_TRANSFORM_OPTIONS,
  ...TEXT_OVERFLOW_OPTIONS,
  ...TEXT_WRAP_OPTIONS,
  ...TEXT_INDENT_OPTIONS,
  ...LINE_HEIGHT_OPTIONS,
  ...LETTER_SPACING_OPTIONS,
  ...WORD_BREAK_OPTIONS,
  ...WHITESPACE_OPTIONS,
  ...HYPHENS_OPTIONS,
  ...LINE_CLAMP_OPTIONS,
  ...VERTICAL_ALIGN_OPTIONS,
  ...LIST_STYLE_TYPE_OPTIONS,
  ...LIST_STYLE_POSITION_OPTIONS,
  ...FONT_VARIANT_NUMERIC_OPTIONS,
  ...TEXT_COLOR_OPTIONS,
  ...BG_COLOR_OPTIONS,
  ...BORDER_COLOR_OPTIONS,
  ...RING_COLOR_OPTIONS,
  ...RING_OFFSET_COLOR_OPTIONS,
  ...OUTLINE_COLOR_OPTIONS,
  ...OPACITY_OPTIONS,
  ...GRADIENT_DIRECTION_OPTIONS,
  ...GRADIENT_FROM_OPTIONS,
  ...GRADIENT_VIA_OPTIONS,
  ...GRADIENT_TO_OPTIONS,
  ...BORDER_RADIUS_OPTIONS,
  ...BORDER_RADIUS_TL_OPTIONS,
  ...BORDER_RADIUS_TR_OPTIONS,
  ...BORDER_RADIUS_BR_OPTIONS,
  ...BORDER_RADIUS_BL_OPTIONS,
  ...BORDER_WIDTH_OPTIONS,
  ...BORDER_WIDTH_T_OPTIONS,
  ...BORDER_WIDTH_R_OPTIONS,
  ...BORDER_WIDTH_B_OPTIONS,
  ...BORDER_WIDTH_L_OPTIONS,
  ...BORDER_STYLE_OPTIONS,
  ...RING_WIDTH_OPTIONS,
  ...RING_OFFSET_WIDTH_OPTIONS,
  ...OUTLINE_WIDTH_OPTIONS,
  ...OUTLINE_STYLE_OPTIONS,
  ...OUTLINE_OFFSET_OPTIONS,
  ...DIVIDE_X_OPTIONS,
  ...DIVIDE_Y_OPTIONS,
  ...DIVIDE_STYLE_OPTIONS,
  ...DIVIDE_REVERSE_OPTIONS,
  ...SHADOW_OPTIONS,
  ...TEXT_SHADOW_OPTIONS,
  ...MIX_BLEND_OPTIONS,
  ...BG_BLEND_OPTIONS,
  ...MASK_CLIP_OPTIONS,
  ...MASK_COMPOSITE_OPTIONS,
  ...MASK_IMAGE_OPTIONS,
  ...MASK_MODE_OPTIONS,
  ...MASK_ORIGIN_OPTIONS,
  ...MASK_POSITION_OPTIONS,
  ...MASK_REPEAT_OPTIONS,
  ...MASK_SIZE_OPTIONS,
  ...MASK_TYPE_OPTIONS,
  ...BLUR_OPTIONS,
  ...BRIGHTNESS_OPTIONS,
  ...CONTRAST_OPTIONS,
  ...GRAYSCALE_OPTIONS,
  ...HUE_ROTATE_OPTIONS,
  ...INVERT_OPTIONS,
  ...SATURATE_OPTIONS,
  ...SEPIA_OPTIONS,
  ...DROP_SHADOW_OPTIONS,
  ...BACKDROP_BLUR_OPTIONS,
  ...BACKDROP_BRIGHTNESS_OPTIONS,
  ...BACKDROP_CONTRAST_OPTIONS,
  ...BACKDROP_GRAYSCALE_OPTIONS,
  ...BACKDROP_HUE_ROTATE_OPTIONS,
  ...BACKDROP_INVERT_OPTIONS,
  ...BACKDROP_OPACITY_OPTIONS,
  ...BACKDROP_SATURATE_OPTIONS,
  ...BACKDROP_SEPIA_OPTIONS,
  ...TRANSITION_PROPERTY_OPTIONS,
  ...TRANSITION_BEHAVIOR_OPTIONS,
  ...TRANSITION_DURATION_OPTIONS,
  ...TRANSITION_TIMING_OPTIONS,
  ...TRANSITION_DELAY_OPTIONS,
  ...ANIMATION_OPTIONS,
  ...SCALE_OPTIONS,
  ...SCALE_X_OPTIONS,
  ...SCALE_Y_OPTIONS,
  ...ROTATE_OPTIONS,
  ...TRANSLATE_X_OPTIONS,
  ...TRANSLATE_Y_OPTIONS,
  ...SKEW_X_OPTIONS,
  ...SKEW_Y_OPTIONS,
  ...TRANSFORM_ORIGIN_OPTIONS,
  "place-items-start",
  "place-items-center",
  "place-items-end",
  "place-items-stretch",
]

export function controlStateToClasses(state: ControlState, context: StyleContext = "default", elementTag?: string): string[] {
  const result: string[] = []
  const push = (v: string) => {
    if (v) result.push(addPrefix(v, context))
  }

  // Don't emit display class if it matches the element's native default
  const nativeDisplay = elementTag ? getNativeDisplay(elementTag) : "block"
  if (state.display && state.display !== nativeDisplay) {
    push(state.display)
  }
  push(state.direction)

  // Use place-items shorthand on grid when both axes match
  const placeShorthand =
    state.display === "grid"
      ? PLACE_ITEMS_MAP[state.justify]?.[state.align]
      : undefined

  if (placeShorthand) {
    push(placeShorthand)
  } else {
    push(state.justify)
    push(state.align)
  }
  push(state.gap)
  push(state.gapX)
  push(state.gapY)
  push(state.flexWrap)
  push(state.alignContent)
  push(state.gridCols)
  push(state.gridRows)
  push(state.gridFlow)
  push(state.autoRows)
  push(state.autoCols)
  push(state.justifyItems)
  push(state.justifySelf)
  push(state.colSpan)
  push(state.rowSpan)
  push(state.colStart)
  push(state.colEnd)
  push(state.rowStart)
  push(state.rowEnd)
  push(state.flexShorthand)
  push(state.flexGrow)
  push(state.flexShrink)
  push(state.flexBasis)
  push(state.alignSelf)
  push(state.order)
  // Positioning (don't emit "static" — it's the default)
  if (state.position && state.position !== "static") push(state.position)
  push(state.overflow)
  push(state.zIndex)
  push(state.inset)
  push(state.insetX)
  push(state.insetY)
  push(state.top)
  push(state.right)
  push(state.bottom)
  push(state.left)
  push(state.visibility)
  push(state.aspectRatio)
  push(state.float)
  push(state.clear)
  push(state.isolation)
  push(state.objectFit)
  push(state.objectPosition)
  push(state.spaceY)
  push(state.spaceX)
  push(state.spaceXReverse)
  push(state.spaceYReverse)
  push(state.width)
  push(state.height)
  push(state.minWidth)
  push(state.maxWidth)
  push(state.minHeight)
  push(state.maxHeight)
  push(state.size)
  push(state.padding)
  push(state.paddingX)
  push(state.paddingY)
  push(state.paddingTop)
  push(state.paddingRight)
  push(state.paddingBottom)
  push(state.paddingLeft)
  push(state.margin)
  push(state.marginX)
  push(state.marginY)
  push(state.marginTop)
  push(state.marginRight)
  push(state.marginBottom)
  push(state.marginLeft)
  push(state.fontSize)
  push(state.fontWeight)
  push(state.fontFamily)
  push(state.fontStyle)
  push(state.textAlign)
  push(state.textDecoration)
  push(state.textDecorationStyle)
  push(state.textDecorationThickness)
  push(state.textUnderlineOffset)
  push(state.textTransform)
  push(state.textOverflow)
  push(state.textWrap)
  push(state.textIndent)
  push(state.lineHeight)
  push(state.letterSpacing)
  push(state.wordBreak)
  push(state.whitespace)
  push(state.hyphens)
  push(state.lineClamp)
  push(state.verticalAlign)
  push(state.listStyleType)
  push(state.listStylePosition)
  push(state.fontVariantNumeric)
  push(state.textColor)
  push(state.bgColor)
  push(state.borderColor)
  push(state.ringColor)
  push(state.ringOffsetColor)
  push(state.outlineColor)
  push(state.opacity)
  push(state.gradientDirection)
  push(state.gradientFrom)
  push(state.gradientVia)
  push(state.gradientTo)
  push(state.borderRadius)
  push(state.borderRadiusTL)
  push(state.borderRadiusTR)
  push(state.borderRadiusBR)
  push(state.borderRadiusBL)
  push(state.borderWidth)
  push(state.borderWidthT)
  push(state.borderWidthR)
  push(state.borderWidthB)
  push(state.borderWidthL)
  push(state.borderStyle)
  push(state.ringWidth)
  push(state.ringOffsetWidth)
  push(state.outlineWidth)
  push(state.outlineStyle)
  push(state.outlineOffset)
  push(state.divideX)
  push(state.divideY)
  push(state.divideStyle)
  push(state.divideReverse)
  push(state.shadow)
  push(state.shadowColor)
  push(state.textShadow)
  push(state.mixBlend)
  push(state.bgBlend)
  push(state.maskClip)
  push(state.maskComposite)
  push(state.maskImage)
  push(state.maskMode)
  push(state.maskOrigin)
  push(state.maskPosition)
  push(state.maskRepeat)
  push(state.maskSize)
  push(state.maskType)
  push(state.blur)
  push(state.brightness)
  push(state.contrast)
  push(state.grayscale)
  push(state.hueRotate)
  push(state.invert)
  push(state.saturate)
  push(state.sepia)
  push(state.dropShadow)
  push(state.backdropBlur)
  push(state.backdropBrightness)
  push(state.backdropContrast)
  push(state.backdropGrayscale)
  push(state.backdropHueRotate)
  push(state.backdropInvert)
  push(state.backdropOpacity)
  push(state.backdropSaturate)
  push(state.backdropSepia)
  push(state.transitionProperty)
  push(state.transitionBehavior)
  push(state.transitionDuration)
  push(state.transitionTiming)
  push(state.transitionDelay)
  push(state.animation)
  push(state.scale)
  push(state.scaleX)
  push(state.scaleY)
  push(state.rotate)
  push(state.rotateX)
  push(state.rotateY)
  push(state.translateX)
  push(state.translateY)
  push(state.skewX)
  push(state.skewY)
  push(state.transformOrigin)

  return result
}

/* ── Class merging ───────────────────────────────────────────────── */

/**
 * Property group prefixes — if a new class starts with one of these,
 * any existing class with the same prefix gets removed (including arbitrary values).
 * e.g. grid-cols-[1fr_auto] replaces grid-cols-3 and vice versa.
 */
export const PROPERTY_GROUP_PREFIXES = [
  "w-", "h-", "min-w-", "max-w-", "min-h-", "max-h-", "size-",
  "space-x-", "space-y-",
  "px-", "py-", "mx-", "my-",
  "font-", "leading-", "tracking-", "indent-", "decoration-", "underline-offset-",
  "line-clamp-", "align-", "list-", "whitespace-", "hyphens-",
  "-m-", "-mt-", "-mr-", "-mb-", "-ml-", "-mx-", "-my-",
  "z-",
  "inset-x-", "inset-y-", "inset-",
  "top-", "right-", "bottom-", "left-",
  "aspect-", "float-", "clear-",
  "object-",
  "grid-cols-", "grid-rows-", "grid-flow-",
  "auto-rows-", "auto-cols-",
  "col-span-", "row-span-",
  "col-start-", "col-end-", "row-start-", "row-end-",
  "gap-x-", "gap-y-",
  "justify-items-", "justify-self-",
  "content-",
  "ring-offset-",
  "opacity-",
  "bg-gradient-to-",
  "from-", "via-", "to-",
  "rounded-tl-", "rounded-tr-", "rounded-br-", "rounded-bl-",
  "border-t-", "border-r-", "border-b-", "border-l-",
  "ring-",
  "outline-offset-",
  "divide-x-", "divide-y-",
  "shadow-",
  "mix-blend-", "bg-blend-",
  "blur-", "brightness-", "contrast-", "grayscale-", "hue-rotate-", "invert-", "saturate-", "sepia-",
  "drop-shadow-",
  "backdrop-blur-", "backdrop-brightness-", "backdrop-contrast-", "backdrop-grayscale-",
  "backdrop-hue-rotate-", "backdrop-invert-", "backdrop-opacity-", "backdrop-saturate-", "backdrop-sepia-",
  "duration-", "delay-", "ease-",
  "animate-",
  "scale-", "scale-x-", "scale-y-",
  "rotate-", "rotate-x-", "rotate-y-", "-rotate-x-", "-rotate-y-",
  "translate-x-", "translate-y-",
  "-translate-x-", "-translate-y-",
  "skew-x-", "skew-y-",
  "-skew-x-", "-skew-y-",
  "origin-",
]

/**
 * Merge updated control-state classes with original classes,
 * preserving any classes the editor does not manage.
 */
export function mergeClasses(
  original: string[],
  state: ControlState,
  context: StyleContext = "default",
  elementTag?: string,
): string[] {
  const managed = new Set(MANAGED_PREFIXES)
  const editorClasses = controlStateToClasses(state, context, elementTag)
  const editorSet = new Set(editorClasses)

  // Build a set of active property group prefixes from editor output
  const activeGroupPrefixes = new Set<string>()
  for (const cls of editorClasses) {
    const stripped = stripPrefix(cls, context)
    if (stripped) {
      for (const gp of PROPERTY_GROUP_PREFIXES) {
        if (stripped.startsWith(gp)) {
          activeGroupPrefixes.add(gp)
          break
        }
      }
    }
  }

  // Prefixes for arbitrary value classes that the editor manages
  // (these can't be in MANAGED_PREFIXES since the full class isn't known ahead of time)
  const ARBITRARY_MANAGED_PREFIXES = ["rotate-x-", "rotate-y-", "-rotate-x-", "-rotate-y-", "skew-x-[", "skew-y-[", "-skew-x-[", "-skew-y-["]

  const kept = original.filter((c) => {
    if (editorSet.has(c)) return false
    if (!hasPrefix(c, context)) return true

    const stripped = stripPrefix(c, context)
    if (!stripped) return true

    // Check exact match in managed set
    if (managed.has(stripped)) return false

    // Check property group prefix — if the editor is emitting a class in the
    // same group, remove the old one (handles arbitrary values)
    for (const gp of activeGroupPrefixes) {
      if (stripped.startsWith(gp)) return false
    }

    // Remove arbitrary value classes that the editor manages
    for (const ap of ARBITRARY_MANAGED_PREFIXES) {
      if (stripped.startsWith(ap)) return false
    }

    return true
  })

  return [...new Set([...kept, ...editorClasses])]
}
