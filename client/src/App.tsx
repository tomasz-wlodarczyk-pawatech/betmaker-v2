import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import { useCountries, getCountryByBrand } from "@/hooks/use-countries";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
// Lazy load pages

function CountryValidator({ children }: { children: React.ReactNode }) {
  const { data: countries, isLoading, error } = useCountries();

  const urlParams = new URLSearchParams(window.location.search);
  const brandIdentifier = urlParams.get("brand");

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <NotFound />;
  }

  if (!brandIdentifier || !getCountryByBrand(countries, brandIdentifier)) {
    return <NotFound />;
  }

  return <>{children}</>;
}

function Router() {
  const { data: countries } = useCountries();
  const urlParams = new URLSearchParams(window.location.search);
  const brandIdentifier = urlParams.get("brand");
  if (!countries?.length) {
    return null;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/">
          <CountryValidator>
            <Home brandIdentifier={brandIdentifier ?? ""} />
          </CountryValidator>
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
