import { NextRequest, NextResponse } from 'next/server';

const DASHBOARD_USERNAME = process.env.DASHBOARD_USERNAME || 'admin';
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'secret123';

const activeIPs = new Map<string, { count: number, resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 req / min

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // 1. Enforce Basic Auth on the entire Dashboard and API routes
  const basicAuth = req.headers.get('authorization');
  
  if (!basicAuth || !basicAuth.startsWith('Basic ')) {
    return new NextResponse('Authentication Required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Dashboard"'
      }
    });
  }

  const base64Credentials = basicAuth.split(' ')[1];
  const decoded = atob(base64Credentials);
  const [username, password] = decoded.split(':');

  if (username !== DASHBOARD_USERNAME || password !== DASHBOARD_PASSWORD) {
    return new NextResponse('Unauthorized Access', { status: 403 });
  }

  // 2. Simple Memory-Based Rate Limiting for API Endpoints
  if (url.pathname.startsWith('/api/')) {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    const entry = activeIPs.get(ip);

    if (!entry || now > entry.resetAt) {
      activeIPs.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else {
      entry.count++;
      if (entry.count > MAX_REQUESTS_PER_WINDOW) {
        return NextResponse.json(
          { success: false, error: 'Too Many Requests - Rate Limit Exceeded' }, 
          { status: 429 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
