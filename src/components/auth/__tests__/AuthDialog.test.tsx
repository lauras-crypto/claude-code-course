import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { AuthDialog } from "@/components/auth/AuthDialog";

// Mock child forms
vi.mock("@/components/auth/SignInForm", () => ({
  SignInForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="sign-in-form">
      <button onClick={onSuccess}>Mock Sign In</button>
    </div>
  ),
}));

vi.mock("@/components/auth/SignUpForm", () => ({
  SignUpForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="sign-up-form">
      <button onClick={onSuccess}>Mock Sign Up</button>
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

test("renders sign-in mode by default", () => {
  render(
    <AuthDialog open={true} onOpenChange={vi.fn()} />
  );
  expect(screen.getByText("Welcome back")).toBeDefined();
  expect(screen.getByText("Sign in to your account to continue")).toBeDefined();
  expect(screen.getByTestId("sign-in-form")).toBeDefined();
});

test("renders sign-up mode when defaultMode is signup", () => {
  render(
    <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />
  );
  expect(screen.getByText("Create an account")).toBeDefined();
  expect(screen.getByText("Sign up to start creating AI-powered React components")).toBeDefined();
  expect(screen.getByTestId("sign-up-form")).toBeDefined();
});

test("switches from sign-in to sign-up mode", () => {
  render(
    <AuthDialog open={true} onOpenChange={vi.fn()} />
  );
  expect(screen.getByTestId("sign-in-form")).toBeDefined();

  const switchButton = screen.getByText("Sign up");
  fireEvent.click(switchButton);

  expect(screen.getByTestId("sign-up-form")).toBeDefined();
  expect(screen.getByText("Create an account")).toBeDefined();
});

test("switches from sign-up to sign-in mode", () => {
  render(
    <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />
  );
  expect(screen.getByTestId("sign-up-form")).toBeDefined();

  const switchButton = screen.getByText("Sign in");
  fireEvent.click(switchButton);

  expect(screen.getByTestId("sign-in-form")).toBeDefined();
  expect(screen.getByText("Welcome back")).toBeDefined();
});

test("calls onOpenChange(false) when form succeeds", () => {
  const onOpenChange = vi.fn();
  render(
    <AuthDialog open={true} onOpenChange={onOpenChange} />
  );
  const successBtn = screen.getByText("Mock Sign In");
  fireEvent.click(successBtn);
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test("updates mode when defaultMode prop changes", () => {
  const { rerender } = render(
    <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signin" />
  );
  expect(screen.getByTestId("sign-in-form")).toBeDefined();

  rerender(
    <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />
  );
  expect(screen.getByTestId("sign-up-form")).toBeDefined();
});

test("does not render content when closed", () => {
  render(
    <AuthDialog open={false} onOpenChange={vi.fn()} />
  );
  expect(screen.queryByText("Welcome back")).toBeNull();
});

test("shows toggle text for sign-in mode", () => {
  render(
    <AuthDialog open={true} onOpenChange={vi.fn()} />
  );
  expect(screen.getByText(/Don't have an account/)).toBeDefined();
});

test("shows toggle text for sign-up mode", () => {
  render(
    <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />
  );
  expect(screen.getByText(/Already have an account/)).toBeDefined();
});
