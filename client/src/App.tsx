import { Suspense, lazy } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import { useCountries, getCountryByBrand } from "@/hooks/use-countries";

// Lazy load pages
const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/Home"));

function CountryValidator({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: countries, isLoading, error } = useCountries();

  const brandIdentifier = location.split("/")[1];

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <NotFound />
      </Suspense>
    );
  }

  if (!brandIdentifier || !getCountryByBrand(countries, brandIdentifier)) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <NotFound />
      </Suspense>
    );
  }

  return <>{children}</>;
}

function Router() {
  const { data: countries } = useCountries();

  if (!countries?.length) {
    return null;
  }

  return (
    <Layout>
      <Suspense fallback={<div className="p-4">Loading page...</div>}>
        <Switch>
          <Route
            path="/"
            component={() => (
              <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md max-w-md mx-auto mt-10">
                <h1 className="text-xl font-bold mb-2">Wrong configuration</h1>
                <p className="mb-4">
                  Please specify a valid brand identifier in the URL (e.g.,
                  /betpawa-gh, /betpawa-ng, etc.)
                </p>
                <p className="text-sm">
                  Supported brand identifiers:{" "}
                  {countries.map((c) => c.brandIdentifier).join(", ")}
                </p>
              </div>
            )}
          />
          <Route path="/:brandIdentifier">
            {(params) => (
              <CountryValidator>
                <Home brandIdentifier={params.brandIdentifier} />
              </CountryValidator>
            )}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </Suspense>
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
