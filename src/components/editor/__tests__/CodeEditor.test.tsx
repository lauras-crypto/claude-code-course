import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { CodeEditor } from "@/components/editor/CodeEditor";

const mockGetFileContent = vi.fn();
const mockUpdateFile = vi.fn();
let mockSelectedFile: string | null = null;

vi.mock("@/lib/contexts/file-system-context", () => ({
  useFileSystem: () => ({
    selectedFile: mockSelectedFile,
    getFileContent: mockGetFileContent,
    updateFile: mockUpdateFile,
  }),
}));

// Mock Monaco Editor
vi.mock("@monaco-editor/react", () => ({
  default: ({ language, value, onChange, onMount, theme, options }: any) => (
    <div data-testid="monaco-editor" data-language={language} data-theme={theme}>
      <textarea
        data-testid="editor-textarea"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
      <span data-testid="editor-options">{JSON.stringify(options)}</span>
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSelectedFile = null;
  mockGetFileContent.mockReturnValue("");
});

afterEach(() => {
  cleanup();
});

// Empty state
test("shows empty state when no file is selected", () => {
  render(<CodeEditor />);
  expect(screen.getByText("Select a file to edit")).toBeDefined();
  expect(screen.getByText("Choose a file from the file tree")).toBeDefined();
});

// Editor rendering
test("renders editor when file is selected", () => {
  mockSelectedFile = "/App.jsx";
  mockGetFileContent.mockReturnValue("const App = () => {};");
  render(<CodeEditor />);
  expect(screen.getByTestId("monaco-editor")).toBeDefined();
});

test("passes correct content to editor", () => {
  mockSelectedFile = "/App.jsx";
  mockGetFileContent.mockReturnValue("const App = () => {};");
  render(<CodeEditor />);
  const textarea = screen.getByTestId("editor-textarea");
  expect(textarea).toHaveProperty("value", "const App = () => {};");
});

test("uses empty string when getFileContent returns null", () => {
  mockSelectedFile = "/App.jsx";
  mockGetFileContent.mockReturnValue(null);
  render(<CodeEditor />);
  const textarea = screen.getByTestId("editor-textarea");
  expect(textarea).toHaveProperty("value", "");
});

// Language detection
test("detects javascript for .js files", () => {
  mockSelectedFile = "/index.js";
  render(<CodeEditor />);
  expect(screen.getByTestId("monaco-editor").getAttribute("data-language")).toBe("javascript");
});

test("detects javascript for .jsx files", () => {
  mockSelectedFile = "/App.jsx";
  render(<CodeEditor />);
  expect(screen.getByTestId("monaco-editor").getAttribute("data-language")).toBe("javascript");
});

test("detects typescript for .ts files", () => {
  mockSelectedFile = "/utils.ts";
  render(<CodeEditor />);
  expect(screen.getByTestId("monaco-editor").getAttribute("data-language")).toBe("typescript");
});

test("detects typescript for .tsx files", () => {
  mockSelectedFile = "/App.tsx";
  render(<CodeEditor />);
  expect(screen.getByTestId("monaco-editor").getAttribute("data-language")).toBe("typescript");
});

test("detects json for .json files", () => {
  mockSelectedFile = "/package.json";
  render(<CodeEditor />);
  expect(screen.getByTestId("monaco-editor").getAttribute("data-language")).toBe("json");
});

test("detects css for .css files", () => {
  mockSelectedFile = "/styles.css";
  render(<CodeEditor />);
  expect(screen.getByTestId("monaco-editor").getAttribute("data-language")).toBe("css");
});

test("detects html for .html files", () => {
  mockSelectedFile = "/index.html";
  render(<CodeEditor />);
  expect(screen.getByTestId("monaco-editor").getAttribute("data-language")).toBe("html");
});

test("detects markdown for .md files", () => {
  mockSelectedFile = "/README.md";
  render(<CodeEditor />);
  expect(screen.getByTestId("monaco-editor").getAttribute("data-language")).toBe("markdown");
});

test("defaults to plaintext for unknown extensions", () => {
  mockSelectedFile = "/data.xyz";
  render(<CodeEditor />);
  expect(screen.getByTestId("monaco-editor").getAttribute("data-language")).toBe("plaintext");
});

test("defaults to plaintext for files without extension", () => {
  mockSelectedFile = "/Makefile";
  render(<CodeEditor />);
  expect(screen.getByTestId("monaco-editor").getAttribute("data-language")).toBe("plaintext");
});

// Theme
test("uses vs-dark theme", () => {
  mockSelectedFile = "/App.jsx";
  render(<CodeEditor />);
  expect(screen.getByTestId("monaco-editor").getAttribute("data-theme")).toBe("vs-dark");
});

// Editor options
test("passes correct editor options", () => {
  mockSelectedFile = "/App.jsx";
  render(<CodeEditor />);
  const options = JSON.parse(screen.getByTestId("editor-options").textContent!);
  expect(options.minimap.enabled).toBe(false);
  expect(options.fontSize).toBe(14);
  expect(options.wordWrap).toBe("on");
  expect(options.readOnly).toBe(false);
  expect(options.automaticLayout).toBe(true);
});
