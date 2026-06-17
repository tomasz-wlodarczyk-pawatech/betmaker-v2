import React, { useState, useEffect } from 'react';
import type {
  FlagProps,
  FlagSize,
  FlagVariant,
  FlagAspectRatio,
} from '@aliengain/icons';
import { CountryIsoMap } from '@/lib/countryIso';

type FlagComponent = React.FC<Omit<FlagProps, 'children'>>;

/**
 * Map of dynamic import functions for each flag, keyed by ISO code.
 * Each function lazily loads only that flag's chunk via subpath imports,
 * so only the flags actually used are downloaded.
 */
const flagLoaders: Record<
  string,
  () => Promise<Record<string, FlagComponent>>
> = {
  AD: () => import('@aliengain/icons/flags/FlagAd'),
  AE: () => import('@aliengain/icons/flags/FlagAe'),
  AF: () => import('@aliengain/icons/flags/FlagAf'),
  AG: () => import('@aliengain/icons/flags/FlagAg'),
  AL: () => import('@aliengain/icons/flags/FlagAl'),
  AM: () => import('@aliengain/icons/flags/FlagAm'),
  AO: () => import('@aliengain/icons/flags/FlagAo'),
  AR: () => import('@aliengain/icons/flags/FlagAr'),
  AS: () => import('@aliengain/icons/flags/FlagAs'),
  AT: () => import('@aliengain/icons/flags/FlagAt'),
  AU: () => import('@aliengain/icons/flags/FlagAu'),
  AX: () => import('@aliengain/icons/flags/FlagAx'),
  AZ: () => import('@aliengain/icons/flags/FlagAz'),
  BA: () => import('@aliengain/icons/flags/FlagBa'),
  BB: () => import('@aliengain/icons/flags/FlagBb'),
  BD: () => import('@aliengain/icons/flags/FlagBd'),
  BE: () => import('@aliengain/icons/flags/FlagBe'),
  BF: () => import('@aliengain/icons/flags/FlagBf'),
  BG: () => import('@aliengain/icons/flags/FlagBg'),
  BH: () => import('@aliengain/icons/flags/FlagBh'),
  BI: () => import('@aliengain/icons/flags/FlagBi'),
  BJ: () => import('@aliengain/icons/flags/FlagBj'),
  BO: () => import('@aliengain/icons/flags/FlagBo'),
  BR: () => import('@aliengain/icons/flags/FlagBr'),
  BS: () => import('@aliengain/icons/flags/FlagBs'),
  BT: () => import('@aliengain/icons/flags/FlagBt'),
  BW: () => import('@aliengain/icons/flags/FlagBw'),
  BY: () => import('@aliengain/icons/flags/FlagBy'),
  CA: () => import('@aliengain/icons/flags/FlagCa'),
  CD: () => import('@aliengain/icons/flags/FlagCd'),
  CF: () => import('@aliengain/icons/flags/FlagCf'),
  CG: () => import('@aliengain/icons/flags/FlagCg'),
  CH: () => import('@aliengain/icons/flags/FlagCh'),
  CI: () => import('@aliengain/icons/flags/FlagCi'),
  CL: () => import('@aliengain/icons/flags/FlagCl'),
  CM: () => import('@aliengain/icons/flags/FlagCm'),
  CN: () => import('@aliengain/icons/flags/FlagCn'),
  CO: () => import('@aliengain/icons/flags/FlagCo'),
  CR: () => import('@aliengain/icons/flags/FlagCr'),
  CU: () => import('@aliengain/icons/flags/FlagCu'),
  CY: () => import('@aliengain/icons/flags/FlagCy'),
  CZ: () => import('@aliengain/icons/flags/FlagCz'),
  DE: () => import('@aliengain/icons/flags/FlagDe'),
  DJ: () => import('@aliengain/icons/flags/FlagDj'),
  DK: () => import('@aliengain/icons/flags/FlagDk'),
  DO: () => import('@aliengain/icons/flags/FlagDo'),
  DZ: () => import('@aliengain/icons/flags/FlagDz'),
  EC: () => import('@aliengain/icons/flags/FlagEc'),
  EE: () => import('@aliengain/icons/flags/FlagEe'),
  EG: () => import('@aliengain/icons/flags/FlagEg'),
  EH: () => import('@aliengain/icons/flags/FlagEh'),
  ER: () => import('@aliengain/icons/flags/FlagEr'),
  ES: () => import('@aliengain/icons/flags/FlagEs'),
  'ES-CN': () => import('@aliengain/icons/flags/FlagEsCn'),
  'ES-CT': () => import('@aliengain/icons/flags/FlagEsCt'),
  'ES-GA': () => import('@aliengain/icons/flags/FlagEsGa'),
  'ES-PV': () => import('@aliengain/icons/flags/FlagEsPv'),
  ET: () => import('@aliengain/icons/flags/FlagEt'),
  EU: () => import('@aliengain/icons/flags/FlagEu'),
  FI: () => import('@aliengain/icons/flags/FlagFi'),
  FJ: () => import('@aliengain/icons/flags/FlagFj'),
  FM: () => import('@aliengain/icons/flags/FlagFm'),
  FO: () => import('@aliengain/icons/flags/FlagFo'),
  FR: () => import('@aliengain/icons/flags/FlagFr'),
  GA: () => import('@aliengain/icons/flags/FlagGa'),
  GB: () => import('@aliengain/icons/flags/FlagGb'),
  'GB-ENG': () => import('@aliengain/icons/flags/FlagGbEng'),
  'GB-NIR': () => import('@aliengain/icons/flags/FlagGbNir'),
  'GB-SCT': () => import('@aliengain/icons/flags/FlagGbSct'),
  'GB-WLS': () => import('@aliengain/icons/flags/FlagGbWls'),
  GE: () => import('@aliengain/icons/flags/FlagGe'),
  GH: () => import('@aliengain/icons/flags/FlagGh'),
  GI: () => import('@aliengain/icons/flags/FlagGi'),
  GL: () => import('@aliengain/icons/flags/FlagGl'),
  GM: () => import('@aliengain/icons/flags/FlagGm'),
  GN: () => import('@aliengain/icons/flags/FlagGn'),
  GQ: () => import('@aliengain/icons/flags/FlagGq'),
  GR: () => import('@aliengain/icons/flags/FlagGr'),
  GT: () => import('@aliengain/icons/flags/FlagGt'),
  GW: () => import('@aliengain/icons/flags/FlagGw'),
  GY: () => import('@aliengain/icons/flags/FlagGy'),
  HK: () => import('@aliengain/icons/flags/FlagHk'),
  HN: () => import('@aliengain/icons/flags/FlagHn'),
  HR: () => import('@aliengain/icons/flags/FlagHr'),
  HT: () => import('@aliengain/icons/flags/FlagHt'),
  HU: () => import('@aliengain/icons/flags/FlagHu'),
  ID: () => import('@aliengain/icons/flags/FlagId'),
  IE: () => import('@aliengain/icons/flags/FlagIe'),
  IL: () => import('@aliengain/icons/flags/FlagIl'),
  IN: () => import('@aliengain/icons/flags/FlagIn'),
  IQ: () => import('@aliengain/icons/flags/FlagIq'),
  IR: () => import('@aliengain/icons/flags/FlagIr'),
  IS: () => import('@aliengain/icons/flags/FlagIs'),
  IT: () => import('@aliengain/icons/flags/FlagIt'),
  JM: () => import('@aliengain/icons/flags/FlagJm'),
  JO: () => import('@aliengain/icons/flags/FlagJo'),
  JP: () => import('@aliengain/icons/flags/FlagJp'),
  KE: () => import('@aliengain/icons/flags/FlagKe'),
  KG: () => import('@aliengain/icons/flags/FlagKg'),
  KH: () => import('@aliengain/icons/flags/FlagKh'),
  KI: () => import('@aliengain/icons/flags/FlagKi'),
  KP: () => import('@aliengain/icons/flags/FlagKp'),
  KR: () => import('@aliengain/icons/flags/FlagKr'),
  KW: () => import('@aliengain/icons/flags/FlagKw'),
  KZ: () => import('@aliengain/icons/flags/FlagKz'),
  LA: () => import('@aliengain/icons/flags/FlagLa'),
  LB: () => import('@aliengain/icons/flags/FlagLb'),
  LI: () => import('@aliengain/icons/flags/FlagLi'),
  LK: () => import('@aliengain/icons/flags/FlagLk'),
  LR: () => import('@aliengain/icons/flags/FlagLr'),
  LS: () => import('@aliengain/icons/flags/FlagLs'),
  LT: () => import('@aliengain/icons/flags/FlagLt'),
  LU: () => import('@aliengain/icons/flags/FlagLu'),
  LV: () => import('@aliengain/icons/flags/FlagLv'),
  LY: () => import('@aliengain/icons/flags/FlagLy'),
  MA: () => import('@aliengain/icons/flags/FlagMa'),
  ME: () => import('@aliengain/icons/flags/FlagMe'),
  MG: () => import('@aliengain/icons/flags/FlagMg'),
  MK: () => import('@aliengain/icons/flags/FlagMk'),
  ML: () => import('@aliengain/icons/flags/FlagMl'),
  MM: () => import('@aliengain/icons/flags/FlagMm'),
  MN: () => import('@aliengain/icons/flags/FlagMn'),
  MQ: () => import('@aliengain/icons/flags/FlagMq'),
  MR: () => import('@aliengain/icons/flags/FlagMr'),
  MT: () => import('@aliengain/icons/flags/FlagMt'),
  MU: () => import('@aliengain/icons/flags/FlagMu'),
  MV: () => import('@aliengain/icons/flags/FlagMv'),
  MW: () => import('@aliengain/icons/flags/FlagMw'),
  MX: () => import('@aliengain/icons/flags/FlagMx'),
  MY: () => import('@aliengain/icons/flags/FlagMy'),
  MZ: () => import('@aliengain/icons/flags/FlagMz'),
  NE: () => import('@aliengain/icons/flags/FlagNe'),
  NF: () => import('@aliengain/icons/flags/FlagNf'),
  NG: () => import('@aliengain/icons/flags/FlagNg'),
  NI: () => import('@aliengain/icons/flags/FlagNi'),
  NL: () => import('@aliengain/icons/flags/FlagNl'),
  NO: () => import('@aliengain/icons/flags/FlagNo'),
  NP: () => import('@aliengain/icons/flags/FlagNp'),
  NZ: () => import('@aliengain/icons/flags/FlagNz'),
  OM: () => import('@aliengain/icons/flags/FlagOm'),
  PA: () => import('@aliengain/icons/flags/FlagPa'),
  PE: () => import('@aliengain/icons/flags/FlagPe'),
  PG: () => import('@aliengain/icons/flags/FlagPg'),
  PH: () => import('@aliengain/icons/flags/FlagPh'),
  PK: () => import('@aliengain/icons/flags/FlagPk'),
  PL: () => import('@aliengain/icons/flags/FlagPl'),
  PR: () => import('@aliengain/icons/flags/FlagPr'),
  PS: () => import('@aliengain/icons/flags/FlagPs'),
  PT: () => import('@aliengain/icons/flags/FlagPt'),
  PW: () => import('@aliengain/icons/flags/FlagPw'),
  PY: () => import('@aliengain/icons/flags/FlagPy'),
  QA: () => import('@aliengain/icons/flags/FlagQa'),
  RO: () => import('@aliengain/icons/flags/FlagRo'),
  RS: () => import('@aliengain/icons/flags/FlagRs'),
  RU: () => import('@aliengain/icons/flags/FlagRu'),
  RW: () => import('@aliengain/icons/flags/FlagRw'),
  SA: () => import('@aliengain/icons/flags/FlagSa'),
  SC: () => import('@aliengain/icons/flags/FlagSc'),
  SD: () => import('@aliengain/icons/flags/FlagSd'),
  SE: () => import('@aliengain/icons/flags/FlagSe'),
  SG: () => import('@aliengain/icons/flags/FlagSg'),
  SI: () => import('@aliengain/icons/flags/FlagSi'),
  SK: () => import('@aliengain/icons/flags/FlagSk'),
  SL: () => import('@aliengain/icons/flags/FlagSl'),
  SM: () => import('@aliengain/icons/flags/FlagSm'),
  SN: () => import('@aliengain/icons/flags/FlagSn'),
  SO: () => import('@aliengain/icons/flags/FlagSo'),
  SR: () => import('@aliengain/icons/flags/FlagSr'),
  SS: () => import('@aliengain/icons/flags/FlagSs'),
  SV: () => import('@aliengain/icons/flags/FlagSv'),
  SY: () => import('@aliengain/icons/flags/FlagSy'),
  TD: () => import('@aliengain/icons/flags/FlagTd'),
  TG: () => import('@aliengain/icons/flags/FlagTg'),
  TH: () => import('@aliengain/icons/flags/FlagTh'),
  TJ: () => import('@aliengain/icons/flags/FlagTj'),
  TL: () => import('@aliengain/icons/flags/FlagTl'),
  TN: () => import('@aliengain/icons/flags/FlagTn'),
  TO: () => import('@aliengain/icons/flags/FlagTo'),
  TR: () => import('@aliengain/icons/flags/FlagTr'),
  TT: () => import('@aliengain/icons/flags/FlagTt'),
  TW: () => import('@aliengain/icons/flags/FlagTw'),
  TZ: () => import('@aliengain/icons/flags/FlagTz'),
  UA: () => import('@aliengain/icons/flags/FlagUa'),
  UG: () => import('@aliengain/icons/flags/FlagUg'),
  US: () => import('@aliengain/icons/flags/FlagUs'),
  UY: () => import('@aliengain/icons/flags/FlagUy'),
  UZ: () => import('@aliengain/icons/flags/FlagUz'),
  VA: () => import('@aliengain/icons/flags/FlagVa'),
  VE: () => import('@aliengain/icons/flags/FlagVe'),
  VN: () => import('@aliengain/icons/flags/FlagVn'),
  WS: () => import('@aliengain/icons/flags/FlagWs'),
  YE: () => import('@aliengain/icons/flags/FlagYe'),
  ZA: () => import('@aliengain/icons/flags/FlagZa'),
  ZM: () => import('@aliengain/icons/flags/FlagZm'),
};

/** Cache resolved flag components to avoid re-importing */
const componentCache = new Map<string, FlagComponent>();

/**
 * Dynamically imports a single flag component via subpath import.
 * Only the requested flag's JS chunk is downloaded — not the entire icons bundle.
 */
async function loadFlagComponent(
  isoCode: string,
): Promise<FlagComponent | null> {
  const cached = componentCache.get(isoCode);
  if (cached) return cached;

  const loader = flagLoaders[isoCode];
  if (!loader) return null;

  try {
    const mod = await loader();
    // Each flag module exports a single component — grab the first export
    const Component = Object.values(mod)[0] as FlagComponent | undefined;
    if (Component) {
      componentCache.set(isoCode, Component);
      return Component;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolves a country slug (e.g. "england", "ghana") to an ISO code using CountryIsoMap.
 * Also accepts raw ISO codes (e.g. "GB", "GH", "GB-ENG").
 */
function resolveIsoCode(slugOrCode?: string): string | undefined {
  if (!slugOrCode) return undefined;

  const upper = slugOrCode.toUpperCase();
  if (flagLoaders[upper]) return upper;

  return CountryIsoMap[slugOrCode];
}

export interface PawabloxFlagProps {
  /** Country slug (e.g. "england", "ghana") or ISO code (e.g. "GB", "GH") */
  slug?: string;
  size?: FlagSize;
  variant?: FlagVariant;
  aspectRatio?: FlagAspectRatio;
  className?: string;
  /** Rendered while the flag is loading or if the slug is not found */
  fallback?: React.ReactNode;
}

const PawabloxFlagComponent: React.FC<PawabloxFlagProps> = ({
  slug,
  size = 'sm',
  variant = 'circle',
  aspectRatio = '1x1',
  className,
  fallback = null,
}) => {
  const isoCode = resolveIsoCode(slug);
  const [FlagComp, setFlagComp] = useState<FlagComponent | null>(() =>
    isoCode ? (componentCache.get(isoCode) ?? null) : null,
  );

  useEffect(() => {
    if (!isoCode) return;

    const cached = componentCache.get(isoCode);
    if (cached) {
      setFlagComp(() => cached);
      return;
    }

    let cancelled = false;
    loadFlagComponent(isoCode)
      .then((comp) => {
        if (!cancelled && comp) {
          setFlagComp(() => comp);
        }
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [isoCode]);

  if (!FlagComp) return <>{fallback}</>;

  return (
    <FlagComp
      size={size}
      variant={variant}
      aspectRatio={aspectRatio}
      className={className}
    />
  );
};

export const PawabloxFlag = React.memo(PawabloxFlagComponent);
