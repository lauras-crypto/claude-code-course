import { test, expect } from "vitest";
import { cn } from "@/lib/utils";

test("merges class names", () => {
  expect(cn("foo", "bar")).toBe("foo bar");
});

test("handles conditional classes", () => {
  expect(cn("base", false && "hidden", "visible")).toBe("base visible");
});

test("handles undefined and null values", () => {
  expect(cn("base", undefined, null, "end")).toBe("base end");
});

test("handles empty string", () => {
  expect(cn("", "foo")).toBe("foo");
});

test("handles no arguments", () => {
  expect(cn()).toBe("");
});

test("deduplicates conflicting tailwind classes", () => {
  expect(cn("px-2", "px-4")).toBe("px-4");
});

test("merges tailwind variants correctly", () => {
  expect(cn("hover:bg-red-500", "hover:bg-blue-500")).toBe("hover:bg-blue-500");
});

test("handles array of classes", () => {
  expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
});

test("handles object syntax", () => {
  expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
});
