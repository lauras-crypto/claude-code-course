import { test, expect, beforeEach, vi } from "vitest";
import {
  setHasAnonWork,
  getHasAnonWork,
  getAnonWorkData,
  clearAnonWork,
} from "@/lib/anon-work-tracker";

// Mock sessionStorage
const mockStorage: Record<string, string> = {};
const sessionStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
};

beforeEach(() => {
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  vi.stubGlobal("sessionStorage", sessionStorageMock);
  vi.clearAllMocks();
});

// setHasAnonWork
test("setHasAnonWork stores data when messages exist", () => {
  const messages = [{ role: "user", content: "hello" }];
  const fileData = { "/": {} };
  setHasAnonWork(messages, fileData);
  expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
    "uigen_has_anon_work",
    "true"
  );
  expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
    "uigen_anon_data",
    JSON.stringify({ messages, fileSystemData: fileData })
  );
});

test("setHasAnonWork stores data when fileSystemData has more than root", () => {
  const messages: any[] = [];
  const fileData = { "/": {}, "/App.jsx": {} };
  setHasAnonWork(messages, fileData);
  expect(sessionStorageMock.setItem).toHaveBeenCalled();
});

test("setHasAnonWork does NOT store when no messages and only root in fileSystemData", () => {
  const messages: any[] = [];
  const fileData = { "/": {} };
  setHasAnonWork(messages, fileData);
  expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
});

// getHasAnonWork
test("getHasAnonWork returns true when flag is set", () => {
  mockStorage["uigen_has_anon_work"] = "true";
  expect(getHasAnonWork()).toBe(true);
});

test("getHasAnonWork returns false when flag is not set", () => {
  expect(getHasAnonWork()).toBe(false);
});

// getAnonWorkData
test("getAnonWorkData returns parsed data", () => {
  const data = { messages: [{ role: "user" }], fileSystemData: {} };
  mockStorage["uigen_anon_data"] = JSON.stringify(data);
  expect(getAnonWorkData()).toEqual(data);
});

test("getAnonWorkData returns null when no data stored", () => {
  expect(getAnonWorkData()).toBeNull();
});

test("getAnonWorkData returns null for invalid JSON", () => {
  mockStorage["uigen_anon_data"] = "not-json{{{";
  expect(getAnonWorkData()).toBeNull();
});

// clearAnonWork
test("clearAnonWork removes both storage keys", () => {
  mockStorage["uigen_has_anon_work"] = "true";
  mockStorage["uigen_anon_data"] = "{}";
  clearAnonWork();
  expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
    "uigen_has_anon_work"
  );
  expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
    "uigen_anon_data"
  );
});

// Edge cases
test("getHasAnonWork returns false for non-'true' values", () => {
  mockStorage["uigen_has_anon_work"] = "false";
  expect(getHasAnonWork()).toBe(false);
});

test("setHasAnonWork stores when empty messages but multiple files", () => {
  const messages: any[] = [];
  const fileData = { "/": {}, "/App.jsx": {}, "/styles.css": {} };
  setHasAnonWork(messages, fileData);
  expect(sessionStorageMock.setItem).toHaveBeenCalled();
});

test("setHasAnonWork does not store for empty fileSystemData object", () => {
  const messages: any[] = [];
  const fileData = {};
  setHasAnonWork(messages, fileData);
  expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
});

test("getAnonWorkData handles complex nested data", () => {
  const data = {
    messages: [
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi", toolInvocations: [{ id: "1" }] },
    ],
    fileSystemData: { "/App.jsx": { type: "file", content: "code" } },
  };
  mockStorage["uigen_anon_data"] = JSON.stringify(data);
  expect(getAnonWorkData()).toEqual(data);
});

test("clearAnonWork works when keys do not exist", () => {
  clearAnonWork();
  expect(sessionStorageMock.removeItem).toHaveBeenCalledTimes(2);
});
