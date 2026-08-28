'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Wallet } from 'lucide-react';
import { COUNTRY_CURRENCY, REGION_ORDER, getRegion, FlagIcon } from '@/lib/deposit-countries';

interface PaymentMethod {
  id: string;
  type: string;
  country: string;
  name: string;
  account_number: string | null;
  account_name: string | null;
  network: string | null;
  instructions: string | null;
  min_deposit: number;
  max_deposit: number;
  is_active: boolean;
}

interface CurrencyRate {
  currency_code: string;
  currency_name: string;
  rate_to_usd: number;
}

interface BonusSetting {
  bonus_percent: number;
  min_deposit: number;
  max_bonus: number;
}

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  isDemo: boolean;
}

type Step = 'country' | 'method' | 'amount' | 'success';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  bank: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 20 7 4 7" />
    </svg>
  ),
  ewallet: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  crypto: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M9.5 9.5c0-1.1.9-2 2-2h1a2 2 0 0 1 0 4h-1a2 2 0 0 1 0 4h1a2 2 0 0 0 2-2M12 7v10" />
    </svg>
  ),
  card: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
};

const TYPE_COLORS: Record<string, string> = {
  bank: '#3b82f6',
  ewallet: '#8b5cf6',
  crypto: '#f59e0b',
  card: '#10b981',
};

const TYPE_LABELS: Record<string, string> = {
  bank: 'Bank Transfer',
  ewallet: 'E-Wallet',
  crypto: 'Cryptocurrency',
  card: 'Credit / Debit Card',
};

const DEFAULT_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.27,
  CHF: 1.12,
  MYR: 0.224,
  SGD: 0.745,
  THB: 0.028,
  VND: 0.000039,
  JPY: 0.0067,
  KRW: 0.00072,
  PHP: 0.017,
  CNY: 0.138,
  INR: 0.012,
  HKD: 0.128,
  TWD: 0.0312,
  BRL: 0.18,
  ARS: 0.0011,
  COP: 0.00025,
  CLP: 0.00105,
  PEN: 0.27,
  UYU: 0.025,
  PYG: 0.00013,
  BOB: 0.145,
  VES: 0.027,
  SAR: 0.2667,
  AED: 0.2723,
  QAR: 0.2747,
  KWD: 3.25,
  BHD: 2.6525,
  OMR: 2.5974,
  JOD: 1.4104,
  PKR: 0.0036,
  BDT: 0.0091,
  LKR: 0.0034,
  MMK: 0.0005,
  KHR: 0.00024,
  LAK: 0.000046,
  NPR: 0.0075,
  AUD: 0.65,
  NZD: 0.60,
  CAD: 0.74,
  MXN: 0.055,
  SEK: 0.095,
  NOK: 0.092,
  DKK: 0.145,
  PLN: 0.25,
  ISK: 0.0072,
  BAM: 0.552,
  MKD: 0.0176,
  RSD: 0.0093,
  CZK: 0.044,
  HUF: 0.0028,
  RON: 0.216,
  BGN: 0.552,
  UAH: 0.024,
  MDL: 0.056,
  BYN: 0.305,
  RUB: 0.0107,
  ALL: 0.0108,
  GYD: 0.0048,
  SRD: 0.028,
};

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  // Germany 🇩🇪
  { id: 'def-de-1', country: 'Germany', type: 'bank', name: 'Deutsche Bank', account_number: 'DE89 3704 0044 0532 0130 00', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'Direct transfer to Deutsche Bank account via SEPA / Online Banking.', min_deposit: 10, max_deposit: 50000, is_active: true },
  { id: 'def-de-2', country: 'Germany', type: 'bank', name: 'Commerzbank', account_number: 'DE43 5008 0000 0123 4567 89', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'Direct transfer to Commerzbank account.', min_deposit: 10, max_deposit: 50000, is_active: true },
  { id: 'def-de-3', country: 'Germany', type: 'bank', name: 'N26 Bank', account_number: 'DE92 1001 1001 2612 3456 78', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'Instant mobile SEPA transfer from your N26 app.', min_deposit: 10, max_deposit: 50000, is_active: true },
  { id: 'def-de-4', country: 'Germany', type: 'bank', name: 'Sparkasse / Girokonto', account_number: 'DE12 5005 0000 0987 6543 21', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'Sparkasse online banking transfer.', min_deposit: 10, max_deposit: 50000, is_active: true },
  { id: 'def-de-5', country: 'Germany', type: 'bank', name: 'SEPA Instant Transfer (Eurozone)', account_number: 'DE89 3704 0044 0532 0130 00', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'Instant Euro transfer arriving in seconds.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // United Kingdom 🇬🇧
  { id: 'def-uk-1', country: 'United Kingdom', type: 'bank', name: 'Barclays Bank UK', account_number: '20-00-00 12345678', account_name: 'Tradiglo UK Ltd', network: null, instructions: 'UK Faster Payments / Online banking transfer.', min_deposit: 10, max_deposit: 50000, is_active: true },
  { id: 'def-uk-2', country: 'United Kingdom', type: 'bank', name: 'HSBC UK', account_number: '40-05-15 87654321', account_name: 'Tradiglo UK Ltd', network: null, instructions: 'HSBC UK online transfer.', min_deposit: 10, max_deposit: 50000, is_active: true },
  { id: 'def-uk-3', country: 'United Kingdom', type: 'bank', name: 'Revolut UK / Monzo', account_number: '04-00-04 55667788', account_name: 'Tradiglo UK Ltd', network: null, instructions: 'Instant app transfer via Revolut or Monzo.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // France 🇫🇷
  { id: 'def-fr-1', country: 'France', type: 'bank', name: 'BNP Paribas', account_number: 'FR76 3000 4000 0100 0123 4567 890', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'Virement bancaire SEPA BNP Paribas.', min_deposit: 10, max_deposit: 50000, is_active: true },
  { id: 'def-fr-2', country: 'France', type: 'bank', name: 'Crédit Agricole', account_number: 'FR76 1000 2000 0300 0987 6543 210', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'Virement bancaire Crédit Agricole.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Italy 🇮🇹
  { id: 'def-it-1', country: 'Italy', type: 'bank', name: 'Intesa Sanpaolo', account_number: 'IT60 X030 6905 0000 0001 2345 678', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'Bonifico bancario SEPA Intesa Sanpaolo.', min_deposit: 10, max_deposit: 50000, is_active: true },
  { id: 'def-it-2', country: 'Italy', type: 'bank', name: 'UniCredit Italia', account_number: 'IT02 Y020 0805 0000 0009 8765 432', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'Bonifico online UniCredit.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Spain 🇪🇸
  { id: 'def-es-1', country: 'Spain', type: 'bank', name: 'Banco Santander España', account_number: 'ES91 0049 1500 0512 3456 7890', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'Transferencia bancaria Santander / Bizum.', min_deposit: 10, max_deposit: 50000, is_active: true },
  { id: 'def-es-2', country: 'Spain', type: 'bank', name: 'BBVA España', account_number: 'ES21 0182 2300 0898 7654 3210', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'Transferencia online BBVA.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Netherlands 🇳🇱
  { id: 'def-nl-1', country: 'Netherlands', type: 'bank', name: 'ING Bank Netherlands', account_number: 'NL91 INGB 0001 2345 67', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'iDEAL / SEPA bankoverschrijving via ING.', min_deposit: 10, max_deposit: 50000, is_active: true },
  { id: 'def-nl-2', country: 'Netherlands', type: 'bank', name: 'Rabobank / ABN AMRO', account_number: 'NL02 RABO 0300 9876 54', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'Bankoverschrijving via Rabobank of ABN AMRO.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Switzerland 🇨🇭
  { id: 'def-ch-1', country: 'Switzerland', type: 'bank', name: 'UBS Switzerland', account_number: 'CH93 0023 0230 1234 5678 A', account_name: 'Tradiglo AG', network: null, instructions: 'Banküberweisung / Virement via UBS.', min_deposit: 10, max_deposit: 50000, is_active: true },
  { id: 'def-ch-2', country: 'Switzerland', type: 'bank', name: 'Credit Suisse / Raiffeisen', account_number: 'CH56 0483 5048 8765 4321 B', account_name: 'Tradiglo AG', network: null, instructions: 'Online banking transfer.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Brazil 🇧🇷
  { id: 'def-br-1', country: 'Brazil', type: 'bank', name: 'Banco do Brasil / PIX', account_number: 'pix@tradiglo.com', account_name: 'Tradiglo LatAm Ltda', network: null, instructions: 'Transferência instantânea via Chave PIX ou Banco do Brasil.', min_deposit: 10, max_deposit: 50000, is_active: true },
  { id: 'def-br-2', country: 'Brazil', type: 'bank', name: 'Itaú Unibanco', account_number: 'Agência 1234 Conta 56789-0', account_name: 'Tradiglo LatAm Ltda', network: null, instructions: 'Transferência TED/DOC/PIX Itaú.', min_deposit: 10, max_deposit: 50000, is_active: true },
  { id: 'def-br-3', country: 'Brazil', type: 'bank', name: 'Nubank / Bradesco', account_number: 'Agência 0001 Conta 98765-4', account_name: 'Tradiglo LatAm Ltda', network: null, instructions: 'Transferência Nubank ou Bradesco.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Argentina 🇦🇷
  { id: 'def-ar-1', country: 'Argentina', type: 'bank', name: 'Banco de la Nación Argentina', account_number: 'CBU: 0110599520000012345678', account_name: 'Tradiglo LatAm SA', network: null, instructions: 'Transferencia bancaria CBU / Alias.', min_deposit: 10, max_deposit: 50000, is_active: true },
  { id: 'def-ar-2', country: 'Argentina', type: 'bank', name: 'Mercado Pago / Santander', account_number: 'CVU: 0000003100012345678901', account_name: 'Tradiglo LatAm SA', network: null, instructions: 'Transferencia Mercado Pago o Santander Río.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Colombia 🇨🇴
  { id: 'def-co-1', country: 'Colombia', type: 'bank', name: 'Bancolombia / PSE', account_number: 'Ahorros: 123-456789-01', account_name: 'Tradiglo Colombia SAS', network: null, instructions: 'Transferencia Bancolombia / PSE / Nequi.', min_deposit: 10, max_deposit: 50000, is_active: true },
  { id: 'def-co-2', country: 'Colombia', type: 'bank', name: 'Davivienda / Nequi', account_number: 'Ahorros: 987-654321-02', account_name: 'Tradiglo Colombia SAS', network: null, instructions: 'Transferencia Davivienda o Nequi.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Chile 🇨🇱
  { id: 'def-cl-1', country: 'Chile', type: 'bank', name: 'Banco de Chile / BancoEstado', account_number: 'Cuenta Corriente: 00-123-45678-01', account_name: 'Tradiglo Chile SpA', network: null, instructions: 'Transferencia electrónica Banco de Chile o CuentaRUT.', min_deposit: 10, max_deposit: 50000, is_active: true },
  { id: 'def-cl-2', country: 'Chile', type: 'bank', name: 'Banco Santander-Chile', account_number: 'Cuenta Corriente: 00-987-65432-02', account_name: 'Tradiglo Chile SpA', network: null, instructions: 'Transferencia online Santander.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Peru 🇵🇪
  { id: 'def-pe-1', country: 'Peru', type: 'bank', name: 'BCP (Banco de Crédito del Perú) / Yape', account_number: 'Cuenta Soles: 191-12345678-0-91', account_name: 'Tradiglo Perú SAC', network: null, instructions: 'Transferencia BCP o Yape.', min_deposit: 10, max_deposit: 50000, is_active: true },
  { id: 'def-pe-2', country: 'Peru', type: 'bank', name: 'BBVA Perú / Interbank / Plin', account_number: 'Cuenta Soles: 0011-0123-0100045678', account_name: 'Tradiglo Perú SAC', network: null, instructions: 'Transferencia BBVA, Interbank o Plin.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Portugal 🇵🇹
  { id: 'def-pt-1', country: 'Portugal', type: 'bank', name: 'Caixa Geral de Depósitos', account_number: 'PT50 0035 0100 0001 2345 6789 0', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'Transferência bancária CGD / MB WAY.', min_deposit: 10, max_deposit: 50000, is_active: true },
  { id: 'def-pt-2', country: 'Portugal', type: 'bank', name: 'Millennium BCP', account_number: 'PT50 0033 0000 0009 8765 4321 0', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'Transferência online Millennium BCP.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Oman 🇴🇲
  { id: 'def-om-1', country: 'Oman', type: 'bank', name: 'Bank Muscat', account_number: '0345 0123 4567 001', account_name: 'Tradiglo ME LLC', network: null, instructions: 'Online bank transfer via Bank Muscat.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Cambodia 🇰🇭
  { id: 'def-kh-1', country: 'Cambodia', type: 'bank', name: 'ABA Bank Cambodia / KHQR', account_number: '001 234 567', account_name: 'Tradiglo Asia Ltd', network: null, instructions: 'ABA Mobile / KHQR bank transfer.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Bolivia 🇧🇴
  { id: 'def-bo-1', country: 'Bolivia', type: 'bank', name: 'Banco Nacional de Bolivia (BNB)', account_number: 'Cuenta: 4012345678', account_name: 'Tradiglo Bolivia SRL', network: null, instructions: 'Transferencia bancaria BNB o Banco Unión.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Ecuador 🇪🇨
  { id: 'def-ec-1', country: 'Ecuador', type: 'bank', name: 'Banco Pichincha', account_number: 'Cuenta: 2201234567', account_name: 'Tradiglo Ecuador SA', network: null, instructions: 'Transferencia bancaria Banco Pichincha (USD).', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Paraguay 🇵🇾
  { id: 'def-py-1', country: 'Paraguay', type: 'bank', name: 'Banco Itaú Paraguay', account_number: 'Cuenta: 1102345678', account_name: 'Tradiglo Paraguay SRL', network: null, instructions: 'Transferencia bancaria Itaú o Banco Continental.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Uruguay 🇺🇾
  { id: 'def-uy-1', country: 'Uruguay', type: 'bank', name: 'Banco República (BROU)', account_number: 'Cuenta: 001-0012345-0', account_name: 'Tradiglo Uruguay SA', network: null, instructions: 'Transferencia bancaria BROU o Santander Uruguay.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Guyana 🇬🇾
  { id: 'def-gy-1', country: 'Guyana', type: 'bank', name: 'Republic Bank Guyana', account_number: 'Acct: 070-123-45678', account_name: 'Tradiglo Guyana Inc', network: null, instructions: 'Local bank transfer via Republic Bank.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Suriname 🇸🇷
  { id: 'def-sr-1', country: 'Suriname', type: 'bank', name: 'De Surinaamsche Bank (DSB)', account_number: 'Acct: 12-345678-01', account_name: 'Tradiglo Suriname NV', network: null, instructions: 'Local bank transfer via DSB.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Luxembourg 🇱🇺
  { id: 'def-lu-1', country: 'Luxembourg', type: 'bank', name: 'Banque et Caisse d’Épargne (BCEE)', account_number: 'LU28 0019 4006 4475 0000', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'SEPA bank transfer via BCEE.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Liechtenstein 🇱🇮
  { id: 'def-li-1', country: 'Liechtenstein', type: 'bank', name: 'LGT Bank', account_number: 'LI21 0881 0000 2324 013A A', account_name: 'Tradiglo AG', network: null, instructions: 'Bank transfer via LGT Bank Liechtenstein.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Monaco 🇲🇨
  { id: 'def-mc-1', country: 'Monaco', type: 'bank', name: 'CMB Monaco', account_number: 'MC58 1122 2000 0101 2345 6789 030', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'Virement bancaire via CMB Monaco.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Malta 🇲🇹
  { id: 'def-mt-1', country: 'Malta', type: 'bank', name: 'Bank of Valletta (BOV)', account_number: 'MT84 MALT 0110 0001 2345 MTLC AST0 01', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'SEPA transfer via Bank of Valletta.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Cyprus 🇨🇾
  { id: 'def-cy-1', country: 'Cyprus', type: 'bank', name: 'Bank of Cyprus', account_number: 'CY17 0020 0128 0000 0012 0052 7600', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'SEPA transfer via Bank of Cyprus.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Croatia 🇭🇷
  { id: 'def-hr-1', country: 'Croatia', type: 'bank', name: 'Zagrebačka banka', account_number: 'HR12 1001 0051 8630 0016 0', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'SEPA transfer via Zagrebačka banka.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Slovenia 🇸🇮
  { id: 'def-si-1', country: 'Slovenia', type: 'bank', name: 'Nova Ljubljanska Banka (NLB)', account_number: 'SI56 0201 0001 2345 678', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'SEPA transfer via NLB.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Albania 🇦🇱
  { id: 'def-al-1', country: 'Albania', type: 'bank', name: 'Raiffeisen Bank Albania', account_number: 'AL47 2121 1009 0000 0002 3569 8741', account_name: 'Tradiglo CEE Ltd', network: null, instructions: 'Bank transfer via Raiffeisen Bank Albania.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Andorra 🇦🇩
  { id: 'def-ad-1', country: 'Andorra', type: 'bank', name: 'Crèdit Andorrà', account_number: 'AD12 0001 0012 0123 4567 8901', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'Bank transfer via Crèdit Andorrà.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // San Marino 🇸🇲
  { id: 'def-sm-1', country: 'San Marino', type: 'bank', name: 'Banca di San Marino', account_number: 'SM86 U032 2509 8000 0000 0270 100', account_name: 'Tradiglo Europe Ltd', network: null, instructions: 'Bank transfer via Banca di San Marino.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Bosnia and Herzegovina 🇧🇦
  { id: 'def-ba-1', country: 'Bosnia and Herzegovina', type: 'bank', name: 'UniCredit Bank d.d.', account_number: 'BA39 1290 0794 0102 8494', account_name: 'Tradiglo CEE Ltd', network: null, instructions: 'Bank transfer via UniCredit Bank BiH.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Montenegro 🇲🇪
  { id: 'def-me-1', country: 'Montenegro', type: 'bank', name: 'Crnogorska Komercijalna Banka (CKB)', account_number: 'ME25 5050 0001 2345 6789 51', account_name: 'Tradiglo CEE Ltd', network: null, instructions: 'Bank transfer via CKB Montenegro.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // North Macedonia 🇲🇰
  { id: 'def-mk-1', country: 'North Macedonia', type: 'bank', name: 'Stopanska Banka', account_number: 'MK07 2501 2000 0058 984', account_name: 'Tradiglo CEE Ltd', network: null, instructions: 'Bank transfer via Stopanska Banka.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Serbia 🇷🇸
  { id: 'def-rs-1', country: 'Serbia', type: 'bank', name: 'Banca Intesa Beograd', account_number: 'RS35 2600 0560 1001 6113 79', account_name: 'Tradiglo CEE Ltd', network: null, instructions: 'Bank transfer via Banca Intesa Beograd.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Kosovo 🇽🇰
  { id: 'def-xk-1', country: 'Kosovo', type: 'bank', name: 'ProCredit Bank Kosovo', account_number: 'XK05 1212 0123 4567 8906', account_name: 'Tradiglo CEE Ltd', network: null, instructions: 'Bank transfer via ProCredit Bank Kosovo.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Czech Republic 🇨🇿
  { id: 'def-cz-1', country: 'Czech Republic', type: 'bank', name: 'Česká spořitelna', account_number: 'CZ65 0800 0000 1920 0014 5399', account_name: 'Tradiglo CEE Ltd', network: null, instructions: 'Bank transfer via Česká spořitelna.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Slovakia 🇸🇰
  { id: 'def-sk-1', country: 'Slovakia', type: 'bank', name: 'Slovenská sporiteľňa', account_number: 'SK31 1200 0000 1987 4263 7541', account_name: 'Tradiglo CEE Ltd', network: null, instructions: 'SEPA transfer via Slovenská sporiteľňa.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Hungary 🇭🇺
  { id: 'def-hu-1', country: 'Hungary', type: 'bank', name: 'OTP Bank', account_number: 'HU42 1177 3016 1111 1018 0000 0000', account_name: 'Tradiglo CEE Ltd', network: null, instructions: 'Bank transfer via OTP Bank.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Romania 🇷🇴
  { id: 'def-ro-1', country: 'Romania', type: 'bank', name: 'Banca Transilvania', account_number: 'RO49 AAAA 1B31 0075 9384 0000', account_name: 'Tradiglo CEE Ltd', network: null, instructions: 'Bank transfer via Banca Transilvania.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Bulgaria 🇧🇬
  { id: 'def-bg-1', country: 'Bulgaria', type: 'bank', name: 'UniCredit Bulbank', account_number: 'BG80 BNBG 9661 1020 3456 78', account_name: 'Tradiglo CEE Ltd', network: null, instructions: 'Bank transfer via UniCredit Bulbank.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Ukraine 🇺🇦
  { id: 'def-ua-1', country: 'Ukraine', type: 'bank', name: 'PrivatBank', account_number: 'UA21 3223 1300 0002 6007 2335 6600 1', account_name: 'Tradiglo CEE Ltd', network: null, instructions: 'Bank transfer via PrivatBank.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Moldova 🇲🇩
  { id: 'def-md-1', country: 'Moldova', type: 'bank', name: 'Moldova Agroindbank (MAIB)', account_number: 'MD24 AG00 0000 0022 1234 5678', account_name: 'Tradiglo CEE Ltd', network: null, instructions: 'Bank transfer via MAIB.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Belarus 🇧🇾
  { id: 'def-by-1', country: 'Belarus', type: 'bank', name: 'Belarusbank', account_number: 'BY13 NBRB 3600 9000 0000 2Z00 AB00', account_name: 'Tradiglo CEE Ltd', network: null, instructions: 'Bank transfer via Belarusbank.', min_deposit: 10, max_deposit: 50000, is_active: true },

  // Russia 🇷🇺
  { id: 'def-ru-1', country: 'Russia', type: 'bank', name: 'Sberbank', account_number: 'Acct: 4081 7810 0000 1234 567', account_name: 'Tradiglo CEE Ltd', network: null, instructions: 'Bank transfer via Sberbank.', min_deposit: 10, max_deposit: 50000, is_active: true },
];

export default function DepositModal({ isOpen, onClose, userId, isDemo }: DepositModalProps) {
  const [step, setStep] = useState<Step>('country');
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [currencyRates, setCurrencyRates] = useState<Record<string, CurrencyRate>>({});
  const [loading, setLoading] = useState(true);
  const [memberCountry, setMemberCountry] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [activeType, setActiveType] = useState<string>('bank');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofBase64, setProofBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isFirstDeposit, setIsFirstDeposit] = useState(false);
  const [bonusSetting, setBonusSetting] = useState<BonusSetting | null>(null);
  const [proofValidating, setProofValidating] = useState(false);
  const [proofValidationError, setProofValidationError] = useState('');
  const [countrySearch, setCountrySearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [methodsRes, ratesRes, bonusRes, profileRes] = await Promise.all([
      supabase.from('payment_methods').select('*').eq('is_active', true).order('country').order('name'),
      supabase.from('currency_rates').select('*'),
      supabase.from('bonus_settings').select('bonus_percent, min_deposit, max_bonus').eq('is_active', true).eq('applies_to', 'first_deposit').maybeSingle(),
      supabase.from('users').select('country').eq('id', userId).maybeSingle(),
    ]);
    
    // Merge database methods with built-in default methods for Europe, South America, etc.
    const remoteMethods = ((methodsRes.data as PaymentMethod[]) || []).filter(
      (method) => method.country?.trim().toLowerCase() !== 'indonesia'
    );
    const mergedMethods = [...remoteMethods];
    DEFAULT_PAYMENT_METHODS.forEach((defMethod) => {
      if (!mergedMethods.some((m) => m.country === defMethod.country && m.name === defMethod.name)) {
        mergedMethods.push(defMethod);
      }
    });
    setMethods(mergedMethods);

    const profileCountry = String(profileRes.data?.country || '').trim();
    const requestedCountry = profileCountry.toLowerCase() === 'indonesia' ? 'Global' : profileCountry;
    // Only auto-lock to the member's country when their profile actually has one set.
    // A new member with no country on file must go through the Country selection step.
    const matchedCountry = profileCountry
      ? Array.from(new Set(mergedMethods.map((method) => method.country || 'Global'))).find(
          (country) => country.toLowerCase() === requestedCountry.toLowerCase()
        )
      : undefined;
    const lockedCountry = matchedCountry || '';
    setMemberCountry(lockedCountry);
    if (lockedCountry) {
      const availableType = ['bank', 'ewallet', 'crypto', 'card'].find((type) =>
        mergedMethods.some((method) => (method.country || 'Global') === lockedCountry && method.type === type)
      );
      setSelectedCountry(lockedCountry);
      setActiveType(availableType || 'bank');
      setStep('method');
    }
    const ratesMap: Record<string, CurrencyRate> = {};
    ((ratesRes.data as CurrencyRate[]) || []).forEach((r) => {
      ratesMap[r.currency_code] = r;
    });
    setCurrencyRates(ratesMap);
    if (bonusRes.data) setBonusSetting(bonusRes.data as BonusSetting);

    // Check if this is user's first deposit
    if (userId) {
      const { data: isFirst } = await supabase.rpc('is_first_deposit', { p_user_id: userId });
      setIsFirstDeposit(!!isFirst);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setStep('country');
      setMemberCountry('');
      setSelectedCountry('');
      setSelectedMethod(null);
      setAmount('');
      setAmountError('');
      setProofFile(null);
      setProofPreview(null);
      setProofBase64(null);
      setProofValidating(false);
      setProofValidationError('');
      setCountrySearch('');
    }
  }, [isOpen, fetchData]);

  // Derived data
  const countries = Array.from(new Set(methods.map((m) => m.country || 'Global'))).sort((a, b) => {
    // Put Global last
    if (a === 'Global') return 1;
    if (b === 'Global') return -1;
    return a.localeCompare(b);
  });
  const filteredCountries = countries.filter((c) =>
    c.toLowerCase().includes(countrySearch.trim().toLowerCase())
  );
  const groupedCountries = REGION_ORDER.reduce<Record<string, string[]>>((acc, region) => {
    acc[region] = filteredCountries.filter((c) => getRegion(c) === region);
    return acc;
  }, {});
  const currency = selectedCountry ? (COUNTRY_CURRENCY[selectedCountry] || 'USD') : 'USD';
  const rate: CurrencyRate | { currency_code: string; currency_name: string; rate_to_usd: number } = currencyRates[currency] ?? {
    currency_code: currency,
    currency_name: currency,
    rate_to_usd: DEFAULT_RATES[currency] ?? 1.0,
  };
  const amountNum = parseFloat(amount) || 0;
  const amountUsd = amountNum * rate.rate_to_usd;

  // Bonus calculation
  const bonusPct = bonusSetting?.bonus_percent ?? 0;
  const BONUS_MIN_USD = 100;
  const isBonusEligible = isFirstDeposit && bonusSetting !== null && amountUsd >= BONUS_MIN_USD;
  const rawBonus = isBonusEligible ? (amountUsd * bonusPct) / 100 : 0;
  const bonusAmt = isBonusEligible && bonusSetting ? Math.min(rawBonus, bonusSetting.max_bonus) : 0;
  const totalWithBonus = Math.round((amountUsd + bonusAmt) * 100) / 100;
  const showBonus = isFirstDeposit && bonusSetting && amountUsd > 0;

  const methodsForCountry = methods.filter((m) => (m.country || 'Global') === selectedCountry);
  const types = ['bank', 'ewallet', 'crypto', 'card'];
  const availableTypes = types.filter((t) => methodsForCountry.some((m) => m.type === t));
  const filteredMethods = methodsForCountry.filter((m) => m.type === activeType);

  const handleSelectCountry = (country: string) => {
    setSelectedCountry(country);
    const firstType = types.find((t) => methods.some((m) => (m.country || 'Global') === country && m.type === t));
    setActiveType(firstType || 'bank');
    setStep('method');
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setAmount(String(method.min_deposit));
    setAmountError('');
    setStep('amount');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setProofValidationError('');
    setProofValidating(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const result = ev.target?.result as string;
      setProofPreview(result);
      setProofBase64(result);

      // File type validation only — admin will verify manually
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      if (!isImage && !isPdf) {
        setProofValidationError('Only image files (PNG, JPG) and PDF are accepted.');
        setProofFile(null);
        setProofPreview(null);
        setProofBase64(null);
      }

      setProofValidating(false);
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const STEPS: Step[] = ['country', 'method', 'amount'];
  const stepIndex = STEPS.indexOf(step);

  const MIN_DEPOSIT_USD = 100;
  const isBelowMinDeposit = amountNum > 0 && rate ? amountUsd < MIN_DEPOSIT_USD : false;

  const handleSubmit = async () => {
    if (!selectedMethod) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setAmountError('Please enter a valid amount');
      return;
    }
    if (isBelowMinDeposit) {
      setAmountError(`Minimum deposit is $100 USD (≈ ${rate ? Math.ceil(MIN_DEPOSIT_USD / rate.rate_to_usd).toLocaleString() : ''} ${currency})`);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const supabase = createClient();

      // Always get user from auth to ensure valid session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setSubmitError('You must be logged in to make a deposit.');
        setSubmitting(false);
        return;
      }

      const ref = `DEP-${Date.now().toString(36).toUpperCase()}`;

      // Debug log
      console.log('Submitting deposit:', {
        user_id: user.id,
        amount: amountUsd,
        amount_original: val,
        currency_original: currency,
        amount_usd: amountUsd,
        payment_method: selectedMethod.name,
        payment_method_id: selectedMethod.id,
        payment_reference: ref,
        status: 'pending',
      });

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedMethod.id);
      const { error } = await supabase.from('deposits').insert({
        user_id: user.id,
        amount: amountUsd,
        amount_original: val,
        currency_original: currency,
        amount_usd: amountUsd,
        payment_method: selectedMethod.name,
        payment_method_id: isUuid ? selectedMethod.id : null,
        payment_reference: ref,
        proof_url: proofBase64 || null,
        status: 'pending',
      });

      if (error) {
        console.error('DEPOSIT ERROR:', error);
        setSubmitError(error.message || 'Failed to submit deposit. Please try again.');
        setSubmitting(false);
        return;
      }

      setReferenceNumber(ref);
      setStep('success');
    } catch (err: any) {
      console.error('Deposit error:', err);
      setSubmitError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepBack = () => {
    if (step === 'method' && !memberCountry) setStep('country');
    else if (step === 'amount') setStep('method');
  };

  const methodsForCountryFiltered = methods.filter((m) => (m.country || 'Global') === selectedCountry && m.type === activeType);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`relative w-full mx-4 rounded-2xl overflow-hidden transition-[max-width] duration-200 ${step === 'country' ? 'max-w-xl' : 'max-w-lg'}`}
        style={{
          background: 'linear-gradient(135deg, #0d0d0d 0%, #111827 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.9)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top accent */}
        <div style={{ height: 2, background: '#10b981', flexShrink: 0 }} />

        {/* Welcome Bonus Banner — shown on country step if first deposit */}
        {isFirstDeposit && bonusSetting && step !== 'success' && (
          <div className="flex items-center gap-3 px-5 py-3 bg-[#0f1f2e] border-b border-blue-500/20" style={{ flexShrink: 0 }}>
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
              <Wallet size={14} color="#3b82f6" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-blue-300 text-xs font-bold">Welcome Bonus: {bonusSetting.bonus_percent}% on your first deposit</div>
              <div className="text-slate-500 text-[10px] mt-0.5">
                Min deposit ${bonusSetting.min_deposit} · Max bonus ${bonusSetting.max_bonus.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-3">
            {step !== 'country' && step !== 'success' && !(step === 'method' && memberCountry) && (
              <button
                onClick={stepBack}
                className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            <div>
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                {step === 'country' && 'Deposit Funds'}
                {step === 'method' && (
                  <>
                    <FlagIcon country={selectedCountry} className="w-5 h-3.5" />
                    {selectedCountry}
                  </>
                )}
                {step === 'amount' && selectedMethod?.name}
                {step === 'success' && 'Deposit Submitted'}
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                {step === 'country' && 'Select your country'}
                {step === 'method' && 'Choose payment method'}
                {step === 'amount' && `${currency} → USD · ${TYPE_LABELS[selectedMethod?.type || 'bank']}`}
                {step === 'success' && 'Awaiting admin approval'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        {step !== 'success' && (
          <div className="flex items-center gap-1 px-5 py-2.5 border-b border-white/5 flex-shrink-0">
            {(['country', 'method', 'amount'] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 ${step === s ? 'opacity-100' : i < stepIndex ? 'opacity-60' : 'opacity-30'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === s ? 'bg-emerald-500 text-black' : i < stepIndex ? 'bg-emerald-500/30 text-emerald-400' : 'bg-white/10 text-slate-500'}`}>
                    {i < stepIndex ? '✓' : i + 1}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 hidden sm:block">
                    {s === 'country' ? 'Country' : s === 'method' ? 'Method' : 'Amount'}
                  </span>
                </div>
                {i < 2 && <div className="flex-1 h-px bg-white/10 mx-1" />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>

          {/* STEP 1: Country */}
          {step === 'country' && (
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : countries.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">No active payment methods available</div>
              ) : (
                <>
                  {/* Search */}
                  <div
                    className="sticky top-0 z-10 -mx-4 px-4 pb-3 mb-1"
                    style={{ background: 'linear-gradient(135deg, #0d0d0d 0%, #111827 100%)' }}
                  >
                    <div className="relative">
                      <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        placeholder="Search your country..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  {filteredCountries.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      No countries match &ldquo;{countrySearch}&rdquo;
                    </div>
                  ) : (
                    REGION_ORDER.map((region) => {
                      const list = groupedCountries[region];
                      if (!list || list.length === 0) return null;
                      return (
                        <div key={region} className="mb-4 last:mb-0">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-0.5">
                            {region}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {list.map((country) => {
                              const countryMethods = methods.filter((m) => (m.country || 'Global') === country);
                              const countryTypes = types.filter((t) => countryMethods.some((m) => m.type === t));
                              const curr = COUNTRY_CURRENCY[country] || 'USD';
                              return (
                                <button
                                  key={country}
                                  onClick={() => handleSelectCountry(country)}
                                  className="flex items-center gap-3 px-4 py-3 rounded-xl border text-left group transition-all"
                                  style={{
                                    background: '#141820',
                                    borderColor: 'rgba(255,255,255,0.09)',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'; e.currentTarget.style.background = '#181d27'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.background = '#141820'; }}
                                >
                                  <FlagIcon country={country} className="w-7 h-5 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-white text-xs font-semibold truncate">{country}</div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <span className="text-slate-500 text-[10px] tracking-wide">{curr}</span>
                                      <span className="text-slate-700 text-[10px]">·</span>
                                      <div className="flex items-center gap-1 text-slate-500">
                                        {countryTypes.map((t) => (
                                          <span
                                            key={t}
                                            title={TYPE_LABELS[t]}
                                            style={{ transform: 'scale(0.65)', display: 'inline-flex' }}
                                          >
                                            {TYPE_ICONS[t]}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 2: Method */}
          {step === 'method' && (
            <div className="p-4">
              {/* Type tabs */}
              <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {availableTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveType(t)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                      activeType === t
                        ? 'text-black' :'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10'
                    }`}
                    style={activeType === t ? { backgroundColor: TYPE_COLORS[t], border: `1px solid ${TYPE_COLORS[t]}` } : {}}
                  >
                    <span style={{ color: activeType === t ? '#000' : TYPE_COLORS[t] }}>{TYPE_ICONS[t]}</span>
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>

              {filteredMethods.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">No {TYPE_LABELS[activeType]} methods available</div>
              ) : (
                <div className="space-y-2">
                  {filteredMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => handleSelectMethod(method)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white/4 border border-white/8 hover:bg-white/8 hover:border-white/15 transition-all text-left group"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${TYPE_COLORS[method.type] || '#6366f1'}20`, color: TYPE_COLORS[method.type] || '#6366f1' }}
                      >
                        {TYPE_ICONS[method.type] || TYPE_ICONS.bank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-semibold truncate">{method.name}</div>
                        <div className="text-slate-500 text-xs">
                          {method.account_number ? `${method.account_number.slice(0, 12)}...` : 'Details available after selection'}
                        </div>
                      </div>
                      <svg className="text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Amount + Proof */}
          {step === 'amount' && selectedMethod && (
            <div className="p-5 space-y-4">
              {/* Account details */}
              <div className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-2.5">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Send Payment To</div>
                {selectedMethod.account_number ? (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs">Account / Address</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-xs font-mono font-semibold">{selectedMethod.account_number}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(selectedMethod.account_number!)}
                        className="text-slate-500 hover:text-emerald-400 transition-colors"
                        title="Copy"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs italic">Contact support for account details.</div>
                )}
                {selectedMethod.account_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs">Account Name</span>
                    <span className="text-white text-xs font-semibold">{selectedMethod.account_name}</span>
                  </div>
                )}
                {selectedMethod.network && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs">Network</span>
                    <span className="text-emerald-400 text-xs font-semibold">{selectedMethod.network}</span>
                  </div>
                )}
              </div>

              {/* Instructions */}
              {selectedMethod.instructions && (
                <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <svg className="text-blue-400 flex-shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-blue-300 text-xs leading-relaxed">{selectedMethod.instructions}</p>
                  </div>
                </div>
              )}

              {/* Amount input */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Deposit Amount ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">{currency}</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setAmountError(''); }}
                    min={selectedMethod.min_deposit}
                    max={selectedMethod.max_deposit}
                    className="w-full bg-white/5 border border-white/15 rounded-xl pl-12 pr-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-emerald-500/60 transition-colors"
                    placeholder="0.00"
                  />
                </div>
                {amountError && <p className="text-red-400 text-xs mt-1.5">{amountError}</p>}
                {isBelowMinDeposit && !amountError && (
                  <p className="text-red-400 text-xs mt-1.5">
                    Minimum deposit is $100 USD (≈ {rate ? Math.ceil(MIN_DEPOSIT_USD / rate.rate_to_usd).toLocaleString() : ''} {currency})
                  </p>
                )}
              </div>

              {/* USD Estimation with Bonus */}
              {amountNum > 0 && rate && (
                <div className={`rounded-xl p-3 ${showBonus ? 'bg-yellow-500/8 border border-yellow-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                  {showBonus ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Deposit Amount</span>
                        <span className="text-white font-semibold">≈ ${amountUsd.toFixed(2)}</span>
                      </div>
                      {isBonusEligible ? (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-yellow-400 flex items-center gap-1">Welcome Bonus ({bonusPct}%)</span>
                          <span className="text-yellow-400 font-semibold">+${bonusAmt.toFixed(2)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1">Welcome Bonus ({bonusPct}%)</span>
                          <span className="text-slate-500 text-[10px]">Bonus available for deposits ≥ $100</span>
                        </div>
                      )}
                      <div className="border-t border-yellow-500/20 pt-2 flex items-center justify-between">
                        <div>
                          <div className="text-yellow-400 text-xs font-semibold">Total Credited</div>
                          <div className="text-slate-500 text-[10px] mt-0.5">Rate: 1 {currency} = {rate.rate_to_usd} USD</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white text-xl font-bold">≈ ${totalWithBonus.toFixed(2)}</div>
                          <div className="text-slate-500 text-[10px]">USD credited after approval</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-emerald-400 text-xs font-semibold">Estimated Credit</div>
                        <div className="text-slate-500 text-[10px] mt-0.5">Rate: 1 {currency} = {rate.rate_to_usd} USD</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-xl font-bold">≈ ${amountUsd.toFixed(2)}</div>
                        <div className="text-slate-500 text-[10px]">USD credited after approval</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Upload proof */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Upload Payment Proof <span className="text-red-400 normal-case">*</span>
                </label>
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" disabled={proofValidating} />
                  {proofPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-emerald-500/30">
                      <img src={proofPreview} alt="Proof preview" className="w-full max-h-40 object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-semibold">Click to change</span>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-white/15 hover:border-emerald-500/40 rounded-xl p-5 text-center transition-colors">
                      {proofValidating ? (
                        <>
                          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-slate-400 text-xs">Validating payment proof...</p>
                        </>
                      ) : (
                        <>
                          <svg className="mx-auto mb-2 text-slate-500" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          <p className="text-slate-500 text-xs">Click to upload screenshot or receipt</p>
                          <p className="text-slate-600 text-[10px] mt-1">PNG, JPG, PDF</p>
                        </>
                      )}
                    </div>
                  )}
                </label>
                {proofValidationError && (
                  <p className="text-red-400 text-xs mt-1.5">{proofValidationError}</p>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || amountNum <= 0 || !proofFile || isBelowMinDeposit || proofValidating}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : isBonusEligible ? (
                  `Submit Deposit · $${amountUsd.toFixed(2)} + $${bonusAmt.toFixed(2)} bonus = $${totalWithBonus.toFixed(2)}`
                ) : (
                  `Submit Deposit Request${amountNum > 0 && rate ? ` · ${amountNum} ${currency} ≈ $${amountUsd.toFixed(2)}` : ''}`
                )}
              </button>
              {submitError && (
                <div className="mt-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-xs">
                  {submitError}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Success */}
          {step === 'success' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Request Submitted!</h3>
              <p className="text-slate-400 text-sm mb-1">Your deposit request has been received.</p>
              <p className="text-slate-500 text-xs mb-5">Admin will review and approve your deposit. Your balance will be updated once approved.</p>

              {referenceNumber && (
                <div className="bg-white/4 border border-white/8 rounded-xl px-4 py-2 mb-5 inline-flex items-center gap-2">
                  <span className="text-slate-500 text-xs">Reference:</span>
                  <span className="text-emerald-400 text-xs font-mono font-bold">{referenceNumber}</span>
                </div>
              )}

              <div className="bg-white/4 border border-white/8 rounded-xl p-4 mb-6 text-left space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Country</span>
                  <span className="text-white font-semibold flex items-center gap-1.5">
                    <FlagIcon country={selectedCountry} className="w-4 h-3" />
                    {selectedCountry}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Method</span>
                  <span className="text-white font-semibold">{selectedMethod?.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Amount</span>
                  <span className="text-white font-semibold">{parseFloat(amount).toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Estimated USD</span>
                  <span className="text-emerald-400 font-bold">≈ ${amountUsd.toFixed(2)}</span>
                </div>
                {isFirstDeposit && bonusSetting && bonusAmt > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-yellow-400">Welcome Bonus</span>
                    <span className="text-yellow-400 font-bold">+${bonusAmt.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Status</span>
                  <span className="text-yellow-400 font-semibold">Pending Review</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
