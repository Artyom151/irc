import { type NextRequest, NextResponse } from 'next/server';

const requestLogs = new Map<string, number[]>();
const RATE_LIMIT_COUNT = 20; // Max requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

export function middleware(request: NextRequest) {
  // Log all incoming requests
  console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`);

  // Apply rate limiting only to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? '127.0.0.1';
    const now = Date.now();

    const userRequests = (requestLogs.get(ip) ?? []).filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
    );

    if (userRequests.length >= RATE_LIMIT_COUNT) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    userRequests.push(now);
    requestLogs.set(ip, userRequests);
  }

  const response = NextResponse.next();

  // Add CORS headers to all API responses
  if (request.nextUrl.pathname.startsWith('/api/')) {
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  // Handle OPTIONS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
