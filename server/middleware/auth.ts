import type { NextFunction, Request, Response } from "express";
import type { IncomingHttpHeaders } from "http";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { sessions as pgSessions, users as pgUsers } from "@shared/schema";
import { sessions as sqliteSessions, users as sqliteUsers } from "@shared/schema-sqlite";

type SessionRow = {
  userId: string;
  expires: Date | number | string;
};

export interface AuthUser {
  id: string;
  email?: string | null;
  role?: string | null;
}

export type AuthenticatedRequest = Request & { user?: AuthUser };

const env = process.env.NODE_ENV ?? "development";
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const isSQLiteDev = env === "development" && !hasDatabaseUrl;

const sessionsTable = isSQLiteDev ? sqliteSessions : pgSessions;
const usersTable = isSQLiteDev ? sqliteUsers : pgUsers;

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);
const CRM_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "AFFILIATE", "ENTERPRISE"]);

function parseCookie(header: string | undefined, key: string): string | undefined {
  if (!header) return undefined;
  const parts = header.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (!part) continue;
    const [k, ...rest] = part.split("=");
    if (k === key) {
      return rest.join("=");
    }
  }
  return undefined;
}

export async function getUserFromSessionToken(sessionToken: string): Promise<AuthUser | null> {
  const sessionResult = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.sessionToken, sessionToken))
    .limit(1);

  if (!sessionResult || sessionResult.length === 0) {
    return null;
  }

  const session = sessionResult[0] as SessionRow;
  const expires = session.expires instanceof Date ? session.expires : new Date(session.expires);
  if (Number.isNaN(expires.getTime()) || expires <= new Date()) {
    return null;
  }

  const userResult = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      role: usersTable.role,
    })
    .from(usersTable)
    .where(eq(usersTable.id, session.userId))
    .limit(1);

  if (!userResult || userResult.length === 0) {
    return null;
  }

  const userRow = userResult[0];
  return {
    id: String(userRow.id),
    email: userRow.email ? String(userRow.email) : null,
    role: userRow.role ? String(userRow.role) : null,
  };
}

export function getSessionTokenFromHeaders(headers: IncomingHttpHeaders): string | undefined {
  const bearer = headers.authorization?.replace("Bearer ", "").trim();
  const headerToken = (headers["x-session-token"] as string | undefined)?.trim();
  const cookieHeader = headers.cookie;
  const cookieToken = parseCookie(cookieHeader, "sessionToken");

  return bearer || headerToken || cookieToken;
}

function getSessionToken(req: Request): string | undefined {
  return getSessionTokenFromHeaders(req.headers);
}

export async function getAuthUserFromHeaders(
  headers: IncomingHttpHeaders
): Promise<AuthUser | null> {
  const sessionToken = getSessionTokenFromHeaders(headers);
  if (!sessionToken) return null;
  return await getUserFromSessionToken(sessionToken);
}

async function authenticateRequest(req: AuthenticatedRequest): Promise<AuthUser | null> {
  if (req.user) return req.user;

  const sessionToken = getSessionToken(req);
  if (!sessionToken) return null;

  const user = await getUserFromSessionToken(sessionToken);
  if (user) {
    req.user = user;
  }
  return user ?? null;
}

export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    await authenticateRequest(req);
    next();
  } catch (error) {
    console.error("optionalAuth error:", error);
    next();
  }
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  } catch (error) {
    console.error("requireAuth error:", error);
    res.status(401).json({ error: "Authentication required" });
  }
}

export function isAdminRole(role: string | null | undefined): boolean {
  return !!role && ADMIN_ROLES.has(role);
}

export function isCrmRole(role: string | null | undefined): boolean {
  return !!role && CRM_ROLES.has(role);
}

export function hasAnyRole(
  user: AuthUser | null | undefined,
  roles: Iterable<string>
): boolean {
  if (!user?.role) return false;
  const roleSet = roles instanceof Set ? roles : new Set(roles);
  return roleSet.has(user.role);
}

export function requireRoles(roles: Iterable<string>) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await authenticateRequest(req);
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!hasAnyRole(user, roles)) {
        return res.status(403).json({ error: "Insufficient privileges" });
      }
      next();
    } catch (error) {
      console.error("requireRoles error:", error);
      res.status(401).json({ error: "Authentication required" });
    }
  };
}

export const requireAdmin = requireRoles(ADMIN_ROLES);
export const requireCrmAccess = requireRoles(CRM_ROLES);

declare global {
  namespace Express {
    interface User extends AuthUser {}
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
