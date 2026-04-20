import { createClient } from '@/lib/supabase/server';

// Types
interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
}

interface SyncSummary {
  total: number;
  inserted: number;
  updated: number;
  errors: number;
}

interface AssetUpsertRow {
  symbol: string;
  name: string;
  coingecko_id: string;
  category_id: string;
  base_currency: string;
  quote_currency: string;
  is_active: boolean;
}

const COINGECKO_LIST_URL =
  'https://api.coingecko.com/api/v3/coins/list?include_platform=false';
const BATCH_SIZE = 500;

/**
 * Fetches the full coin list from CoinGecko API.
 */
async function fetchCoinGeckoList(): Promise<CoinGeckoCoin[]> {
  console.log('[assetIngestion] Fetching coin list from CoinGecko...');
  const response = await fetch(COINGECKO_LIST_URL, {
    headers: { Accept: 'application/json' },
    // Next.js: no-store to always get fresh data
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `CoinGecko API error: ${response.status} ${response.statusText}`
    );
  }

  const coins: CoinGeckoCoin[] = await response.json();
  console.log(`[assetIngestion] Fetched ${coins.length} coins from CoinGecko.`);
  return coins;
}

/**
 * Looks up the UUID for the 'crypto' category in asset_categories.
 */
async function getCryptoCategoryId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const { data, error } = await supabase
    .from('asset_categories')
    .select('id')
    .eq('name', 'crypto')
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to find 'crypto' category in asset_categories: ${error?.message ?? 'No data returned'}`
    );
  }

  return data.id as string;
}

/**
 * Processes a single batch of coins and upserts them into the assets table.
 * Returns counts of inserted/updated/errored records.
 */
async function processBatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  coins: CoinGeckoCoin[],
  categoryId: string,
  batchIndex: number
): Promise<{ inserted: number; updated: number; errors: number }> {
  const rows: AssetUpsertRow[] = coins.map((coin) => ({
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    coingecko_id: coin.id,
    category_id: categoryId,
    base_currency: coin.symbol.toUpperCase(),
    quote_currency: 'USD',
    is_active: true,
  }));

  const { data, error } = await supabase
    .from('assets')
    .upsert(rows, { onConflict: 'coingecko_id' })
    .select('id');

  if (error) {
    console.error(
      `[assetIngestion] Batch ${batchIndex} error: ${error.message}`
    );
    return { inserted: 0, updated: 0, errors: coins.length };
  }

  // Supabase upsert returns all affected rows; we can't distinguish
  // insert vs update from the response alone, so we count all as processed.
  const processed = data?.length ?? 0;
  console.log(
    `[assetIngestion] Batch ${batchIndex}: upserted ${processed} records.`
  );

  return { inserted: processed, updated: 0, errors: 0 };
}

/**
 * Synchronizes CoinGecko assets into the Supabase assets table.
 * Fetches the full coin list, looks up the 'crypto' category UUID,
 * and upserts all assets in batches of 500.
 */
export async function syncCoinGeckoAssets(): Promise<SyncSummary> {
  const summary: SyncSummary = { total: 0, inserted: 0, updated: 0, errors: 0 };

  try {
    // 1. Fetch coins from CoinGecko
    const coins = await fetchCoinGeckoList();
    summary.total = coins.length;

    // 2. Create Supabase client
    const supabase = await createClient();

    // 3. Get the 'crypto' category UUID
    const categoryId = await getCryptoCategoryId(supabase);
    console.log(`[assetIngestion] Using crypto category_id: ${categoryId}`);

    // 4. Process in batches
    const totalBatches = Math.ceil(coins.length / BATCH_SIZE);
    console.log(
      `[assetIngestion] Processing ${coins.length} assets in ${totalBatches} batches of ${BATCH_SIZE}...`
    );

    for (let i = 0; i < coins.length; i += BATCH_SIZE) {
      const batch = coins.slice(i, i + BATCH_SIZE);
      const batchIndex = Math.floor(i / BATCH_SIZE) + 1;

      console.log(
        `[assetIngestion] Processing batch ${batchIndex}/${totalBatches} (${batch.length} assets)...`
      );

      const result = await processBatch(supabase, batch, categoryId, batchIndex);
      summary.inserted += result.inserted;
      summary.updated += result.updated;
      summary.errors += result.errors;
    }

    console.log(
      `[assetIngestion] Sync complete. Total: ${summary.total}, Inserted/Updated: ${summary.inserted}, Errors: ${summary.errors}`
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[assetIngestion] Fatal error during sync: ${message}`);
    throw err;
  }

  return summary;
}
