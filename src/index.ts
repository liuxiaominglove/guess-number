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
}

export async function start(options: StartOptions): Promise<void> {
  const highScore = await loadScore(options.scorePath);

  const { attempts, cheatDetected, timedOut } = await runGame(
    { rng: options.rng, highScore },
    options.output,
    options.input
  );

  if (!cheatDetected && !timedOut) {
    await saveScore(attempts, options.scorePath);
  }
}

async function main(): Promise<void> {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    await start({
      input: async () => rl.question("Your guess: "),
      output: (msg) => console.log(msg),
      scorePath: "score.json",
    });
  } finally {
    rl.close();
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch(console.error);
}
