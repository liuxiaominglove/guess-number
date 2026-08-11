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

describe("elapsed time in messages", () => {
  it("should include elapsed time in win message", async () => {
    const outputs: string[] = [];

    await runGame(
      { rng: () => 0.49, highScore: null },
      (msg) => outputs.push(msg),
      async () => "50"
    );

    const winMsg = outputs.find((m) => m.includes("Correct!"));
    expect(winMsg).toBeDefined();
    expect(winMsg).toMatch(/\d+ seconds/);
  });

  it("should include elapsed time in timeout message", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "Date"] });
    vi.setSystemTime(0);

    const outputs: string[] = [];
    const gamePromise = runGame(
      { rng: () => 0.49, timeLimitSeconds: 1, highScore: null },
      (msg) => outputs.push(msg),
      async () => new Promise<string>(() => {})
    );

    await vi.advanceTimersByTimeAsync(1000);
    await gamePromise;

    const timeoutMsg = outputs.find((m) => m.includes("Time's up"));
    expect(timeoutMsg).toBeDefined();
    expect(timeoutMsg).toMatch(/\d+ seconds/);

    vi.useRealTimers();
  });
});

describe("high score display on game end", () => {
  it("should show high score when player does not beat it", async () => {
    const outputs: string[] = [];
    const inputs = ["30", "40", "50"];

    await runGame(
      { rng: () => 0.49, highScore: 1 },
      (msg) => outputs.push(msg),
      async () => inputs.shift() ?? "0"
    );

    expect(outputs.some((m) => m.includes("High score: 1"))).toBe(true);
  });

  it("should show new high score but not old high score when beaten", async () => {
    const outputs: string[] = [];

    await runGame(
      { rng: () => 0.49, highScore: 10 },
      (msg) => outputs.push(msg),
      async () => "50"
    );

    expect(outputs.some((m) => m.includes("New high score!"))).toBe(true);
    expect(outputs.some((m) => m.includes("High score:"))).toBe(false);
  });

  it("should not show high score when no history", async () => {
    const outputs: string[] = [];

    await runGame(
      { rng: () => 0.49, highScore: null },
      (msg) => outputs.push(msg),
      async () => "50"
    );

    expect(outputs.some((m) => m.includes("High score:"))).toBe(false);
  });

  it("should show high score on timeout", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "Date"] });
    vi.setSystemTime(0);

    const outputs: string[] = [];
    const gamePromise = runGame(
      { rng: () => 0.49, timeLimitSeconds: 1, highScore: 3 },
      (msg) => outputs.push(msg),
      async () => new Promise<string>(() => {})
    );

    await vi.advanceTimersByTimeAsync(1000);
    await gamePromise;

    expect(outputs.some((m) => m.includes("High score: 3"))).toBe(true);

    vi.useRealTimers();
  });

  it("should not show high score when cheating detected", async () => {
    const outputs: string[] = [];
    const inputs = ["80", "90", "50"];

    await runGame(
      { rng: () => 0.49, highScore: 1 },
      (msg) => outputs.push(msg),
      async () => inputs.shift() ?? "0"
    );

    expect(outputs.some((m) => m.includes("Cheating detected"))).toBe(true);
    expect(outputs.some((m) => m.includes("High score:"))).toBe(false);
  });
});
