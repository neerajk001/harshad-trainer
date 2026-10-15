import { NextResponse } from "next/server";
import { auth } from "@/../auth";

export async function proxy(request: Request) {
  const url = new URL(request.url);
  const session = await auth();
  const { pathname } = url;

  const isPublic =
    pathname === "/" ||
    pathname === "/welcome" ||
    pathname === "/login" ||
    pathname === "/inquiry" ||
    pathname.startsWith("/api/auth") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname === "/offline.html" ||
    pathname.startsWith("/icons/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt";

  if (!session?.user && !isPublic) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (session?.user && (pathname === "/" || pathname === "/login" || pathname === "/inquiry")) {
    url.pathname = session.user.role === "trainer" ? "/trainer" : "/client";
    return NextResponse.redirect(url);
  }

  if (session?.user?.role === "trainer" && pathname.startsWith("/client")) {
    url.pathname = "/trainer";
    return NextResponse.redirect(url);
  }
  if (session?.user?.role === "client" && pathname.startsWith("/trainer")) {
    url.pathname = "/client";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.svg$).*)"],
};
