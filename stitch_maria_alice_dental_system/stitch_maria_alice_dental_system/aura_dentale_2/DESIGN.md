---
name: Aura Dentale
colors:
  surface: '#fbf9f8'
  surface-dim: '#dbdad9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#755a25'
  on-secondary: '#ffffff'
  secondary-container: '#fdd897'
  on-secondary-container: '#785c28'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1a1c1c'
  on-tertiary-container: '#838484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#ffdea7'
  secondary-fixed-dim: '#e6c182'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5b430f'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  section-gap: 120px
---

## Brand & Style
The design system embodies the intersection of surgical precision and boutique hospitality. It is tailored for high-end dental clinics where clinical excellence is matched by an elevated patient experience. 

The aesthetic is **Modern Corporate Luxury**. It prioritizes clarity, stillness, and authority through a "high-definition" minimalist approach. The UI should evoke a sense of calm confidence—reassuring patients with organized information while signaling premium service through refined editorial touches. Key characteristics include expansive white space, rigorous alignment, and a restrained use of metallic accents.

## Colors
The palette is rooted in a high-contrast foundation of **Deep Charcoal** (#1A1A1A) and **Crisp White**. This creates an authoritative, "surgical" environment that feels sterile yet premium. 

- **Primary:** Deep Charcoal is used for primary actions and core typography to establish seriousness.
- **Accent:** Champagne Gold (#C5A367) is used sparingly for high-value interactions, subtle separators, and iconography to denote the "boutique" aspect of the brand.
- **Neutrals:** A spectrum of soft greys manages hierarchy without introducing visual noise.
- **Function:** Success and error states should be muted (e.g., a sage green or a deep terracotta) to maintain the sophisticated atmosphere.

## Typography
The typographic system uses a "Master-and-Apprentice" relationship. 

**Playfair Display** serves as the editorial voice. It is used for large headings and display moments to inject a sense of history and prestige. **Inter** handles all functional duties, including body copy, UI controls, and data. 

To maintain the high-end feel, use generous line heights for body text (1.6x) and tighter tracking for large serif headlines. Labels should frequently utilize uppercase styling with slight letter-spacing to reinforce the organized, architectural nature of the design system.

## Layout & Spacing
This design system utilizes a **Fixed Grid** model on desktop to maintain a contained, gallery-like feel. 

- **Grid:** A 12-column grid with 24px gutters.
- **Rhythm:** An 8px linear scale governs all padding and margins. 
- **Whitespace:** Use "intentional voids." Section headers should have significant vertical breathing room (section-gap) to prevent the UI from feeling cluttered or "medical" in a negative sense.
- **Alignment:** Strictly left-aligned content for readability, with occasional centered serif displays for high-level brand moments.

## Elevation & Depth
Depth is handled with extreme subtlety to mirror a physical boutique environment. 

- **Surface Layers:** Use "Tonal Layering." The main background is pure white (#FFFFFF), while secondary containers (like sidebars or cards) use an ultra-light grey (#F9F9F9).
- **Shadows:** Avoid heavy, dark shadows. Use a single "Signature Shadow" for elevated elements (like active cards or modals): `0px 4px 20px rgba(0, 0, 0, 0.04)`.
- **Dividers:** Use 1px solid lines in Champagne Gold (#C5A367) at 30% opacity to separate sections elegantly without the weight of a shadow.

## Shapes
The shape language is **precise and architectural**. 

A minimal corner radius (0.25rem/4px) is applied to buttons and inputs to prevent them from feeling sharp/dangerous while maintaining a professional, structured appearance. Larger containers (cards) may use 0px (Sharp) corners to emphasize the grid-based, editorial layout. Circles are reserved exclusively for avatars or specific status indicators to provide a soft contrast to the otherwise rectangular UI.

## Components
- **Buttons:** Primary buttons are Deep Charcoal with white Inter typography (Medium weight). Hover states transition to Champagne Gold. Use a "Ghost" variant with a 1px charcoal border for secondary actions.
- **Inputs:** Use "Float" style labels. Fields have a 1px bottom border by default; they transition to a full 1px charcoal frame on focus. No background fill.
- **Cards:** White background with a very subtle 1px border (#E5E5E5). Do not use shadows unless the card is interactive or hovered.
- **Chips/Tags:** Use a Champagne Gold background at 10% opacity with Deep Charcoal text for a sophisticated, low-contrast "premium" badge look.
- **Lists:** High-density data should be separated by 1px light-grey horizontal rules. Use "Playfair" for list item titles if they represent services or premium entries.
- **Navigation:** Top-tier navigation uses uppercase Inter at 12px with 0.1em letter spacing. The active state is indicated by a 2px Champagne Gold underline.