import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { CountryData } from "../lib/countries.ts";
import { COUNTRIES } from "../lib/countries.ts";

export function useCountries(): UseQueryResult<CountryData[], never> {
  return useQuery({
    queryKey: ["countries-static"],
    queryFn: () => COUNTRIES,
    staleTime: Infinity,
    retry: false,
  });
}

export function getCountryByBrand(
  countries: CountryData[] | undefined,
  brandIdentifier: string,
): CountryData | undefined {
  return (countries ?? COUNTRIES).find(
    (c) => c.brandIdentifier.toLowerCase() === brandIdentifier.toLowerCase(),
  );
}
