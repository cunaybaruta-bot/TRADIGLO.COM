'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AssetItem {
  id: string;
  symbol: string;
  name: string;
  category: string;
}

interface AssetWithPrice extends AssetItem {
  price: number | null;
  change24h: number | null;
  changePct24h: number | null;
}

interface AssetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: AssetItem[];
  selectedAsset: AssetItem | null;
  onSelectAsset: (asset: AssetItem) => void;
}

// ─── Category Tabs ────────────────────────────────────────────────────────────

const MODAL_CATEGORIES = ['Currencies', 'Crypto', 'Commodities', 'Stocks'] as const;
type ModalCategory = typeof MODAL_CATEGORIES[number];

const CATEGORY_MAP: Record<ModalCategory, string[]> = {
  Currencies: ['forex', 'currency', 'currencies'],
  Crypto: ['crypto', 'cryptocurrency'],
  Commodities: ['commodity', 'commodities'],
  Stocks: ['stock', 'stocks', 'equity'],
};

// ─── Crypto symbol map for Binance ───────────────────────────────────────────

function getCryptoIconSymbol(symbol: string): string {
  return symbol
    .replace('USDT', '')
    .replace('USD', '')
    .replace('/USD', '')
    .toLowerCase();
}

function getBinanceSymbol(symbol: string): string {
  const s = symbol.replace('/', '').toUpperCase();
  if (s.endsWith('USDT') || s.endsWith('USD')) return s.endsWith('USDT') ? s : s.replace('USD', 'USDT');
  return s + 'USDT';
}

function isCrypto(category: string): boolean {
  return CATEGORY_MAP.Crypto.includes(category.toLowerCase());
}

// ─── Asset Icon ───────────────────────────────────────────────────────────────

// Currency code → flag emoji
const CURRENCY_FLAGS: Record<string, string> = {
  AUD: '🇦🇺', CAD: '🇨🇦', CHF: '🇨🇭', CNY: '🇨🇳', CZK: '🇨🇿',
  DKK: '🇩🇰', EUR: '🇪🇺', GBP: '🇬🇧', HKD: '🇭🇰', HUF: '🇭🇺',
  IDR: '🇮🇩', ILS: '🇮🇱', INR: '🇮🇳', JPY: '🇯🇵', KRW: '🇰🇷',
  MXN: '🇲🇽', MYR: '🇲🇾', NOK: '🇳🇴', NZD: '🇳🇿', PHP: '🇵🇭',
  PLN: '🇵🇱', RON: '🇷🇴', RUB: '🇷🇺', SAR: '🇸🇦', SEK: '🇸🇪',
  SGD: '🇸🇬', THB: '🇹🇭', TRY: '🇹🇷', TWD: '🇹🇼', USD: '🇺🇸',
  ZAR: '🇿🇦', BRL: '🇧🇷', AED: '🇦🇪', QAR: '🇶🇦', KWD: '🇰🇼',
  OMR: '🇴🇲', BHD: '🇧🇭', JOD: '🇯🇴', EGP: '🇪🇬', NGN: '🇳🇬',
  KES: '🇰🇪', GHS: '🇬🇭', MAD: '🇲🇦', TND: '🇹🇳', DZD: '🇩🇿',
  PKR: '🇵🇰', BDT: '🇧🇩', LKR: '🇱🇰', VND: '🇻🇳', CLP: '🇨🇱',
  COP: '🇨🇴', PEN: '🇵🇪', ARS: '🇦🇷', UYU: '🇺🇾', HRK: '🇭🇷',
  BGN: '🇧🇬', ISK: '🇮🇸', UAH: '🇺🇦', CRC: '🇨🇷', DOP: '🇩🇴',
};

// Extract currency codes from forex pair symbol (e.g. AUDCAD → AUD, CAD)
function parseFxPair(symbol: string): [string, string] {
  const s = symbol.replace('/', '').toUpperCase();
  return [s.slice(0, 3), s.slice(3, 6)];
}

// Commodity symbol → icon config
const COMMODITY_ICONS: Record<string, { bg: string; emoji: string }> = {
  // Precious Metals
  XAUUSD:   { bg: 'linear-gradient(135deg,#b8860b,#ffd700)', emoji: '🥇' },
  XAGUSD:   { bg: 'linear-gradient(135deg,#708090,#c0c0c0)', emoji: '🥈' },
  XPTUSD:   { bg: 'linear-gradient(135deg,#4a4a6a,#a8a9ad)', emoji: '💎' },
  XPDUSD:   { bg: 'linear-gradient(135deg,#2c3e50,#4ca1af)', emoji: '⚙️' },
  // Energy
  USOIL:    { bg: 'linear-gradient(135deg,#1a1a2e,#4a4a6e)', emoji: '🛢️' },
  UKOIL:    { bg: 'linear-gradient(135deg,#0f3460,#533483)', emoji: '🛢️' },
  NGAS:     { bg: 'linear-gradient(135deg,#f46b45,#eea849)', emoji: '🔥' },
  // Grains & Crops
  WHEAT:    { bg: 'linear-gradient(135deg,#c8a951,#e8d5a3)', emoji: '🌾' },
  CORN:     { bg: 'linear-gradient(135deg,#f7971e,#ffd200)', emoji: '🌽' },
  SOYBEAN:  { bg: 'linear-gradient(135deg,#56ab2f,#a8e063)', emoji: '🫘' },
  RICE:     { bg: 'linear-gradient(135deg,#e8d5a3,#c8a951)', emoji: '🍚' },
  // Soft Commodities
  COFFEE:   { bg: 'linear-gradient(135deg,#4b2c20,#8b5e3c)', emoji: '☕' },
  COCOA:    { bg: 'linear-gradient(135deg,#3d1c02,#7b3f00)', emoji: '🍫' },
  SUGAR:    { bg: 'linear-gradient(135deg,#e96c6c,#f7c59f)', emoji: '🍬' },
  COTTON:   { bg: 'linear-gradient(135deg,#c8e6fa,#e8f4fd)', emoji: '🌸' },
  // Base Metals
  COPPER:   { bg: 'linear-gradient(135deg,#b5541c,#e07b39)', emoji: '🔶' },
  ALUMINIUM:{ bg: 'linear-gradient(135deg,#9e9e9e,#e0e0e0)', emoji: '🔩' },
  ALUMINUM: { bg: 'linear-gradient(135deg,#9e9e9e,#e0e0e0)', emoji: '🔩' },
  ZINC:     { bg: 'linear-gradient(135deg,#607d8b,#90a4ae)', emoji: '⚙️' },
  NICKEL:   { bg: 'linear-gradient(135deg,#455a64,#78909c)', emoji: '🔘' },
  LEAD:     { bg: 'linear-gradient(135deg,#37474f,#546e7a)', emoji: '🔲' },
  TIN:      { bg: 'linear-gradient(135deg,#78909c,#b0bec5)', emoji: '🥫' },
  // Livestock
  CATTLE:   { bg: 'linear-gradient(135deg,#795548,#a1887f)', emoji: '🐄' },
  HOGS:     { bg: 'linear-gradient(135deg,#e91e63,#f48fb1)', emoji: '🐷' },
  // Other
  LUMBER:   { bg: 'linear-gradient(135deg,#8d6e63,#bcaaa4)', emoji: '🪵' },
  OJ:       { bg: 'linear-gradient(135deg,#ff8c00,#ffd700)', emoji: '🍊' },
};

// Stock symbol → logo URL (using Clearbit Logo API + fallback to Google favicon)
function getStockLogoUrl(symbol: string): string {
  const STOCK_DOMAINS: Record<string, string> = {
    AAPL: 'apple.com',
    MSFT: 'microsoft.com',
    GOOGL: 'google.com',
    GOOG: 'google.com',
    AMZN: 'amazon.com',
    META: 'meta.com',
    TSLA: 'tesla.com',
    NVDA: 'nvidia.com',
    NFLX: 'netflix.com',
    BABA: 'alibaba.com',
    BIDU: 'baidu.com',
    JD: 'jd.com',
    TCEHY: 'tencent.com',
    TSM: 'tsmc.com',
    SONY: 'sony.com',
    TOYOTA: 'toyota.com',
    SHOP: 'shopify.com',
    SQ: 'squareup.com',
    PYPL: 'paypal.com',
    V: 'visa.com',
    MA: 'mastercard.com',
    JPM: 'jpmorganchase.com',
    BAC: 'bankofamerica.com',
    GS: 'goldmansachs.com',
    WMT: 'walmart.com',
    AMGN: 'amgen.com',
    PFE: 'pfizer.com',
    JNJ: 'jnj.com',
    KO: 'coca-cola.com',
    PEP: 'pepsico.com',
    MCD: 'mcdonalds.com',
    SBUX: 'starbucks.com',
    DIS: 'disney.com',
    BA: 'boeing.com',
    GE: 'ge.com',
    XOM: 'exxonmobil.com',
    CVX: 'chevron.com',
    CRM: 'salesforce.com',
    ORCL: 'oracle.com',
    INTC: 'intel.com',
    AMD: 'amd.com',
    QCOM: 'qualcomm.com',
    UBER: 'uber.com',
    LYFT: 'lyft.com',
    SPOT: 'spotify.com',
    TWTR: 'twitter.com',
    SNAP: 'snap.com',
    PINS: 'pinterest.com',
    COIN: 'coinbase.com',
    ABNB: 'airbnb.com',
    HOOD: 'robinhood.com',
    PLTR: 'palantir.com',
    RBLX: 'roblox.com',
    RIVN: 'rivian.com',
    LCID: 'lucidmotors.com',
    NIO: 'nio.com',
    XPEV: 'xpeng.com',
    LI: 'lixiang.com',
    DKNG: 'draftkings.com',
    PENN: 'pennentertainment.com',
    ROKU: 'roku.com',
    ZM: 'zoom.us',
    DOCU: 'docusign.com',
    SNOW: 'snowflake.com',
    DDOG: 'datadoghq.com',
    NET: 'cloudflare.com',
    CRWD: 'crowdstrike.com',
    OKTA: 'okta.com',
    TWLO: 'twilio.com',
    SHOP2: 'shopify.com',
    ETSY: 'etsy.com',
    EBAY: 'ebay.com',
    BKNG: 'booking.com',
    EXPE: 'expedia.com',
    ABNB2: 'airbnb.com',
    UAL: 'united.com',
    DAL: 'delta.com',
    AAL: 'aa.com',
    LUV: 'southwest.com',
    CCL: 'carnival.com',
    RCL: 'royalcaribbean.com',
    MAR: 'marriott.com',
    HLT: 'hilton.com',
    MGM: 'mgmresorts.com',
    WYNN: 'wynnresorts.com',
    LVS: 'sands.com',
    NKE: 'nike.com',
    ADDYY: 'adidas.com',
    LULU: 'lululemon.com',
    TGT: 'target.com',
    COST: 'costco.com',
    HD: 'homedepot.com',
    LOW: 'lowes.com',
    CVS: 'cvshealth.com',
    WBA: 'walgreens.com',
    UNH: 'unitedhealthgroup.com',
    ANTM: 'elevancehealth.com',
    CI: 'cigna.com',
    HUM: 'humana.com',
    ABT: 'abbott.com',
    MDT: 'medtronic.com',
    SYK: 'stryker.com',
    ISRG: 'intuitivesurgical.com',
    TMO: 'thermofisher.com',
    DHR: 'danaher.com',
    MRNA: 'modernatx.com',
    BNTX: 'biontech.com',
    REGN: 'regeneron.com',
    GILD: 'gilead.com',
    BIIB: 'biogen.com',
    VRTX: 'vrtx.com',
    LLY: 'lilly.com',
    BMY: 'bms.com',
    MRK: 'merck.com',
    AZN: 'astrazeneca.com',
    GSK: 'gsk.com',
    NVS: 'novartis.com',
    RHHBY: 'roche.com',
    SNY: 'sanofi.com',
    BAYRY: 'bayer.com',
    NSRGY: 'nestle.com',
    LVMUY: 'lvmh.com',
    MC: 'lvmh.com',
    OR: 'loreal.com',
    CFRUY: 'richemont.com',
    PPRUY: 'kering.com',
    BURBY: 'burberry.com',
    HESAY: 'hermes.com',
    SAP: 'sap.com',
    ASML: 'asml.com',
    SIEGY: 'siemens.com',
    BMWYY: 'bmw.com',
    VWAGY: 'vw.com',
    DDAIF: 'mercedes-benz.com',
    STLA: 'stellantis.com',
    F: 'ford.com',
    GM: 'gm.com',
    TM: 'toyota.com',
    HMC: 'honda.com',
    NSANY: 'nissan.com',
    HYMTF: 'hyundai.com',
    KIMTF: 'kia.com',
    RACE: 'ferrari.com',
    POAHY: 'porsche.com',
    // Adobe & AbbVie (explicitly requested)
    ADBE: 'adobe.com',
    ABBV: 'abbvie.com',
    // Additional common stocks
    IBM: 'ibm.com',
    CSCO: 'cisco.com',
    TXN: 'ti.com',
    NOW: 'servicenow.com',
    ADSK: 'autodesk.com',
    INTU: 'intuit.com',
    PANW: 'paloaltonetworks.com',
    ZS: 'zscaler.com',
    FTNT: 'fortinet.com',
    AMAT: 'appliedmaterials.com',
    LRCX: 'lamresearch.com',
    KLAC: 'kla.com',
    MU: 'micron.com',
    WDC: 'westerndigital.com',
    STX: 'seagate.com',
    HPQ: 'hp.com',
    HPE: 'hpe.com',
    DELL: 'dell.com',
    ACN: 'accenture.com',
    CTSH: 'cognizant.com',
    INFY: 'infosys.com',
    WIT: 'wipro.com',
    TCS: 'tcs.com',
    MSCI: 'msci.com',
    SPGI: 'spglobal.com',
    MCO: 'moodys.com',
    ICE: 'theice.com',
    CME: 'cmegroup.com',
    NDAQ: 'nasdaq.com',
    BLK: 'blackrock.com',
    SCHW: 'schwab.com',
    MS: 'morganstanley.com',
    C: 'citi.com',
    WFC: 'wellsfargo.com',
    USB: 'usbank.com',
    PNC: 'pnc.com',
    TFC: 'truist.com',
    AXP: 'americanexpress.com',
    COF: 'capitalone.com',
    DFS: 'discover.com',
    SYF: 'synchronyfinancial.com',
    ALLY: 'ally.com',
    BRK: 'berkshirehathaway.com',
    BRKB: 'berkshirehathaway.com',
    BRKA: 'berkshirehathaway.com',
    MMM: '3m.com',
    CAT: 'caterpillar.com',
    DE: 'deere.com',
    EMR: 'emerson.com',
    HON: 'honeywell.com',
    RTX: 'rtx.com',
    LMT: 'lockheedmartin.com',
    NOC: 'northropgrumman.com',
    GD: 'gd.com',
    HII: 'huntingtoningalls.com',
    UPS: 'ups.com',
    FDX: 'fedex.com',
    AMTRAK: 'amtrak.com',
    CSX: 'csx.com',
    UNP: 'up.com',
    NSC: 'nscorp.com',
    NEE: 'nexteraenergy.com',
    DUK: 'duke-energy.com',
    SO: 'southerncompany.com',
    D: 'dominionenergy.com',
    AEP: 'aep.com',
    EXC: 'exeloncorp.com',
    SRE: 'sempra.com',
    PCG: 'pge.com',
    ED: 'coned.com',
    T: 'att.com',
    VZ: 'verizon.com',
    TMUS: 't-mobile.com',
    CMCSA: 'comcast.com',
    CHTR: 'charter.com',
    DISH: 'dish.com',
    SIRI: 'siriusxm.com',
    NWSA: 'newscorp.com',
    FOX: 'foxcorporation.com',
    PARA: 'paramount.com',
    WBD: 'wbd.com',
    AMCX: 'amcnetworks.com',
    VIAC: 'paramount.com',
    DISCA: 'discovery.com',
    LBTYA: 'libertyglobal.com',
    ATVI: 'activision.com',
    EA: 'ea.com',
    TTWO: 'take2games.com',
    NTDOY: 'nintendo.com',
    SE: 'sea.com',
    GRAB: 'grab.com',
    GOTO: 'gotogroup.com',
    MELI: 'mercadolibre.com',
    PDD: 'pinduoduo.com',
    TME: 'tencentmusic.com',
    BILI: 'bilibili.com',
    IQ: 'iqiyi.com',
    WB: 'weibo.com',
    NTES: 'netease.com',
    ZTO: 'zto.com',
    DIDI: 'didiglobal.com',
    KWEB: 'kraneshares.com',
    MCHI: 'ishares.com',
    FXI: 'blackrock.com',
  };

  const domain = STOCK_DOMAINS[symbol.toUpperCase()];
  if (domain) {
    return `https://logo.clearbit.com/${domain}?size=64`;
  }
  return '';
}

// Get Google favicon URL as secondary fallback
function getGoogleFaviconUrl(symbol: string): string {
  const STOCK_DOMAINS: Record<string, string> = {
    AAPL: 'apple.com', MSFT: 'microsoft.com', GOOGL: 'google.com', GOOG: 'google.com',
    AMZN: 'amazon.com', META: 'meta.com', TSLA: 'tesla.com', NVDA: 'nvidia.com',
    NFLX: 'netflix.com', BABA: 'alibaba.com', BIDU: 'baidu.com', JD: 'jd.com',
    TCEHY: 'tencent.com', TSM: 'tsmc.com', SONY: 'sony.com', SHOP: 'shopify.com',
    PYPL: 'paypal.com', V: 'visa.com', MA: 'mastercard.com', JPM: 'jpmorganchase.com',
    BAC: 'bankofamerica.com', GS: 'goldmansachs.com', WMT: 'walmart.com',
    PFE: 'pfizer.com', JNJ: 'jnj.com', KO: 'coca-cola.com', PEP: 'pepsico.com',
    MCD: 'mcdonalds.com', SBUX: 'starbucks.com', DIS: 'disney.com', BA: 'boeing.com',
    XOM: 'exxonmobil.com', CVX: 'chevron.com', CRM: 'salesforce.com', ORCL: 'oracle.com',
    INTC: 'intel.com', AMD: 'amd.com', QCOM: 'qualcomm.com', UBER: 'uber.com',
    SPOT: 'spotify.com', SNAP: 'snap.com', COIN: 'coinbase.com', ABNB: 'airbnb.com',
    PLTR: 'palantir.com', ZM: 'zoom.us', SNOW: 'snowflake.com', NET: 'cloudflare.com',
    CRWD: 'crowdstrike.com', OKTA: 'okta.com', ETSY: 'etsy.com', EBAY: 'ebay.com',
    NKE: 'nike.com', TGT: 'target.com', COST: 'costco.com', HD: 'homedepot.com',
    UNH: 'unitedhealthgroup.com', ABT: 'abbott.com', MDT: 'medtronic.com',
    MRNA: 'modernatx.com', REGN: 'regeneron.com', GILD: 'gilead.com', LLY: 'lilly.com',
    MRK: 'merck.com', AZN: 'astrazeneca.com', GSK: 'gsk.com', NVS: 'novartis.com',
    SAP: 'sap.com', ASML: 'asml.com', F: 'ford.com', GM: 'gm.com', TM: 'toyota.com',
    HMC: 'honda.com', RACE: 'ferrari.com', ADBE: 'adobe.com', ABBV: 'abbvie.com',
    IBM: 'ibm.com', CSCO: 'cisco.com', TXN: 'ti.com', NOW: 'servicenow.com',
    ADSK: 'autodesk.com', INTU: 'intuit.com', PANW: 'paloaltonetworks.com',
    ACN: 'accenture.com', BLK: 'blackrock.com', MS: 'morganstanley.com',
    C: 'citi.com', WFC: 'wellsfargo.com', AXP: 'americanexpress.com',
    COF: 'capitalone.com', MMM: '3m.com', CAT: 'caterpillar.com', DE: 'deere.com',
    HON: 'honeywell.com', RTX: 'rtx.com', LMT: 'lockheedmartin.com',
    UPS: 'ups.com', FDX: 'fedex.com', T: 'att.com', VZ: 'verizon.com',
    TMUS: 't-mobile.com', CMCSA: 'comcast.com', ATVI: 'activision.com', EA: 'ea.com',
    MELI: 'mercadolibre.com', SE: 'sea.com', GRAB: 'grab.com',
  };
  const domain = STOCK_DOMAINS[symbol.toUpperCase()];
  if (domain) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  }
  return '';
}

// Stock fallback colors for when logo fails to load
const STOCK_COLORS: Record<string, [string, string]> = {
  AAPL:  ['#555', '#888'],
  MSFT:  ['#0078d4', '#00bcf2'],
  GOOGL: ['#4285f4', '#34a853'],
  GOOG:  ['#4285f4', '#34a853'],
  AMZN:  ['#ff9900', '#ffb347'],
  META:  ['#1877f2', '#42a5f5'],
  TSLA:  ['#cc0000', '#ff4444'],
  NVDA:  ['#76b900', '#a8d800'],
  NFLX:  ['#e50914', '#ff4444'],
  BABA:  ['#ff6a00', '#ee0979'],
  BIDU:  ['#2932e1', '#5b6ef5'],
  JD:    ['#e1251b', '#ff6b6b'],
  TCEHY: ['#07c160', '#0a9c4e'],
  TSM:   ['#003087', '#0057b7'],
  SONY:  ['#000', '#333'],
  TOYOTA:['#eb0a1e', '#ff4444'],
  SHOP:  ['#96bf48', '#5e8e3e'],
  SQ:    ['#00d64f', '#007a2f'],
  PYPL:  ['#003087', '#009cde'],
  V:     ['#1a1f71', '#f7a600'],
  MA:    ['#eb001b', '#f79e1b'],
  JPM:   ['#005eb8', '#0072ce'],
  BAC:   ['#e31837', '#012169'],
  GS:    ['#6699cc', '#003366'],
  WMT:   ['#0071ce', '#ffc220'],
  AMGN:  ['#003087', '#00a3e0'],
  PFE:   ['#0093d0', '#005587'],
  JNJ:   ['#cc0000', '#d50032'],
  KO:    ['#f40009', '#cc0000'],
  PEP:   ['#004b93', '#0078d4'],
  MCD:   ['#ffbc0d', '#da291c'],
  SBUX:  ['#00704a', '#1e3932'],
  DIS:   ['#113ccf', '#0063e5'],
  BA:    ['#1d4289', '#0033a0'],
  GE:    ['#0066b2', '#00a0dc'],
  XOM:   ['#e01b22', '#c8102e'],
  CVX:   ['#0066b2', '#004b8d'],
  CRM:   ['#00a1e0', '#032d60'],
  ORCL:  ['#c74634', '#f80000'],
  INTC:  ['#0071c5', '#00aeef'],
  AMD:   ['#ed1c24', '#f7941d'],
  QCOM:  ['#3253dc', '#0f2b8f'],
  UBER:  ['#000', '#333'],
  LYFT:  ['#ff00bf', '#cc0099'],
  SPOT:  ['#1db954', '#191414'],
  TWTR:  ['#1da1f2', '#0d8ecf'],
  SNAP:  ['#fffc00', '#f5a623'],
  PINS:  ['#e60023', '#ad081b'],
  COIN:  ['#0052ff', '#1652f0'],
  ADBE:  ['#ff0000', '#cc0000'],
  ABBV:  ['#071d49', '#1a3a6b'],
  IBM:   ['#1f70c1', '#054ada'],
  CSCO:  ['#049fd9', '#0070d2'],
  NOW:   ['#81b5a1', '#293e40'],
  ADSK:  ['#0696d7', '#0054a6'],
  INTU:  ['#365ebf', '#2747a0'],
  PANW:  ['#fa582d', '#c73e1d'],
  ACN:   ['#a100ff', '#7800c4'],
  BLK:   ['#000', '#333'],
  MS:    ['#003087', '#0057b7'],
  C:     ['#003b70', '#0066b2'],
  WFC:   ['#cc0000', '#d50032'],
  AXP:   ['#016fcf', '#0057b7'],
  COF:   ['#d03027', '#a8201a'],
  MMM:   ['#ff0000', '#cc0000'],
  CAT:   ['#ffcd11', '#e8a900'],
  DE:    ['#367c2b', '#2a5e20'],
  HON:   ['#e2231a', '#b51a13'],
  RTX:   ['#003087', '#0057b7'],
  LMT:   ['#1c3f6e', '#0f2a4a'],
  UPS:   ['#351c15', '#5c2d0e'],
  FDX:   ['#4d148c', '#ff6600'],
  T:     ['#00a8e0', '#0057b7'],
  VZ:    ['#cd040b', '#a00009'],
  TMUS:  ['#e20074', '#b5005c'],
  CMCSA: ['#000', '#333'],
  ATVI:  ['#000', '#333'],
  EA:    ['#ff4747', '#cc0000'],
  MELI:  ['#ffe600', '#ccb800'],
  SE:    ['#ee4d2d', '#c73e1d'],
};

function CurrencyIcon({ symbol, size }: { symbol: string; size: number }) {
  const [base, quote] = parseFxPair(symbol);
  const baseFlag = CURRENCY_FLAGS[base] ?? '💱';
  const quoteFlag = CURRENCY_FLAGS[quote] ?? '💱';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Base currency flag */}
      <div style={{
        position: 'absolute', left: 0, top: 0,
        width: size * 0.72, height: size * 0.72,
        borderRadius: '50%',
        background: 'rgba(30,41,59,0.95)',
        border: '1.5px solid rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38,
        zIndex: 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
      }}>
        {baseFlag}
      </div>
      {/* Quote currency flag */}
      <div style={{
        position: 'absolute', right: 0, bottom: 0,
        width: size * 0.72, height: size * 0.72,
        borderRadius: '50%',
        background: 'rgba(15,23,42,0.95)',
        border: '1.5px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38,
        zIndex: 1,
        boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
      }}>
        {quoteFlag}
      </div>
    </div>
  );
}

function CommodityIcon({ symbol, size }: { symbol: string; size: number }) {
  const key = symbol.replace('/', '').toUpperCase();
  const config = COMMODITY_ICONS[key];

  if (config) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: config.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        border: '1.5px solid rgba(255,255,255,0.12)',
        fontSize: size * 0.52,
        lineHeight: 1,
      }}>
        {config.emoji}
      </div>
    );
  }

  // Generic commodity fallback
  const initials = key.replace('USD', '').slice(0, 3);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg,#064e3b,#10b981)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.3, fontWeight: 700, color: '#fff',
      flexShrink: 0,
      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      border: '1.5px solid rgba(16,185,129,0.3)',
    }}>
      {initials}
    </div>
  );
}

function StockIcon({ symbol, size }: { symbol: string; size: number }) {
  // 0 = try Clearbit, 1 = try Google favicon, 2 = show ticker badge
  const [fallbackLevel, setFallbackLevel] = useState(0);
  const key = symbol.replace('USDT', '').replace('/USD', '').toUpperCase();
  const clearbitUrl = getStockLogoUrl(key);
  const googleFaviconUrl = getGoogleFaviconUrl(key);
  const colors = STOCK_COLORS[key] ?? ['#1e293b', '#334155'];
  const initials = key.slice(0, key.length <= 3 ? 3 : 4);

  const currentSrc = fallbackLevel === 0 ? clearbitUrl : fallbackLevel === 1 ? googleFaviconUrl : '';

  if (currentSrc && fallbackLevel < 2) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 8,
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.15)',
        overflow: 'hidden',
        padding: fallbackLevel === 1 ? 2 : 3,
      }}>
        <img
          src={currentSrc}
          alt={key}
          width={size - 6}
          height={size - 6}
          style={{ width: size - 6, height: size - 6, objectFit: 'contain', borderRadius: 5 }}
          onError={() => setFallbackLevel(prev => prev + 1)}
        />
      </div>
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: `linear-gradient(135deg,${colors[0]},${colors[1]})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      border: '1.5px solid rgba(255,255,255,0.1)',
    }}>
      <span style={{
        color: '#fff',
        fontSize: initials.length <= 2 ? size * 0.36 : initials.length === 3 ? size * 0.3 : size * 0.24,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}>
        {initials}
      </span>
    </div>
  );
}

function AssetIcon({ symbol, category, size = 28 }: { symbol: string; category: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const iconSymbol = getCryptoIconSymbol(symbol);
  const cat = category.toLowerCase();

  // Crypto: use real coin images
  if (isCrypto(category) && !imgError) {
    return (
      <img
        src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${iconSymbol}.png`}
        alt={symbol}
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
        onError={() => setImgError(true)}
      />
    );
  }

  // Currencies: overlapping flag icons
  if (cat === 'forex' || cat === 'currency' || cat === 'currencies') {
    return <CurrencyIcon symbol={symbol} size={size} />;
  }

  // Commodities: emoji + gradient
  if (cat === 'commodity' || cat === 'commodities') {
    return <CommodityIcon symbol={symbol} size={size} />;
  }

  // Stocks: rounded square with ticker
  if (cat === 'stock' || cat === 'stocks' || cat === 'equity') {
    return <StockIcon symbol={symbol} size={size} />;
  }

  // Generic fallback
  const initials = symbol.replace('USDT', '').replace('/USD', '').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#6366f1',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ─── TwelveData symbol mapping ────────────────────────────────────────────────

function toTwelveDataSymbol(symbol: string): string {
  const s = symbol.toUpperCase();

  const COMMODITY_MAP: Record<string, string> = {
    XAUUSD: 'XAU/USD', XAGUSD: 'XAG/USD', PLATINUM: 'XPT/USD', PALLADIUM: 'XPD/USD',
    USOIL: 'WTI/USD', UKOIL: 'BRENT/USD', NATGAS: 'NATGAS/USD',
    COPPER: 'XCU/USD', ALUMINUM: 'XAL/USD', ZINC: 'XZN/USD', NICKEL: 'XNI/USD',
    WHEAT: 'WHEAT/USD', CORN: 'CORN/USD', SOYBEAN: 'SOYBEAN/USD',
    SUGAR: 'SUGAR/USD', COFFEE: 'COFFEE/USD', COCOA: 'COCOA/USD',
    COTTON: 'COTTON/USD', LUMBER: 'LUMBER/USD',
  };
  if (COMMODITY_MAP[s]) return COMMODITY_MAP[s];

  // TwelveData uses plain ticker symbols for stocks (e.g. GOOGL, not GOOGL:NASDAQ)
  const STOCK_TICKERS = new Set([
    'AAPL','MSFT','GOOGL','GOOG','AMZN','META','TSLA','NVDA','NFLX',
    'INTC','AMD','QCOM','CSCO','ADBE','CRM','PYPL','SHOP','SNAP',
    'UBER','LYFT','ZM','COIN','RBLX','HOOD','PLTR','AFRM',
    'RIVN','LCID','MSTR','AVGO','TXN','MU','PANW','CRWD',
    'OKTA','DDOG','SNOW','INTU','ADSK','COST','SBUX','AMGN',
    'GILD','REGN','BIIB','MRNA','ISRG','ASML','ARM','SMCI',
    'TMUS','CMCSA','CHTR','PARA','AAL','MAR','DPZ','PEP',
    'NDAQ','CME','CBOE','WDAY','VEEV','ZS','NET','MDB','CFLT',
    'JPM','BAC','WFC','C','GS','MS','BLK','AXP','COF','USB','PNC',
    'JNJ','PFE','MRK','ABT','ABBV','BMY','LLY','UNH','CVS','HUM',
    'XOM','CVX','COP','SLB','EOG','OXY','HAL',
    'BA','LMT','RTX','NOC','GD','CAT','DE','HON','MMM','GE','EMR',
    'UPS','FDX','DAL','UAL','LUV','CCL','RCL','HLT','MGM',
    'WMT','TGT','HD','LOW','NKE','KO','MCD','CMG',
    'T','VZ','DIS','NEE','DUK','SO','PG','CL','KMB',
    'V','MA','FIS','GPN','BABA','NIO','TSM',
    'IBM','HPQ','DELL','ACN','NOW','SPGI','MCO','ICE',
    'SONY','TM','SAP',
  ]);
  if (STOCK_TICKERS.has(s)) return s;

  // Currencies: convert 6-char XXXYYY → XXX/YYY
  if (s.length === 6 && /^[A-Z]{6}$/.test(s)) return s.slice(0, 3) + '/' + s.slice(3);
  if (s.includes('/')) return s;
  return s;
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function AssetSelectorModal({
  isOpen,
  onClose,
  assets,
  selectedAsset,
  onSelectAsset,
}: AssetSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<ModalCategory>('Currencies');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('asset_favorites');
        return stored ? new Set(JSON.parse(stored)) : new Set();
      } catch { return new Set(); }
    }
    return new Set();
  });
  const [assetPrices, setAssetPrices] = useState<Map<string, { price: number | null; change24h: number | null; changePct24h: number | null }>>(new Map());
  const [visible, setVisible] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Animation ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setVisible(false);
      const t = setTimeout(() => {
        setVisible(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }, 10);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // ── Filtered assets ────────────────────────────────────────────────────────

  const filteredAssets = assets.filter((a) => {
    const catMatch = CATEGORY_MAP[activeTab]?.includes(a.category.toLowerCase()) ?? false;
    const q = searchQuery.toLowerCase();
    const searchMatch = !q || a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
    return catMatch && searchMatch;
  });

  // ── Binance WebSocket for crypto ───────────────────────────────────────────

  const startBinanceWS = useCallback((cryptoAssets: AssetItem[]) => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (cryptoAssets.length === 0) return;

    const streams = cryptoAssets.map((a) => `${getBinanceSymbol(a.symbol).toLowerCase()}@ticker`).join('/');
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const data = msg.data ?? msg;
          if (!data?.s) return;

          const binanceSymbol = data.s.toUpperCase();
          const asset = cryptoAssets.find((a) => getBinanceSymbol(a.symbol).toUpperCase() === binanceSymbol);
          if (!asset) return;

          const price = parseFloat(data.c);
          const changePct = parseFloat(data.P);
          const priceChange = parseFloat(data.p);

          setAssetPrices((prev) => {
            const next = new Map(prev);
            next.set(asset.symbol, { price, change24h: priceChange, changePct24h: changePct });
            return next;
          });
        } catch {}
      };

      ws.onerror = () => {};
      ws.onclose = () => {};
    } catch {}
  }, []);

  // ── Twelve Data polling for non-crypto ────────────────────────────────────

  const startTwelveDataPolling = useCallback((nonCryptoAssets: AssetItem[]) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (nonCryptoAssets.length === 0) return;

    const apiKey = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY;
    if (!apiKey) return;

    const fetchPrices = async () => {
      // Batch up to 8 symbols per request
      const batches: AssetItem[][] = [];
      for (let i = 0; i < nonCryptoAssets.length; i += 8) {
        batches.push(nonCryptoAssets.slice(i, i + 8));
      }

      for (const batch of batches) {
        // Map each asset symbol to the correct TwelveData symbol
        const mappedSymbols = batch.map((a) => toTwelveDataSymbol(a.symbol));
        const symbols = mappedSymbols.join(',');
        try {
          const res = await fetch(
            `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbols)}&apikey=${apiKey}`
          );
          if (!res.ok) continue;
          const json = await res.json();

          // Handle single vs multiple response — key by mapped symbol, update by original symbol
          const entries = batch.length === 1
            ? [{ symbol: batch[0].symbol, data: json }]
            : batch.map((a, i) => ({ symbol: a.symbol, data: json[mappedSymbols[i]] }));

          for (const { symbol, data } of entries) {
            if (!data || data.status === 'error') continue;
            const price = parseFloat(data.close ?? data.price ?? '0');
            const change = parseFloat(data.change ?? '0');
            const changePct = parseFloat(data.percent_change ?? '0');
            if (!isNaN(price) && price > 0) {
              setAssetPrices((prev) => {
                const next = new Map(prev);
                next.set(symbol, { price, change24h: change, changePct24h: changePct });
                return next;
              });
            }
          }
        } catch {}
      }
    };

    fetchPrices();
    pollingRef.current = setInterval(fetchPrices, 5000);
  }, []);

  // ── Start/stop price feeds when modal opens ────────────────────────────────

  useEffect(() => {
    if (!isOpen) {
      wsRef.current?.close();
      wsRef.current = null;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const cryptoAssets = assets.filter((a) => isCrypto(a.category));
    const nonCryptoAssets = assets.filter((a) => !isCrypto(a.category));

    startBinanceWS(cryptoAssets);
    startTwelveDataPolling(nonCryptoAssets);

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isOpen, assets, startBinanceWS, startTwelveDataPolling]);

  // ── Favorites ──────────────────────────────────────────────────────────────

  const toggleFavorite = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      try { localStorage.setItem('asset_favorites', JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  // ── Handle select ──────────────────────────────────────────────────────────

  const handleSelect = (asset: AssetItem) => {
    onSelectAsset(asset);
    onClose();
  };

  // ── Handle close ──────────────────────────────────────────────────────────

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: visible ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0)',
        backdropFilter: visible ? 'blur(4px)' : 'blur(0px)',
        transition: 'background 200ms ease, backdrop-filter 200ms ease',
        padding: '0',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#141414',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 580,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.9)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(16px)',
          transition: 'opacity 200ms ease-out, transform 200ms cubic-bezier(0.22,1,0.36,1)',
          margin: '0 12px',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>Select trade pair</span>
          <button
            onClick={handleClose}
            style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'rgba(255,255,255,0.08)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#94a3b8', transition: 'background 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Category Tabs ── */}
        <div style={{
          display: 'flex', gap: 4, padding: '12px 20px 0',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0, overflowX: 'auto',
        }}>
          {MODAL_CATEGORIES.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearchQuery(''); }}
              style={{
                padding: '7px 14px',
                borderRadius: '6px 6px 0 0',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                transition: 'all 150ms',
                background: activeTab === tab ? '#2563eb' : 'transparent',
                color: activeTab === tab ? '#fff' : '#64748b',
                marginBottom: -1,
                borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab) e.currentTarget.style.color = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab) e.currentTarget.style.color = '#64748b';
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Search Row ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          {/* Favorites count badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>{favorites.size}</span>
          </div>

          {/* Search input */}
          <div style={{ flex: 1, position: 'relative' }}>
            <svg
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '8px 10px 8px 32px',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>
        </div>

        {/* ── Column Headers ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '32px 1fr 100px 80px',
          gap: 0,
          padding: '8px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div />
          <span style={{ color: '#475569', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name</span>
          <span style={{ color: '#475569', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>24h Change</span>
          <span style={{ color: '#475569', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Payout</span>
        </div>

        {/* ── Asset List ── */}
        <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
          {filteredAssets.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#475569', fontSize: 13 }}>
              No assets found
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const priceData = assetPrices.get(asset.symbol);
              const isActive = selectedAsset?.id === asset.id;
              const isFav = favorites.has(asset.symbol);
              const changePct = priceData?.changePct24h ?? null;
              const isPositive = changePct !== null && changePct >= 0;

              return (
                <div
                  key={asset.id}
                  onClick={() => handleSelect(asset)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 1fr 100px 80px',
                    alignItems: 'center',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: isActive ? 'rgba(37,99,235,0.12)' : 'transparent',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Favorite star */}
                  <button
                    onClick={(e) => toggleFavorite(e, asset.symbol)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isFav ? '#f59e0b' : '#334155',
                      transition: 'color 150ms',
                    }}
                    onMouseEnter={(e) => { if (!isFav) e.currentTarget.style.color = '#64748b'; }}
                    onMouseLeave={(e) => { if (!isFav) e.currentTarget.style.color = '#334155'; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={isFav ? '#f59e0b' : 'none'} stroke="currentColor" strokeWidth="1.8">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>

                  {/* Asset name + icon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <AssetIcon symbol={asset.symbol} category={asset.category} size={28} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {asset.symbol.replace('USDT', '').replace('/USD', '')}
                        </span>
                        {isActive && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                            color: '#2563eb', background: 'rgba(37,99,235,0.2)',
                            border: '1px solid rgba(37,99,235,0.4)',
                            padding: '1px 5px', borderRadius: 3,
                          }}>
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span style={{ color: '#475569', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: 140 }}>
                        {asset.name}
                      </span>
                    </div>
                  </div>

                  {/* 24h Change */}
                  <div style={{ textAlign: 'right' }}>
                    {changePct !== null ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                        {isPositive ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="18 15 12 9 6 15" />
                          </svg>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        )}
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: isPositive ? '#10b981' : '#ef4444',
                        }}>
                          {isPositive ? '+' : ''}{changePct.toFixed(2)}%
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: '#334155', fontSize: 12 }}>—</span>
                    )}
                  </div>

                  {/* Payout */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#f59e0b', fontSize: 13, fontWeight: 700 }}>95%</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .asset-modal-container {
            margin: 0 !important;
            max-width: 100vw !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
