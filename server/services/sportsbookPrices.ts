// `prices/list` resolves selection IDs to their market, including the
// market's `additionalInfo.cashoutable` — the flag the sportsbook frontend
// reads when it builds a bet. One group per selection (BetMaker never puts two
// legs on one event). IDs must be numbers: the sportsbook silently returns
// `{}` for string IDs.
export async function fetchCashoutableSelectionIds(
  baseUrl: string,
  headers: Record<string, string>,
  selectionIds: string[],
): Promise<Set<string>> {
  const response = await fetch(`${baseUrl}/api/sportsbook/v3/prices/list`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      selections: selectionIds.map((id) => ({
        type: "SINGLE",
        selections: [Number(id)],
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch prices: ${response.status}`);
  }

  const data = await response.json();
  const cashoutable = new Set<string>();
  for (const item of data?.items ?? []) {
    for (const selection of item?.selections ?? []) {
      const id = selection?.selectionInfo?.id;
      if (
        id != null &&
        selection?.market?.additionalInfo?.cashoutable === true
      ) {
        cashoutable.add(String(id));
      }
    }
  }
  return cashoutable;
}
