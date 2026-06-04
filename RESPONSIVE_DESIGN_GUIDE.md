# MakTrip Responsive Design Guide

## Mobile-First Approach

All CSS follows mobile-first design principles. Start with mobile styling, then use media queries for larger screens.

---

## Breakpoints Reference

```css
/* Mobile (default) */
(no media query) - 320px to 767px

/* Tablet */
@media (max-width: 768px) { }

/* Large Tablet / Small Laptop */
@media (max-width: 992px) { }

/* Laptop */
@media (max-width: 1024px) { }

/* Desktop */
@media (max-width: 1440px) { }

/* Extra Small (edge case) */
@media (max-width: 360px) { }
```

---

## Back Button Positioning

The back button is now **fixed and responsive**. It automatically adjusts based on screen size.

```css
/* Top-left positioning automatically adjusts:
   Desktop: top: 100px, left: 20px
   Tablet:  top: 85px, left: 60px
   Mobile:  top: 80px, left: 70px
*/

.back-button {
    position: fixed;
    top: 100px;
    left: 20px;
    z-index: 999;
    /* ... other styles ... */
}
```

**Usage in components:**
```jsx
<button className="back-button" onClick={() => navigate(-1)}>
    ⬅ Back
</button>
```

---

## Glassmorphism Components

All dropdown menus and navigation items use glassmorphism for transparency.

### Recipe:
```css
.glassmorphic-element {
    background: rgba(255, 255, 255, 0.07);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}
```

---

## Touch-Friendly Sizes

All interactive elements follow minimum touch targets:

```css
/* Minimum sizes for touch targets */
button, input, select, textarea {
    min-height: 44px;
    min-width: 44px;
}

/* On mobile, use 16px font-size to prevent iOS zoom */
@media (max-width: 480px) {
    input, textarea, select {
        font-size: 16px;
    }
}
```

---

## Responsive Typography

Use `clamp()` for fluid typography:

```css
h1 {
    font-size: clamp(1.5rem, 5vw, 3rem);
}

p {
    font-size: clamp(0.875rem, 2vw, 1rem);
}
```

---

## Grid Layouts

Use `auto-fit` for responsive grids:

```css
.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
}

@media (max-width: 768px) {
    .grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }
}

@media (max-width: 480px) {
    .grid {
        grid-template-columns: 1fr;
    }
}
```

---

## Common Responsive Patterns

### Pattern 1: Stack on Mobile
```css
.container {
    display: flex;
    flex-direction: row;
    gap: 20px;
}

@media (max-width: 480px) {
    .container {
        flex-direction: column;
    }
}
```

### Pattern 2: Hide on Mobile
```css
.desktop-only {
    display: block;
}

@media (max-width: 480px) {
    .desktop-only {
        display: none;
    }
}
```

### Pattern 3: Responsive Padding
```css
.section {
    padding: 40px 20px;
}

@media (max-width: 768px) {
    .section {
        padding: 30px 15px;
    }
}

@media (max-width: 480px) {
    .section {
        padding: 20px 10px;
    }
}
```

---

## Form Input Best Practices

```css
input, textarea, select {
    padding: 12px 15px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    font-size: 1rem;
    font-family: inherit;
}

/* On mobile, larger font prevents zoom */
@media (max-width: 480px) {
    input, textarea, select {
        font-size: 16px;
        padding: 12px;
    }
}

/* Focus state */
input:focus, textarea:focus {
    outline: none;
    border-color: rgba(255, 107, 0, 0.5);
    box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.2);
}
```

---

## Accessibility Considerations

### Respect User Preferences
```css
/* Reduce animations if user prefers */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}

/* High contrast mode */
@media (prefers-contrast: high) {
    .element {
        border: 2px solid #ffffff;
        background: rgba(255, 255, 255, 0.95);
    }
}
```

---

## Common Issues & Solutions

### Issue: Horizontal Scrolling on Mobile
```css
/* Solution: Use overflow hidden or max-width 100% */
html, body {
    width: 100%;
    overflow-x: hidden;
}

img {
    max-width: 100%;
    height: auto;
}
```

### Issue: iOS Input Zoom
```css
/* Solution: Set font-size to 16px or higher */
@media (max-width: 480px) {
    input, textarea, select {
        font-size: 16px; /* 16px prevents zoom */
    }
}
```

### Issue: Modal Overflow on Mobile
```css
/* Solution: Use bottom sheet layout on mobile */
.modal {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
}

@media (min-width: 768px) {
    .modal {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        bottom: auto;
    }
}
```

---

## Performance Tips

1. **Use `clamp()` for responsive sizes** - Reduces media query count
2. **Prefer flexbox/grid** - Better performance than floats
3. **Use `min()`, `max()`, `clamp()`** - Modern CSS for responsiveness
4. **Minimize media queries** - Group related rules together
5. **Test on real devices** - Browser dev tools aren't always accurate

---

## Browser Support

All CSS features used are supported in:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

For older browsers, consider using PostCSS for automatic prefixing.

---

## Testing Checklist

- [ ] Test on iPhone SE (375px)
- [ ] Test on iPhone 12/13 (390px)
- [ ] Test on iPad (768px)
- [ ] Test on iPad Pro (1024px)
- [ ] Test on Desktop (1440px+)
- [ ] Test with iOS Safari
- [ ] Test with Chrome DevTools mobile mode
- [ ] Check form inputs don't cause zoom
- [ ] Verify touch targets are 44x44px minimum
- [ ] Check modal positioning on all sizes

---

## Quick Reference: CSS Variables (Recommended Future Addition)

```css
:root {
    /* Colors */
    --color-primary: #ff6a00;
    --color-secondary: #f7931e;
    --color-dark: rgba(0, 0, 0, 0.7);
    --color-text: #ffffff;
    --color-text-muted: rgba(255, 255, 255, 0.8);
    
    /* Spacing */
    --spacing-xs: 0.5rem;
    --spacing-sm: 1rem;
    --spacing-md: 1.5rem;
    --spacing-lg: 2rem;
    --spacing-xl: 3rem;
    
    /* Border Radius */
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    
    /* Shadows */
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
    --shadow-md: 0 4px 15px rgba(0, 0, 0, 0.2);
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.3);
    
    /* Z-index Scale */
    --z-dropdown: 1000;
    --z-modal: 10000;
    --z-sticky: 999;
}
```

---

## Resources

- MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries
- CSS-Tricks: https://css-tricks.com/a-complete-guide-to-grid/
- Can I Use: https://caniuse.com/

---

**Document Date:** 2026-04-01
**Last Updated:** 2026-04-01
