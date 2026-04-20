import { NextRequest, NextResponse } from 'next/server';
import { getPriceEngineStatus, startPriceEngine, stopPriceEngine } from '@/lib/services/priceEngine';

const EXPECTED_SECRET = process.env.ADMIN_SECRET || 'investoft_asset_sync_secure_2026';

function isAuthorized(request: NextRequest): boolean {
  const header = request.headers.get('x-admin-secret');
  const query = request.nextUrl.searchParams.get('secret');
  const secret = header || query || '';
  return secret === EXPECTED_SECRET;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const status = getPriceEngineStatus();
  return NextResponse.json({ success: true, status });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: { action?: string; secret?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  // Also allow secret in body for POST
  if (!isAuthorized(request)) {
    const bodySecret = body?.secret || '';
    if (bodySecret !== EXPECTED_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  const action = body?.action;

  if (action === 'start') {
    await startPriceEngine();
    return NextResponse.json({ success: true, message: 'Price engine started', status: getPriceEngineStatus() });
  }

  if (action === 'stop') {
    stopPriceEngine();
    return NextResponse.json({ success: true, message: 'Price engine stopped', status: getPriceEngineStatus() });
  }

  return NextResponse.json(
    { success: false, error: 'Invalid action. Use "start" or "stop".' },
    { status: 400 }
  );
}
