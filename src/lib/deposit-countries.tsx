// Single source of truth for country → currency, country → region, and
// country → flag mapping used by the deposit flow (DepositModal) and by
// the admin dashboard (Countries & Payment Methods pages). Keeping this in
// one place means adding a country here makes it available everywhere
// consistently, instead of drifting between separately hand-maintained lists.
import React from 'react';
import { Globe2 } from 'lucide-react';
import {
  MY, SG, TH, VN, JP, KR, PH, CN, IN, HK, TW, PK, BD, LK, MM, KH, LA, NP, AU, NZ,
  SA, AE, QA, KW, BH, OM, JO,
  DE, GB, FR, IT, ES, NL, CH, BE, AT, PT, IE, FI, SE, NO, DK, PL, GR,
  EE, IS, LV, LT, LI, LU, MC,
  AL, AD, BA, HR, CY, XK, MT, ME, MK, SM, RS, SI,
  BY, BG, CZ, HU, MD, RO, RU, SK, UA,
  BR, AR, CO, CL, PE, UY, PY, BO, EC, VE, GY, SR,
  US, CA, MX,
} from 'country-flag-icons/react/3x2';

export const COUNTRY_CURRENCY: Record<string, string> = {
  // Asia & Pacific
  Malaysia: 'MYR',
  Singapore: 'SGD',
  Thailand: 'THB',
  Vietnam: 'VND',
  Japan: 'JPY',
  'South Korea': 'KRW',
  Philippines: 'PHP',
  China: 'CNY',
  India: 'INR',
  'Hong Kong': 'HKD',
  Taiwan: 'TWD',
  Pakistan: 'PKR',
  Bangladesh: 'BDT',
  'Sri Lanka': 'LKR',
  Myanmar: 'MMK',
  Cambodia: 'KHR',
  Laos: 'LAK',
  Nepal: 'NPR',
  Australia: 'AUD',
  'New Zealand': 'NZD',

  // Middle East
  'Saudi Arabia': 'SAR',
  UAE: 'AED',
  'United Arab Emirates': 'AED',
  Qatar: 'QAR',
  Kuwait: 'KWD',
  Bahrain: 'BHD',
  Oman: 'OMR',
  Jordan: 'JOD',

  // Northern Europe
  'United Kingdom': 'GBP',
  UK: 'GBP',
  Ireland: 'EUR',
  Sweden: 'SEK',
  Norway: 'NOK',
  Denmark: 'DKK',
  Finland: 'EUR',
  Iceland: 'ISK',
  Estonia: 'EUR',
  Latvia: 'EUR',
  Lithuania: 'EUR',

  // Western Europe
  Germany: 'EUR',
  France: 'EUR',
  Netherlands: 'EUR',
  Switzerland: 'CHF',
  Belgium: 'EUR',
  Austria: 'EUR',
  Luxembourg: 'EUR',
  Liechtenstein: 'CHF',
  Monaco: 'EUR',

  // Southern Europe
  Italy: 'EUR',
  Spain: 'EUR',
  Portugal: 'EUR',
  Greece: 'EUR',
  Malta: 'EUR',
  Cyprus: 'EUR',
  Croatia: 'EUR',
  Slovenia: 'EUR',
  Albania: 'ALL',
  Andorra: 'EUR',
  'San Marino': 'EUR',
  'Bosnia and Herzegovina': 'BAM',
  Montenegro: 'EUR',
  'North Macedonia': 'MKD',
  Serbia: 'RSD',
  Kosovo: 'EUR',

  // Eastern Europe
  Poland: 'PLN',
  'Czech Republic': 'CZK',
  Slovakia: 'EUR',
  Hungary: 'HUF',
  Romania: 'RON',
  Bulgaria: 'BGN',
  Ukraine: 'UAH',
  Moldova: 'MDL',
  Belarus: 'BYN',
  Russia: 'RUB',

  // South America
  Brazil: 'BRL',
  Argentina: 'ARS',
  Colombia: 'COP',
  Chile: 'CLP',
  Peru: 'PEN',
  Uruguay: 'UYU',
  Paraguay: 'PYG',
  Bolivia: 'BOB',
  Ecuador: 'USD',
  Venezuela: 'VES',
  Guyana: 'GYD',
  Suriname: 'SRD',

  // North America & Global
  'United States': 'USD',
  USA: 'USD',
  Canada: 'CAD',
  Mexico: 'MXN',
  Global: 'USD',
};

export const REGION_ORDER = [
  'Asia & Pacific', 'Middle East', 'Northern Europe', 'Western Europe', 'Southern Europe',
  'Eastern Europe', 'South America', 'Americas', 'Other',
] as const;

export const REGION_MAP: Record<string, (typeof REGION_ORDER)[number]> = {
  // Asia & Pacific
  Malaysia: 'Asia & Pacific', Singapore: 'Asia & Pacific', Thailand: 'Asia & Pacific', Vietnam: 'Asia & Pacific',
  Japan: 'Asia & Pacific', 'South Korea': 'Asia & Pacific', Philippines: 'Asia & Pacific', China: 'Asia & Pacific',
  India: 'Asia & Pacific', 'Hong Kong': 'Asia & Pacific', Taiwan: 'Asia & Pacific', Pakistan: 'Asia & Pacific',
  Bangladesh: 'Asia & Pacific', 'Sri Lanka': 'Asia & Pacific', Myanmar: 'Asia & Pacific', Cambodia: 'Asia & Pacific',
  Laos: 'Asia & Pacific', Nepal: 'Asia & Pacific', Australia: 'Asia & Pacific', 'New Zealand': 'Asia & Pacific',
  // Middle East
  'Saudi Arabia': 'Middle East', UAE: 'Middle East', 'United Arab Emirates': 'Middle East', Qatar: 'Middle East',
  Kuwait: 'Middle East', Bahrain: 'Middle East', Oman: 'Middle East', Jordan: 'Middle East',
  // Northern Europe
  'United Kingdom': 'Northern Europe', UK: 'Northern Europe', Ireland: 'Northern Europe',
  Sweden: 'Northern Europe', Norway: 'Northern Europe', Denmark: 'Northern Europe', Finland: 'Northern Europe',
  Iceland: 'Northern Europe', Estonia: 'Northern Europe', Latvia: 'Northern Europe', Lithuania: 'Northern Europe',
  // Western Europe
  Germany: 'Western Europe', France: 'Western Europe', Netherlands: 'Western Europe',
  Switzerland: 'Western Europe', Belgium: 'Western Europe', Austria: 'Western Europe',
  Luxembourg: 'Western Europe', Liechtenstein: 'Western Europe', Monaco: 'Western Europe',
  // Southern Europe
  Italy: 'Southern Europe', Spain: 'Southern Europe', Portugal: 'Southern Europe', Greece: 'Southern Europe',
  Malta: 'Southern Europe', Cyprus: 'Southern Europe', Croatia: 'Southern Europe', Slovenia: 'Southern Europe',
  Albania: 'Southern Europe', Andorra: 'Southern Europe', 'San Marino': 'Southern Europe',
  'Bosnia and Herzegovina': 'Southern Europe', Montenegro: 'Southern Europe', 'North Macedonia': 'Southern Europe',
  Serbia: 'Southern Europe', Kosovo: 'Southern Europe',
  // Eastern Europe
  Poland: 'Eastern Europe', 'Czech Republic': 'Eastern Europe', Slovakia: 'Eastern Europe',
  Hungary: 'Eastern Europe', Romania: 'Eastern Europe', Bulgaria: 'Eastern Europe', Ukraine: 'Eastern Europe',
  Moldova: 'Eastern Europe', Belarus: 'Eastern Europe', Russia: 'Eastern Europe',
  // South America
  Brazil: 'South America', Argentina: 'South America', Colombia: 'South America', Chile: 'South America',
  Peru: 'South America', Uruguay: 'South America', Paraguay: 'South America', Bolivia: 'South America',
  Ecuador: 'South America', Venezuela: 'South America', Guyana: 'South America', Suriname: 'South America',
  // Americas (North)
  'United States': 'Americas', USA: 'Americas', Canada: 'Americas', Mexico: 'Americas',
};

export function getRegion(countryName: string): (typeof REGION_ORDER)[number] {
  return REGION_MAP[countryName] || 'Other';
}

const FLAG_COMPONENTS: Record<string, React.ComponentType<{ title?: string; className?: string }>> = {
  MY, SG, TH, VN, JP, KR, PH, CN, IN, HK, TW, PK, BD, LK, MM, KH, LA, NP, AU, NZ,
  SA, AE, QA, KW, BH, OM, JO,
  DE, GB, FR, IT, ES, NL, CH, BE, AT, PT, IE, FI, SE, NO, DK, PL, GR,
  EE, IS, LV, LT, LI, LU, MC,
  AL, AD, BA, HR, CY, XK, MT, ME, MK, SM, RS, SI,
  BY, BG, CZ, HU, MD, RO, RU, SK, UA,
  BR, AR, CO, CL, PE, UY, PY, BO, EC, VE, GY, SR,
  US, CA, MX,
};

export const COUNTRY_ISO: Record<string, string> = {
  Malaysia: 'MY', Singapore: 'SG', Thailand: 'TH', Vietnam: 'VN', Japan: 'JP', 'South Korea': 'KR',
  Philippines: 'PH', China: 'CN', India: 'IN', 'Hong Kong': 'HK', Taiwan: 'TW', Pakistan: 'PK',
  Bangladesh: 'BD', 'Sri Lanka': 'LK', Myanmar: 'MM', Cambodia: 'KH', Laos: 'LA', Nepal: 'NP',
  Australia: 'AU', 'New Zealand': 'NZ',
  'Saudi Arabia': 'SA', UAE: 'AE', 'United Arab Emirates': 'AE', Qatar: 'QA', Kuwait: 'KW',
  Bahrain: 'BH', Oman: 'OM', Jordan: 'JO',
  // Northern Europe
  'United Kingdom': 'GB', UK: 'GB', Ireland: 'IE', Sweden: 'SE', Norway: 'NO', Denmark: 'DK',
  Finland: 'FI', Iceland: 'IS', Estonia: 'EE', Latvia: 'LV', Lithuania: 'LT',
  // Western Europe
  Germany: 'DE', France: 'FR', Netherlands: 'NL', Switzerland: 'CH', Belgium: 'BE', Austria: 'AT',
  Luxembourg: 'LU', Liechtenstein: 'LI', Monaco: 'MC',
  // Southern Europe
  Italy: 'IT', Spain: 'ES', Portugal: 'PT', Greece: 'GR', Malta: 'MT', Cyprus: 'CY',
  Croatia: 'HR', Slovenia: 'SI', Albania: 'AL', Andorra: 'AD', 'San Marino': 'SM',
  'Bosnia and Herzegovina': 'BA', Montenegro: 'ME', 'North Macedonia': 'MK', Serbia: 'RS', Kosovo: 'XK',
  // Eastern Europe
  Poland: 'PL', 'Czech Republic': 'CZ', Slovakia: 'SK', Hungary: 'HU', Romania: 'RO',
  Bulgaria: 'BG', Ukraine: 'UA', Moldova: 'MD', Belarus: 'BY', Russia: 'RU',
  // South America
  Brazil: 'BR', Argentina: 'AR', Colombia: 'CO', Chile: 'CL', Peru: 'PE', Uruguay: 'UY',
  Paraguay: 'PY', Bolivia: 'BO', Ecuador: 'EC', Venezuela: 'VE', Guyana: 'GY', Suriname: 'SR',
  'United States': 'US', USA: 'US', Canada: 'CA', Mexico: 'MX',
};

/** Renders a country's flag as a crisp SVG (falls back to a globe icon for unmapped names). */
export function FlagIcon({ country, className }: { country: string; className?: string }) {
  const iso = COUNTRY_ISO[country];
  const Comp = iso ? FLAG_COMPONENTS[iso] : undefined;
  if (!Comp) {
    return (
      <span className={`inline-flex items-center justify-center rounded-sm bg-white/10 text-slate-400 ${className || ''}`}>
        <Globe2 size={14} strokeWidth={2} />
      </span>
    );
  }
  return (
    <span className={`inline-block overflow-hidden rounded-sm ${className || ''}`}>
      <Comp title={country} className="w-full h-full block" />
    </span>
  );
}

/** Canonical (non-alias) country names, in the same region order as REGION_ORDER — for admin dropdowns. */
export const KNOWN_COUNTRIES: string[] = [
  // Asia & Pacific
  'Malaysia', 'Singapore', 'Thailand', 'Vietnam', 'Japan', 'South Korea', 'Philippines', 'China',
  'India', 'Hong Kong', 'Taiwan', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Myanmar', 'Cambodia',
  'Laos', 'Nepal', 'Australia', 'New Zealand',
  // Middle East
  'Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Jordan',
  // Northern Europe
  'United Kingdom', 'Ireland', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Iceland', 'Estonia', 'Latvia', 'Lithuania',
  // Western Europe
  'Germany', 'France', 'Netherlands', 'Switzerland', 'Belgium', 'Austria', 'Luxembourg', 'Liechtenstein', 'Monaco',
  // Southern Europe
  'Italy', 'Spain', 'Portugal', 'Greece', 'Malta', 'Cyprus', 'Croatia', 'Slovenia', 'Albania', 'Andorra',
  'San Marino', 'Bosnia and Herzegovina', 'Montenegro', 'North Macedonia', 'Serbia', 'Kosovo',
  // Eastern Europe
  'Poland', 'Czech Republic', 'Slovakia', 'Hungary', 'Romania', 'Bulgaria', 'Ukraine', 'Moldova', 'Belarus', 'Russia',
  // South America
  'Brazil', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Uruguay', 'Paraguay', 'Bolivia', 'Ecuador', 'Venezuela',
  'Guyana', 'Suriname',
  // North America & Global
  'United States', 'Canada', 'Mexico', 'Global',
];
