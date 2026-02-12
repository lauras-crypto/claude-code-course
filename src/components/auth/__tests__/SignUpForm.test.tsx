import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignUpForm } from "@/components/auth/SignUpForm";

const mockSignUp = vi.fn();
let mockIsLoading = false;

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    signUp: mockSignUp,
    isLoading: mockIsLoading,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockIsLoading = false;
  mockSignUp.mockResolvedValue({ success: true });
});

afterEach(() => {
  cleanup();
});

test("renders email, password, and confirm password fields", () => {
  render(<SignUpForm />);
  expect(screen.getByLabelText("Email")).toBeDefined();
  expect(screen.getByLabelText("Password")).toBeDefined();
  expect(screen.getByLabelText("Confirm Password")).toBeDefined();
});

test("renders submit button with correct text", () => {
  render(<SignUpForm />);
  expect(screen.getByRole("button", { name: "Sign Up" })).toBeDefined();
});

test("shows password requirement hint", () => {
  render(<SignUpForm />);
  expect(screen.getByText("Must be at least 8 characters long")).toBeDefined();
});

test("password field has minLength attribute", () => {
  render(<SignUpForm />);
  const password = screen.getByLabelText("Password");
  expect(password.getAttribute("minlength")).toBe("8");
});

test("calls signUp with email and password on submit", async () => {
  render(<SignUpForm />);
  await userEvent.type(screen.getByLabelText("Email"), "new@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "password123");
  await userEvent.type(screen.getByLabelText("Confirm Password"), "password123");
  fireEvent.submit(screen.getByRole("button", { name: "Sign Up" }).closest("form")!);

  await waitFor(() => {
    expect(mockSignUp).toHaveBeenCalledWith("new@example.com", "password123");
  });
});

test("shows error when passwords do not match", async () => {
  render(<SignUpForm />);
  await userEvent.type(screen.getByLabelText("Email"), "new@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "password123");
  await userEvent.type(screen.getByLabelText("Confirm Password"), "different");
  fireEvent.submit(screen.getByRole("button", { name: "Sign Up" }).closest("form")!);

  await waitFor(() => {
    expect(screen.getByText("Passwords do not match")).toBeDefined();
  });
  expect(mockSignUp).not.toHaveBeenCalled();
});

test("calls onSuccess when sign-up succeeds", async () => {
  const onSuccess = vi.fn();
  mockSignUp.mockResolvedValue({ success: true });
  render(<SignUpForm onSuccess={onSuccess} />);

  await userEvent.type(screen.getByLabelText("Email"), "new@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "password123");
  await userEvent.type(screen.getByLabelText("Confirm Password"), "password123");
  fireEvent.submit(screen.getByRole("button", { name: "Sign Up" }).closest("form")!);

  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalled();
  });
});

test("displays error when sign-up fails", async () => {
  mockSignUp.mockResolvedValue({ success: false, error: "Email already registered" });
  render(<SignUpForm />);

  await userEvent.type(screen.getByLabelText("Email"), "existing@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "password123");
  await userEvent.type(screen.getByLabelText("Confirm Password"), "password123");
  fireEvent.submit(screen.getByRole("button", { name: "Sign Up" }).closest("form")!);

  await waitFor(() => {
    expect(screen.getByText("Email already registered")).toBeDefined();
  });
});

test("displays fallback error when no error message provided", async () => {
  mockSignUp.mockResolvedValue({ success: false });
  render(<SignUpForm />);

  await userEvent.type(screen.getByLabelText("Email"), "new@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "password123");
  await userEvent.type(screen.getByLabelText("Confirm Password"), "password123");
  fireEvent.submit(screen.getByRole("button", { name: "Sign Up" }).closest("form")!);

  await waitFor(() => {
    expect(screen.getByText("Failed to sign up")).toBeDefined();
  });
});

test("does not call onSuccess when sign-up fails", async () => {
  const onSuccess = vi.fn();
  mockSignUp.mockResolvedValue({ success: false, error: "Error" });
  render(<SignUpForm onSuccess={onSuccess} />);

  await userEvent.type(screen.getByLabelText("Email"), "new@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "password123");
  await userEvent.type(screen.getByLabelText("Confirm Password"), "password123");
  fireEvent.submit(screen.getByRole("button", { name: "Sign Up" }).closest("form")!);

  await waitFor(() => {
    expect(screen.getByText("Error")).toBeDefined();
  });
  expect(onSuccess).not.toHaveBeenCalled();
});

test("clears error on new submission", async () => {
  mockSignUp.mockResolvedValueOnce({ success: false, error: "First error" });
  mockSignUp.mockResolvedValueOnce({ success: true });
  render(<SignUpForm />);

  await userEvent.type(screen.getByLabelText("Email"), "new@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "password123");
  await userEvent.type(screen.getByLabelText("Confirm Password"), "password123");
  fireEvent.submit(screen.getByRole("button", { name: "Sign Up" }).closest("form")!);

  await waitFor(() => {
    expect(screen.getByText("First error")).toBeDefined();
  });

  fireEvent.submit(screen.getByRole("button", { name: "Sign Up" }).closest("form")!);

  await waitFor(() => {
    expect(screen.queryByText("First error")).toBeNull();
  });
});

test("disables inputs when loading", () => {
  mockIsLoading = true;
  render(<SignUpForm />);
  expect(screen.getByLabelText("Email")).toHaveProperty("disabled", true);
  expect(screen.getByLabelText("Password")).toHaveProperty("disabled", true);
  expect(screen.getByLabelText("Confirm Password")).toHaveProperty("disabled", true);
});

test("shows loading text on button", () => {
  mockIsLoading = true;
  render(<SignUpForm />);
  expect(screen.getByRole("button", { name: "Creating account..." })).toBeDefined();
});

test("disables submit button when loading", () => {
  mockIsLoading = true;
  render(<SignUpForm />);
  expect(screen.getByRole("button", { name: "Creating account..." })).toHaveProperty("disabled", true);
});

test("works without onSuccess prop", async () => {
  mockSignUp.mockResolvedValue({ success: true });
  render(<SignUpForm />);

  await userEvent.type(screen.getByLabelText("Email"), "new@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "password123");
  await userEvent.type(screen.getByLabelText("Confirm Password"), "password123");
  fireEvent.submit(screen.getByRole("button", { name: "Sign Up" }).closest("form")!);

  await waitFor(() => {
    expect(mockSignUp).toHaveBeenCalled();
  });
});
