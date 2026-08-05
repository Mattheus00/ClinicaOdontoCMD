---
name: Aura Dentale
colors:
  surface: '#faf9f7'
  surface-dim: '#dadad8'
  surface-bright: '#faf9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeec'
  surface-container-high: '#e9e8e6'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1b'
  on-surface-variant: '#4d463a'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#7f7668'
  outline-variant: '#d1c5b5'
  surface-tint: '#755a25'
  primary: '#755a25'
  on-primary: '#ffffff'
  primary-container: '#c5a367'
  on-primary-container: '#503906'
  inverse-primary: '#e6c182'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#4d5e83'
  on-tertiary: '#ffffff'
  tertiary-container: '#97a8d1'
  on-tertiary-container: '#2c3d60'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdea7'
  primary-fixed-dim: '#e6c182'
  on-primary-fixed: '#271900'
  on-primary-fixed-variant: '#5b430f'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#b5c6f1'
  on-tertiary-fixed: '#061a3c'
  on-tertiary-fixed-variant: '#35466a'
  background: '#faf9f7'
  on-background: '#1a1c1b'
  surface-variant: '#e3e2e0'
  champagne-gold: '#C5A367'
  deep-charcoal: '#1A1A1A'
  soft-white: '#F9F8F6'
  bone-ivory: '#EFECE7'
  muted-gold: '#D4BC8E'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 64px
    fontWeight: '600'
    lineHeight: 72px
    letterSpacing: -0.02em
  display-sm:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0.05em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 30px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.15em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 32px
  margin-mobile: 20px
  section-gap-lg: 120px
  section-gap-sm: 64px
  stack-space: 16px
---

## Brand & Style

The design system is rooted in the concept of "Smile Architecture," treating dental care as both a clinical science and a fine art. The brand personality is boutique and high-end, targeting a clientele that values exclusivity, precision, and a tranquil experience. 

The aesthetic follows a **Minimalist** approach with subtle **Glassmorphism** influences. It prioritizes expansive white space to evoke a sense of calm and hygiene, while using high-contrast typography and refined metallic accents to signal luxury. Visuals should feel curated and editorial, moving away from traditional medical tropes toward a high-fashion or architectural studio vibe.

## Colors

The palette is anchored by **Champagne Gold**, representing the "Smile Architecture" and premium craft. This is supported by **Deep Charcoal** for authoritative typography and structural elements, ensuring the design feels grounded and professional.

**Soft White** and **Bone Ivory** serve as the primary background surfaces, providing a warmer, more inviting alternative to sterile clinical whites. Use Gold sparingly for calls to action, accents, and dividers to maintain its perceived value. Charcoal should be used for all primary text to ensure maximum legibility against the light background.

## Typography

This design system employs a sophisticated typographic pairing to balance heritage and modernity. **Playfair Display** is used for headlines to convey elegance and the "architectural" aspect of the brand. Its high-contrast strokes reflect precision and beauty.

**Hanken Grotesk** is the functional workhorse for body copy and labels. It is a sharp, contemporary sans-serif that remains highly legible at smaller sizes while maintaining a professional, clean-room aesthetic. 

For navigation and overlines, use `label-caps` to provide a rhythmic contrast to the more fluid serif headlines. Generous line height (1.6x+) should be maintained across all body text to reinforce the feeling of "breathable" luxury.

## Layout & Spacing

The layout philosophy is built on a **Fixed Grid** with significant negative space. On desktop, a 12-column grid is used with wide 32px gutters to prevent information density from feeling overwhelming.

- **Desktop:** 120px vertical padding between major sections to emphasize exclusivity and give imagery room to breathe.
- **Tablet:** Transitions to an 8-column grid with 80px section gaps.
- **Mobile:** A 4-column grid with 20px side margins. Large serifs should scale down slightly to avoid awkward line breaks.

Alignment should lean towards asymmetrical compositions for editorial layouts (e.g., text offset against large-scale imagery), while functional pages (booking, clinical info) should maintain a strict, centered, or left-aligned discipline.

## Elevation & Depth

To maintain a premium feel, avoid heavy, dark shadows. Instead, use **Tonal Layers** and **Ambient Shadows**. 

1.  **Base Layer:** Soft White (#F9F8F6) or Bone Ivory (#EFECE7) surfaces.
2.  **Floating Elements:** Cards and containers use a very soft, diffused shadow: `0 20px 40px rgba(26, 26, 26, 0.05)`. This creates a subtle lift without appearing "heavy."
3.  **Glassmorphism:** For navigation bars and overlay modals, use a backdrop blur (12px) with a 70% opaque Soft White fill. This maintains context of the clinical environment while focusing the user.
4.  **Intersections:** Use thin, 1px lines in Gold or light Charcoal (at 10% opacity) for dividers rather than shadows to define structure.

## Shapes

The shape language is **Soft (0.25rem)**. While the brand is luxury, "Smile Architecture" implies a level of precision and structural integrity, which is best represented by slightly disciplined corners rather than overly playful rounded forms.

- **Standard Elements:** (Buttons, Input fields) 4px border radius.
- **Container Elements:** (Large cards, Image containers) 8px (rounded-lg) to 12px (rounded-xl) border radius.
- **Images:** Use rectangular containers with the standard 4px radius, but occasionally utilize "arch" shapes (rounded top) for hero imagery to mimic architectural elements.

## Components

### Buttons
Primary buttons should be Deep Charcoal with white text for high-contrast visibility. Secondary buttons use a Gold outline with Charcoal text. All buttons feature a subtle 0.2s transition on hover, shifting the background color slightly lighter.

### Cards
Cards should have no visible border. Use the Bone Ivory background and a soft ambient shadow. Typography within cards should be centered for service descriptions to enhance the boutique feel.

### Input Fields
Minimalist design: only a bottom border (1px) in a muted Charcoal, which turns Gold on focus. Avoid boxed inputs to keep the forms feeling light and non-intrusive.

### Image Containers
Images are central to the brand. Use "Object-fit: cover" with a subtle zoom-on-hover effect. Every image should have a 1px inner border of 5% black to give it a "framed" architectural quality.

### Lists
Use custom Gold icons (like a simple dot or a refined plus sign) for list bullets to reinforce the brand's primary color. Keep vertical spacing between list items at 16px (`stack-space`) to maintain legibility.

### Specialized Components
- **Before/After Slider:** A minimalist tool with a thin Gold vertical handle to showcase "Smile Architecture" results.
- **Treatment Timeline:** A vertical line component in Gold with serif labels to explain complex dental procedures.