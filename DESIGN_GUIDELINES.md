# BetPawa App Design Guidelines

## Design Philosophy

The BetPawa Betslip Generator application follows a clean, modern interface with a focus on usability and a professional appearance. The design uses a white background with bright lime green accents to match BetPawa's brand identity.

## Color Palette

### Primary Colors

- **Background:** `#ffffff` (White background)
- **Primary Green:** `#9ce800` (BetPawa lime green)
- **Text Primary:** `#252a2d` (Dark text)
- **Text Secondary:** `#6b7280` (Gray text)
- **Destructive:** `#ef4444` (Red)

### Neutral Colors

- **Neutral Light:** `#f4f5f0` (Light gray for input backgrounds)
- **Neutral Medium:** `#e6e7e2` (Borders and dividers)
- **Neutral Dark:** `#9ca3af` (Secondary text)

## Typography

- **Primary Font:** Roboto (Sans-serif font)
- **Headings:** Font weight 700 (Bold)
- **Body:** Font weight 400 (Regular)
- **Button Text:** Font weight 700 (Bold, Uppercase)

### Font Sizes

- **Large Headings:** 18px (1.125rem)
- **Section Headings:** 16px (1rem)
- **Body Text:** 14px (0.875rem)
- **Small Text:** 12px (0.75rem)
- **Button Text:** 14px (0.875rem)

## Component Styling

### Cards

The current design removes card borders for a cleaner look:

```css
.card-content {
  padding: 16px;
  margin-bottom: 24px;
  background: transparent;
}
```

### Buttons

**Primary Action Button (Generate/Load Betslip):**
```css
.button-primary {
  background-color: #9ce800;
  color: #252a2d;
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  height: 36px;
  padding: 0 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 150ms;
}

.button-primary:hover {
  background-color: #8bd700;
}

.button-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Odds Control Buttons:**
```css
.odds-control-button {
  background-color: #f4f5f0;
  color: #252a2d;
  padding: 8px;
  border: none;
  transition: background-color 150ms;
}

.odds-control-button:hover {
  background-color: #e6e7e2;
}
```

### Odds Input Controls

**Odds Display:**
```css
.odds-display {
  background-color: #f4f5f0;
  color: #252a2d;
  font-weight: 700;
  font-size: 20px;
  text-align: center;
  padding: 8px 16px;
  border-left: 1px solid #e6e7e2;
  border-right: 1px solid #e6e7e2;
  flex-grow: 1;
}
```

**Slider:**
```css
.odds-slider {
  width: 100%;
  margin: 24px 0;
}
```

### Progress Bar

```css
.progress-container {
  width: 100%;
  height: 8px;
  background-color: #e6e7e2;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #9ce800;
  transition: width 150ms ease-out;
}
```

## Layout Guidelines

### Spacing

- **Extra Small:** 4px (0.25rem)
- **Small:** 8px (0.5rem)
- **Medium:** 16px (1rem)
- **Large:** 24px (1.5rem)
- **Extra Large:** 32px (2rem)

### Container Widths

- **Mobile:** 100% (with 16px padding)
- **Tablet:** 768px
- **Desktop:** 1024px

### Responsive Breakpoints

- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

## Component Design Patterns

### Betslip Selection Item

Updated design with full-width layout and green odds background:

```jsx
<div className="border border-neutral-medium hover:bg-neutral-light transition-colors">
  <div className="p-3">
    {/* Event name with odds */}
    <div className="flex justify-between items-center w-full">
      <h4 className="text-[#252a2d] font-medium text-base">{eventName}</h4>
      <div className="bg-[#9CE800] text-[#252a2d] text-base font-bold px-2 py-0.5 rounded">
        {odds}
      </div>
    </div>
    
    {/* Event details */}
    <div className="text-xs text-neutral-dark mt-1">
      {formattedDate} - Football - {competition}
    </div>
    
    {/* Selection details */}
    <div className="mt-2 text-sm text-[#252a2d]">
      {marketName} - {selectionName}
    </div>
  </div>
</div>
```

### Error Messages

```jsx
<div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
  <h3 className="font-bold mb-2">{errorTitle}</h3>
  <p>{errorMessage}</p>
</div>
```

### Stats Card

Updated compact design for odds and selections:

```jsx
<div className="bg-neutral-light rounded-md p-2 flex-1">
  <div className="flex items-center justify-between">
    <p className="text-sm text-neutral-dark">{statLabel}:</p>
    <p className="text-base font-bold">{statValue}</p>
  </div>
</div>
```

## Animation Guidelines

- Use subtle transitions for hover and focus states (150ms duration)
- Apply smooth transitions for loading states and progress bars
- Limit animations to improve performance on mobile devices

## Icons

- Use Lucide icons for consistent UI elements
- Icon sizes: 16px (small), 20px (medium), 24px (large)
- Use `FaFire` from react-icons/fa for 'hot' indicators

## Additional UI Elements

### Loading Spinner

```jsx
<div className="flex items-center justify-center p-4">
  <Loader2 className="h-6 w-6 animate-spin text-secondary" />
  <span className="ml-2 text-sm font-medium">Loading...</span>
</div>
```

### Toast Notifications

```jsx
// Success toast
toast({
  title: "Success",
  description: "Your action was completed successfully",
})

// Error toast
toast({
  title: "Error",
  description: "There was a problem completing your action",
  variant: "destructive"
})
```

## Implementation with Tailwind CSS

The design system is implemented using Tailwind CSS with the following configuration:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: '#121212',
        secondary: '#6ded8a',
        'neutral-light': '#1e1e1e',
        'neutral-medium': '#2e2e2e',
        'neutral-dark': '#a1a1a1',
      },
    },
  },
}
```

To maintain consistency, compose utility classes using shadcn/ui components and Tailwind CSS.

## Accessibility Considerations

- Maintain sufficient color contrast (WCAG AA minimum)
- Include hover and focus states for interactive elements
- Ensure proper heading hierarchy (h1, h2, h3, etc.)
- Add appropriate alt text for images
- Use semantic HTML elements

## Best Practices

1. **Consistent Spacing:** Apply consistent spacing between elements using the spacing scale
2. **Typography Hierarchy:** Maintain a clear visual hierarchy with appropriate font sizes and weights
3. **Color Usage:** Use the secondary color (lime green) for important actions and highlights
4. **Responsive Design:** Design for mobile-first, then adjust for larger screens
5. **Feedback States:** Provide clear visual feedback for all interactive elements

## Live Components Reference

To view the application's components in action, navigate to the `/gh` route in the application.
