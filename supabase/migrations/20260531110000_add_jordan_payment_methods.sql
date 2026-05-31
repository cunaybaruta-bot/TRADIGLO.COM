-- Add Jordan payment methods
-- Currency: JOD (Jordanian Dinar)

INSERT INTO payment_methods (type, country, name, account_number, account_name, network, instructions, min_deposit, max_deposit, is_active, currency)
VALUES
  -- Bank Transfer
  ('bank', 'Jordan', 'Arab Bank Jordan', 'JO94ARABJO0310000012345678901', 'Tradiglo Payments Ltd', NULL, 'Transfer to Arab Bank Jordan. Include your reference number in the transfer notes. Processing time: 1-2 business days.', 100, 50000, true, 'JOD'),
  ('bank', 'Jordan', 'Jordan Ahli Bank', 'JO15AHLI1234567890123456789', 'Tradiglo Payments Ltd', NULL, 'Transfer to Jordan Ahli Bank. Include your reference number in the transfer notes. Processing time: 1-2 business days.', 100, 50000, true, 'JOD'),
  ('bank', 'Jordan', 'Bank of Jordan', 'JO47BKJO0000000012345678901', 'Tradiglo Payments Ltd', NULL, 'Transfer to Bank of Jordan. Include your reference number in the transfer notes. Processing time: 1-2 business days.', 100, 50000, true, 'JOD'),
  -- E-Wallet
  ('ewallet', 'Jordan', 'eFAWATEERcom', NULL, NULL, NULL, 'Pay via eFAWATEERcom (Jordan''s national bill payment network). Select Tradiglo from the biller list and enter your user ID.', 50, 10000, true, 'JOD'),
  ('ewallet', 'Jordan', 'Zain Cash Jordan', NULL, NULL, NULL, 'Send payment via Zain Cash Jordan mobile wallet. Use the registered Tradiglo merchant number and include your reference.', 50, 10000, true, 'JOD'),
  -- Crypto
  ('crypto', 'Jordan', 'USDT (TRC20)', 'TTradigloWalletAddressJordan1', NULL, 'TRC20', 'Send USDT via TRC20 network. Minimum 100 USDT. Confirm network before sending.', 100, 100000, true, 'USDT'),
  ('crypto', 'Jordan', 'USDT (ERC20)', '0xTradigloWalletAddressJordan1', NULL, 'ERC20', 'Send USDT via ERC20 network. Minimum 100 USDT. Confirm network before sending.', 100, 100000, true, 'USDT')
ON CONFLICT DO NOTHING;
