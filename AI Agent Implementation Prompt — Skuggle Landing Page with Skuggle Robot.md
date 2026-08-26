# SKUGGLE LANDING PAGE IMPLEMENTATION PROMPT

## Role

Act as a **Senior React Frontend Engineer, SaaS Product Designer, UI/UX Engineer, Responsive Web Specialist and Performance Engineer**.

You are working on **Skuggle**, a modern multi-tenant School Operating and Learning Intelligence Platform.

Your task is to build the **production-quality public landing/home page** for Skuggle based on the approved visual direction.

This must be a **real working React interface**, not a screenshot, static mockup, or one-off visual experiment.

The landing page must prominently introduce the official **Skuggle AI character/robot**, also named **Skuggle**, as the intelligent school assistant and visual brand mascot.

---

# 1. PRODUCT BRAND

Product name:

**Skuggle**

Primary positioning:

> **Run your school. Smarter, together.**

Supporting positioning:

> Skuggle brings student records, academics, assessment, performance monitoring, parent engagement and intelligent school operations into one simple platform.

The page should communicate that Skuggle is:

- modern;
- intelligent;
- simple;
- warm;
- trustworthy;
- education-focused;
- professional;
- approachable;
- technologically advanced without appearing complicated.

---

# 2. IMPORTANT DESIGN PRINCIPLE

Do NOT design the page like:

- an ERP dashboard;
- an accounting platform;
- a corporate banking website;
- a crowded education portal;
- a generic AI startup;
- a giant wall of text;
- a template packed with dozens of sections.

The interface must remain:

**minimalistic + warm + sophisticated + spacious + premium**

Use large amounts of whitespace.

Every section must have a clear purpose.

---

# 3. TECHNOLOGY

Use the existing project stack.

Preferred implementation:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React icons

Use existing project conventions where they already exist.

Do not introduce a new UI framework merely to implement this page.

Do not use Bootstrap.

Do not unnecessarily add heavy dependencies.

---

# 4. LANDING PAGE STRUCTURE

Build the public homepage at:

```text
/
```

Suggested component architecture:

```text
src/
  pages/
    public/
      LandingPage.tsx

  components/
    landing/
      Navbar.tsx
      HeroSection.tsx
      SkuggleRobot.tsx
      FeatureHighlights.tsx
      ProductOverview.tsx
      IntelligenceSection.tsx
      CallToAction.tsx
      Footer.tsx
```

Reuse existing global components where appropriate.

Do not place the entire landing page inside one enormous component.

---

# 5. VISUAL STYLE

Use a warm white / cream base.

Recommended visual direction:

```text
Background:
#FFFCF8 or equivalent warm off-white

Primary:
Skuggle Purple

Primary gradient:
Deep Purple → Bright Violet

Text:
Very dark navy / charcoal

Secondary text:
Muted slate

Accent colours:
Soft purple
Soft green
Soft orange
Soft coral
```

Avoid excessive colour.

Purple remains the dominant Skuggle identity.

---

# 6. TYPOGRAPHY

Use elegant, highly readable typography.

Hero heading may combine:

- strong modern sans-serif;
- optional elegant serif emphasis for selected words.

Example:

> Run your school.  
> **Smarter**, together.

The word **Smarter** may use Skuggle purple.

Typography hierarchy must be obvious.

Do not use tiny text merely to fit more content.

---

# 7. MAIN NAVIGATION

Create a clean horizontal navigation header.

Desktop structure:

```text
[ SKUGGLE LOGO ]

Home
Features
Solutions ▼
Pricing
About

                         Sign In
                         Get Started
```

Requirements:

- sticky or subtly fixed navigation;
- soft white/cream surface;
- slight border/shadow after scrolling;
- active item indicator;
- smooth hover behaviour;
- responsive mobile navigation;
- keyboard accessible.

Do not use an ERP sidebar.

---

# 8. LOGO

Use the existing Skuggle logo from the project assets.

Do not recreate the brand using random icons if an official asset already exists.

Logo area should contain:

**Skuggle**

with the approved Skuggle mark.

Clicking the logo returns to `/`.

---

# 9. HERO SECTION

Create the primary hero immediately below the navigation.

Desktop:

```text
┌──────────────────────────────────────────────┐

 LEFT                                RIGHT

 Smart School Management            SKUGGLE
 Simplified                          AI ROBOT

 Run your school.
 Smarter, together.

 Supporting text                    Robot illustration
                                    greeting / waving
 Get Started
 Book Demo

└──────────────────────────────────────────────┘
```

The composition must feel spacious.

Do not overcrowd the hero.

---

# 10. HERO EYEBROW

Above the main heading display a subtle pill:

```text
✦ Smart School Management, Simplified
```

Use:

- soft lavender background;
- purple text;
- subtle icon;
- rounded pill.

---

# 11. HERO HEADLINE

Primary headline:

# Run your school.
# Smarter, together.

Keep this text prominent.

On desktop it should occupy approximately two large lines.

On smaller screens allow natural wrapping.

---

# 12. HERO SUPPORTING TEXT

Use concise supporting copy:

> Skuggle brings everything your school needs into one intuitive platform, helping you save time, understand student performance, strengthen collaboration and focus on what matters most: student success.

Do not make the hero paragraph excessively long.

---

# 13. HERO CALLS TO ACTION

Primary:

```text
Get Started →
```

Secondary:

```text
Book Demo
```

Behaviour:

### Get Started

Navigate to:

```text
/register-school
```

### Book Demo

Navigate to the existing demo/contact experience if implemented.

If not implemented, create a lightweight reusable demo-request modal or route architecture without inventing fake backend success.

Buttons must have:

- hover;
- focus;
- loading states where appropriate;
- accessible labels.

---

# 14. OFFICIAL SKUGGLE ROBOT

The right side of the hero must contain the **Skuggle Robot**.

The robot is NOT a generic robot.

It is the official visual AI character of the product.

The character itself is also called:

# Skuggle

---

# 15. SKUGGLE ROBOT VISUAL IDENTITY

Maintain the following characteristics consistently:

### Head

- friendly rounded futuristic robot head;
- predominantly soft white;
- glossy dark purple digital face;
- large expressive eyes;
- friendly smile;
- soft violet illumination.

### Head Branding

Place the Skuggle education/logo mark subtly on the upper head.

### Body

- soft white body/hoodie;
- purple trims;
- clean premium appearance;
- friendly rather than mechanical.

### Accessories

Skuggle may hold:

- purple Skuggle book;
- tablet;
- school document;

depending on future context.

For the landing page use the **book-holding version**.

### Pose

Skuggle should:

- face the visitor;
- smile;
- raise one hand in greeting;
- hold a Skuggle book with the other hand.

---

# 16. ROBOT ASSET RULE

If an approved Skuggle Robot asset exists in the project:

**USE THE EXISTING ASSET.**

Do not replace it with:

- emoji;
- generic robot;
- Lucide robot icon;
- random SVG robot;
- CSS-built character.

Preserve character identity.

If the supplied reference asset has a background, prepare or use a transparent-background version for implementation.

Use efficient image format such as:

```text
WebP
AVIF
optimized PNG where transparency requires it
```

Do not ship a multi-megabyte hero image.

---

# 17. ROBOT COMPONENT

Create a reusable component such as:

```tsx
<SkuggleRobot
  pose="welcome"
  size="hero"
  message="Hi! I'm Skuggle"
/>
```

Do not hardwire the robot directly into the landing page structure.

The character will later be reused throughout the application.

Design the component architecture accordingly.

---

# 18. ROBOT GREETING

Place a subtle floating speech bubble beside the robot.

Suggested content:

```text
Hi! I'm Skuggle

Your AI School Assistant.
```

Keep it elegant and brief.

Do not turn the character into a giant chatbot widget.

---

# 19. ROBOT ANIMATION

Give Skuggle subtle animation.

Recommended:

### On initial load

- gentle fade/scale entrance;
- slight upward motion.

### Idle

- very subtle floating motion;
- occasional gentle blink if implementation permits without excessive complexity.

### Greeting

Optional small wave animation.

Do NOT:

- bounce constantly;
- spin;
- flash;
- shake;
- animate aggressively;
- distract from the message.

Respect:

```css
prefers-reduced-motion
```

Disable/reduce non-essential animation for users requesting reduced motion.

---

# 20. HERO DECORATION

Behind Skuggle use very subtle decorative shapes:

- pale cream circles;
- lavender abstract forms;
- tiny sparkles;
- soft geometric patterns.

Avoid visual noise.

Include small education-related decorative objects only where useful:

- books;
- graduation cap;
- small plant.

Keep them secondary.

---

# 21. FEATURE SUMMARY

Immediately beneath the hero add four lightweight feature cards.

### Student Records

Supporting text:

> Securely manage complete student information in one place.

### Assessments

> Create assessments, record scores and simplify academic workflows.

### Parent Engagement

> Keep families informed and connected to their children's progress.

### Performance Insights

> Turn school and student data into clear, actionable insights.

Use simple icons.

Avoid large illustrations in these cards.

---

# 22. FEATURE CARD DESIGN

Cards should use:

- white/warm-white surface;
- subtle border;
- rounded 16–20px corners;
- very subtle shadow;
- icon container;
- title;
- maximum two lines of description.

Do not make cards excessively tall.

Add a small hover lift on pointer devices.

---

# 23. PRODUCT CAPABILITY SECTION

Below the initial fold, introduce the main product areas.

Use a clean section heading such as:

# Everything your school needs.
## Without the complexity.

Highlight:

- Student Management
- Academics
- Assessment
- Attendance
- Parent Engagement
- School Finance
- Reporting
- Performance Intelligence

Do not create a giant wall of 20 feature cards.

Use grouped categories.

---

# 24. SKUGGLE INTELLIGENCE SECTION

Create a visually distinct but minimal section introducing Skuggle intelligence.

Heading:

# Meet Skuggle.
## Intelligence built into your school.

Copy should communicate that the AI assistant helps teachers and school leaders with:

- lesson preparation;
- curriculum support;
- assessment creation;
- performance understanding;
- school insights.

Do not make exaggerated AI claims.

Skuggle assists users.

Humans remain responsible for final academic decisions.

---

# 25. OPTIONAL ROBOT REAPPEARANCE

The Skuggle character may appear again in this section in a smaller pose.

Do not duplicate the same giant hero artwork.

Example:

```text
Skuggle holding a tablet
```

or:

```text
Skuggle pointing toward an insight card
```

Maintain exactly the same visual identity.

---

# 26. SMARTMARK FEATURE TEASER

Introduce one distinctive Skuggle capability:

### Print. Scan. Mark. Done.

Briefly explain:

> Teachers can prepare assessments digitally, print them for students, scan completed answer sheets and automatically process objective scores with teacher review.

Use a simple three-step or four-step visual:

```text
Create
  ↓
Print
  ↓
Scan
  ↓
Review
```

Keep this section visual and concise.

Do not implement the SmartMark application workflow on the marketing page.

---

# 27. SOCIAL PROOF

Do not use fake production figures.

This is critical.

Do NOT hardcode claims such as:

```text
2,500+ Schools
1.2M Students
85% Time Saved
```

unless those figures are backed by real production data.

For the current product stage, use credible non-numeric trust statements such as:

```text
Built for modern schools
Privacy-first architecture
Mobile & PWA ready
Designed for Nigerian education
```

Do not manufacture customer logos.

---

# 28. NIGERIAN MARKET RELEVANCE

Communicate subtly that Skuggle is designed for real school environments including:

- mobile-first access;
- inconsistent connectivity;
- paper-to-digital assessment;
- configurable academic structures;
- school-specific branding.

Do not make the page feel geographically restrictive if future expansion is intended.

---

# 29. FINAL CTA

Near the bottom create a spacious final conversion section.

Example:

# Ready to run your school smarter?

Supporting:

> Create your Skuggle school workspace and start building a connected digital school.

Buttons:

```text
Create School Account
Book Demo
```

Optionally place a small friendly Skuggle Robot beside this CTA.

---

# 30. FOOTER

Minimal footer structure:

### Product

- Features
- Solutions
- Pricing

### Company

- About
- Contact

### Resources

- Help
- Support

### Legal

- Privacy
- Terms

Bottom:

```text
© Skuggle
```

Do not hardcode an outdated year.

Calculate it dynamically:

```typescript
new Date().getFullYear()
```

---

# 31. MOBILE DESIGN

Mobile is mandatory.

At approximately:

```text
360px
375px
390px
414px
```

the hero should become:

```text
Logo / Menu

Eyebrow

Run your school.
Smarter, together.

Description

[ Get Started ]
[ Book Demo ]

      Skuggle Robot
```

Robot must not be squeezed beside text.

Stack vertically.

Keep the character large enough to retain personality.

---

# 32. TABLET DESIGN

At approximately:

```text
768px
820px
1024px
```

allow flexible two-column or stacked layouts depending on available width.

Avoid overlapping the robot and hero text.

---

# 33. DESKTOP DESIGN

Test:

```text
1280px
1366px
1440px
1920px
```

Set a maximum content width.

Recommended:

```text
max-width: 1440px
```

or equivalent.

Do not stretch text from one side of an ultra-wide display to the other.

---

# 34. PERFORMANCE

The landing page must be exceptionally fast.

Audit:

- hero image size;
- fonts;
- animation;
- JavaScript;
- unnecessary libraries;
- layout shifts.

Use:

- image compression;
- responsive images;
- lazy loading below the fold;
- route-based code splitting where applicable;
- efficient fonts.

Do not lazy-load the primary above-the-fold robot asset so late that visitors stare at an empty space.

Use appropriate preload/fetch priority if beneficial.

---

# 35. CORE WEB VITALS

Target:

```text
LCP < 2.5s
CLS < 0.1
INP < 200ms
```

under reasonable conditions.

Avoid significant layout movement while the robot artwork loads.

Specify image dimensions/aspect ratio.

---

# 36. ACCESSIBILITY

Implement:

- proper semantic headings;
- alt text;
- keyboard navigation;
- focus styles;
- sufficient contrast;
- accessible menu;
- accessible buttons;
- reduced-motion support.

Robot alt text should describe purpose rather than every pixel.

Example:

```text
Skuggle, the friendly AI school assistant, waving while holding a school book.
```

---

# 37. NAVIGATION ACTIONS

Configure:

```text
Sign In
→ /login
```

```text
Get Started
→ /register-school
```

Do not leave buttons dead.

If `/pricing`, `/about` or other pages are not currently implemented, use section anchor navigation rather than creating broken routes.

---

# 38. SMOOTH PAGE INTERACTION

For same-page navigation:

```text
Features
Solutions
About
```

use smooth scrolling.

Maintain proper scroll offset for sticky navigation.

---

# 39. PAGE STATES

Handle:

- asset loading;
- navigation state;
- mobile menu open/close;
- reduced motion;
- failed image loading.

A missing robot image must not collapse the hero layout.

---

# 40. SEO BASICS

Set:

```text
title:
Skuggle | Smart School Operating & Learning Platform
```

Meta description:

> Manage students, academics, assessments, performance and parent engagement with Skuggle, the smart platform built for modern schools.

Include sensible OpenGraph metadata architecture if the project supports it.

---

# 41. DO NOT INCLUDE

Do not place the authenticated dashboard screenshot in the hero.

The **Skuggle Robot replaces the previous dashboard preview**.

Also avoid:

- giant metric counters;
- fake client logos;
- excessive testimonials;
- pricing table above the fold;
- sidebar navigation;
- login fields directly on homepage;
- excessive gradients;
- glassmorphism everywhere;
- floating animated objects everywhere;
- chatbot popup covering content.

---

# 42. DESIGN CONSISTENCY

The public landing page must visually connect with:

- login page;
- school registration page;
- authenticated Skuggle dashboards.

Maintain shared:

- purple brand colour;
- typography;
- button styling;
- rounded corners;
- icon style;
- spacing;
- subtle warm backgrounds.

The transition:

```text
Landing Page
→ School Registration
→ Login
→ Skuggle Dashboard
```

must feel like one product.

---

# 43. SKUGGLE CHARACTER SYSTEM

Treat Skuggle as a future reusable character system.

Prepare variants conceptually such as:

```text
welcome
thinking
teaching
celebrating
explaining
alert
success
empty-state
```

Do not implement every pose now.

Implement the component architecture so future assets can be swapped by state.

Example:

```typescript
type SkugglePose =
  | "welcome"
  | "thinking"
  | "teaching"
  | "celebrating"
  | "success";
```

---

# 44. FUTURE CHARACTER USE

The same Skuggle character may later appear in:

### Teacher Workspace

> Need help preparing today's Mathematics lesson?

### Student Dashboard

> Great progress, Nathan!

### Parent Dashboard

> Nathan improved in Mathematics this week.

### Administrator

> Three assessment approvals need your attention.

Do NOT implement these now.

The landing page simply establishes the character visually.

---

# 45. IMPLEMENTATION QUALITY

Before completing the task:

- run TypeScript checking;
- run production build;
- resolve broken imports;
- resolve console errors;
- test navigation;
- test mobile menu;
- test desktop;
- test tablet;
- test mobile;
- check image performance;
- check accessibility;
- verify all visible buttons work.

Do not suppress errors to achieve a successful build.

---

# 46. PRESERVE EXISTING APPLICATION

Do not damage:

- authentication;
- registration;
- dashboards;
- PWA;
- routing;
- backend API integration;
- existing school workspace.

This is a **public landing-page implementation**, not permission to rewrite the application.

---

# 47. EXPECTED RESULT

The finished page should immediately communicate:

> **Skuggle is a modern, intelligent and approachable school platform.**

Visitors should understand within seconds:

1. what Skuggle is;
2. who it is for;
3. why it is useful;
4. that Skuggle includes intelligent assistance;
5. how to register;
6. how to sign in.

The Skuggle Robot must become a memorable part of the brand without making the product look childish.

The final visual impression should be:

**premium education technology + warmth + intelligence + simplicity.**

Do not stop after creating the hero.

Implement the complete responsive landing page and validate it against the existing application.