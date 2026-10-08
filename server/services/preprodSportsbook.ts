import type { Event } from "@/types";
import { fetchCashoutableSelectionIds } from "./sportsbookPrices";

// Preprod runs its own sportsbook (its own event/selection IDs) and has no
// environment on the MiniApps gateway — any `x-miniapp-env` other than
// `production` falls back to staging data there. So preprod events are read
// straight from the preprod sportsbook. The `x-pawa-brand` header picks the
// brand; the host's jurisdiction prefix doesn't matter.
const PREPROD_SPORTSBOOK_BASE_URL =
  process.env.PREPROD_SPORTSBOOK_BASE_URL ||
  "https://gh.preprod.fe.verekuu.com";

// Upcoming football with odds, 1X2 Full Time only. Not limited to `popular`
// events: preprod data is sparse, and hot prices are flagged either way.
const EVENTS_QUERY = {
  queries: [
    {
      query: {
        eventType: "UPCOMING",
        categories: ["2"],
        zones: {},
        hasOdds: true,
      },
      view: { marketTypes: ["3743"] },
      skip: 0,
      take: 100,
      sort: { popularity: "DESC" },
    },
  ],
};

// Fetch preprod events and map the v4 `by-queries` shape onto the
// `events/all` shape the betslip generator reads.
export async function getPreprodEvents(brand: string): Promise<Event[]> {
  const url = new URL(
    `${PREPROD_SPORTSBOOK_BASE_URL}/api/sportsbook/v4/events/lists/by-queries`,
  );
  url.searchParams.set("q", JSON.stringify(EVENTS_QUERY));

  const response = await fetch(url, {
    headers: { Accept: "application/json", "x-pawa-brand": brand },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch preprod events: ${response.status}`);
  }

  const data = await response.json();
  const v4Events = data?.responses?.[0]?.responses;

  return (Array.isArray(v4Events) ? v4Events : []).map((event: any) => ({
    event_id: String(event.id),
    event_name: event.name,
    competition: [
      event.category?.name,
      event.region?.name,
      event.competition?.name,
    ]
      .filter(Boolean)
      .join(" - "),
    start_time: event.startTime,
    markets: (event.markets || []).map((market: any) => ({
      name: market.marketType?.displayName || market.marketType?.name,
      selections: (market.row || []).flatMap((row: any) =>
        (row.prices || [])
          .filter((price: any) => !price.suspended)
          .map((price: any) => ({
            id: String(price.id),
            name: price.displayName || price.name,
            odds: String(price.odds),
            hot: price.additionalInfo?.hot ? 1 : 0,
          })),
      ),
    })),
  }));
}

// Which of these selections sit on a cashoutable market, per the preprod
// sportsbook.
export function getPreprodCashoutableSelectionIds(
  brand: string,
  selectionIds: string[],
): Promise<Set<string>> {
  return fetchCashoutableSelectionIds(
    PREPROD_SPORTSBOOK_BASE_URL,
    {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-pawa-brand": brand,
    },
    selectionIds,
  );
}
