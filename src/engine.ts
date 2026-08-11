export interface Game {
  target: number;
  lastGuess: number | null;
  lastResult: "too-low" | "too-high" | null;
  cheatDetected: boolean;
  attempts: number;
  isOver: boolean;
  startedAt: number;
  deadline: number;
}

export class InvalidGuessError extends Error {
  constructor(message = "Invalid guess") {
    super(message);
    this.name = "InvalidGuessError";
  }
}

export class GameOverError extends Error {
  constructor(message = "Game is already over") {
    super(message);
    this.name = "GameOverError";
  }
}

export function newGame(randomFn?: () => number, timeLimitSeconds?: number): Game {
  const rng = randomFn ?? Math.random;
  const target = Math.floor(rng() * 100) + 1;
  const now = Date.now();
  const limit = timeLimitSeconds && timeLimitSeconds > 0 ? timeLimitSeconds * 1000 : Infinity;
  return {
    target,
    lastGuess: null,
    lastResult: null,
    cheatDetected: false,
    attempts: 0,
    isOver: false,
    startedAt: now,
    deadline: now + limit,
  };
}

export function guess(
  game: Game,
  n: number
): { result: "correct" | "too-low" | "too-high" } {
  if (game.isOver) {
    throw new GameOverError();
  }

  if (!Number.isInteger(n) || n < 1 || n > 100) {
    throw new InvalidGuessError(`Guess must be an integer between 1 and 100, got ${n}`);
  }

  game.attempts++;

  if (game.lastResult !== null && game.lastGuess !== null) {
    if (game.lastResult === "too-low" && n <= game.lastGuess) {
      game.cheatDetected = true;
    }
    if (game.lastResult === "too-high" && n >= game.lastGuess) {
      game.cheatDetected = true;
    }
  }

  let result: "correct" | "too-low" | "too-high";
  if (n === game.target) {
    result = "correct";
    game.isOver = true;
  } else if (n < game.target) {
    result = "too-low";
  } else {
    result = "too-high";
  }

  if (result !== "correct") {
    game.lastGuess = n;
    game.lastResult = result;
  }

  return { result };
}

export function isTimedOut(game: Game, now?: number): boolean {
  const currentTime = now ?? Date.now();
  return currentTime >= game.deadline;
}
