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
- **Dynamic Routing**: Country-specific URLs (e.g., `/gh/`, `/ng/`)
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

### Server-Side Optimizations
- **Compression**: Gzip compression enabled with configurable levels and thresholds
- **Security Headers**: Helmet.js for security headers and CSP configuration
- **Caching**: Multi-layer caching strategy with 5-minute API cache and 1-year static asset cache
- **Request Deduplication**: Prevents duplicate API calls for identical requests
- **Memory Management**: Automatic memory monitoring and cache cleanup
- **HTTP/2 Optimization**: Keep-alive connections and proper cache headers

### Client-Side Optimizations
- **Lazy Loading**: Components lazy-loaded to reduce initial bundle size
- **Query Optimization**: TanStack Query with 5-minute stale time and structural sharing
- **Font Preloading**: Roboto font preloaded for better rendering performance
- **Performance Hooks**: Debounce, throttle, and expensive computation monitoring
- **Bundle Splitting**: Manual chunk splitting for vendor libraries

### Caching Strategy
- **API Responses**: 5-minute server-side cache with X-Cache headers
- **Static Assets**: 1-year cache for immutable assets (JS, CSS, fonts)
- **Hot Selections**: 5-minute cache for processed betting data
- **Countries Data**: Session storage with automatic cleanup

### Build Optimizations
- **Tree Shaking**: Automatic dead code elimination
- **Minification**: Production builds use Terser with console removal
- **Asset Optimization**: Hashed filenames for cache busting
- **Modern JavaScript**: ES2020 target for smaller bundles

## Changelog

```
Changelog:
- July 03, 2025. Added comprehensive performance optimizations including compression, caching, lazy loading, and bundle optimization
- July 03, 2025. Implemented Google Analytics tracking integration
- July 03, 2025. Added window.parent.postMessage for booking code communication
- July 01, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```