import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PreviewFrame } from "@/components/preview/PreviewFrame";

// Mock the file system context
const mockGetAllFiles = vi.fn();
vi.mock("@/lib/contexts/file-system-context", () => ({
  useFileSystem: () => ({
    getAllFiles: mockGetAllFiles,
    refreshTrigger: 0,
  }),
}));

// Mock the JSX transformer
vi.mock("@/lib/transform/jsx-transformer", () => ({
  createImportMap: vi.fn(() => ({
    importMap: {},
    styles: "",
    errors: [],
  })),
  createPreviewHTML: vi.fn(
    () => "<html><body>Preview</body></html>"
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

test("shows welcome screen when no files exist on first load", () => {
  mockGetAllFiles.mockReturnValue(new Map());
  render(<PreviewFrame />);
  expect(screen.getByText("Welcome to UI Generator")).toBeDefined();
  expect(
    screen.getByText("Start building React components with AI assistance")
  ).toBeDefined();
});

test("shows error when files exist but no entry point found", () => {
  const files = new Map();
  files.set("/readme.md", "# hello");
  mockGetAllFiles.mockReturnValue(files);
  render(<PreviewFrame />);
  expect(screen.getByText("No Preview Available")).toBeDefined();
});

test("renders iframe when App.jsx exists", () => {
  const files = new Map();
  files.set("/App.jsx", 'export default function App() { return <div>Hi</div> }');
  mockGetAllFiles.mockReturnValue(files);
  const { container } = render(<PreviewFrame />);
  const iframe = container.querySelector("iframe");
  expect(iframe).toBeDefined();
  expect(iframe?.title).toBe("Preview");
});

test("finds alternative entry points", () => {
  const files = new Map();
  files.set("/App.tsx", 'export default function App() { return <div/> }');
  mockGetAllFiles.mockReturnValue(files);
  const { container } = render(<PreviewFrame />);
  const iframe = container.querySelector("iframe");
  expect(iframe).toBeDefined();
});

test("falls back to first jsx file when no standard entry point exists", () => {
  const files = new Map();
  files.set("/MyComponent.jsx", 'export default function Comp() { return <div/> }');
  mockGetAllFiles.mockReturnValue(files);
  const { container } = render(<PreviewFrame />);
  const iframe = container.querySelector("iframe");
  expect(iframe).toBeDefined();
});

test("iframe has correct attributes", () => {
  const files = new Map();
  files.set("/App.jsx", 'export default function App() { return <div/> }');
  mockGetAllFiles.mockReturnValue(files);
  const { container } = render(<PreviewFrame />);
  const iframe = container.querySelector("iframe");
  expect(iframe?.className).toContain("w-full");
  expect(iframe?.className).toContain("h-full");
  expect(iframe?.className).toContain("bg-white");
});

// Additional entry point discovery
test("finds /index.jsx as entry point", () => {
  const files = new Map();
  files.set("/index.jsx", 'export default function App() { return <div/> }');
  mockGetAllFiles.mockReturnValue(files);
  const { container } = render(<PreviewFrame />);
  expect(container.querySelector("iframe")).toBeDefined();
});

test("finds /src/App.jsx as entry point", () => {
  const files = new Map();
  files.set("/src/App.jsx", 'export default function App() { return <div/> }');
  mockGetAllFiles.mockReturnValue(files);
  const { container } = render(<PreviewFrame />);
  expect(container.querySelector("iframe")).toBeDefined();
});

test("finds /src/App.tsx as entry point", () => {
  const files = new Map();
  files.set("/src/App.tsx", 'export default function App() { return <div/> }');
  mockGetAllFiles.mockReturnValue(files);
  const { container } = render(<PreviewFrame />);
  expect(container.querySelector("iframe")).toBeDefined();
});

// Error states
test("shows error message text in no preview state", () => {
  const files = new Map();
  files.set("/data.json", '{}');
  mockGetAllFiles.mockReturnValue(files);
  render(<PreviewFrame />);
  expect(screen.getByText("No Preview Available")).toBeDefined();
  expect(screen.getByText(/Start by creating a React component/)).toBeDefined();
});

test("welcome screen shows prompt text", () => {
  mockGetAllFiles.mockReturnValue(new Map());
  render(<PreviewFrame />);
  expect(screen.getByText(/Ask the AI to create your first component/)).toBeDefined();
});

// Does not show welcome when non-jsx files exist
test("shows 'no preview' not welcome when non-jsx files exist", () => {
  const files = new Map();
  files.set("/readme.txt", "hello");
  mockGetAllFiles.mockReturnValue(files);
  render(<PreviewFrame />);
  expect(screen.queryByText("Welcome to UI Generator")).toBeNull();
  expect(screen.getByText("No Preview Available")).toBeDefined();
});
