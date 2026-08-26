# Landing Page Navigation Structure

## Navigation Menu Items and Corresponding Sections

All navigation menu items are properly connected to their respective sections on the landing page.

### Navigation Links

| Menu Item | Anchor | Section ID | Description |
|-----------|--------|------------|-------------|
| HOME | `/#home` | `#home` | Hero section with main value proposition and robot animation |
| FEATURES | `/#features` | `#features` | Core features: Student records, Teaching & attendance, Assessment intelligence, Parent connection |
| SOLUTIONS | `/#solutions` | `#solutions` | Six role-based experiences and SmartMark solution |
| PRICING | `/#pricing` | `#pricing` | Three pricing tiers: Smart Library Free, Skuggle Learn+, School Plans |
| ABOUT | `/#about` | `#about` | About Skuggle and final CTA |
| LIBRARY | Widget | `#library` | Smart Library section (accessible via widget dropdown, not main nav) |

## Section Details

### 1. HOME Section (`#home`)
**Purpose**: Primary hero and value proposition
**Key Elements**:
- Main headline: "Smart work now, better result tomorrow"
- Description of platform benefits
- Two CTAs: "Start learning free" and "Book a demo"
- Three benefits: No setup fee, Guided onboarding, Mobile ready
- Animated robot hero image
- Four highlight cards: Student Management, Smart Learning, Parent Connection, AI-Powered Insights

**Scroll Behavior**: `scroll-mt-28` (28 units top margin when scrolling)

---

### 2. LIBRARY Section (`#library`)
**Purpose**: Showcase Smart Library feature for curriculum learning
**Key Elements**:
- Split layout: Dark purple info panel + search form
- Headline: "Learn anything in your curriculum"
- Search form with Class, Subject, Topic fields
- CTA: "Explore Free Library"
- Benefits: AI explanations, Practice, Study help

**Scroll Behavior**: `scroll-mt-28`
**Note**: Accessible via Smart Library widget, not main navigation menu

---

### 3. FEATURES Section (`#features`)
**Purpose**: Core platform features
**Key Elements**:
- Section title: "Everything essential. Without the complexity."
- Four feature cards:
  1. **Student records** - One reliable student history
  2. **Teaching & attendance** - Quick class access
  3. **Assessment intelligence** - Performance tracking
  4. **Parent connection** - Guardian access

**Scroll Behavior**: `scroll-mt-28`

---

### 4. SOLUTIONS Section (`#solutions`)
**Purpose**: Role-based experiences and SmartMark feature
**Key Elements**:
- Title: "One platform. Six clear experiences."
- Six role cards:
  1. Platform owner
  2. School leadership
  3. School operations
  4. Teacher
  5. Parent / guardian
  6. Student
- **SmartMark subsection**: "Print. Scan. Mark. Done."
  - 5-step workflow visualization
  - Dark purple background with feature highlight

**Scroll Behavior**: `scroll-mt-28`

---

### 5. PRICING Section (`#pricing`)
**Purpose**: Pricing tiers and plans
**Key Elements**:
- Title: "Start free. Grow when you need more."
- Three pricing cards:
  1. **Smart Library Free** (Emerald theme)
     - For students & parents
     - CTA: "Start free" → `/join`
  2. **Skuggle Learn+** (Brand/purple theme)
     - For individuals & families
     - CTA: "Ask about Learn+" → Email
  3. **School Plans** (Amber theme)
     - For schools
     - CTA: "Register a school" → `/register-school`

**Scroll Behavior**: `scroll-mt-28`

---

### 6. ABOUT Section (`#about`)
**Purpose**: Company mission and final conversion
**Key Elements**:
- Title: "Built to make every school day simpler and more connected."
- Description of platform purpose
- CTA: "Join Skuggle free" → `/join`

**Scroll Behavior**: `scroll-mt-28`

---

## Call-to-Action Mapping

### Primary CTAs
| Button Text | Destination | Location |
|-------------|-------------|----------|
| Start learning free | `/join` | Home section |
| Book a demo | Email to support | Home section |
| Explore Free Library | `/library` | Library section |
| Start free | `/join` | Pricing - Smart Library Free |
| Ask about Learn+ | Email to support | Pricing - Learn+ |
| Register a school | `/register-school` | Pricing - School Plans |
| Join Skuggle free | `/join` | About section |

### Secondary Actions
| Button Text | Destination | Location |
|-------------|-------------|----------|
| Sign in | `/login` | Header, Footer |
| Get started | `/join` | Header |

---

## Mobile Navigation

Mobile menu (visible on screens < 1024px) includes:
- All main navigation links
- SIGN IN → `/login`
- GET STARTED → `/join`

---

## Scroll Behavior

All sections use `scroll-mt-28` which adds a 28-unit top margin when the page scrolls to that section. This prevents content from being hidden behind the sticky header.

The sticky header:
- Position: `sticky top-0`
- Z-index: `var(--z-sticky)`
- Background: `bg-cream-50/90` with `backdrop-blur-xl`
- Height: Approximately 72px (min-h-16 + padding)

---

## Smart Library Widget

The Smart Library Widget appears in the navigation bar and provides:
- **Guest users**: Preview of library resources with sign-up prompts
- **Registered users**: Limited access with upgrade prompts
- **Subscribed users**: Full access to all library resources

Widget navigates to the `#library` section when resources are clicked (for guests).

---

## Accessibility

- All sections have proper `id` attributes for anchor navigation
- Skip link: "Skip to content" → `#main-content`
- ARIA labels on all navigation regions
- Mobile menu has proper `aria-expanded` and `aria-controls` attributes

---

## Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1023px
- **Desktop**: ≥ 1024px

Navigation adapts:
- Mobile: Hamburger menu
- Desktop: Full horizontal navigation bar
