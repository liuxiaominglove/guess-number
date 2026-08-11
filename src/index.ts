import { runGame } from "./cli";
import { loadScore, saveScore } from "./score";
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { fileURLToPath } from "node:url";

export interface StartOptions {
  input: () => Promise<string>;
  output: (msg: string) => void;
  scorePath: string;
  rng?: () => number;
  playAgain?: boolean;
}

export async function start(options: StartOptions): Promise<void> {
  let currentHighScore: number | null = await loadScore(options.scorePath);

  while (true) {
    const { attempts, cheatDetected, timedOut } = await runGame(
      { rng: options.rng, highScore: currentHighScore },
      options.output,
      options.input
    );

    if (!cheatDetected && !timedOut) {
      const saved = await saveScore(attempts, options.scorePath);
      if (saved && (currentHighScore === null || attempts < currentHighScore)) {
        currentHighScore = attempts;
      }
    }

    if (!options.playAgain) return;

    while (true) {
      options.output("Play again? (y/n)");
      const answer = await options.input();
      const trimmed = answer.trim().toLowerCase();
      if (trimmed === "y") break;
      if (trimmed === "n") return;
    }
  }
}

async function main(): Promise<void> {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    await start({
      input: async () => rl.question("Your guess: "),
      output: (msg) => console.log(msg),
      scorePath: "score.json",
      playAgain: true,
    });
  } finally {
    rl.close();
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch(console.error);
}
