import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInForm } from "@/components/auth/SignInForm";

const mockSignIn = vi.fn();
let mockIsLoading = false;

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    isLoading: mockIsLoading,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockIsLoading = false;
  mockSignIn.mockResolvedValue({ success: true });
});

afterEach(() => {
  cleanup();
});

test("renders email and password fields", () => {
  render(<SignInForm />);
  expect(screen.getByLabelText("Email")).toBeDefined();
  expect(screen.getByLabelText("Password")).toBeDefined();
});

test("renders submit button", () => {
  render(<SignInForm />);
  expect(screen.getByRole("button", { name: "Sign In" })).toBeDefined();
});

test("email field has correct type and placeholder", () => {
  render(<SignInForm />);
  const email = screen.getByLabelText("Email");
  expect(email.getAttribute("type")).toBe("email");
  expect(email.getAttribute("placeholder")).toBe("you@example.com");
});

test("password field has correct type", () => {
  render(<SignInForm />);
  const password = screen.getByLabelText("Password");
  expect(password.getAttribute("type")).toBe("password");
});

test("calls signIn with email and password on submit", async () => {
  render(<SignInForm />);

  await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "password123");
  fireEvent.submit(screen.getByRole("button", { name: "Sign In" }).closest("form")!);

  await waitFor(() => {
    expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password123");
  });
});

test("calls onSuccess when sign-in succeeds", async () => {
  const onSuccess = vi.fn();
  mockSignIn.mockResolvedValue({ success: true });
  render(<SignInForm onSuccess={onSuccess} />);

  await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "password123");
  fireEvent.submit(screen.getByRole("button", { name: "Sign In" }).closest("form")!);

  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalled();
  });
});

test("displays error message when sign-in fails", async () => {
  mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });
  render(<SignInForm />);

  await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "wrong");
  fireEvent.submit(screen.getByRole("button", { name: "Sign In" }).closest("form")!);

  await waitFor(() => {
    expect(screen.getByText("Invalid credentials")).toBeDefined();
  });
});

test("displays fallback error when no error message provided", async () => {
  mockSignIn.mockResolvedValue({ success: false });
  render(<SignInForm />);

  await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "wrong");
  fireEvent.submit(screen.getByRole("button", { name: "Sign In" }).closest("form")!);

  await waitFor(() => {
    expect(screen.getByText("Failed to sign in")).toBeDefined();
  });
});

test("does not call onSuccess when sign-in fails", async () => {
  const onSuccess = vi.fn();
  mockSignIn.mockResolvedValue({ success: false, error: "Bad" });
  render(<SignInForm onSuccess={onSuccess} />);

  await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "wrong");
  fireEvent.submit(screen.getByRole("button", { name: "Sign In" }).closest("form")!);

  await waitFor(() => {
    expect(screen.getByText("Bad")).toBeDefined();
  });
  expect(onSuccess).not.toHaveBeenCalled();
});

test("clears previous error on new submit", async () => {
  mockSignIn.mockResolvedValueOnce({ success: false, error: "First error" });
  mockSignIn.mockResolvedValueOnce({ success: true });
  render(<SignInForm />);

  await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "wrong");
  fireEvent.submit(screen.getByRole("button", { name: "Sign In" }).closest("form")!);

  await waitFor(() => {
    expect(screen.getByText("First error")).toBeDefined();
  });

  fireEvent.submit(screen.getByRole("button", { name: "Sign In" }).closest("form")!);

  await waitFor(() => {
    expect(screen.queryByText("First error")).toBeNull();
  });
});

test("disables inputs when loading", () => {
  mockIsLoading = true;
  // Need to re-mock to pick up new value
  render(<SignInForm />);
  expect(screen.getByLabelText("Email")).toHaveProperty("disabled", true);
  expect(screen.getByLabelText("Password")).toHaveProperty("disabled", true);
});

test("shows loading text on button when loading", () => {
  mockIsLoading = true;
  render(<SignInForm />);
  expect(screen.getByRole("button", { name: "Signing in..." })).toBeDefined();
});

test("disables submit button when loading", () => {
  mockIsLoading = true;
  render(<SignInForm />);
  expect(screen.getByRole("button", { name: "Signing in..." })).toHaveProperty("disabled", true);
});

test("works without onSuccess prop", async () => {
  mockSignIn.mockResolvedValue({ success: true });
  render(<SignInForm />);

  await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "pass1234");
  fireEvent.submit(screen.getByRole("button", { name: "Sign In" }).closest("form")!);

  await waitFor(() => {
    expect(mockSignIn).toHaveBeenCalled();
  });
  // Should not throw
});
