import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MainContent } from "@/app/main-content";

// Mock all child components
vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">FileTree</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">CodeEditor</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: ({ user, projectId }: any) => (
    <div data-testid="header-actions" data-user={user?.id} data-project={projectId}>
      HeaderActions
    </div>
  ),
}));

// Mock providers to just render children
vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <div data-testid="fs-provider">{children}</div>,
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <div data-testid="chat-provider">{children}</div>,
}));

// Mock resizable panels to be simple divs
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children, ...props }: any) => <div data-testid="panel-group" {...props}>{children}</div>,
  ResizablePanel: ({ children, ...props }: any) => <div data-testid="panel" {...props}>{children}</div>,
  ResizableHandle: () => <div data-testid="handle" />,
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>{children}</div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => (
    <button data-testid={`tab-${value}`} data-value={value}>{children}</button>
  ),
}));

afterEach(() => {
  cleanup();
});

test("renders chat interface", () => {
  render(<MainContent />);
  expect(screen.getByTestId("chat-interface")).toBeDefined();
});

test("renders preview frame by default", () => {
  render(<MainContent />);
  expect(screen.getByTestId("preview-frame")).toBeDefined();
});

test("renders header with title", () => {
  render(<MainContent />);
  expect(screen.getByText("React Component Generator")).toBeDefined();
});

test("renders tab triggers for preview and code", () => {
  render(<MainContent />);
  expect(screen.getByTestId("tab-preview")).toBeDefined();
  expect(screen.getByTestId("tab-code")).toBeDefined();
});

test("renders HeaderActions component", () => {
  render(<MainContent />);
  expect(screen.getByTestId("header-actions")).toBeDefined();
});

test("passes user to HeaderActions", () => {
  const user = { id: "user-1", email: "test@example.com" };
  render(<MainContent user={user} />);
  expect(screen.getByTestId("header-actions").getAttribute("data-user")).toBe("user-1");
});

test("passes projectId to HeaderActions", () => {
  const project = {
    id: "proj-1",
    name: "Test",
    messages: [],
    data: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  render(<MainContent project={project} />);
  expect(screen.getByTestId("header-actions").getAttribute("data-project")).toBe("proj-1");
});

test("wraps content in FileSystemProvider and ChatProvider", () => {
  render(<MainContent />);
  expect(screen.getByTestId("fs-provider")).toBeDefined();
  expect(screen.getByTestId("chat-provider")).toBeDefined();
});

test("renders without user or project props", () => {
  render(<MainContent />);
  expect(screen.getByTestId("chat-interface")).toBeDefined();
  expect(screen.getByTestId("preview-frame")).toBeDefined();
});
