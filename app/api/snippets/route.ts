import { NextRequest, NextResponse } from 'next/server';
import { getSnippets, createSnippet } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimiter';
import { validateRequestSize } from '@/lib/security';

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;

export async function GET() {
  try {
    const snippets = await getSnippets();
    return NextResponse.json(snippets);
  } catch (error) {
    console.error('[v0] Error fetching snippets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch snippets' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const limit = rateLimit(`snippet-create:${ip}`, {
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX_REQUESTS,
    });

    if (!limit.allowed) {
      console.warn('[security] Snippet creation rate limit exceeded:', { ip });

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          limit: RATE_LIMIT_MAX_REQUESTS,
          window: `${RATE_LIMIT_WINDOW_MS / 1000}s`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    if (!validateRequestSize(body)) {
      console.warn('[security] Snippet creation request too large:', { ip });

      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      );
    }

    const { title, description, code, language, tags } = body;

    if (
      !title ||
      !description ||
      !code ||
      !language ||
      !Array.isArray(tags) ||
      tags.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: title, description, code, language, tags',
        },
        { status: 400 }
      );
    }

    const snippet = await createSnippet(
      title,
      description,
      code,
      language,
      tags
    );

    return NextResponse.json(snippet, { status: 201 });
  } catch (error) {
    console.error('[v0] Error creating snippet:', error);
    return NextResponse.json(
      { error: 'Failed to create snippet' },
      { status: 500 }
    );
  }
}