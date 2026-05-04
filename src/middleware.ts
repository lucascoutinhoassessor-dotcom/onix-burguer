import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

type JwtPayload = {
  email?: string;
  role?: string;
  permissions?: string[];
};

// Map from route prefix → permission key required
const ROUTE_PERMISSION_MAP: { prefix: string; key: string }[] = [
  { prefix: "/admin/pedidos",       key: "pedidos" },
  { prefix: "/admin/cardapio",      key: "cardapio" },
  { prefix: "/admin/promocoes",     key: "promocoes" },
  { prefix: "/admin/estoque",       key: "estoque" },
  { prefix: "/admin/financeiro",    key: "financeiro" },
  { prefix: "/admin/colaboradores", key: "colaboradores" },
  { prefix: "/admin/integracoes",   key: "integracoes" },
  { prefix: "/admin/clientes",      key: "clientes" },
  { prefix: "/admin/suporte",       key: "suporte" },
  { prefix: "/admin/sugestoes",     key: "sugestoes" },
  { prefix: "/admin/dados-empresa", key: "dados-empresa" },
  // Root dashboard — always allowed if logged in
];

// Routes that require at least 'manager' role (staff cannot access by default role-check)
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
      const customPermissions = jwtPayload.permissions; // only set for employees with custom perms

      // If employee has custom per-tab permissions (JSONB array), enforce them
      if (customPermissions && Array.isArray(customPermissions)) {
        const match = ROUTE_PERMISSION_MAP.find((r) => pathname.startsWith(r.prefix));
        if (match && !customPermissions.includes(match.key)) {
          // Employee doesn't have permission for this route
          return NextResponse.redirect(new URL("/admin", request.url));
        }
      } else {
        // Fallback to role-based access (legacy behaviour)
        // Check owner-only routes
        if (OWNER_ROUTES.some((r) => pathname.startsWith(r)) && role !== "owner") {
          return NextResponse.redirect(new URL("/admin", request.url));
        }

        // Check manager+ routes (staff blocked)
        if (MANAGER_ROUTES.some((r) => pathname.startsWith(r)) && role === "staff") {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
      }

      // Pass role info in headers for API routes
      const response = NextResponse.next();
      response.headers.set("x-admin-role", role);
      response.headers.set("x-admin-email", jwtPayload.email ?? "");
      if (customPermissions) {
        response.headers.set("x-admin-permissions", customPermissions.join(","));
      }
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
