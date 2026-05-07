import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@aliengain/components";
import Layout from "@/components/Layout";
import { useCountries, getCountryByBrand } from "@/hooks/use-countries";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";

function CountryValidator({ children }: { children: React.ReactNode }) {
  const { data: countries, isLoading, error } = useCountries();

  const urlParams = new URLSearchParams(window.location.search);
  const brandIdentifier = urlParams.get("brand");

  if (isLoading) {
    return <div style={{ padding: "1rem" }}>Loading...</div>;
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
      <ThemeProvider defaultTheme="light">
        <Router />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
