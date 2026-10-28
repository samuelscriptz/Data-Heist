import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'dataheist_session';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Let API requests handle their own authentication responses
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Dashboard requires login
  if (pathname.startsWith('/dashboard')) {
    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Organizer portal requires login
  if (pathname.startsWith('/organizer')) {
    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
