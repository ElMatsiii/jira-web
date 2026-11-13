---
name: Agile Slate
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45474c'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#001815'
  on-tertiary: '#ffffff'
  tertiary-container: '#002f2a'
  on-tertiary-container: '#28a094'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#89f5e7'
  tertiary-fixed-dim: '#6bd8cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#005049'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  code-inline:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

# Agile Slate — Design System

## 1. Brand & Style Principles

This design system delivers an agile project management and issue-tracking environment focused on high focus, visual calm, and low cognitive fatigue. Designed for software engineering leads, product managers, and cross-functional delivery squads, the interface replaces enterprise clutter with structured clarity, high-density utility, and quiet confidence.

The design movement combines **Contemporary Functional Minimalism** with **Precision Tonal Hierarchy**:
- **Canvas Calm:** Bright, matte surfaces devoid of harsh starkness or eye-straining dark canvases.
- **Color Discipline:** Expressive color is reserved strictly for semantic states, statuses, and key focal points. Buttons and interactions rely exclusively on solid, perfectly calibrated pigment fills with zero decorative gradients.
- **Engineered Legibility:** Strict metric alignments, crisp hairline separations, and structural geometric typography that prioritizes data legibility across expansive boards.

---

## 2. Color Palette & Roles

The palette is engineered for light mode, emphasizing high optical contrast, legible information density, and refined tone balance.

### Foundational Surfaces
* **Main App Canvas:** Soft slate-ivory `#F8FAFC` (`background` / `surface: #F8F9FF`)
* **Elevated Container / Board Columns:** Neutral off-white `#F1F5F9` (`surface-container-low: #EFF4FF`)
* **Interactive Cards & Panels:** Crisp pure white `#FFFFFF` (`surface-container-lowest: #FFFFFF`)
* **Borders & Dividers:** Architectural hairpins in `#E2E8F0` and muted dividing rules in `#CBD5E1` (`outline: #75777D`, `outline-variant: #C5C6CD`)

### Primary Interactive Brand
* **Primary Anchor:** Deep sapphire slate `#1E293B` (`primary-container: #1E293B`, `primary: #091426`, text `#FFFFFF`)
* **Secondary / Action Accent:** Energetic engineering blue `#2563EB` (`secondary: #0051D5` / `#2563EB`, text `#FFFFFF`) for active filters, focal links, and sprint execution highlights.
* **Neutral Slate:** `#64748B` for secondary labels, issue IDs, and breadcrumbs.

### Semantic Status Tints
Status indicators, Kanban tags, and progress chips use calibrated pastel containers with grounded typography:
* **To Do:** Neutral slate container `#F1F5F9` with text `#475569`
* **In Progress:** Calm sky container `#EFF6FF` with text `#1D4ED8` (`1px solid #DBEAFE`)
* **Code Review:** Muted violet container `#F5F3FF` with text `#6D28D9`
* **Done:** Soft emerald container `#ECFDF5` with text `#047857`
* **Blocked / High Priority:** Muted rose container `#FFF1F2` with text `#BE123C` (`error: #BA1A1A`)

---

## 3. Typography Scale

The typographic hierarchy pairs the structured geometry of **Plus Jakarta Sans** for headlines and structural landmarks with the neutral clarity of **Inter** for dense task grids, issue metadata, body content, and controls.

| Token | Font Family | Size | Weight | Line Height | Letter Spacing | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `headline-xl` | Plus Jakarta Sans | 36px | 700 (Bold) | 44px | -0.02em | Hero headers, board main title |
| `headline-xl-mobile` | Plus Jakarta Sans | 28px | 700 (Bold) | 36px | -0.015em | Responsive mobile board titles |
| `headline-lg` | Plus Jakarta Sans | 24px | 600 (SemiBold) | 32px | -0.015em | View headers, modal titles |
| `headline-md` | Plus Jakarta Sans | 20px | 600 (SemiBold) | 28px | -0.01em | Column headers, section titles |
| `headline-sm` | Plus Jakarta Sans | 16px | 600 (SemiBold) | 24px | normal | Card group headers, subheadings |
| `body-lg` | Inter | 16px | 400 (Regular) | 24px | normal | Rich descriptions, release notes |
| `body-md` | Inter | 14px | 400 (Regular) | 20px | normal | Primary body text, table cells |
| `body-sm` | Inter | 13px | 400 (Regular) | 18px | normal | Secondary descriptions, timestamps |
| `label-lg` | Inter | 14px | 500 (Medium) | 20px | normal | Button labels, primary inputs |
| `label-md` | Inter | 12px | 500 (Medium) | 16px | normal | Form field labels, filter options |
| `label-sm` | Inter | 11px | 600 (SemiBold) | 14px | +0.02em | Status badges, chip text |
| `code-inline` | Inter | 12px | 500 (Medium) | 16px | normal | Monospace / inline ticket keys |

### Typographic Rules:
* **Numeric Tabulation:** All ticket IDs (`ENG-1042`), story points, sprint countdowns, and cycle-time metrics must enable tabular figures (`font-variant-numeric: tabular-nums`).
* **Tracking:** Compact tracking (`-0.015em` to `-0.02em`) on top-level headers. Data labels below 12px receive positive tracking (`+0.02em`) to maximize legibility.

---

## 4. Spacing & Layout Rhythm

Based on a disciplined 4px / 8px modular scale tailored for data-heavy agile views:

* `space-xs`: `0.25rem` (4px) — Micro gaps, badge inner padding
* `space-sm`: `0.5rem` (8px) — Inner metadata gaps, icon spacing
* `space-md`: `0.75rem` (12px) — Card interior padding, input padding
* `space-lg`: `1rem` (16px) — Column padding, section gaps, gutter
* `space-xl`: `1.5rem` (24px) — Page margins, drawer separation
* `gutter`: `1rem` (16px) (Tablet: `0.75rem` / 12px)
* `margin`: `1.5rem` (24px) (Mobile: `1rem` / 16px)

### Board & Navigation Constraints:
* **Application Shell:** Persistent collapsed rail (`64px`) or expandable sidebar (`240px`).
* **Kanban Columns:** Min width `280px`, max width `360px`, with horizontal momentum scroll on overflow.
* **Detail Drawers:** Right-docking flyout panel width `640px` (or `100vw` on mobile).

---

## 5. Shape Geometry & Border Radii

A soft architectural curvature (base `0.25rem` / 4px):

* `sm` (`0.125rem` / 2px): Micro badges, indicators
* `DEFAULT` (`0.25rem` / 4px): Buttons, form inputs, table rows, checkboxes
* `md` (`0.375rem` / 6px): Floating tooltips, menus
* `lg` (`0.5rem` / 8px): Kanban cards, metric summary panels
* `xl` (`0.75rem` / 12px): Modals, slide-out drawer corners
* `full` (`9999px`): Status tag pills, avatars, filter toggle chips

---

## 6. Elevation & Depth

* **Level 0 (Base Canvas):** Background `#F8FAFC`, flat, 0 shadow.
* **Level 1 (Structural Lanes & Tables):** Surface `#F1F5F9`, border `1px solid #E2E8F0`, 0 shadow.
* **Level 2 (Interactive Kanban Cards):** Surface `#FFFFFF`, border `1px solid #E2E8F0`, ambient shadow `0 1px 2px 0 rgba(15, 23, 42, 0.05)`. Hover: `0 4px 6px -1px rgba(15, 23, 42, 0.08)`, border `#CBD5E1`.
* **Level 3 (Dropdown Menus & Popovers):** Surface `#FFFFFF`, border `1px solid #E2E8F0`, shadow `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)`.
* **Level 4 (Flyout Panels & Modals):** Surface `#FFFFFF`, left border `1px solid #E2E8F0`, lateral occlusion shadow `-4px 0 24px rgba(15, 23, 42, 0.08)`. Scrim `#0F172A` at `20%` opacity.

---

## 7. Component Specifications

### Buttons
* **Primary:** Solid dark sapphire `#1E293B`, label `#FFFFFF`, border `1px solid transparent`, radius `4px`. Hover: Solid `#0F172A`. Active: `#334155`. Zero gradients or drop shadows.
* **Secondary / Action:** Solid engineering blue `#2563EB`, label `#FFFFFF`. Hover: Solid `#1D4ED8`.
* **Outline / Ghost:** Solid surface `#FFFFFF`, border `1px solid #CBD5E1`, text `#334155`. Hover: surface `#F8FAFC`, border `#94A3B8`.
* **Destructive:** Solid surface `#EF4444`, text `#FFFFFF`. Hover: `#DC2626`.

### Kanban Cards
* Container: Pure white (`#FFFFFF`), border `1px solid #E2E8F0`, padding `12px` (`space-md`), radius `8px` (`rounded-lg`).
* Top row: Ticket ID (`ENG-302` in `#64748B`, bold, `tabular-nums`) and priority icon.
* Middle row: Issue title (`#0F172A`, line clamp 2).
* Bottom row: Assignee avatar (24px circle), pastel status chip, story point badge.

### Status Chips & Tags
* Height: `22px`, font size `11px`, font weight `600`, padding `0 8px`, `border-radius: 9999px`.
* Pastel fill with contrasting text (e.g., In Progress: `#EFF6FF` bg, `#1D4ED8` text, `1px solid #DBEAFE`).

### Form Inputs & Selectors
* Background `#FFFFFF`, border `1px solid #CBD5E1`, text `#0F172A`, height `36px`, padding `0 12px`, radius `4px`.
* Focus: Border `1px solid #2563EB`, outer ring `2px solid rgba(37, 99, 235, 0.15)`. No default black browser outline.
