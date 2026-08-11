import { describe, it, expect } from "vitest";
import {
  newGame,
  guess,
  InvalidGuessError,
  GameOverError,
  isTimedOut,
  type Game,
} from "./engine";

describe("newGame", () => {
  it("should generate target in range [1, 100]", () => {
    for (let i = 0; i < 1000; i++) {
      const game = newGame();
      expect(game.target).toBeGreaterThanOrEqual(1);
      expect(game.target).toBeLessThanOrEqual(100);
      expect(Number.isInteger(game.target)).toBe(true);
    }
  });

  it("should use custom RNG when provided", () => {
    const mockRng = () => 0.41;
    const game = newGame(mockRng);
    expect(game.target).toBe(42);
  });
});

describe("guess", () => {
  it("should return 'correct' when guess equals target", () => {
    const game = newGame(() => 0.49);
    const result = guess(game, 50);
    expect(result).toEqual({ result: "correct" });
  });

  it("should return 'too-low' when guess is below target", () => {
    const game = newGame(() => 0.49);
    const result = guess(game, 30);
    expect(result).toEqual({ result: "too-low" });
  });

  it("should return 'too-high' when guess is above target", () => {
    const game = newGame(() => 0.49);
    const result = guess(game, 80);
    expect(result).toEqual({ result: "too-high" });
  });

  it("should accept guess=1", () => {
    const game = newGame(() => 0);
    const result = guess(game, 1);
    expect(result).toEqual({ result: "correct" });
  });

  it("should accept guess=100", () => {
    const game = newGame(() => 0.99);
    const result = guess(game, 100);
    expect(result).toEqual({ result: "correct" });
  });

  it("should throw InvalidGuessError for non-number input", () => {
    const game = newGame();
    expect(() => guess(game, "abc" as unknown as number)).toThrow(
      InvalidGuessError
    );
  });

  it("should throw InvalidGuessError for guess < 1", () => {
    const game = newGame();
    expect(() => guess(game, 0)).toThrow(InvalidGuessError);
  });

  it("should throw InvalidGuessError for guess > 100", () => {
    const game = newGame();
    expect(() => guess(game, 101)).toThrow(InvalidGuessError);
  });

  it("should throw InvalidGuessError for non-integer guess", () => {
    const game = newGame();
    expect(() => guess(game, 50.5)).toThrow(InvalidGuessError);
  });
});

describe("cheat detection", () => {
  it("should NOT flag cheat when player follows 'too-low' hint and guesses higher", () => {
    const game = newGame(() => 0.49);
    guess(game, 30);
    expect(game.cheatDetected).toBe(false);
    guess(game, 40);
    expect(game.cheatDetected).toBe(false);
  });

  it("should flag cheat when player ignores 'too-low' hint and guesses same", () => {
    const game = newGame(() => 0.49);
    guess(game, 30);
    guess(game, 30);
    expect(game.cheatDetected).toBe(true);
  });

  it("should flag cheat when player ignores 'too-low' hint and guesses lower", () => {
    const game = newGame(() => 0.49);
    guess(game, 30);
    guess(game, 20);
    expect(game.cheatDetected).toBe(true);
  });

  it("should flag cheat when player ignores 'too-high' hint and guesses higher", () => {
    const game = newGame(() => 0.49);
    guess(game, 80);
    guess(game, 90);
    expect(game.cheatDetected).toBe(true);
  });

  it("should flag cheat when player ignores 'too-high' hint and guesses same", () => {
    const game = newGame(() => 0.49);
    guess(game, 80);
    guess(game, 80);
    expect(game.cheatDetected).toBe(true);
  });

  it("should NOT flag cheat on first guess (no previous hint)", () => {
    const game = newGame(() => 0.49);
    guess(game, 30);
    expect(game.cheatDetected).toBe(false);
  });
});

describe("game session", () => {
  it("should initialize attempts to 0 for new game", () => {
    const game = newGame();
    expect(game.attempts).toBe(0);
  });

  it("should increment attempts after each guess", () => {
    const game = newGame(() => 0.49);
    guess(game, 30);
    expect(game.attempts).toBe(1);
  });

  it("should track multiple attempts", () => {
    const game = newGame(() => 0.49);
    guess(game, 30);
    guess(game, 40);
    guess(game, 50);
    expect(game.attempts).toBe(3);
  });

  it("should throw GameOverError when guessing after correct", () => {
    const game = newGame(() => 0.49);
    guess(game, 50);
    expect(() => guess(game, 30)).toThrow(GameOverError);
  });

  it("should reset attempts and target on newGame", () => {
    const game = newGame(() => 0.49);
    guess(game, 30);
    guess(game, 40);
    guess(game, 50);
    expect(game.attempts).toBe(3);

    const newGameInstance = newGame(() => 0.3);
    expect(newGameInstance.attempts).toBe(0);
    expect(newGameInstance.target).not.toBe(game.target);
  });
});

describe("newGame with time limit", () => {
  it("should set deadline when timeLimitSeconds is provided", () => {
    const before = Date.now();
    const game = newGame(() => 0.49, 30);
    const after = Date.now();
    expect(game.deadline).toBeGreaterThanOrEqual(before + 30000);
    expect(game.deadline).toBeLessThanOrEqual(after + 30000);
  });

  it("should set startedAt when game is created", () => {
    const before = Date.now();
    const game = newGame(() => 0.49, 30);
    const after = Date.now();
    expect(game.startedAt).toBeGreaterThanOrEqual(before);
    expect(game.startedAt).toBeLessThanOrEqual(after);
  });

  it("should have no time limit when timeLimitSeconds is not provided", () => {
    const game = newGame(() => 0.49);
    expect(game.deadline).toBe(Infinity);
  });

  it("should have no time limit when 0 is provided", () => {
    const game = newGame(() => 0.49, 0);
    expect(game.deadline).toBe(Infinity);
  });

  it("should have no time limit when negative is provided", () => {
    const game = newGame(() => 0.49, -5);
    expect(game.deadline).toBe(Infinity);
  });
});

describe("isTimedOut", () => {
  const baseGame: Game = {
    target: 50,
    lastGuess: null,
    lastResult: null,
    cheatDetected: false,
    attempts: 0,
    isOver: false,
    startedAt: 0,
    deadline: 5000,
  };

  it("should return false when now is before deadline", () => {
    expect(isTimedOut(baseGame, 4999)).toBe(false);
  });

  it("should return true when now equals deadline", () => {
    expect(isTimedOut(baseGame, 5000)).toBe(true);
  });

  it("should return true when now is after deadline", () => {
    expect(isTimedOut(baseGame, 5001)).toBe(true);
  });

  it("should return false when no time limit (infinity deadline)", () => {
    const game = { ...baseGame, deadline: Infinity as number };
    expect(isTimedOut(game, 9999999999999)).toBe(false);
  });

  it("should use Date.now() when now is not provided", () => {
    const game = { ...baseGame, deadline: Date.now() + 60000 };
    expect(isTimedOut(game)).toBe(false);
  });
});

describe("guess with timeout", () => {
  it("should still process guess correctly when deadline has passed", () => {
    const game = newGame(() => 0.49, 30);
    (game as Game).deadline = 0;
    const result = guess(game, 50);
    expect(result).toEqual({ result: "correct" });
    expect(game.isOver).toBe(true);
  });
});
