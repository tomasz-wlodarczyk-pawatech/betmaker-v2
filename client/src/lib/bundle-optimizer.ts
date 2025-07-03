// Bundle optimization utilities for maximum performance

// Tree-shake unused date-fns functions by importing only what we need
export { format, parseISO } from 'date-fns';

// Optimize lucide-react imports to reduce bundle size
export { 
  Loader2,
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Trophy
} from 'lucide-react';

// Optimize React Query imports
export { 
  useQuery,
  useMutation,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';

// Critical UI components only
export { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';

export { 
  Slider 
} from '@/components/ui/slider';

export { 
  Toaster 
} from '@/components/ui/toaster';

export { 
  TooltipProvider 
} from '@/components/ui/tooltip';

// Remove unused exports and components to reduce bundle
// This file serves as a central import optimizer