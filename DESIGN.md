---
name: Field Ledger
description: Mobile-first property accountability for individual Army hand receipt holders.
colors:
  paper-khaki: "#f5f3ec"
  raised-paper: "#fbfaf4"
  sunken-khaki: "#efece2"
  field-ink: "#1a1a17"
  secondary-ink: "#3b3a32"
  muted-ink: "#6b6a62"
  faint-ink: "#9b9a90"
  field-rule: "#d9d5c7"
  quiet-rule: "#e8e4d6"
  command-olive: "#3a4a2a"
  command-olive-ink: "#fbfaf4"
  amber-warning: "#a86a1a"
  brick-danger: "#9a2a1f"
  service-green: "#3a5a3a"
  night-bg: "#13140f"
  night-surface: "#1b1d16"
  night-sunken: "#0d0e0a"
  night-ink: "#ecebde"
typography:
  display:
    fontFamily: "Inter Tight, Helvetica Neue, Helvetica, Arial, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "normal"
  headline:
    fontFamily: "Inter Tight, Helvetica Neue, Helvetica, Arial, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "normal"
  title:
    fontFamily: "Inter Tight, Helvetica Neue, Helvetica, Arial, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "normal"
  body:
    fontFamily: "Inter Tight, Helvetica Neue, Helvetica, Arial, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "Inter Tight, Helvetica Neue, Helvetica, Arial, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.06em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
rounded:
  xs: "3px"
  sm: "4px"
  md: "5px"
  lg: "8px"
  shell: "10px"
  phone: "36px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.command-olive}"
    textColor: "{colors.command-olive-ink}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.raised-paper}"
    textColor: "{colors.field-ink}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "36px"
  chip-default:
    backgroundColor: "{colors.sunken-khaki}"
    textColor: "{colors.secondary-ink}"
    rounded: "{rounded.xs}"
    padding: "0 6px"
    height: "18px"
  shell-sidebar:
    backgroundColor: "{colors.raised-paper}"
    textColor: "{colors.field-ink}"
    rounded: "{rounded.shell}"
---

# Design System: Field Ledger

## 1. Overview

**Creative North Star: "The Field Desk"**

Field Ledger should feel like a field-ready desk surface: paper-toned, compact,
legible, and durable. It carries enough Army-adjacent texture to feel native to
hand receipt work without becoming camo cosplay or an official-system costume.
The product design serves repeated operational use, so density is welcome when
it helps compare records, scan status, or complete a workflow.

The default scene is a user checking accountable property on a phone in mixed
lighting, then reviewing the same records on a tablet or desktop. That scene
points to a light, paper-khaki system with strong ink contrast. Dark mode can
exist for later, but light mode is the default product truth.

Field Ledger explicitly rejects generic SaaS dashboards, decorative analytics,
purple AI gradients, neon-on-black command centers, and fake official Army
system styling.

**Key Characteristics:**

- Mobile-first, not mobile-only.
- Dense enough for real records, quiet enough for repeated work.
- Touch targets and navigation are practical before they are decorative.
- Status and risk are shown with labels plus color, never color alone.
- Surfaces are paper, rules, and tonal layering before shadows.

## 2. Colors

The palette is warm field paper, olive command accents, and status colors that
feel accountable instead of theatrical.

### Primary

- **Command Olive** (`#3a4a2a`): Use for primary actions, active navigation
  marks, selected item indicators, and the compact Field Ledger mark. Keep it
  rare so it continues to mean "current or actionable."
- **Command Olive Ink** (`#fbfaf4`): Text and icons on Command Olive.

### Secondary

- **Amber Warning** (`#a86a1a`): Due soon, signed-out attention states, and
  warning tags.
- **Brick Danger** (`#9a2a1f`): Overdue, missing, destructive, or blocked
  states.
- **Service Green** (`#3a5a3a`): Complete, in-use, or healthy states when a
  positive status is needed.

### Neutral

- **Paper Khaki** (`#f5f3ec`): Default app background.
- **Raised Paper** (`#fbfaf4`): Primary panels, cards, headers, bottom nav, and
  sidebars.
- **Sunken Khaki** (`#efece2`): Selected rows, filter wells, input wells, and
  quiet grouped regions.
- **Field Ink** (`#1a1a17`): Primary text.
- **Secondary Ink** (`#3b3a32`): Secondary labels and less prominent values.
- **Muted Ink** (`#6b6a62`): Metadata, helper text, inactive nav labels.
- **Faint Ink** (`#9b9a90`): Disabled text and low-emphasis counters.
- **Field Rule** (`#d9d5c7`): Primary borders and dividers.
- **Quiet Rule** (`#e8e4d6`): Internal list separators and subtle dividers.

### Named Rules

**The Olive Is Scarce Rule.** Command Olive should stay under 10% of a screen.
Its scarcity makes active state and primary action obvious.

**The Status Has Words Rule.** Amber, brick, and green must travel with text,
icons, or position. Never rely on color alone for overdue, missing, signed-out,
or complete states.

## 3. Typography

**Display Font:** Inter Tight, with Helvetica Neue, Helvetica, Arial, system-ui,
and sans-serif fallbacks.

**Body Font:** Inter Tight, with the same system fallbacks.

**Label/Mono Font:** JetBrains Mono, with ui-monospace, SF Mono, Menlo, Consolas,
and monospace fallbacks.

**Character:** The type system is compact, technical, and plainspoken. Inter
Tight keeps record-heavy screens efficient, while JetBrains Mono gives ECNs,
serials, dates, DODID fragments, and filenames a distinct accountable texture.

### Hierarchy

- **Display** (700, 32px, 1.1): Use sparingly for app-entry or empty-state
  headlines. Product screens usually do not need hero-scale type.
- **Headline** (700, 22px, 1.1): Phone screen titles and major panel titles.
- **Title** (700, 15px, 1.25): Detail panel headings, record names, and selected
  item titles.
- **Body** (500, 14px, 1.45): Primary app copy, row labels, descriptions, and
  form text. Cap long prose at 65 to 75 characters.
- **Label** (700, 11px, 0.06em, uppercase): Section labels, table headers,
  metadata headings, and small operational labels.
- **Mono** (500, 11px, 1.3): Serial numbers, ECNs, dates, DODID fragments,
  filenames, counts, and fixed-width record identifiers.

### Named Rules

**The Records Are Scannable Rule.** Identifiers, dates, filenames, and counts
use mono. Names, actions, and workflow labels use the sans face.

**No Tiny Mysteries Rule.** Small labels can be compact, but they must remain
legible and must not carry essential meaning alone.

## 4. Elevation

Field Ledger is mostly flat. Depth comes from tonal surfaces, borders, dividers,
and selected states. Shadows are reserved for device mock frames, floating
menus, and overlays where a surface truly sits above another.

### Shadow Vocabulary

- **Shell Frame** (`0 1px 0 rgba(255,255,255,.6) inset, 0 30px 60px -30px rgba(0,0,0,.3)`): Use only for whole-device or app-shell presentation frames, not for every card.
- **Interactive Lift** (`0 8px 20px -16px rgba(0,0,0,.35)`): Optional for menus,
  popovers, or drag surfaces that must clearly float above record content.

### Named Rules

**The Paper Stack Rule.** Prefer `Raised Paper`, `Sunken Khaki`, `Field Rule`,
and `Quiet Rule` before adding shadows.

## 5. Components

### Buttons

Buttons should feel compact and tactile. Use Lucide icons where a common action
has a recognizable symbol.

- **Shape:** Slightly squared, never pill-like (`4px` radius).
- **Primary:** Command Olive background, Command Olive Ink text, `36px` default
  height, `14px` horizontal padding.
- **Hover / Focus:** Darken or move one tonal step, keep a clear focus ring.
  Active press may move by `0.5px` without animating layout.
- **Secondary:** Raised Paper with Field Rule border and Field Ink text.
- **Ghost:** Transparent by default, Sunken Khaki on hover or active.
- **Danger:** Transparent or Raised Paper with Brick Danger text and border.

### Chips

Chips are record metadata, not decoration.

- **Style:** `18px` tall, `3px` radius, uppercase 10.5 to 11px text, one-pixel
  border.
- **State:** Default chips use Sunken Khaki. Olive chips mark active or selected
  formal states. Warning and danger chips stay transparent with colored text and
  border.

### Cards / Containers

Containers are working surfaces, not marketing cards.

- **Corner Style:** `4px` to `8px` for app panels; `10px` only for the desktop
  shell frame.
- **Background:** Raised Paper for panels, Sunken Khaki for selected or inset
  regions.
- **Shadow Strategy:** Flat by default, with tonal layering and rules.
- **Border:** One-pixel Field Rule. Internal rows may use Quiet Rule.
- **Internal Padding:** Use 12px to 16px for dense records; 24px only for broad
  app-entry or empty-state surfaces.

### Inputs / Fields

Inputs should feel like record-entry fields.

- **Style:** Raised Paper or transparent inside a Sunken Khaki search well,
  Field Rule border, `4px` to `5px` radius.
- **Focus:** Border shifts to Command Olive with a subtle ring. Do not use glow
  effects.
- **Error / Disabled:** Brick Danger with clear text for errors. Disabled fields
  use Faint Ink and Sunken Khaki.

### Navigation

Phone uses bottom navigation: Dashboard, Items, Hand Receipts, More. Active
phone nav uses Field Ink text plus a thin Command Olive top mark.

Tablet and desktop use a collapsible left sidebar. Active sidebar rows use
Sunken Khaki fill, a compact Command Olive indicator, and an olive icon. The
sidebar should expose Dashboard, Items, Hand Receipts, Contacts, 2062 archive or
Active 2062s, Activity or History, Settings, and Billing as the product matures.

### Tables and Record Lists

Tables and lists are first-class product surfaces. Rows should support scanning
by name, identifier, hand receipt context, assignment state, requirement state,
and value where relevant. Sticky headers, selected-row tonal states, and compact
metadata are encouraged.

### Signature Component: 2062 Upload Flow

The 2062 upload flow is a step-based working surface. Each step should show the
current item or hand receipt context, the selected contact, the uploaded
document, the item selection, and the final filing summary. The UI must preserve
the distinction between manual signed-to state and formal 2062 coverage.

## 6. Do's and Don'ts

### Do:

- **Do** use Paper Khaki (`#f5f3ec`) as the default app background and Raised
  Paper (`#fbfaf4`) for primary panels.
- **Do** use Command Olive (`#3a4a2a`) for primary actions, selected state, and
  active navigation only.
- **Do** keep bottom navigation on phone and a collapsible sidebar on tablet and
  desktop.
- **Do** use JetBrains Mono for serials, ECNs, dates, filenames, and compact
  record identifiers.
- **Do** keep workflows honest: placeholders must say what is not implemented
  and must not fake product behavior.
- **Do** keep visible text short, direct, and tied to property-accountability
  action.

### Don't:

- **Don't** use generic SaaS analytics-first dashboard patterns.
- **Don't** use purple gradients, neon tech styling, gradient text, or
  decorative glassmorphism.
- **Don't** use side-stripe borders greater than 1px as card accents.
- **Don't** use nested cards or identical card grids as the default information
  pattern.
- **Don't** make the app feel like an organization, team, commander, PBO, or
  clinic workspace.
- **Don't** use official Army visual claims, seals, or system-of-record language.
- **Don't** reserve permanent large image slots for item photos in MVP.
