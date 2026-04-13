import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Allow through — auth check is handled by withAuth
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Protect these routes — anything else is public
export const config = {
  matcher: ["/dashboard/:path*", "/project/:path*"],
};
