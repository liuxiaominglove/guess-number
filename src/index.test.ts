import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./score", () => ({
  loadScore: vi.fn(),
  saveScore: vi.fn(),
}));

import { start } from "./index";
import { loadScore, saveScore } from "./score";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("start", () => {
  it("should load high score before starting game", async () => {
    vi.mocked(loadScore).mockResolvedValue(5);

    await start({
      input: async () => "50",
      output: () => {},
      scorePath: "/tmp/test-score.json",
      rng: () => 0.49,
    });

    expect(loadScore).toHaveBeenCalledWith("/tmp/test-score.json");
  });

  it("should save score after a clean game", async () => {
    vi.mocked(loadScore).mockResolvedValue(null);

    await start({
      input: async () => "50",
      output: () => {},
      scorePath: "/tmp/test-score.json",
      rng: () => 0.49,
    });

    expect(saveScore).toHaveBeenCalledWith(1, "/tmp/test-score.json");
  });

  it("should NOT save score when player cheated", async () => {
    vi.mocked(loadScore).mockResolvedValue(null);
    const inputs = ["80", "90", "50"]; // target=50: 80 → too-high, 90 → cheat, 50 → correct
    const outputMessages: string[] = [];

    await start({
      input: async () => inputs.shift() ?? "50",
      output: (msg) => outputMessages.push(msg),
      scorePath: "/tmp/test-score.json",
      rng: () => 0.49,
    });

    expect(saveScore).not.toHaveBeenCalled();
    expect(outputMessages.some((m) => m.includes("Cheating detected"))).toBe(
      true
    );
  });

  it("should pass high score to game for display", async () => {
    vi.mocked(loadScore).mockResolvedValue(3);
    const outputMessages: string[] = [];

    await start({
      input: async () => "50",
      output: (msg) => outputMessages.push(msg),
      scorePath: "/tmp/test-score.json",
      rng: () => 0.49,
    });

    expect(outputMessages.some((m) => m.includes("3 attempts"))).toBe(true);
  });

  it("should NOT save score when game timed out", async () => {
    vi.mocked(loadScore).mockResolvedValue(null);
    vi.useFakeTimers({ toFake: ["setTimeout", "Date"] });
    vi.setSystemTime(0);

    const startPromise = start({
      input: async () => new Promise<string>(() => {}),
      output: () => {},
      scorePath: "/tmp/test-score.json",
      rng: () => 0.49,
    });

    await vi.advanceTimersByTimeAsync(31000);
    await startPromise;

    expect(saveScore).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("should save score when game won within time limit", async () => {
    vi.mocked(loadScore).mockResolvedValue(null);

    await start({
      input: async () => "50",
      output: () => {},
      scorePath: "/tmp/test-score.json",
      rng: () => 0.49,
    });

    expect(saveScore).toHaveBeenCalledWith(1, "/tmp/test-score.json");
  });
});
