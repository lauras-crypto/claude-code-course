import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { MockLanguageModel, getLanguageModel } from "@/lib/provider";

// Mock @ai-sdk/anthropic
vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn((model: string) => ({ provider: "anthropic", modelId: model })),
}));

// extractUserPrompt tests
test("MockLanguageModel has correct metadata", () => {
  const model = new MockLanguageModel("test-model");
  expect(model.specificationVersion).toBe("v1");
  expect(model.provider).toBe("mock");
  expect(model.modelId).toBe("test-model");
  expect(model.defaultObjectGenerationMode).toBe("tool");
});

test("doGenerate returns text and tool calls for initial message", async () => {
  const model = new MockLanguageModel("test");
  const result = await model.doGenerate({
    prompt: [
      { role: "user", content: [{ type: "text", text: "make a counter" }] },
    ],
    mode: { type: "regular" },
    inputFormat: "messages",
  } as any);

  expect(result.text).toBeTruthy();
  expect(result.toolCalls.length).toBeGreaterThan(0);
  expect(result.toolCalls[0].toolName).toBe("str_replace_editor");
  expect(result.usage.promptTokens).toBeDefined();
  expect(result.usage.completionTokens).toBeDefined();
});

test("doGenerate detects form component from prompt", async () => {
  const model = new MockLanguageModel("test");
  const result = await model.doGenerate({
    prompt: [
      { role: "user", content: [{ type: "text", text: "create a contact form" }] },
    ],
    mode: { type: "regular" },
    inputFormat: "messages",
  } as any);

  const args = JSON.parse(result.toolCalls[0].args);
  expect(args.path).toBe("/App.jsx");
  expect(args.file_text).toContain("ContactForm");
});

test("doGenerate detects card component from prompt", async () => {
  const model = new MockLanguageModel("test");
  const result = await model.doGenerate({
    prompt: [
      { role: "user", content: [{ type: "text", text: "build a card component" }] },
    ],
    mode: { type: "regular" },
    inputFormat: "messages",
  } as any);

  const args = JSON.parse(result.toolCalls[0].args);
  expect(args.file_text).toContain("Card");
});

test("doStream returns a readable stream", async () => {
  const model = new MockLanguageModel("test");
  const result = await model.doStream({
    prompt: [
      { role: "user", content: [{ type: "text", text: "make a counter" }] },
    ],
    mode: { type: "regular" },
    inputFormat: "messages",
  } as any);

  expect(result.stream).toBeInstanceOf(ReadableStream);
  expect(result.warnings).toEqual([]);

  // Read the stream to verify it emits events
  const reader = result.stream.getReader();
  const parts: any[] = [];
  let done = false;
  while (!done) {
    const { value, done: d } = await reader.read();
    if (d) {
      done = true;
    } else {
      parts.push(value);
    }
  }

  const types = parts.map((p) => p.type);
  expect(types).toContain("text-delta");
  expect(types).toContain("tool-call");
  expect(types).toContain("finish");
});

test("doGenerate with tool messages progresses through steps", async () => {
  const model = new MockLanguageModel("test");

  // Step with 1 tool message -> creates component file
  const result = await model.doGenerate({
    prompt: [
      { role: "user", content: [{ type: "text", text: "make a counter" }] },
      { role: "tool", content: [{ type: "tool-result", toolCallId: "1", result: "ok" }] },
    ],
    mode: { type: "regular" },
    inputFormat: "messages",
  } as any);

  const args = JSON.parse(result.toolCalls[0].args);
  expect(args.command).toBe("create");
  expect(args.path).toBe("/components/Counter.jsx");
});

test(
  "doGenerate with 3+ tool messages returns final summary without tool calls",
  async () => {
    const model = new MockLanguageModel("test");
    const result = await model.doGenerate({
      prompt: [
        { role: "user", content: [{ type: "text", text: "make a counter" }] },
        { role: "tool", content: [{ type: "tool-result", toolCallId: "1", result: "ok" }] },
        { role: "tool", content: [{ type: "tool-result", toolCallId: "2", result: "ok" }] },
        { role: "tool", content: [{ type: "tool-result", toolCallId: "3", result: "ok" }] },
      ],
      mode: { type: "regular" },
      inputFormat: "messages",
    } as any);

    expect(result.text).toContain("Counter");
    expect(result.toolCalls).toHaveLength(0);
    expect(result.finishReason).toBe("stop");
  },
  15000
);

// getLanguageModel
test("getLanguageModel returns MockLanguageModel when no API key", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;

  const model = getLanguageModel();
  expect(model).toBeInstanceOf(MockLanguageModel);

  process.env.ANTHROPIC_API_KEY = originalKey;
});

test("getLanguageModel returns MockLanguageModel for empty API key", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "   ";

  const model = getLanguageModel();
  expect(model).toBeInstanceOf(MockLanguageModel);

  process.env.ANTHROPIC_API_KEY = originalKey;
});

test("getLanguageModel returns anthropic model when API key is set", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";

  const model = getLanguageModel();
  expect(model).not.toBeInstanceOf(MockLanguageModel);

  process.env.ANTHROPIC_API_KEY = originalKey;
});

// Edge cases
test("extractUserPrompt handles empty messages array", async () => {
  const model = new MockLanguageModel("test");
  const result = await model.doGenerate({
    prompt: [],
    mode: { type: "regular" },
    inputFormat: "messages",
  } as any);
  // Should default to counter component when no user prompt
  expect(result).toBeDefined();
  expect(result.toolCalls.length).toBeGreaterThan(0);
});

test("extractUserPrompt handles string content", async () => {
  const model = new MockLanguageModel("test");
  const result = await model.doGenerate({
    prompt: [
      { role: "user", content: "make a form" },
    ],
    mode: { type: "regular" },
    inputFormat: "messages",
  } as any);
  const args = JSON.parse(result.toolCalls[0].args);
  expect(args.file_text).toContain("ContactForm");
});

test("extractUserPrompt uses last user message", async () => {
  const model = new MockLanguageModel("test");
  const result = await model.doGenerate({
    prompt: [
      { role: "user", content: [{ type: "text", text: "make a counter" }] },
      { role: "assistant", content: [{ type: "text", text: "ok" }] },
      { role: "user", content: [{ type: "text", text: "make a card" }] },
    ],
    mode: { type: "regular" },
    inputFormat: "messages",
  } as any);
  const args = JSON.parse(result.toolCalls[0].args);
  expect(args.file_text).toContain("Card");
});

test("doGenerate step 2 uses str_replace command", async () => {
  const model = new MockLanguageModel("test");
  const result = await model.doGenerate({
    prompt: [
      { role: "user", content: [{ type: "text", text: "make a counter" }] },
      { role: "tool", content: [{ type: "tool-result", toolCallId: "1", result: "ok" }] },
      { role: "tool", content: [{ type: "tool-result", toolCallId: "2", result: "ok" }] },
    ],
    mode: { type: "regular" },
    inputFormat: "messages",
  } as any);
  const args = JSON.parse(result.toolCalls[0].args);
  expect(args.command).toBe("str_replace");
});

test("doGenerate rawCall includes prompt and settings", async () => {
  const model = new MockLanguageModel("test");
  const result = await model.doGenerate({
    prompt: [
      { role: "user", content: [{ type: "text", text: "counter" }] },
    ],
    mode: { type: "regular" },
    inputFormat: "messages",
    maxTokens: 1000,
    temperature: 0.5,
  } as any);
  expect(result.rawCall.rawPrompt).toBeDefined();
  expect(result.rawCall.rawSettings).toBeDefined();
});

test("doStream rawCall and rawResponse are populated", async () => {
  const model = new MockLanguageModel("test");
  const result = await model.doStream({
    prompt: [
      { role: "user", content: [{ type: "text", text: "counter" }] },
    ],
    mode: { type: "regular" },
    inputFormat: "messages",
  } as any);
  expect(result.rawCall).toBeDefined();
  expect(result.rawResponse).toBeDefined();
  expect(result.rawResponse?.headers).toBeDefined();
});
