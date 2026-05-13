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
