import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
}

interface AssetRow {
  symbol: string;
  name: string;
  coingecko_id: string;
  category_id: string;
  base_currency: string;
  quote_currency: string;
  is_active: boolean;
  created_at: string;
}

const COINGECKO_LIST_URL =
  'https://api.coingecko.com/api/v3/coins/list?include_platform=false';
const BATCH_SIZE = 500;

export async function POST(request: Request) {
  // Parse secret from header, query param, or body
  let bodyData: { secret?: string } = {};
  try { bodyData = await (request as NextRequest).clone().json(); } catch {}

  const secret =
    request.headers.get('x-admin-secret') ||
    new URL(request.url).searchParams.get('secret') ||
    bodyData?.secret ||
    '';

  const expectedSecret = process.env.ADMIN_SECRET || 'investoft_asset_sync_secure_2026';

  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Fetch full crypto list from CoinGecko
    const cgResponse = await fetch(COINGECKO_LIST_URL, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!cgResponse.ok) {
      throw new Error(
        `CoinGecko API error: ${cgResponse.status} ${cgResponse.statusText}`
      );
    }

    const coins: CoinGeckoCoin[] = await cgResponse.json();
    const total = coins.length;

    // 3. Create Supabase server client
    const supabase = await createClient();

    // 4. Look up the 'crypto' category UUID
    const { data: categoryData, error: categoryError } = await supabase
      .from('asset_categories')
      .select('id')
      .eq('name', 'crypto')
      .single();

    if (categoryError || !categoryData) {
      throw new Error(
        `Failed to find 'crypto' category: ${categoryError?.message ?? 'No data returned'}`
      );
    }

    const categoryId: string = categoryData.id;

    // 5. Fetch existing coingecko_ids to distinguish inserts vs updates
    const { data: existingData, error: existingError } = await supabase
      .from('assets')
      .select('coingecko_id');

    if (existingError) {
      throw new Error(`Failed to fetch existing assets: ${existingError.message}`);
    }

    const existingIds = new Set<string>(
      (existingData ?? []).map((row: { coingecko_id: string }) => row.coingecko_id)
    );

    // 6. Normalize assets
    const now = new Date().toISOString();
    const rows: AssetRow[] = coins.map((coin) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      coingecko_id: coin.id,
      category_id: categoryId,
      base_currency: coin.symbol.toUpperCase(),
      quote_currency: 'USD',
      is_active: true,
      created_at: now,
    }));

    // 7. Upsert in batches of 500
    let inserted = 0;
    let updated = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const batchIndex = Math.floor(i / BATCH_SIZE) + 1;

      const { error: upsertError } = await supabase
        .from('assets')
        .upsert(batch, { onConflict: 'coingecko_id' });

      if (upsertError) {
        throw new Error(`Batch ${batchIndex} upsert failed: ${upsertError.message}`);
      }

      for (const row of batch) {
        if (existingIds.has(row.coingecko_id)) {
          updated++;
        } else {
          inserted++;
        }
      }
    }

    // 8. Return JSON summary with version field
    return NextResponse.json(
      {
        success: true,
        version: '2.0',
        inserted,
        updated,
        total,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
