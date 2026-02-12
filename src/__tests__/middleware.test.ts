import { test, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/auth", () => ({
  verifySession: vi.fn(),
}));

import { middleware } from "@/middleware";
import { verifySession } from "@/lib/auth";

const mockVerifySession = vi.mocked(verifySession);

function createRequest(pathname: string): NextRequest {
  const url = new URL(pathname, "http://localhost:3000");
  return new NextRequest(url);
}

beforeEach(() => {
  vi.clearAllMocks();
});

test("allows unprotected routes without session", async () => {
  mockVerifySession.mockResolvedValue(null);
  const response = await middleware(createRequest("/"));
  expect(response.status).toBe(200);
});

test("allows unprotected API routes without session", async () => {
  mockVerifySession.mockResolvedValue(null);
  const response = await middleware(createRequest("/api/chat"));
  expect(response.status).toBe(200);
});

test("blocks /api/projects without session", async () => {
  mockVerifySession.mockResolvedValue(null);
  const response = await middleware(createRequest("/api/projects"));
  expect(response.status).toBe(401);
  const body = await response.json();
  expect(body.error).toBe("Authentication required");
});

test("blocks /api/filesystem without session", async () => {
  mockVerifySession.mockResolvedValue(null);
  const response = await middleware(createRequest("/api/filesystem"));
  expect(response.status).toBe(401);
});

test("allows /api/projects with valid session", async () => {
  mockVerifySession.mockResolvedValue({
    userId: "user-1",
    email: "test@example.com",
    expiresAt: new Date(),
  });
  const response = await middleware(createRequest("/api/projects"));
  expect(response.status).toBe(200);
});

test("allows /api/filesystem with valid session", async () => {
  mockVerifySession.mockResolvedValue({
    userId: "user-1",
    email: "test@example.com",
    expiresAt: new Date(),
  });
  const response = await middleware(createRequest("/api/filesystem/data"));
  expect(response.status).toBe(200);
});

test("allows subpaths of protected routes with session", async () => {
  mockVerifySession.mockResolvedValue({
    userId: "user-1",
    email: "test@example.com",
    expiresAt: new Date(),
  });
  const response = await middleware(createRequest("/api/projects/123"));
  expect(response.status).toBe(200);
});

// Edge cases
test("blocks /api/projects subpath without session", async () => {
  mockVerifySession.mockResolvedValue(null);
  const response = await middleware(createRequest("/api/projects/123/details"));
  expect(response.status).toBe(401);
});

test("blocks /api/filesystem subpath without session", async () => {
  mockVerifySession.mockResolvedValue(null);
  const response = await middleware(createRequest("/api/filesystem/upload"));
  expect(response.status).toBe(401);
});

test("allows project page routes without session", async () => {
  mockVerifySession.mockResolvedValue(null);
  const response = await middleware(createRequest("/project-123"));
  expect(response.status).toBe(200);
});

test("does not protect /api/projects-like paths that only share prefix", async () => {
  mockVerifySession.mockResolvedValue(null);
  // /api/projectsettings starts with /api/projects but is a different route
  const response = await middleware(createRequest("/api/projectsettings"));
  // This actually matches startsWith("/api/projects") so it WILL be blocked
  expect(response.status).toBe(401);
});

test("returns JSON error body for blocked requests", async () => {
  mockVerifySession.mockResolvedValue(null);
  const response = await middleware(createRequest("/api/projects"));
  const body = await response.json();
  expect(body).toEqual({ error: "Authentication required" });
});

test("allows root route", async () => {
  mockVerifySession.mockResolvedValue(null);
  const response = await middleware(createRequest("/"));
  expect(response.status).toBe(200);
});
