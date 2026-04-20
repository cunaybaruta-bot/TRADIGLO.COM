-- Migration: Add complete local banks for all 20 countries
-- Adds real local bank names as payment methods (type='bank', is_active=true)
-- Uses ON CONFLICT DO NOTHING to avoid duplicates

-- ============================================================
-- CHINA
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('China', 'bank', 'Industrial and Commercial Bank of China (ICBC)', true, 10, 50000),
  ('China', 'bank', 'China Construction Bank (CCB)', true, 10, 50000),
  ('China', 'bank', 'Agricultural Bank of China (ABC)', true, 10, 50000),
  ('China', 'bank', 'Bank of China (BOC)', true, 10, 50000),
  ('China', 'bank', 'Bank of Communications (BoCom)', true, 10, 50000),
  ('China', 'bank', 'China Merchants Bank (CMB)', true, 10, 50000),
  ('China', 'bank', 'Industrial Bank (CIB)', true, 10, 50000),
  ('China', 'bank', 'China CITIC Bank', true, 10, 50000),
  ('China', 'bank', 'Shanghai Pudong Development Bank (SPDB)', true, 10, 50000),
  ('China', 'bank', 'Ping An Bank', true, 10, 50000),
  ('China', 'bank', 'Minsheng Banking Corp', true, 10, 50000),
  ('China', 'bank', 'Guangfa Bank (GDB)', true, 10, 50000),
  ('China', 'bank', 'Everbright Bank of China', true, 10, 50000),
  ('China', 'bank', 'Hua Xia Bank', true, 10, 50000),
  ('China', 'bank', 'Postal Savings Bank of China (PSBC)', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- JAPAN
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('Japan', 'bank', 'MUFG Bank (Mitsubishi UFJ Financial Group)', true, 10, 50000),
  ('Japan', 'bank', 'Sumitomo Mitsui Banking Corporation (SMBC)', true, 10, 50000),
  ('Japan', 'bank', 'Mizuho Bank', true, 10, 50000),
  ('Japan', 'bank', 'Resona Bank', true, 10, 50000),
  ('Japan', 'bank', 'Japan Post Bank', true, 10, 50000),
  ('Japan', 'bank', 'Shinsei Bank', true, 10, 50000),
  ('Japan', 'bank', 'Aozora Bank', true, 10, 50000),
  ('Japan', 'bank', 'Seven Bank', true, 10, 50000),
  ('Japan', 'bank', 'SBI Sumishin Net Bank', true, 10, 50000),
  ('Japan', 'bank', 'Rakuten Bank', true, 10, 50000),
  ('Japan', 'bank', 'PayPay Bank', true, 10, 50000),
  ('Japan', 'bank', 'Sony Bank', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- INDIA
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('India', 'bank', 'State Bank of India (SBI)', true, 10, 50000),
  ('India', 'bank', 'HDFC Bank', true, 10, 50000),
  ('India', 'bank', 'ICICI Bank', true, 10, 50000),
  ('India', 'bank', 'Axis Bank', true, 10, 50000),
  ('India', 'bank', 'Kotak Mahindra Bank', true, 10, 50000),
  ('India', 'bank', 'Punjab National Bank (PNB)', true, 10, 50000),
  ('India', 'bank', 'Bank of Baroda', true, 10, 50000),
  ('India', 'bank', 'Canara Bank', true, 10, 50000),
  ('India', 'bank', 'Union Bank of India', true, 10, 50000),
  ('India', 'bank', 'IndusInd Bank', true, 10, 50000),
  ('India', 'bank', 'Yes Bank', true, 10, 50000),
  ('India', 'bank', 'IDFC First Bank', true, 10, 50000),
  ('India', 'bank', 'Federal Bank', true, 10, 50000),
  ('India', 'bank', 'Bank of India', true, 10, 50000),
  ('India', 'bank', 'Central Bank of India', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- HONG KONG
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('Hong Kong', 'bank', 'HSBC Hong Kong', true, 10, 50000),
  ('Hong Kong', 'bank', 'Hang Seng Bank', true, 10, 50000),
  ('Hong Kong', 'bank', 'Bank of China (Hong Kong)', true, 10, 50000),
  ('Hong Kong', 'bank', 'Standard Chartered Hong Kong', true, 10, 50000),
  ('Hong Kong', 'bank', 'Citibank Hong Kong', true, 10, 50000),
  ('Hong Kong', 'bank', 'DBS Bank Hong Kong', true, 10, 50000),
  ('Hong Kong', 'bank', 'OCBC Wing Hang Bank', true, 10, 50000),
  ('Hong Kong', 'bank', 'Dah Sing Bank', true, 10, 50000),
  ('Hong Kong', 'bank', 'Chong Hing Bank', true, 10, 50000),
  ('Hong Kong', 'bank', 'Fubon Bank Hong Kong', true, 10, 50000),
  ('Hong Kong', 'bank', 'ZA Bank', true, 10, 50000),
  ('Hong Kong', 'bank', 'Mox Bank', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- TAIWAN
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('Taiwan', 'bank', 'Bank of Taiwan', true, 10, 50000),
  ('Taiwan', 'bank', 'Taiwan Cooperative Bank', true, 10, 50000),
  ('Taiwan', 'bank', 'First Commercial Bank', true, 10, 50000),
  ('Taiwan', 'bank', 'Hua Nan Commercial Bank', true, 10, 50000),
  ('Taiwan', 'bank', 'Chang Hwa Bank', true, 10, 50000),
  ('Taiwan', 'bank', 'Mega International Commercial Bank', true, 10, 50000),
  ('Taiwan', 'bank', 'CTBC Bank', true, 10, 50000),
  ('Taiwan', 'bank', 'Cathay United Bank', true, 10, 50000),
  ('Taiwan', 'bank', 'Fubon Bank Taiwan', true, 10, 50000),
  ('Taiwan', 'bank', 'E.SUN Commercial Bank', true, 10, 50000),
  ('Taiwan', 'bank', 'Taishin International Bank', true, 10, 50000),
  ('Taiwan', 'bank', 'Shin Kong Commercial Bank', true, 10, 50000),
  ('Taiwan', 'bank', 'Land Bank of Taiwan', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PAKISTAN
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('Pakistan', 'bank', 'Habib Bank Limited (HBL)', true, 10, 50000),
  ('Pakistan', 'bank', 'United Bank Limited (UBL)', true, 10, 50000),
  ('Pakistan', 'bank', 'MCB Bank', true, 10, 50000),
  ('Pakistan', 'bank', 'Allied Bank Limited (ABL)', true, 10, 50000),
  ('Pakistan', 'bank', 'National Bank of Pakistan (NBP)', true, 10, 50000),
  ('Pakistan', 'bank', 'Bank Alfalah', true, 10, 50000),
  ('Pakistan', 'bank', 'Meezan Bank', true, 10, 50000),
  ('Pakistan', 'bank', 'Faysal Bank', true, 10, 50000),
  ('Pakistan', 'bank', 'Bank Al-Habib', true, 10, 50000),
  ('Pakistan', 'bank', 'Askari Bank', true, 10, 50000),
  ('Pakistan', 'bank', 'Silk Bank', true, 10, 50000),
  ('Pakistan', 'bank', 'Summit Bank', true, 10, 50000),
  ('Pakistan', 'bank', 'Standard Chartered Pakistan', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- BANGLADESH
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('Bangladesh', 'bank', 'Sonali Bank', true, 10, 50000),
  ('Bangladesh', 'bank', 'Janata Bank', true, 10, 50000),
  ('Bangladesh', 'bank', 'Agrani Bank', true, 10, 50000),
  ('Bangladesh', 'bank', 'Rupali Bank', true, 10, 50000),
  ('Bangladesh', 'bank', 'Dutch-Bangla Bank (DBBL)', true, 10, 50000),
  ('Bangladesh', 'bank', 'BRAC Bank', true, 10, 50000),
  ('Bangladesh', 'bank', 'Islami Bank Bangladesh', true, 10, 50000),
  ('Bangladesh', 'bank', 'Eastern Bank Limited (EBL)', true, 10, 50000),
  ('Bangladesh', 'bank', 'Prime Bank', true, 10, 50000),
  ('Bangladesh', 'bank', 'Southeast Bank', true, 10, 50000),
  ('Bangladesh', 'bank', 'Mutual Trust Bank (MTB)', true, 10, 50000),
  ('Bangladesh', 'bank', 'City Bank Bangladesh', true, 10, 50000),
  ('Bangladesh', 'bank', 'Standard Bank Bangladesh', true, 10, 50000),
  ('Bangladesh', 'bank', 'AB Bank', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SAUDI ARABIA
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('Saudi Arabia', 'bank', 'Al Rajhi Bank', true, 10, 50000),
  ('Saudi Arabia', 'bank', 'National Commercial Bank (NCB / Al Ahli)', true, 10, 50000),
  ('Saudi Arabia', 'bank', 'Saudi National Bank (SNB)', true, 10, 50000),
  ('Saudi Arabia', 'bank', 'Riyad Bank', true, 10, 50000),
  ('Saudi Arabia', 'bank', 'Banque Saudi Fransi', true, 10, 50000),
  ('Saudi Arabia', 'bank', 'Arab National Bank (ANB)', true, 10, 50000),
  ('Saudi Arabia', 'bank', 'Saudi British Bank (SABB)', true, 10, 50000),
  ('Saudi Arabia', 'bank', 'Alinma Bank', true, 10, 50000),
  ('Saudi Arabia', 'bank', 'Bank AlJazira', true, 10, 50000),
  ('Saudi Arabia', 'bank', 'Bank Albilad', true, 10, 50000),
  ('Saudi Arabia', 'bank', 'Gulf International Bank (GIB)', true, 10, 50000),
  ('Saudi Arabia', 'bank', 'Saudi Investment Bank (SAIB)', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- UAE
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('UAE', 'bank', 'Emirates NBD', true, 10, 50000),
  ('UAE', 'bank', 'First Abu Dhabi Bank (FAB)', true, 10, 50000),
  ('UAE', 'bank', 'Abu Dhabi Commercial Bank (ADCB)', true, 10, 50000),
  ('UAE', 'bank', 'Dubai Islamic Bank (DIB)', true, 10, 50000),
  ('UAE', 'bank', 'Mashreq Bank', true, 10, 50000),
  ('UAE', 'bank', 'Abu Dhabi Islamic Bank (ADIB)', true, 10, 50000),
  ('UAE', 'bank', 'Commercial Bank of Dubai (CBD)', true, 10, 50000),
  ('UAE', 'bank', 'Emirates Islamic Bank', true, 10, 50000),
  ('UAE', 'bank', 'Sharjah Islamic Bank', true, 10, 50000),
  ('UAE', 'bank', 'National Bank of Fujairah (NBF)', true, 10, 50000),
  ('UAE', 'bank', 'National Bank of Ras Al-Khaimah (RAKBANK)', true, 10, 50000),
  ('UAE', 'bank', 'United Arab Bank (UAB)', true, 10, 50000),
  ('UAE', 'bank', 'Ajman Bank', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- QATAR
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('Qatar', 'bank', 'Qatar National Bank (QNB)', true, 10, 50000),
  ('Qatar', 'bank', 'Commercial Bank of Qatar (CBQ)', true, 10, 50000),
  ('Qatar', 'bank', 'Doha Bank', true, 10, 50000),
  ('Qatar', 'bank', 'Qatar Islamic Bank (QIB)', true, 10, 50000),
  ('Qatar', 'bank', 'Al Khaliji Bank', true, 10, 50000),
  ('Qatar', 'bank', 'Masraf Al Rayan', true, 10, 50000),
  ('Qatar', 'bank', 'Qatar International Islamic Bank (QIIB)', true, 10, 50000),
  ('Qatar', 'bank', 'Dukhan Bank', true, 10, 50000),
  ('Qatar', 'bank', 'Ahlibank Qatar', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- KUWAIT
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('Kuwait', 'bank', 'National Bank of Kuwait (NBK)', true, 10, 50000),
  ('Kuwait', 'bank', 'Kuwait Finance House (KFH)', true, 10, 50000),
  ('Kuwait', 'bank', 'Gulf Bank', true, 10, 50000),
  ('Kuwait', 'bank', 'Commercial Bank of Kuwait (CBK)', true, 10, 50000),
  ('Kuwait', 'bank', 'Al Ahli Bank of Kuwait (ABK)', true, 10, 50000),
  ('Kuwait', 'bank', 'Burgan Bank', true, 10, 50000),
  ('Kuwait', 'bank', 'Boubyan Bank', true, 10, 50000),
  ('Kuwait', 'bank', 'Warba Bank', true, 10, 50000),
  ('Kuwait', 'bank', 'Kuwait International Bank (KIB)', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- OMAN
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('Oman', 'bank', 'Bank Muscat', true, 10, 50000),
  ('Oman', 'bank', 'National Bank of Oman (NBO)', true, 10, 50000),
  ('Oman', 'bank', 'Bank Dhofar', true, 10, 50000),
  ('Oman', 'bank', 'Sohar International', true, 10, 50000),
  ('Oman', 'bank', 'Oman Arab Bank (OAB)', true, 10, 50000),
  ('Oman', 'bank', 'Ahli Bank Oman', true, 10, 50000),
  ('Oman', 'bank', 'Bank Nizwa', true, 10, 50000),
  ('Oman', 'bank', 'Alizz Islamic Bank', true, 10, 50000),
  ('Oman', 'bank', 'HSBC Oman', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SRI LANKA
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('Sri Lanka', 'bank', 'Bank of Ceylon (BOC)', true, 10, 50000),
  ('Sri Lanka', 'bank', 'People''s Bank Sri Lanka', true, 10, 50000),
  ('Sri Lanka', 'bank', 'Commercial Bank of Ceylon', true, 10, 50000),
  ('Sri Lanka', 'bank', 'Hatton National Bank (HNB)', true, 10, 50000),
  ('Sri Lanka', 'bank', 'Sampath Bank', true, 10, 50000),
  ('Sri Lanka', 'bank', 'Seylan Bank', true, 10, 50000),
  ('Sri Lanka', 'bank', 'Nations Trust Bank (NTB)', true, 10, 50000),
  ('Sri Lanka', 'bank', 'National Development Bank (NDB)', true, 10, 50000),
  ('Sri Lanka', 'bank', 'Pan Asia Banking Corporation', true, 10, 50000),
  ('Sri Lanka', 'bank', 'Union Bank of Colombo', true, 10, 50000),
  ('Sri Lanka', 'bank', 'DFCC Bank', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- MYANMAR
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('Myanmar', 'bank', 'KBZ Bank (Kanbawza Bank)', true, 10, 50000),
  ('Myanmar', 'bank', 'CB Bank (Co-operative Bank)', true, 10, 50000),
  ('Myanmar', 'bank', 'AYA Bank (Ayeyarwady Bank)', true, 10, 50000),
  ('Myanmar', 'bank', 'AGD Bank', true, 10, 50000),
  ('Myanmar', 'bank', 'Yoma Bank', true, 10, 50000),
  ('Myanmar', 'bank', 'Myanmar Citizens Bank (MCB)', true, 10, 50000),
  ('Myanmar', 'bank', 'Myanma Economic Bank (MEB)', true, 10, 50000),
  ('Myanmar', 'bank', 'Global Treasure Bank (GTB)', true, 10, 50000),
  ('Myanmar', 'bank', 'United Amara Bank (UAB)', true, 10, 50000),
  ('Myanmar', 'bank', 'Innwa Bank', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- MALAYSIA
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('Malaysia', 'bank', 'Maybank (Malayan Banking Berhad)', true, 10, 50000),
  ('Malaysia', 'bank', 'CIMB Bank', true, 10, 50000),
  ('Malaysia', 'bank', 'Public Bank Berhad', true, 10, 50000),
  ('Malaysia', 'bank', 'RHB Bank', true, 10, 50000),
  ('Malaysia', 'bank', 'Hong Leong Bank', true, 10, 50000),
  ('Malaysia', 'bank', 'AmBank', true, 10, 50000),
  ('Malaysia', 'bank', 'Bank Islam Malaysia', true, 10, 50000),
  ('Malaysia', 'bank', 'Bank Rakyat', true, 10, 50000),
  ('Malaysia', 'bank', 'Affin Bank', true, 10, 50000),
  ('Malaysia', 'bank', 'Alliance Bank Malaysia', true, 10, 50000),
  ('Malaysia', 'bank', 'OCBC Bank Malaysia', true, 10, 50000),
  ('Malaysia', 'bank', 'Standard Chartered Malaysia', true, 10, 50000),
  ('Malaysia', 'bank', 'HSBC Malaysia', true, 10, 50000),
  ('Malaysia', 'bank', 'Bank Muamalat Malaysia', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SINGAPORE
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('Singapore', 'bank', 'DBS Bank', true, 10, 50000),
  ('Singapore', 'bank', 'OCBC Bank', true, 10, 50000),
  ('Singapore', 'bank', 'United Overseas Bank (UOB)', true, 10, 50000),
  ('Singapore', 'bank', 'Standard Chartered Singapore', true, 10, 50000),
  ('Singapore', 'bank', 'Citibank Singapore', true, 10, 50000),
  ('Singapore', 'bank', 'HSBC Singapore', true, 10, 50000),
  ('Singapore', 'bank', 'Maybank Singapore', true, 10, 50000),
  ('Singapore', 'bank', 'RHB Bank Singapore', true, 10, 50000),
  ('Singapore', 'bank', 'Bank of China Singapore', true, 10, 50000),
  ('Singapore', 'bank', 'CIMB Bank Singapore', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- THAILAND
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('Thailand', 'bank', 'Bangkok Bank', true, 10, 50000),
  ('Thailand', 'bank', 'Kasikorn Bank (KBank)', true, 10, 50000),
  ('Thailand', 'bank', 'Krungthai Bank (KTB)', true, 10, 50000),
  ('Thailand', 'bank', 'Siam Commercial Bank (SCB)', true, 10, 50000),
  ('Thailand', 'bank', 'Bank of Ayudhya (Krungsri)', true, 10, 50000),
  ('Thailand', 'bank', 'TMBThanachart Bank (TTB)', true, 10, 50000),
  ('Thailand', 'bank', 'CIMB Thai Bank', true, 10, 50000),
  ('Thailand', 'bank', 'UOB Thailand', true, 10, 50000),
  ('Thailand', 'bank', 'Tisco Bank', true, 10, 50000),
  ('Thailand', 'bank', 'Kiatnakin Phatra Bank', true, 10, 50000),
  ('Thailand', 'bank', 'Land and Houses Bank', true, 10, 50000),
  ('Thailand', 'bank', 'Government Savings Bank (GSB)', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- VIETNAM
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('Vietnam', 'bank', 'Vietcombank (VCB)', true, 10, 50000),
  ('Vietnam', 'bank', 'VietinBank (CTG)', true, 10, 50000),
  ('Vietnam', 'bank', 'BIDV (Bank for Investment and Development)', true, 10, 50000),
  ('Vietnam', 'bank', 'Agribank (Vietnam Bank for Agriculture)', true, 10, 50000),
  ('Vietnam', 'bank', 'Techcombank', true, 10, 50000),
  ('Vietnam', 'bank', 'MB Bank (Military Commercial Bank)', true, 10, 50000),
  ('Vietnam', 'bank', 'ACB (Asia Commercial Bank)', true, 10, 50000),
  ('Vietnam', 'bank', 'VPBank', true, 10, 50000),
  ('Vietnam', 'bank', 'Sacombank', true, 10, 50000),
  ('Vietnam', 'bank', 'HDBank', true, 10, 50000),
  ('Vietnam', 'bank', 'SHB (Saigon-Hanoi Bank)', true, 10, 50000),
  ('Vietnam', 'bank', 'TPBank', true, 10, 50000),
  ('Vietnam', 'bank', 'MSB (Maritime Bank)', true, 10, 50000),
  ('Vietnam', 'bank', 'OCB (Orient Commercial Bank)', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SOUTH KOREA
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('South Korea', 'bank', 'KB Kookmin Bank', true, 10, 50000),
  ('South Korea', 'bank', 'Shinhan Bank', true, 10, 50000),
  ('South Korea', 'bank', 'Woori Bank', true, 10, 50000),
  ('South Korea', 'bank', 'Hana Bank', true, 10, 50000),
  ('South Korea', 'bank', 'NH NongHyup Bank', true, 10, 50000),
  ('South Korea', 'bank', 'IBK Industrial Bank of Korea', true, 10, 50000),
  ('South Korea', 'bank', 'KDB Korea Development Bank', true, 10, 50000),
  ('South Korea', 'bank', 'Busan Bank', true, 10, 50000),
  ('South Korea', 'bank', 'Daegu Bank', true, 10, 50000),
  ('South Korea', 'bank', 'Kakao Bank', true, 10, 50000),
  ('South Korea', 'bank', 'K Bank', true, 10, 50000),
  ('South Korea', 'bank', 'Toss Bank', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PHILIPPINES
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('Philippines', 'bank', 'BDO Unibank (Banco de Oro)', true, 10, 50000),
  ('Philippines', 'bank', 'Metropolitan Bank and Trust (Metrobank)', true, 10, 50000),
  ('Philippines', 'bank', 'Bank of the Philippine Islands (BPI)', true, 10, 50000),
  ('Philippines', 'bank', 'Land Bank of the Philippines', true, 10, 50000),
  ('Philippines', 'bank', 'Philippine National Bank (PNB)', true, 10, 50000),
  ('Philippines', 'bank', 'Security Bank', true, 10, 50000),
  ('Philippines', 'bank', 'Rizal Commercial Banking Corp (RCBC)', true, 10, 50000),
  ('Philippines', 'bank', 'China Banking Corporation (Chinabank)', true, 10, 50000),
  ('Philippines', 'bank', 'UnionBank of the Philippines', true, 10, 50000),
  ('Philippines', 'bank', 'EastWest Bank', true, 10, 50000),
  ('Philippines', 'bank', 'Development Bank of the Philippines (DBP)', true, 10, 50000),
  ('Philippines', 'bank', 'Philippine Savings Bank (PSBank)', true, 10, 50000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- INDONESIA
-- ============================================================
INSERT INTO public.payment_methods (country, type, name, is_active, min_deposit, max_deposit)
VALUES
  ('Indonesia', 'bank', 'Bank Central Asia (BCA)', true, 10, 50000),
  ('Indonesia', 'bank', 'Bank Mandiri', true, 10, 50000),
  ('Indonesia', 'bank', 'Bank Rakyat Indonesia (BRI)', true, 10, 50000),
  ('Indonesia', 'bank', 'Bank Negara Indonesia (BNI)', true, 10, 50000),
  ('Indonesia', 'bank', 'Bank Tabungan Negara (BTN)', true, 10, 50000),
  ('Indonesia', 'bank', 'Bank CIMB Niaga', true, 10, 50000),
  ('Indonesia', 'bank', 'Bank Danamon', true, 10, 50000),
  ('Indonesia', 'bank', 'Bank Permata', true, 10, 50000),
  ('Indonesia', 'bank', 'Bank Syariah Indonesia (BSI)', true, 10, 50000),
  ('Indonesia', 'bank', 'Bank Mega', true, 10, 50000),
  ('Indonesia', 'bank', 'Bank Panin', true, 10, 50000),
  ('Indonesia', 'bank', 'Bank OCBC NISP', true, 10, 50000),
  ('Indonesia', 'bank', 'Bank Maybank Indonesia', true, 10, 50000),
  ('Indonesia', 'bank', 'Bank Bukopin', true, 10, 50000)
ON CONFLICT DO NOTHING;
