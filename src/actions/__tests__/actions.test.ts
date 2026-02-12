import { test, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    project: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn((password: string) => Promise.resolve(`hashed_${password}`)),
    compare: vi.fn((plain: string, hashed: string) =>
      Promise.resolve(hashed === `hashed_${plain}`)
    ),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { signUp, signIn, signOut, getUser } from "@/actions";
import { createProject } from "@/actions/create-project";
import { getProject } from "@/actions/get-project";
import { getProjects } from "@/actions/get-projects";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession, getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const mockPrisma = vi.mocked(prisma);
const mockGetSession = vi.mocked(getSession);
const mockCreateSession = vi.mocked(createSession);
const mockDeleteSession = vi.mocked(deleteSession);

beforeEach(() => {
  vi.clearAllMocks();
});

// signUp tests
test("signUp returns error when email is empty", async () => {
  const result = await signUp("", "password123");
  expect(result.success).toBe(false);
  expect(result.error).toBe("Email and password are required");
});

test("signUp returns error when password is empty", async () => {
  const result = await signUp("test@example.com", "");
  expect(result.success).toBe(false);
  expect(result.error).toBe("Email and password are required");
});

test("signUp returns error when password is too short", async () => {
  const result = await signUp("test@example.com", "short");
  expect(result.success).toBe(false);
  expect(result.error).toBe("Password must be at least 8 characters");
});

test("signUp returns error when email already exists", async () => {
  mockPrisma.user.findUnique.mockResolvedValue({
    id: "1",
    email: "test@example.com",
    password: "hashed",
    createdAt: new Date(),
  });
  const result = await signUp("test@example.com", "password123");
  expect(result.success).toBe(false);
  expect(result.error).toBe("Email already registered");
});

test("signUp succeeds with valid credentials", async () => {
  mockPrisma.user.findUnique.mockResolvedValue(null);
  mockPrisma.user.create.mockResolvedValue({
    id: "user-1",
    email: "new@example.com",
    password: "hashed_password123",
    createdAt: new Date(),
  });

  const result = await signUp("new@example.com", "password123");
  expect(result.success).toBe(true);
  expect(mockCreateSession).toHaveBeenCalledWith("user-1", "new@example.com");
});

test("signUp handles unexpected errors", async () => {
  mockPrisma.user.findUnique.mockRejectedValue(new Error("DB error"));
  const result = await signUp("test@example.com", "password123");
  expect(result.success).toBe(false);
  expect(result.error).toBe("An error occurred during sign up");
});

// signIn tests
test("signIn returns error when email is empty", async () => {
  const result = await signIn("", "password123");
  expect(result.success).toBe(false);
  expect(result.error).toBe("Email and password are required");
});

test("signIn returns error when user not found", async () => {
  mockPrisma.user.findUnique.mockResolvedValue(null);
  const result = await signIn("unknown@example.com", "password123");
  expect(result.success).toBe(false);
  expect(result.error).toBe("Invalid credentials");
});

test("signIn returns error for wrong password", async () => {
  mockPrisma.user.findUnique.mockResolvedValue({
    id: "1",
    email: "test@example.com",
    password: "hashed_wrongpassword",
    createdAt: new Date(),
  });
  const result = await signIn("test@example.com", "password123");
  expect(result.success).toBe(false);
  expect(result.error).toBe("Invalid credentials");
});

test("signIn succeeds with correct credentials", async () => {
  mockPrisma.user.findUnique.mockResolvedValue({
    id: "user-1",
    email: "test@example.com",
    password: "hashed_password123",
    createdAt: new Date(),
  });

  const result = await signIn("test@example.com", "password123");
  expect(result.success).toBe(true);
  expect(mockCreateSession).toHaveBeenCalledWith("user-1", "test@example.com");
});

test("signIn handles unexpected errors", async () => {
  mockPrisma.user.findUnique.mockRejectedValue(new Error("DB error"));
  const result = await signIn("test@example.com", "password123");
  expect(result.success).toBe(false);
  expect(result.error).toBe("An error occurred during sign in");
});

// signOut tests
test("signOut deletes session and redirects", async () => {
  await signOut();
  expect(mockDeleteSession).toHaveBeenCalled();
  expect(redirect).toHaveBeenCalledWith("/");
});

// getUser tests
test("getUser returns null when no session", async () => {
  mockGetSession.mockResolvedValue(null);
  const user = await getUser();
  expect(user).toBeNull();
});

test("getUser returns user data when session exists", async () => {
  mockGetSession.mockResolvedValue({
    userId: "user-1",
    email: "test@example.com",
    expiresAt: new Date(),
  });
  mockPrisma.user.findUnique.mockResolvedValue({
    id: "user-1",
    email: "test@example.com",
    createdAt: new Date(),
  } as any);

  const user = await getUser();
  expect(user).toBeDefined();
  expect(user?.email).toBe("test@example.com");
});

test("getUser returns null on database error", async () => {
  mockGetSession.mockResolvedValue({
    userId: "user-1",
    email: "test@example.com",
    expiresAt: new Date(),
  });
  mockPrisma.user.findUnique.mockRejectedValue(new Error("DB error"));
  const user = await getUser();
  expect(user).toBeNull();
});

// createProject tests
test("createProject throws when not authenticated", async () => {
  mockGetSession.mockResolvedValue(null);
  await expect(
    createProject({ name: "Test", messages: [], data: {} })
  ).rejects.toThrow("Unauthorized");
});

test("createProject creates project for authenticated user", async () => {
  mockGetSession.mockResolvedValue({
    userId: "user-1",
    email: "test@example.com",
    expiresAt: new Date(),
  });
  mockPrisma.project.create.mockResolvedValue({
    id: "proj-1",
    name: "Test",
    userId: "user-1",
    messages: "[]",
    data: "{}",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const project = await createProject({
    name: "Test",
    messages: [{ role: "user" }],
    data: { key: "val" },
  });
  expect(project.id).toBe("proj-1");
  expect(mockPrisma.project.create).toHaveBeenCalledWith({
    data: {
      name: "Test",
      userId: "user-1",
      messages: JSON.stringify([{ role: "user" }]),
      data: JSON.stringify({ key: "val" }),
    },
  });
});

// getProject tests
test("getProject throws when not authenticated", async () => {
  mockGetSession.mockResolvedValue(null);
  await expect(getProject("proj-1")).rejects.toThrow("Unauthorized");
});

test("getProject throws when project not found", async () => {
  mockGetSession.mockResolvedValue({
    userId: "user-1",
    email: "test@example.com",
    expiresAt: new Date(),
  });
  mockPrisma.project.findUnique.mockResolvedValue(null);
  await expect(getProject("nonexistent")).rejects.toThrow("Project not found");
});

test("getProject returns parsed project data", async () => {
  mockGetSession.mockResolvedValue({
    userId: "user-1",
    email: "test@example.com",
    expiresAt: new Date(),
  });
  mockPrisma.project.findUnique.mockResolvedValue({
    id: "proj-1",
    name: "My Project",
    userId: "user-1",
    messages: JSON.stringify([{ role: "user", content: "hello" }]),
    data: JSON.stringify({ "/App.jsx": "code" }),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
  });

  const project = await getProject("proj-1");
  expect(project.id).toBe("proj-1");
  expect(project.messages).toEqual([{ role: "user", content: "hello" }]);
  expect(project.data).toEqual({ "/App.jsx": "code" });
});

// getProjects tests
test("getProjects throws when not authenticated", async () => {
  mockGetSession.mockResolvedValue(null);
  await expect(getProjects()).rejects.toThrow("Unauthorized");
});

test("getProjects returns list of projects", async () => {
  mockGetSession.mockResolvedValue({
    userId: "user-1",
    email: "test@example.com",
    expiresAt: new Date(),
  });
  mockPrisma.project.findMany.mockResolvedValue([
    {
      id: "proj-1",
      name: "First",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "proj-2",
      name: "Second",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ] as any);

  const projects = await getProjects();
  expect(projects).toHaveLength(2);
  expect(projects[0].name).toBe("First");
});

test("getProjects returns empty array when no projects", async () => {
  mockGetSession.mockResolvedValue({
    userId: "user-1",
    email: "test@example.com",
    expiresAt: new Date(),
  });
  mockPrisma.project.findMany.mockResolvedValue([]);
  const projects = await getProjects();
  expect(projects).toHaveLength(0);
});

// Boundary conditions
test("signUp accepts exactly 8 character password", async () => {
  mockPrisma.user.findUnique.mockResolvedValue(null);
  mockPrisma.user.create.mockResolvedValue({
    id: "user-1",
    email: "test@example.com",
    password: "hashed_12345678",
    createdAt: new Date(),
  });
  const result = await signUp("test@example.com", "12345678");
  expect(result.success).toBe(true);
});

test("signUp rejects 7 character password", async () => {
  const result = await signUp("test@example.com", "1234567");
  expect(result.success).toBe(false);
  expect(result.error).toBe("Password must be at least 8 characters");
});

test("signIn returns error when password is empty", async () => {
  const result = await signIn("test@example.com", "");
  expect(result.success).toBe(false);
  expect(result.error).toBe("Email and password are required");
});

test("signUp calls bcrypt.hash with salt rounds 10", async () => {
  const bcrypt = await import("bcrypt");
  mockPrisma.user.findUnique.mockResolvedValue(null);
  mockPrisma.user.create.mockResolvedValue({
    id: "user-1",
    email: "test@example.com",
    password: "hashed",
    createdAt: new Date(),
  });
  await signUp("test@example.com", "password123");
  expect(bcrypt.default.hash).toHaveBeenCalledWith("password123", 10);
});

test("getUser queries with correct select fields", async () => {
  mockGetSession.mockResolvedValue({
    userId: "user-1",
    email: "test@example.com",
    expiresAt: new Date(),
  });
  mockPrisma.user.findUnique.mockResolvedValue({
    id: "user-1",
    email: "test@example.com",
    createdAt: new Date(),
  } as any);

  await getUser();
  expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
    where: { id: "user-1" },
    select: { id: true, email: true, createdAt: true },
  });
});

test("getProject queries with userId for access control", async () => {
  mockGetSession.mockResolvedValue({
    userId: "user-1",
    email: "test@example.com",
    expiresAt: new Date(),
  });
  mockPrisma.project.findUnique.mockResolvedValue(null);
  try {
    await getProject("proj-1");
  } catch {}
  expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
    where: { id: "proj-1", userId: "user-1" },
  });
});

test("getProjects orders by updatedAt desc", async () => {
  mockGetSession.mockResolvedValue({
    userId: "user-1",
    email: "test@example.com",
    expiresAt: new Date(),
  });
  mockPrisma.project.findMany.mockResolvedValue([]);
  await getProjects();
  expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
    where: { userId: "user-1" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });
});

test("createProject serializes messages and data to JSON", async () => {
  mockGetSession.mockResolvedValue({
    userId: "user-1",
    email: "test@example.com",
    expiresAt: new Date(),
  });
  mockPrisma.project.create.mockResolvedValue({
    id: "proj-1",
    name: "Test",
    userId: "user-1",
    messages: "[]",
    data: "{}",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await createProject({ name: "Test", messages: [], data: {} });
  const call = mockPrisma.project.create.mock.calls[0][0];
  expect(call.data.messages).toBe("[]");
  expect(call.data.data).toBe("{}");
});
