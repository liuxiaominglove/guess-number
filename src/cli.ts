import { newGame, guess, InvalidGuessError } from "./engine";

class TimeoutError extends Error {
  constructor() {
    super("Timed out");
    this.name = "TimeoutError";
  }
}

export interface RunGameOptions {
  rng?: () => number;
  highScore?: number | null;
  timeLimitSeconds?: number;
}

export function parseInput(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isInteger(n)) return null;
  return n;
}

export async function runGame(
  options: RunGameOptions,
  output: (msg: string) => void,
  getInput: () => Promise<string>
): Promise<{ attempts: number; cheatDetected: boolean; timedOut: boolean }> {
  const game = newGame(options.rng, options.timeLimitSeconds ?? 30);

  output("Welcome to Guess Number!");
  output("I have picked a number between 1 and 100. Can you guess it?");
  output("");

  const highScore = options.highScore ?? null;
  if (highScore !== null) {
    output(`Current high score: ${highScore} attempt${highScore === 1 ? "" : "s"}`);
  }

  const elapsed = () => ((Date.now() - game.startedAt) / 1000).toFixed(1);

  const handleTimeout = () => {
    output(`Time's up! You lose. (${elapsed()} seconds)`);
    if (highScore !== null) {
      output(`High score: ${highScore}`);
    }
    return { attempts: game.attempts, cheatDetected: game.cheatDetected, timedOut: true as const };
  };

  const inputWithTimeout = (remainingMs: number) =>
    Promise.race([
      getInput(),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new TimeoutError()), remainingMs)
      ),
    ]);

  while (!game.isOver) {
    const remainingMs = game.deadline - Date.now();
    if (remainingMs <= 0) {
      return handleTimeout();
    }

    try {
      const line = await inputWithTimeout(remainingMs);
      const n = parseInput(line);

      if (n === null) {
        output("Invalid input. Please enter an integer.");
        continue;
      }

      try {
        const result = guess(game, n);

        if (result.result === "too-low") {
          output("Too low!");
        } else if (result.result === "too-high") {
          output("Too high!");
        } else {
          const attemptWord = game.attempts === 1 ? "attempt" : "attempts";
          output(`Correct! You won in ${game.attempts} ${attemptWord}! (${elapsed()} seconds)`);

          if (game.cheatDetected) {
            output("Cheating detected! Score not saved.");
          } else {
            if (highScore === null || game.attempts < highScore) {
              output("New high score!");
            } else if (highScore !== null) {
              output(`High score: ${highScore}`);
            }
          }
        }
      } catch (e) {
        if (e instanceof InvalidGuessError) {
          output("Guess must be an integer between 1 and 100.");
        } else {
          throw e;
        }
      }
    } catch (e) {
      if (e instanceof TimeoutError) {
        return handleTimeout();
      }
      throw e;
    }
  }

  return { attempts: game.attempts, cheatDetected: game.cheatDetected, timedOut: false };
}
