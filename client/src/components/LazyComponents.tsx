import { lazy } from 'react';

// Lazy load heavy components to improve initial bundle size
export const LazyBetslipResults = lazy(() => import('./BetslipResults'));
export const LazyProcessingState = lazy(() => import('./ProcessingState'));
export const LazyNoMatchState = lazy(() => import('./NoMatchState'));
export const LazyErrorState = lazy(() => import('./ErrorState'));