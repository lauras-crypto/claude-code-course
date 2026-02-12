import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { HeaderActions } from "@/components/HeaderActions";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignOut = vi.fn();
vi.mock("@/actions", () => ({
  signOut: (...args: any[]) => mockSignOut(...args),
}));

const mockGetProjects = vi.fn();
vi.mock("@/actions/get-projects", () => ({
  getProjects: (...args: any[]) => mockGetProjects(...args),
}));

const mockCreateProject = vi.fn();
vi.mock("@/actions/create-project", () => ({
  createProject: (...args: any[]) => mockCreateProject(...args),
}));

vi.mock("@/components/auth/AuthDialog", () => ({
  AuthDialog: ({ open, defaultMode }: any) =>
    open ? <div data-testid="auth-dialog" data-mode={defaultMode} /> : null,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetProjects.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
});

// Unauthenticated user
test("shows Sign In and Sign Up buttons for unauthenticated user", () => {
  render(<HeaderActions />);
  expect(screen.getByText("Sign In")).toBeDefined();
  expect(screen.getByText("Sign Up")).toBeDefined();
});

test("opens auth dialog in signin mode when Sign In is clicked", () => {
  render(<HeaderActions />);
  fireEvent.click(screen.getByText("Sign In"));
  const dialog = screen.getByTestId("auth-dialog");
  expect(dialog.getAttribute("data-mode")).toBe("signin");
});

test("opens auth dialog in signup mode when Sign Up is clicked", () => {
  render(<HeaderActions />);
  fireEvent.click(screen.getByText("Sign Up"));
  const dialog = screen.getByTestId("auth-dialog");
  expect(dialog.getAttribute("data-mode")).toBe("signup");
});

test("does not show New Design button for unauthenticated user", () => {
  render(<HeaderActions />);
  expect(screen.queryByText("New Design")).toBeNull();
});

// Authenticated user
const mockUser = { id: "user-1", email: "test@example.com" };

test("shows New Design button for authenticated user", async () => {
  mockGetProjects.mockResolvedValue([]);
  render(<HeaderActions user={mockUser} projectId="proj-1" />);
  await waitFor(() => {
    expect(screen.getByText("New Design")).toBeDefined();
  });
});

test("shows sign out button for authenticated user", async () => {
  render(<HeaderActions user={mockUser} projectId="proj-1" />);
  await waitFor(() => {
    expect(screen.getByTitle("Sign out")).toBeDefined();
  });
});

test("calls signOut when sign out button is clicked", async () => {
  render(<HeaderActions user={mockUser} projectId="proj-1" />);
  await waitFor(() => {
    expect(screen.getByTitle("Sign out")).toBeDefined();
  });
  fireEvent.click(screen.getByTitle("Sign out"));
  expect(mockSignOut).toHaveBeenCalled();
});

test("creates new project and navigates when New Design is clicked", async () => {
  mockCreateProject.mockResolvedValue({ id: "new-proj" });
  render(<HeaderActions user={mockUser} projectId="proj-1" />);

  await waitFor(() => {
    expect(screen.getByText("New Design")).toBeDefined();
  });
  fireEvent.click(screen.getByText("New Design"));

  await waitFor(() => {
    expect(mockCreateProject).toHaveBeenCalledWith({
      name: expect.stringContaining("Design #"),
      messages: [],
      data: {},
    });
    expect(mockPush).toHaveBeenCalledWith("/new-proj");
  });
});

test("does not show Sign In/Sign Up for authenticated user", () => {
  render(<HeaderActions user={mockUser} projectId="proj-1" />);
  expect(screen.queryByText("Sign In")).toBeNull();
  expect(screen.queryByText("Sign Up")).toBeNull();
});

// Project dropdown
test("shows project selector after loading", async () => {
  mockGetProjects.mockResolvedValue([
    { id: "proj-1", name: "My Project", createdAt: new Date(), updatedAt: new Date() },
  ]);
  render(<HeaderActions user={mockUser} projectId="proj-1" />);

  await waitFor(() => {
    expect(screen.getByText("My Project")).toBeDefined();
  });
});

test("shows Select Project when current project not in list", async () => {
  mockGetProjects.mockResolvedValue([]);
  render(<HeaderActions user={mockUser} projectId="proj-1" />);

  await waitFor(() => {
    expect(screen.getByText("Select Project")).toBeDefined();
  });
});
