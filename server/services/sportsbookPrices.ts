export interface SelectionDetails {
  cashoutable: boolean;
  /** In the requested language, e.g. "Plus de/Moins de | Fin de Match". */
  marketName?: string;
  /** In the requested language, e.g. "Moins de 2.5". */
  selectionName?: string;
}

// `prices/list` resolves selection IDs to their market, including the
// market's `additionalInfo.cashoutable` — the flag the sportsbook frontend
// reads when it builds a bet — and market/selection names translated per the
// `x-pawa-language` header (the events feeds ignore it). One group per
// selection (BetMaker never puts two legs on one event). IDs must be numbers:
// the sportsbook silently returns `{}` for string IDs.
export async function fetchSelectionDetails(
  baseUrl: string,
  headers: Record<string, string>,
  selectionIds: string[],
): Promise<Map<string, SelectionDetails>> {
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
  const details = new Map<string, SelectionDetails>();
  for (const item of data?.items ?? []) {
    for (const selection of item?.selections ?? []) {
      const info = selection?.selectionInfo;
      if (info?.id == null) continue;
      details.set(String(info.id), {
        cashoutable: selection?.market?.additionalInfo?.cashoutable === true,
        marketName: selection?.market?.displayName?.trim() || undefined,
        selectionName: resolveSelectionName(info),
      });
    }
  }
  return details;
}

// `displayName` carries placeholders ("Moins de {formattedHandicap}") that the
// frontend normally fills in. Only the handicap is known here; anything still
// unresolved falls back to the events feed's English name.
function resolveSelectionName(info: {
  displayName?: string;
  handicap?: string;
}): string | undefined {
  const name =
    info.handicap != null
      ? info.displayName?.replace("{formattedHandicap}", info.handicap)
      : info.displayName;
  return name && !name.includes("{") ? name : undefined;
}
