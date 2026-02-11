import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// str_replace_editor tests

test("shows 'Creating' message for str_replace_editor create command", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="result"
      args={{ command: "create", path: "/App.jsx" }}
    />
  );

  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
});

test("shows 'Editing' message for str_replace_editor str_replace command", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="result"
      args={{ command: "str_replace", path: "/components/Header.tsx" }}
    />
  );

  expect(screen.getByText("Editing /components/Header.tsx")).toBeDefined();
});

test("shows 'Viewing' message for str_replace_editor view command", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="result"
      args={{ command: "view", path: "/utils.ts" }}
    />
  );

  expect(screen.getByText("Viewing /utils.ts")).toBeDefined();
});

test("shows 'Inserting into' message for str_replace_editor insert command", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="result"
      args={{ command: "insert", path: "/index.tsx" }}
    />
  );

  expect(screen.getByText("Inserting into /index.tsx")).toBeDefined();
});

test("shows 'Undoing edit to' message for str_replace_editor undo_edit command", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="result"
      args={{ command: "undo_edit", path: "/App.jsx" }}
    />
  );

  expect(screen.getByText("Undoing edit to /App.jsx")).toBeDefined();
});

// file_manager tests

test("shows 'Moving' message for file_manager rename command", () => {
  render(
    <ToolInvocationBadge
      toolName="file_manager"
      state="result"
      args={{ command: "rename", path: "/old.tsx", new_path: "/new.tsx" }}
    />
  );

  expect(screen.getByText("Moving /old.tsx → /new.tsx")).toBeDefined();
});

test("shows 'Deleting' message for file_manager delete command", () => {
  render(
    <ToolInvocationBadge
      toolName="file_manager"
      state="result"
      args={{ command: "delete", path: "/temp.tsx" }}
    />
  );

  expect(screen.getByText("Deleting /temp.tsx")).toBeDefined();
});

// State tests

test("shows spinner when state is not result", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="call"
      args={{ command: "create", path: "/App.jsx" }}
    />
  );

  const spinner = container.querySelector(".animate-spin");
  expect(spinner).not.toBeNull();
});

test("shows green dot when state is result", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="result"
      args={{ command: "create", path: "/App.jsx" }}
    />
  );

  const greenDot = container.querySelector(".bg-emerald-500");
  expect(greenDot).not.toBeNull();

  const spinner = container.querySelector(".animate-spin");
  expect(spinner).toBeNull();
});

// Fallback tests

test("falls back to tool name for unknown tools", () => {
  render(
    <ToolInvocationBadge
      toolName="unknown_tool"
      state="result"
      args={{}}
    />
  );

  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("falls back to 'file' when path is not provided", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="result"
      args={{ command: "create" }}
    />
  );

  expect(screen.getByText("Creating file")).toBeDefined();
});

test("handles missing args gracefully", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      state="result"
    />
  );

  expect(screen.getByText("str_replace_editor")).toBeDefined();
});
