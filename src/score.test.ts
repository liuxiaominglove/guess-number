import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { rm } from "node:fs/promises";
import { loadScore, saveScore } from "./score";

const SCORE_PATH = "/tmp/guess-number-test-score.json";

beforeEach(async () => {
  try {
    await rm(SCORE_PATH);
  } catch {
    // file doesn't exist, that's fine
  }
});

afterEach(async () => {
  try {
    await rm(SCORE_PATH);
  } catch {
    // cleanup
  }
});

describe("loadScore", () => {
  it("should return null when no score file exists", async () => {
    const result = await loadScore(SCORE_PATH);
    expect(result).toBeNull();
  });
});

describe("saveScore", () => {
  it("should save score and loadScore reads it back", async () => {
    await saveScore(5, SCORE_PATH);
    const result = await loadScore(SCORE_PATH);
    expect(result).toBe(5);
  });

  it("should overwrite with a better (lower) score", async () => {
    await saveScore(10, SCORE_PATH);
    await saveScore(3, SCORE_PATH);
    const result = await loadScore(SCORE_PATH);
    expect(result).toBe(3);
  });

  it("should NOT overwrite with a worse (higher) score", async () => {
    await saveScore(3, SCORE_PATH);
    await saveScore(8, SCORE_PATH);
    const result = await loadScore(SCORE_PATH);
    expect(result).toBe(3);
  });

  it("should keep existing score when same score is saved", async () => {
    await saveScore(5, SCORE_PATH);
    await saveScore(5, SCORE_PATH);
    const result = await loadScore(SCORE_PATH);
    expect(result).toBe(5);
  });
});
