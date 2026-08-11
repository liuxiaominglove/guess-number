import { describe, it, expect, vi } from "vitest";
import { parseInput, runGame } from "./cli";

describe("parseInput", () => {
  it("should parse valid integer string", () => {
    expect(parseInput("42")).toBe(42);
  });

  it("should trim whitespace before parsing", () => {
    expect(parseInput("  42  ")).toBe(42);
  });

  it("should return null for non-numeric string", () => {
    expect(parseInput("hello")).toBeNull();
  });

  it("should return null for empty string", () => {
    expect(parseInput("")).toBeNull();
  });

  it("should return null for floating point string", () => {
    expect(parseInput("50.5")).toBeNull();
  });
});

describe("runGame", () => {
  it("should play a correct guess on first try", async () => {
    const inputs = ["50"];
    const outputs: string[] = [];

    await runGame(
      { rng: () => 0.49 },
      (msg) => outputs.push(msg),
      async () => inputs.shift() ?? "0"
    );

    expect(outputs.some((m) => m.includes("Correct!"))).toBe(true);
    expect(outputs.some((m) => m.includes("1 attempt"))).toBe(true);
  });

  it("should give hints for wrong guesses", async () => {
    const inputs = ["30", "50"]; // target=50
    const outputs: string[] = [];

    await runGame(
      { rng: () => 0.49 },
      (msg) => outputs.push(msg),
      async () => inputs.shift() ?? "0"
    );

    expect(outputs.some((m) => m.includes("Too low!"))).toBe(true);
    expect(outputs.some((m) => m.includes("Correct!"))).toBe(true);
  });

  it("should handle invalid input without crashing", async () => {
    const inputs = ["hello", "50"];
    const outputs: string[] = [];

    await runGame(
      { rng: () => 0.49 },
      (msg) => outputs.push(msg),
      async () => inputs.shift() ?? "0"
    );

    expect(outputs.some((m) => m.toLowerCase().includes("invalid"))).toBe(
      true
    );
    expect(outputs.some((m) => m.includes("Correct!"))).toBe(true);
  });
});

describe("runGame with time limit", () => {
  it("should win normally within time limit", async () => {
    const outputs: string[] = [];

    const result = await runGame(
      { rng: () => 0.49, timeLimitSeconds: 30 },
      (msg) => outputs.push(msg),
      async () => "50"
    );

    expect(result.timedOut).toBe(false);
    expect(outputs.some((m) => m.includes("Correct!"))).toBe(true);
  });

  it("should return timedOut when time limit expires with no correct guess", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "Date"] });
    vi.setSystemTime(0);

    const outputs: string[] = [];
    const gamePromise = runGame(
      { rng: () => 0.49, timeLimitSeconds: 5 },
      (msg) => outputs.push(msg),
      async () => new Promise<string>(() => {})
    );

    await vi.advanceTimersByTimeAsync(5000);
    const result = await gamePromise;

    expect(result.timedOut).toBe(true);
    expect(outputs.some((m) => m.includes("Time's up"))).toBe(true);

    vi.useRealTimers();
  });

  it("should return timedOut when deadline passes between iterations", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "Date"] });
    vi.setSystemTime(0);

    // target = 50, wrong guess = 30
    const outputs: string[] = [];
    const gamePromise = runGame(
      { rng: () => 0.49, timeLimitSeconds: 5 },
      (msg) => outputs.push(msg),
      async () => {
        await vi.advanceTimersByTimeAsync(5001);
        return "30";
      }
    );

    const result = await gamePromise;

    expect(result.timedOut).toBe(true);
    expect(outputs.some((m) => m.includes("Time's up"))).toBe(true);

    vi.useRealTimers();
  });

  it("should output timeout message", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "Date"] });
    vi.setSystemTime(0);

    const outputs: string[] = [];
    const gamePromise = runGame(
      { rng: () => 0.49, timeLimitSeconds: 1 },
      (msg) => outputs.push(msg),
      async () => new Promise<string>(() => {})
    );

    await vi.advanceTimersByTimeAsync(1000);
    await gamePromise;

    expect(outputs.some((m) => m.includes("Time's up"))).toBe(true);

    vi.useRealTimers();
  });
});
