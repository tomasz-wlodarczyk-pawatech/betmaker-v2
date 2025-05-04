# BetPawa App Design Guidelines

## Design Philosophy

The BetPawa Betslip Generator application follows a clean, modern interface with a focus on usability and a professional appearance. The design uses a dark theme with lime green accents to match BetPawa's brand identity.

## Color Palette

### Primary Colors

- **Background:** `#121212` (Dark background)
- **Secondary:** `#6ded8a` (Lime green)
- **Text:** `#ffffff` (White)
- **Destructive:** `#ef4444` (Red)

### Neutral Colors

- **Neutral Light:** `#1e1e1e` (Lighter background for cards)
- **Neutral Medium:** `#2e2e2e` (Borders)
- **Neutral Dark:** `#a1a1a1` (Secondary text)

## Typography

- **Primary Font:** Inter (Sans-serif font)
- **Headings:** Font weight 600-700
- **Body:** Font weight 400
- **Input Labels:** Font weight 500

### Font Sizes

- **Large Headings:** 24px (1.5rem)
- **Section Headings:** 18px (1.125rem)
- **Body Text:** 16px (1rem)
- **Small Text:** 14px (0.875rem)
- **Very Small Text:** 12px (0.75rem)

## Component Styling

### Cards

```css
.card {
  border-radius: 8px;
  background-color: #1e1e1e;
  border: 1px solid #2e2e2e;
  padding: 16px;
  margin-bottom: 16px;
}
```

### Buttons

**Primary Button:**
```css
.button-primary {
  background-color: #6ded8a;
  color: #121212;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 6px;
  transition: opacity 150ms;
}

.button-primary:hover {
  opacity: 0.9;
}

.button-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
```

**Secondary Button:**
```css
.button-secondary {
  background-color: #2e2e2e;
  color: #ffffff;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 6px;
  transition: background-color 150ms;
}

.button-secondary:hover {
  background-color: #3e3e3e;
}
```

### Form Inputs

```css
.input {
  background-color: #1e1e1e;
  border: 1px solid #2e2e2e;
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 6px;
  transition: border-color 150ms;
}

.input:focus {
  border-color: #6ded8a;
  outline: none;
}

.input-label {
  color: #a1a1a1;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
}
```

### Progress Bar

```css
.progress-container {
  width: 100%;
  height: 8px;
  background-color: #2e2e2e;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #6ded8a;
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

```jsx
<div className="border border-neutral-medium rounded-md p-3 hover:bg-neutral-light transition-colors">
  <div className="flex justify-between items-start mb-2">
    <div className="w-full">
      <h4 className="font-medium text-secondary">{eventName}</h4>
      <div className="text-xs text-neutral-dark mt-1">
        {competition} - {formattedDate}
      </div>
      <div className="flex items-center mt-2">
        <div className="text-sm">
          {marketName} - {selectionName}
        </div>
      </div>
    </div>
    <div className="bg-secondary text-white text-sm font-bold px-2 py-1 rounded ml-4 whitespace-nowrap">
      <span>{odds}</span>
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

```jsx
<div className="bg-neutral-light rounded-md p-3 flex-1">
  <p className="text-sm text-neutral-dark">{statLabel}</p>
  <p className="text-xl font-bold">{statValue}</p>
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
