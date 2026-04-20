# 🚀 PIXEL-PERFECT FIGMA REBUILD PLAN

## CURRENT STATUS
✅ Figma token validated  
✅ 84 image assets extracted  
✅ File structure analyzed  
✅ localhost:3000 running  

## REBUILD STRATEGY

### PHASE 1: Component Analysis
- [x] Extract Figma file structure
- [x] Identify all sections
- [x] Map image assets
- [ ] Document design tokens (colors, fonts, spacing)
- [ ] Create component spec sheet

### PHASE 2: Design Token Extraction
Tasks:
- Extract all colors from Figma
- Extract typography (fonts, sizes, weights, line heights)
- Extract spacing/padding/gaps
- Extract border radius values
- Document all components and variants

### PHASE 3: Component Rebuild (Priority Order)
1. **Navbar** - Fixed header, sticky behavior
2. **Hero** - Large background image, headline, CTAs
3. **UspBar** - Horizontal scrolling marquee
4. **WeightTracker** - Interactive with images/graphs
5. **Reviews** - Card grid with images
6. **WhatToExpect** - 4-column step layout
7. **ExpertGuidance** - 2-column content
8. **Features** - 6-item grid
9. **HowItWorks** - Vertical step process
10. **Quiz** - Form section
11. **FAQ** - Accordion component
12. **BlogPosts** - Card carousel
13. **Footer** - Multi-column layout

### PHASE 4: Image Integration
- Replace all image URLs with working Figma CDN URLs
- Ensure next/image optimization
- Verify responsive image handling

### PHASE 5: Quality Assurance
- Visual comparison with Figma
- Responsive testing (mobile, tablet, desktop)
- Performance check
- Build verification

## TECHNICAL APPROACH

### Using Figma API
```bash
# Get file structure
curl https://api.figma.com/v1/files/{FILE_ID} \
  -H "X-Figma-Token: {TOKEN}"

# Get nodes with geometry
curl https://api.figma.com/v1/files/{FILE_ID}/nodes?ids={NODE_ID}&geometry=include" \
  -H "X-Figma-Token: {TOKEN}"

# Get images
curl https://api.figma.com/v1/files/{FILE_ID}/images" \
  -H "X-Figma-Token: {TOKEN}"
```

### Component Structure
```
components/
├── Navbar.tsx (UPDATED with exact Figma specs)
├── Hero.tsx (UPDATED)
├── UspBar.tsx (UPDATED)
├── WeightTracker.tsx (UPDATED)
├── Reviews.tsx (UPDATED)
├── WhatToExpect.tsx (UPDATED)
├── ExpertGuidance.tsx (UPDATED)
├── Features.tsx (UPDATED)
├── HowItWorks.tsx (UPDATED)
├── Quiz.tsx (UPDATED)
├── Faq.tsx (UPDATED)
├── BlogPosts.tsx (UPDATED)
└── Footer.tsx (UPDATED)

app/
├── layout.tsx (Design tokens, fonts)
├── globals.css (Colors, animations)
└── page.tsx (Component assembly)
```

## NEXT IMMEDIATE STEPS

1. Extract design tokens from Figma
2. Update app/globals.css with exact colors/spacing
3. Rebuild each component systematically
4. Update all image URLs to working Figma CDN URLs
5. Test on localhost:3000
6. Verify pixel-perfect match

## BLOCKING DEPENDENCIES
None - all assets and token access confirmed working.

