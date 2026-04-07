import { NextRequest, NextResponse } from 'next/server';
import { completion } from '@rocketnew/llm-sdk';

export async function POST(request: NextRequest) {
  let body: any = {};

  try {
    body = await request.json();
    const { model, messages, parameters = {} } = body;

    if (!model || !messages?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: model, messages', details: 'Request validation failed' },
        { status: 400 }
      );
    }

    const apiKey = process.env.TRANSLATE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TRANSLATE API key is not configured', details: 'The TRANSLATE_API_KEY environment variable is missing' },
        { status: 400 }
      );
    }

    const response = await completion({
      model,
      messages,
      stream: false,
      api_key: apiKey,
      ...parameters,
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    const statusCode = (error as any)?.statusCode || (error as any)?.status || 500;
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Translate API Route Error:', errMsg);
    return NextResponse.json(
      { error: `TRANSLATE API error: ${statusCode}`, details: errMsg },
      { status: statusCode }
    );
  }
}
