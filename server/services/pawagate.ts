const PAWAGATE_BASE_URL =
  process.env.PAWAGATE_BASE_URL || "https://miniapps.betpawa.com";
const APP_ORIGIN = process.env.APP_ORIGIN || "";
const MINIAPP_ENV = process.env.MINIAPP_ENV || "staging";

export interface UserContext {
  userUuid: string;
  phoneNumber: string;
  miniAppId: number;
}

function buildHeaders(brand?: string, token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Origin: APP_ORIGIN,
    "x-miniapp-env": MINIAPP_ENV,
  };
  if (brand) {
    headers["x-pawa-brand"] = brand;
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function validateSession(token: string): Promise<UserContext> {
  const response = await fetch(
    `${PAWAGATE_BASE_URL}/api/miniapp/v1/session/validate`,
    { headers: buildHeaders(undefined, token) },
  );

  if (!response.ok) {
    throw new Error(`Session validation failed: ${response.status}`);
  }

  const data = await response.json();
  return data.user;
}

// The gateway stores a single preference document per (user, miniapp) and
// returns it in a shape we can't fully confirm from the public docs (it may be
// bare, or wrapped as `{ preferences }` / `{ data: { preferences } }`, mirroring
// how `session/validate` wraps `{ success, user }`). Normalise all of those to
// the plain preferences object, and drop known wrapper keys when the body looks
// bare.
function extractPreferences(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object") return {};
  const obj = data as Record<string, unknown>;
  if (obj.preferences && typeof obj.preferences === "object") {
    return obj.preferences as Record<string, unknown>;
  }
  const nested = obj.data as Record<string, unknown> | undefined;
  if (nested && typeof nested === "object") {
    if (nested.preferences && typeof nested.preferences === "object") {
      return nested.preferences as Record<string, unknown>;
    }
    return nested;
  }
  const { success: _success, message: _message, ...rest } = obj;
  return rest;
}

// Read the user's miniapp preference document. A missing document (first-ever
// save) is a normal 404/empty → return `{}` so callers can merge into it. Auth
// or upstream failures throw, so the caller never mistakes "token expired" for
// "no saved data" and clobbers the client's local copy.
export async function getPreferences(
  token: string,
  brand?: string,
): Promise<Record<string, unknown>> {
  const response = await fetch(
    `${PAWAGATE_BASE_URL}/api/miniapp/v1/preference`,
    { headers: buildHeaders(brand, token) },
  );

  if (response.status === 404) return {};
  if (!response.ok) {
    throw new Error(`Failed to load preferences: ${response.status}`);
  }

  const data = await response.json().catch(() => null);
  if (data == null) return {};
  return extractPreferences(data);
}

// Replace the user's miniapp preference document. POST overwrites the whole
// `preferences` object, so callers must pass the full merged document.
export async function setPreferences(
  token: string,
  preferences: Record<string, unknown>,
  brand?: string,
): Promise<void> {
  const response = await fetch(
    `${PAWAGATE_BASE_URL}/api/miniapp/v1/preference`,
    {
      method: "POST",
      headers: buildHeaders(brand, token),
      body: JSON.stringify({ preferences }),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Failed to save preferences: ${response.status} ${body}`);
  }
}

export async function getPopularEvents(brand: string): Promise<unknown> {
  const response = await fetch(
    `${PAWAGATE_BASE_URL}/api/sportsbook-plus/v1/events/popular`,
    { headers: buildHeaders(brand) },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch popular events: ${response.status}`);
  }

  return response.json();
}

async function getBonusSchemeId(brand: string): Promise<string> {
  const response = await fetch(
    `${PAWAGATE_BASE_URL}/api/preference/v1/brand-component-data`,
    { headers: buildHeaders(brand) },
  );
  if (!response.ok) return "";
  const data = await response.json();
  return data?.bonusConfigurations?.bonusSchemeId || "";
}

export async function placeBet(
  token: string,
  brand: string,
  selections: Array<{ selectionId: string; odds: number }>,
  stake: number,
): Promise<unknown> {
  const bonusSchemeId = await getBonusSchemeId(brand);

  const payload = {
    acceptAnyPrice: true,
    stake: String(stake),
    items: selections.map((s) => ({
      selectionId: Number(s.selectionId),
      price: String(s.odds),
    })),
    stakeFormat: "STAKE",
    userState: { cashoutable: false },
    uuid: crypto.randomUUID(),
    cutPlus: null,
    bonusSchemeId,
  };

  const response = await fetch(
    `${PAWAGATE_BASE_URL}/api/fixed-odds-bets/v1/place-bet/real`,
    {
      method: "POST",
      headers: buildHeaders(brand, token),
      body: JSON.stringify(payload),
    },
  );

  const body = await response
    .json()
    .catch(() => ({ message: "Bet placement failed" }));

  if (!response.ok) {
    const err = new Error(body.message || "Bet placement failed") as Error & {
      status: number;
      body: unknown;
    };
    err.status = response.status;
    err.body = body;
    throw err;
  }

  return body;
}
