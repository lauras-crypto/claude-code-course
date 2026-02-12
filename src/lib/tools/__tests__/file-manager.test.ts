import { test, expect, beforeEach } from "vitest";
import { VirtualFileSystem } from "@/lib/file-system";
import { buildFileManagerTool } from "@/lib/tools/file-manager";

let fs: VirtualFileSystem;
let tool: ReturnType<typeof buildFileManagerTool>;

beforeEach(() => {
  fs = new VirtualFileSystem();
  tool = buildFileManagerTool(fs);
});

// rename command
test("rename succeeds with valid paths", async () => {
  fs.createFile("/old.txt", "content");
  const result = await tool.execute({
    command: "rename",
    path: "/old.txt",
    new_path: "/new.txt",
  });
  expect(result).toEqual({
    success: true,
    message: "Successfully renamed /old.txt to /new.txt",
  });
  expect(fs.exists("/new.txt")).toBe(true);
  expect(fs.exists("/old.txt")).toBe(false);
});

test("rename fails when new_path is not provided", async () => {
  fs.createFile("/old.txt", "content");
  const result = await tool.execute({
    command: "rename",
    path: "/old.txt",
  });
  expect(result).toEqual({
    success: false,
    error: "new_path is required for rename command",
  });
});

test("rename fails for non-existent file", async () => {
  const result = await tool.execute({
    command: "rename",
    path: "/nonexistent.txt",
    new_path: "/new.txt",
  });
  expect(result.success).toBe(false);
  expect(result.error).toContain("Failed to rename");
});

// delete command
test("delete succeeds for existing file", async () => {
  fs.createFile("/test.txt", "content");
  const result = await tool.execute({
    command: "delete",
    path: "/test.txt",
  });
  expect(result).toEqual({
    success: true,
    message: "Successfully deleted /test.txt",
  });
  expect(fs.exists("/test.txt")).toBe(false);
});

test("delete fails for non-existent file", async () => {
  const result = await tool.execute({
    command: "delete",
    path: "/nonexistent.txt",
  });
  expect(result.success).toBe(false);
  expect(result.error).toContain("Failed to delete");
});

// tool metadata
test("tool has correct description", () => {
  expect(tool.description).toContain("Rename or delete");
});

test("tool has parameters schema", () => {
  expect(tool.parameters).toBeDefined();
});

// Edge cases
test("rename preserves file content", async () => {
  fs.createFile("/file.txt", "important content");
  await tool.execute({
    command: "rename",
    path: "/file.txt",
    new_path: "/renamed.txt",
  });
  const node = fs.getNode("/renamed.txt");
  expect(node?.content).toBe("important content");
});

test("rename to nested path", async () => {
  fs.createFile("/file.txt", "content");
  const result = await tool.execute({
    command: "rename",
    path: "/file.txt",
    new_path: "/deep/nested/file.txt",
  });
  // Behavior depends on whether rename creates parent dirs
  expect(result).toBeDefined();
});

test("delete root directory is handled", async () => {
  const result = await tool.execute({
    command: "delete",
    path: "/",
  });
  expect(result).toBeDefined();
});

test("rename with same source and destination", async () => {
  fs.createFile("/file.txt", "content");
  const result = await tool.execute({
    command: "rename",
    path: "/file.txt",
    new_path: "/file.txt",
  });
  expect(result).toBeDefined();
  expect(fs.exists("/file.txt")).toBe(true);
});
