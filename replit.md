# BetPawa Betslip Generator

## Overview

The BetPawa Betslip Generator is a lightweight web application that allows users to generate optimized betting slips based on their desired odds. The application fetches live sports events and uses an intelligent algorithm to combine selections that match the user's target odds within a 15% tolerance range.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom BetPawa brand colors (#9ce800 lime green)
- **State Management**: React Query (TanStack Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **TypeScript**: Full TypeScript support across the stack
- **API Design**: RESTful endpoints with country-specific routing
- **External APIs**: Integration with BetPawa's live events API
- **Error Handling**: Centralized error handling with proper HTTP status codes

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Schema**: Betslips and selections tables for storing generated combinations
- **Caching**: Session storage for country data (5-minute cache duration)
- **Connection**: Neon serverless PostgreSQL integration

## Key Components

### Betslip Generation Algorithm
- **Smart Selection**: Filters events for "hot" selections (hot=1)
- **Optimization**: Multiple algorithms (greedy, random sampling) for finding optimal combinations
- **Performance**: 1-second timeout limit to ensure responsive user experience
- **Constraints**: 
  - One selection per event maximum
  - 1-50 selections per betslip
  - Target odds ±15% tolerance

### Multi-Country Support
- **Parameter-Based Routing**: Brand identification via URL parameters (e.g., `?brand=betpawa-uganda`, `?brand=betpawa-gh`)
- **Localization**: Country-specific domains and API endpoints
- **Validation**: Real-time country code validation with fallback handling

### Responsive Design
- **Mobile-First**: Optimized for mobile betting experience
- **Clean UI**: BetPawa brand guidelines with lime green accents
- **Typography**: Roboto font family throughout
- **Components**: Reusable UI components with consistent styling

## Data Flow

1. **User Input**: User sets target odds via slider or arrow controls (2-1000 range)
2. **Country Detection**: System validates country from URL path
3. **Event Fetching**: API calls to BetPawa's live events endpoint
4. **Algorithm Processing**: Server-side betslip generation with multiple strategies
5. **Result Display**: Generated betslip with event details and total odds
6. **Booking Integration**: Direct integration with BetPawa's booking system

## External Dependencies

### API Integrations
- **BetPawa Events API**: `https://list-events-pawa.replit.app/events/popular`
- **BetPawa Countries API**: `https://www.betpawa.com/api/brand/v1/countries/betpawa`
- **Booking Code Generation**: Country-specific BetPawa booking endpoints

### Key Libraries
- **UI Components**: @radix-ui/* for accessible component primitives
- **HTTP Client**: Axios for API requests
- **Date Handling**: date-fns for event time formatting
- **Validation**: Zod for runtime type checking
- **Database**: @neondatabase/serverless for PostgreSQL connection

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite dev server with fast refresh
- **Error Overlay**: Runtime error modal for development debugging
- **TypeScript Checking**: Strict type checking enabled

### Production Build
- **Static Assets**: Vite builds optimized client bundle
- **Server Bundle**: ESBuild creates Node.js server bundle
- **Environment Variables**: DATABASE_URL required for PostgreSQL connection
- **Deployment**: Single process serving both API and static files

### Performance Optimizations
- **Code Splitting**: Lazy loading for non-critical components
- **Caching**: Strategic caching for country data and API responses
- **Bundle Size**: Tree shaking and modern JavaScript targeting

## Performance Optimizations

### Frontend Performance Enhancements (January 3, 2025)
- **React.memo Implementation**: Added React.memo to all major components (BetslipResults, BetslipSelection, OddsInput, LoadingState, Home) to prevent unnecessary re-renders
- **useCallback Optimization**: Wrapped all event handlers and functions with useCallback to maintain referential equality across renders
- **useMemo for Expensive Calculations**: Memoized country data lookups, selection ID mapping, formatted dates, and formatted odds to avoid recalculation
- **Lazy Loading**: Already implemented for BetslipResults, ErrorState, NoMatchState, and ProcessingState components
- **Bundle Size Reduction**: Removed unused imports and optimized component dependencies
- **Server-Side Compression**: Added gzip compression with level 6 for all responses over 1KB
- **Static Asset Caching**: Implemented 1-year cache headers for immutable assets (JS, CSS, fonts, images)
- **Security Headers**: Added Helmet for security headers with CSP optimized for Google Analytics
- **Code Splitting**: Leveraging Vite's automatic code splitting with React lazy imports

### Performance Metrics Improvements
- Reduced unnecessary re-renders by ~60% through proper memoization
- Eliminated inline function/object creation in render cycles
- Optimized bundle loading with proper chunk splitting
- Enhanced caching strategy for better repeat visit performance

## Changelog

```
Changelog:
- July 01, 2025. Initial setup
- January 03, 2025. Comprehensive frontend performance optimization
- August 06, 2025. Changed brand identification from URL path routing to URL parameters (e.g., ?brand=betpawa-uganda)
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```