# Cartful Brand System

## Colors

| Token          | Value     | Usage                        |
|----------------|-----------|------------------------------|
| background     | `#0F0F0F` | App background               |
| surface        | `#1A1A1A` | Cards, modals, bottom sheets |
| accent         | `#4ECDC4` | CTAs, highlights, icons      |
| text primary   | `#FFFFFF` | Headings, body copy          |
| text secondary | `#888888` | Captions, meta, placeholders |

## Typography

| Style   | Size  | Weight  | Color          |
|---------|-------|---------|----------------|
| heading | 24px  | bold    | text primary   |
| body    | 16px  | regular | text primary   |
| caption | 13px  | regular | text secondary |

System font stack — no custom fonts in v1.

## Spacing Scale

`4 · 8 · 16 · 24 · 32`

Use only values from this scale. Never hardcode arbitrary spacing.

## Core Components

### Card
- Background: surface (`#1A1A1A`)
- Border radius: 12px
- Padding: 16px

### Button
- **Primary** — teal fill (`#4ECDC4`), dark text, 8px border radius
- **Ghost** — transparent fill, 1px teal border, teal text

### ScreenWrapper
- Full-screen container
- Background: background (`#0F0F0F`)
- Horizontal padding: 24px on every screen, no exceptions

## Tone & Personality

- **Clean, minimal, dark.** The UI recedes so food content leads.
- **Food-forward but not precious.** Practical and direct — this is a grocery app, not a lifestyle brand.
- **Functional first, beautiful second.** Every design decision should earn its place by making the app easier to use.
