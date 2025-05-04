import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Layout from "@/components/Layout";

// List of supported country codes
const SUPPORTED_COUNTRIES = [
  'ao', 'bj', 'bw', 'cd', 'cf', 'cg', 'ci', 'cm', 'ga', 'gh', 
  'ke', 'lr', 'ls', 'mw', 'mz', 'ng', 'rw', 'sl', 'sn', 'tz', 'ug', 'zm', 'zw'
];

function CountryValidator({ children }: { children: React.ReactNode }) {
  // Get current location
  const [location] = useLocation();
  
  // Extract country code from path
  const countryCode = location.split("/")[1]?.toLowerCase();
  
  // Check if country code is supported
  if (!countryCode || !SUPPORTED_COUNTRIES.includes(countryCode)) {
    return <NotFound />;
  }
  
  return <>{children}</>;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={() => (
          <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md max-w-md mx-auto mt-10">
            <h1 className="text-xl font-bold mb-2">Wrong configuration</h1>
            <p className="mb-4">Please specify a country code in the URL (e.g., /gh, /ng, etc.)</p>
            <p className="text-sm">Supported countries: {SUPPORTED_COUNTRIES.join(', ')}</p>
          </div>
        )} />
        <Route path="/:country">
          {(params) => (
            <CountryValidator>
              <Home country={params.country} />
            </CountryValidator>
          )}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
