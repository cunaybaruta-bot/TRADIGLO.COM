import { startPriceEngine } from './priceEngine';

declare global {
  // eslint-disable-next-line no-var
  var __priceEngineStarted: boolean | undefined;
}

export function initPriceEngine(): void {
  if (global.__priceEngineStarted) {
    console.log('[PriceEngineInit] Price engine already started, skipping duplicate init');
    return;
  }

  global.__priceEngineStarted = true;

  startPriceEngine().catch((err) => {
    console.error('[PriceEngineInit] Failed to start price engine:', err);
    // Reset flag so it can be retried
    global.__priceEngineStarted = false;
  });
}
