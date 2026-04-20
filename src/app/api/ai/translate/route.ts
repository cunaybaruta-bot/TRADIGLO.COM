import { NextRequest, NextResponse } from 'next/server';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callOpenAI(apiKey: string, body: object, attempt: number = 0): Promise<Response> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  // Retry on 429 with exponential backoff (max 3 attempts)
  if (res.status === 429 && attempt < 3) {
    const retryAfter = res.headers.get('retry-after');
    const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
    console.warn(`[Translate Route] 429 rate limit hit. Retrying in ${delay}ms (attempt ${attempt + 1}/3)`);
    await sleep(delay);
    return callOpenAI(apiKey, body, attempt + 1);
  }

  return res;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, messages, parameters = {} } = body;

    if (!model || !messages?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: model, messages' },
        { status: 400 }
      );
    }

    const apiKey = process.env.TRANSLATE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TRANSLATE_API_KEY is not configured in environment variables' },
        { status: 500 }
      );
    }

    const openaiRes = await callOpenAI(apiKey, {
      model,
      messages,
      stream: false,
      ...parameters,
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      const errMsg = data?.error?.message || `HTTP ${openaiRes.status}`;
      console.error('[Translate Route] OpenAI error:', openaiRes.status, errMsg);
      return NextResponse.json(
        { error: `Translation API error: ${openaiRes.status}`, details: errMsg },
        { status: openaiRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Translate Route] Unexpected error:', errMsg);
    return NextResponse.json(
      { error: 'Internal server error', details: errMsg },
      { status: 500 }
    );
  }
}
