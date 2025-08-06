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

  const urlParams = new URLSearchParams(window.location.search);
  const brandIdentifier = urlParams.get('brand');

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return (
      <Suspense>
        <NotFound />
      </Suspense>
    );
  }

  if (!brandIdentifier || !getCountryByBrand(countries, brandIdentifier)) {
    return (
      <div className="p-4 bg-[#F4F5F0] border border-destructive text-destructive rounded-md max-w-md mx-auto mt-10">
        <h1 className="text-xl font-bold mb-2">Wrong configuration</h1>
        <p className="mb-4">
          Please specify a valid brand identifier in the URL parameter (e.g.,
          ?brand=betpawa-uganda, ?brand=betpawa-gh, etc.)
        </p>
        <p className="text-sm">
          Supported brand identifiers:{" "}
          {countries?.map((c) => c.brandIdentifier).join(", ")}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

function BrandBasedHome() {
  const urlParams = new URLSearchParams(window.location.search);
  const brandIdentifier = urlParams.get('brand');
  
  return <Home brandIdentifier={brandIdentifier || ''} />;
}

function Router() {
  const { data: countries } = useCountries();

  if (!countries?.length) {
    return null;
  }

  return (
    <Layout>
      <Suspense>
        <Switch>
          <Route path="/">
            <CountryValidator>
              <BrandBasedHome />
            </CountryValidator>
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
