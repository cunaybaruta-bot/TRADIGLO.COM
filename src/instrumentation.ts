export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initPriceEngine } = await import('./lib/services/priceEngineInit');
    initPriceEngine();
  }
}
