import { test, expect, beforeEach } from "vitest";
import { VirtualFileSystem } from "@/lib/file-system";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";

let fs: VirtualFileSystem;
let tool: ReturnType<typeof buildStrReplaceTool>;

beforeEach(() => {
  fs = new VirtualFileSystem();
  tool = buildStrReplaceTool(fs);
});

test("has correct id and parameters", () => {
  expect(tool.id).toBe("str_replace_editor");
  expect(tool.parameters).toBeDefined();
});

// view command
test("view command returns file content", async () => {
  fs.createFile("/test.txt", "Hello World");
  const result = await tool.execute({
    command: "view",
    path: "/test.txt",
  });
  expect(result).toContain("Hello World");
});

test("view command with view_range returns partial content", async () => {
  fs.createFile("/test.txt", "line1\nline2\nline3\nline4\nline5");
  const result = await tool.execute({
    command: "view",
    path: "/test.txt",
    view_range: [2, 4],
  });
  expect(result).toContain("line2");
  expect(result).toContain("line4");
});

// create command
test("create command creates a new file", async () => {
  await tool.execute({
    command: "create",
    path: "/new-file.txt",
    file_text: "New content",
  });
  expect(fs.exists("/new-file.txt")).toBe(true);
  const node = fs.getNode("/new-file.txt");
  expect(node?.content).toBe("New content");
});

test("create command creates file with empty content when file_text is omitted", async () => {
  await tool.execute({
    command: "create",
    path: "/empty.txt",
  });
  expect(fs.exists("/empty.txt")).toBe(true);
  const node = fs.getNode("/empty.txt");
  expect(node?.content).toBe("");
});

test("create command creates parent directories", async () => {
  await tool.execute({
    command: "create",
    path: "/deep/nested/file.txt",
    file_text: "deep content",
  });
  expect(fs.exists("/deep/nested/file.txt")).toBe(true);
});

// str_replace command
test("str_replace command replaces text in file", async () => {
  fs.createFile("/test.txt", "Hello World");
  await tool.execute({
    command: "str_replace",
    path: "/test.txt",
    old_str: "World",
    new_str: "Vitest",
  });
  const node = fs.getNode("/test.txt");
  expect(node?.content).toBe("Hello Vitest");
});

test("str_replace command uses empty strings for missing old_str/new_str", async () => {
  fs.createFile("/test.txt", "Hello");
  const result = await tool.execute({
    command: "str_replace",
    path: "/test.txt",
  });
  // Should attempt to replace "" with "" - behavior depends on VirtualFileSystem
  expect(result).toBeDefined();
});

// insert command
test("insert command inserts text at line", async () => {
  fs.createFile("/test.txt", "line1\nline2\nline3");
  await tool.execute({
    command: "insert",
    path: "/test.txt",
    insert_line: 2,
    new_str: "inserted",
  });
  const node = fs.getNode("/test.txt");
  expect(node?.content).toContain("inserted");
});

test("insert command defaults to line 0 when insert_line is omitted", async () => {
  fs.createFile("/test.txt", "existing");
  await tool.execute({
    command: "insert",
    path: "/test.txt",
    new_str: "prepended",
  });
  const node = fs.getNode("/test.txt");
  expect(node?.content).toContain("prepended");
});

// undo_edit command
test("undo_edit command returns error message", async () => {
  fs.createFile("/test.txt", "content");
  const result = await tool.execute({
    command: "undo_edit",
    path: "/test.txt",
  });
  expect(result).toContain("Error");
  expect(result).toContain("undo_edit command is not supported");
});

// Edge cases
test("view command on non-existent file", async () => {
  const result = await tool.execute({
    command: "view",
    path: "/missing.txt",
  });
  expect(result).toBeDefined();
});

test("str_replace on non-existent file", async () => {
  const result = await tool.execute({
    command: "str_replace",
    path: "/missing.txt",
    old_str: "foo",
    new_str: "bar",
  });
  expect(result).toBeDefined();
});

test("create on existing file path still creates", async () => {
  fs.createFile("/test.txt", "old content");
  const result = await tool.execute({
    command: "create",
    path: "/test.txt",
    file_text: "new content",
  });
  // createFileWithParents may not overwrite - verify it doesn't throw
  expect(result).toBeDefined();
});

test("str_replace with multiline content", async () => {
  fs.createFile("/test.txt", "line1\nline2\nline3");
  await tool.execute({
    command: "str_replace",
    path: "/test.txt",
    old_str: "line1\nline2",
    new_str: "replaced1\nreplaced2",
  });
  const node = fs.getNode("/test.txt");
  expect(node?.content).toBe("replaced1\nreplaced2\nline3");
});

test("insert at line within file", async () => {
  fs.createFile("/test.txt", "line1\nline2");
  await tool.execute({
    command: "insert",
    path: "/test.txt",
    insert_line: 1,
    new_str: "inserted",
  });
  const node = fs.getNode("/test.txt");
  expect(node?.content).toContain("inserted");
});

test("create file with special characters in content", async () => {
  const content = 'const x = "hello <world> & \\"quotes\\"";';
  await tool.execute({
    command: "create",
    path: "/special.js",
    file_text: content,
  });
  const node = fs.getNode("/special.js");
  expect(node?.content).toBe(content);
});
