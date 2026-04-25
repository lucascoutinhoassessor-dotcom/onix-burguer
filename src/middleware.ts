import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

type JwtPayload = {
  email?: string;
  role?: string;
};

// Routes that require at least 'manager' role (staff cannot access)
const MANAGER_ROUTES = ["/admin/promocoes", "/admin/financeiro", "/admin/colaboradores"];
// Routes that require 'owner' role only
const OWNER_ROUTES = ["/admin/integracoes"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("admin-token")?.value;

    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "onix-admin-secret");
      const { payload } = await jwtVerify(token, secret);
      const jwtPayload = payload as JwtPayload;
      const role = jwtPayload.role ?? "owner";

      // Check owner-only routes
      if (OWNER_ROUTES.some((r) => pathname.startsWith(r)) && role !== "owner") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }

      // Check manager+ routes (staff blocked)
      if (MANAGER_ROUTES.some((r) => pathname.startsWith(r)) && role === "staff") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }

      // Pass role info in headers for API routes
      const response = NextResponse.next();
      response.headers.set("x-admin-role", role);
      response.headers.set("x-admin-email", jwtPayload.email ?? "");
      return response;
    } catch {
      const loginUrl = new URL("/admin/login", request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("admin-token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
