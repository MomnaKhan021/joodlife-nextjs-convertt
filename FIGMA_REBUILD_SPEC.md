# 🎨 FIGMA REBUILD SPECIFICATION

## DESIGN SYSTEM (FROM FIGMA EXTRACTION)

### COLOR PALETTE
- Primary Dark: #0c2421
- Teal: #0b3b3c  
- Sage Green: #87af73
- Sage Light: #d3dabe
- Cream: #f7f9f2
- Dark Text: #142e2a
- White: #ffffff

### TYPOGRAPHY
- **Heading Font**: Plus Jakarta Sans (500, 600, 700)
  - Playfair Display for italics
- **Body Font**: Outfit (400, 500, 600, 700)
- **Sizes**: 16px, 18px, 20px, 28px, 40px, 56px, 80px

### SPACING SYSTEM
- Section padding: 80px horizontal, 80px vertical
- Component gaps: 12px, 15px, 16px, 20px, 24px, 30px, 40px, 51px, 60px, 80px
- Border radius: 4px, 8px, 12px, 16px, 24px

---

## COMPONENT REBUILD ORDER & SPECIFICATIONS

### 1. HERO SECTION (PRIORITY: CRITICAL)
**Location**: `components/Hero.tsx`

**Specs from Figma**:
- Full viewport height (h-screen)
- Background image with gradient overlay
- Sticky navbar offset (pt-20)
- Headline: 56px, line-height 1.1, letter-spacing -2.24px
- Stars: 5-star rating (emoji or image)
- Subtext: "3K+ happy customers"
- 3 bullet points with checkmark icons
- CTA Button: "Get started" (white border glass effect)

**Images to fetch**:
- Background image
- Checkmark/verification icons

**Actions**:
- [ ] Extract exact hero image URL from Figma
- [ ] Update background image src
- [ ] Verify spacing (gap-[40px], gap-[15px], pt-20)
- [ ] Confirm typography (56px, Playfair italic)
- [ ] Test on localhost:3000

---

### 2. NAVBAR (PRIORITY: HIGH)
**Location**: `components/Navbar.tsx`

**Specs**:
- Fixed position with sticky behavior
- Logo: 30px × 95px
- Navigation items: Home, Shop, FAQs, Reviews
- Right side: Get Started button, User icon, Cart icon
- Scroll effect: bg-black/80 when scrolled

**Actions**:
- [ ] Update logo image URL
- [ ] Update icon URLs (user, cart)
- [ ] Verify spacing and positioning

---

### 3. USP BAR (PRIORITY: HIGH)
**Location**: `components/UspBar.tsx`

**Specs**:
- Exact height: 64px
- Background: sage color (#87af73)
- Marquee animation: 30s infinite
- 5 items duplicated for scroll
- Icon size: 32.4px × 32.4px

**Icons to update**:
- UK Licensed medication
- Clinically proven
- Free next-day delivery
- Cancel anytime
- Medical support

**Actions**:
- [ ] Map icon URLs from Figma
- [ ] Update all 5 icon components

---

### 4. WEIGHT TRACKER (PRIORITY: HIGH)
**Location**: `components/WeightTracker.tsx`

**Specs**:
- Background: sage-light with 24px radius
- Layout: flex with gap-51px
- Weight counter: 0 → 98kg animation
- Progress slider: 243px × 22px
- 27% stat card with sage background
- Product box: absolute positioned, rotate -0.54deg

**Images**:
- Circle graph image
- Product box image

**Actions**:
- [ ] Update circle graph image URL
- [ ] Update product box image URL
- [ ] Verify all sizing and positioning

---

### 5. REVIEWS (PRIORITY: MEDIUM)
**Location**: `components/Reviews.tsx`

**Specs**:
- 4-column grid on desktop
- Cards: bg-cream, rounded-4px, padding-32px
- Gap: 16px between cards
- 4 reviews displayed as grid (not carousel)
- Star rating image above each quote

**Images**:
- Star rating image (1 image for all cards)

**Actions**:
- [ ] Update star image URL
- [ ] Verify 4-column grid layout
- [ ] Test responsive behavior

---

### 6-13. OTHER COMPONENTS
- WhatToExpect (4-step guide)
- ExpertGuidance (2-column layout)
- Features (6-item 3-column grid)
- HowItWorks (4-step vertical)
- Quiz (form section)
- FAQ (accordion)
- BlogPosts (3-item grid)
- Footer (5-column footer)

---

## REBUILD CHECKLIST

### Phase 1: Image URLs
- [ ] Extract all 84 image URLs from Figma images JSON
- [ ] Map each image to its component
- [ ] Create image constants for each component
- [ ] Verify all URLs are accessible

### Phase 2: Hero Component
- [ ] Rebuild Hero.tsx with exact Figma specs
- [ ] Update image URLs
- [ ] Test localhost:3000
- [ ] Verify pixel-perfect match

### Phase 3: Supporting Components
- [ ] Update Navbar with correct images
- [ ] Update UspBar icon URLs
- [ ] Update WeightTracker images
- [ ] Update Reviews star image
- [ ] Verify all other components

### Phase 4: Testing
- [ ] Responsive testing (mobile, tablet, desktop)
- [ ] Visual comparison with Figma
- [ ] Performance check
- [ ] Build verification

### Phase 5: Deployment
- [ ] Commit changes
- [ ] Push to main
- [ ] Verify on production

---

## IMAGE EXTRACTION STATUS
✅ Total Images: 84  
✅ Image URLs: Working S3 CDN links  
✅ Mapping: In progress

---

## TOOLS & RESOURCES
- Figma API: Authenticated and working
- Token: Use FIGMA_TOKEN environment variable
- Images Map: `.figma_images_map.json`
- Dev Server: localhost:3000 (running)

