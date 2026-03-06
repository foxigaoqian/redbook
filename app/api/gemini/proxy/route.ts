import { NextResponse } from 'next/server';

async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // Retry on 524 (Cloudflare Timeout) or 502/503/504
    if (!response.ok && [524, 502, 503, 504].includes(response.status) && retries > 0) {
      console.warn(`[Gemini Proxy] Target returned ${response.status}, retrying... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
  } catch (error: any) {
    if (retries > 0 && (error.code === 'ECONNRESET' || error.message?.includes('ECONNRESET') || error.name === 'TypeError' || error.name === 'AbortError')) {
      console.warn(`[Gemini Proxy] Request failed (${error.message || error.name}), retrying... (${retries} left)`);
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { url, headers, body } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log(`[Gemini Proxy] Forwarding request to: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout for the proxy fetch

    try {
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          ...headers,
          // Ensure we don't pass problematic headers from the client
          'Origin': undefined,
          'Referer': undefined,
          // Add connection keep-alive to help with ECONNRESET
          'Connection': 'keep-alive',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error(`[Gemini Proxy] Target returned ${response.status}:`, data);
        return NextResponse.json(
          { error: data.error?.message || data.error || `Target API returned ${response.status}` },
          { status: response.status }
        );
      }

      return NextResponse.json(data);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Target API request timed out (Proxy Timeout)' },
          { status: 524 }
        );
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('[Gemini Proxy] Internal Error:', error);
    return NextResponse.json(
      { error: `Proxy Error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
