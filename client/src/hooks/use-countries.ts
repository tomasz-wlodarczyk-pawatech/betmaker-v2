import { useQuery } from "@tanstack/react-query";

export interface CountryData {
  brandIdentifier: string;
  countryIso2Code: string;
  rootDomain: string;
}

const CACHE_KEY = "betpawa_countries";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchCountries(): Promise<CountryData[]> {
  const cachedData = sessionStorage.getItem(CACHE_KEY);
  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  }

  const response = await fetch("/api/countries");
  if (!response.ok) {
    throw new Error("Failed to fetch country data");
  }

  const data = await response.json();

  sessionStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      data,
      timestamp: Date.now(),
    }),
  );

  return data;
}

export function useCountries() {
  return useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: CACHE_DURATION,
    retry: 2,
  });
}

export function getCountryByBrand(
  countries: CountryData[] | undefined,
  brandIdentifier: string,
): CountryData | undefined {
  return countries?.find(
    (c) => c.brandIdentifier.toLowerCase() === brandIdentifier.toLowerCase(),
  );
}
