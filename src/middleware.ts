import { NextResponse } from 'next/server';
import { testSeriesPath } from '@/lib/slug';

export async function middleware(request: Request) {
  const url = new URL(request.url);
  const { pathname, searchParams } = url;

  // Old quiz filter links (/quizzes?category=X&subcategory=Y) now live on indexable /test-series pages.
  if (pathname === '/quizzes') {
    const category = searchParams.get('category');
    if (category) {
      url.pathname = testSeriesPath(category, searchParams.get('subcategory') || undefined);
      url.search = '';
      return NextResponse.redirect(url, 308);
    }
  }

  // Allow all other requests to proceed without authentication
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/quizzes',
    '/admin/:path*',
    '/api/admin/:path*'
  ]
};
