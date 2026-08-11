import { readFile, writeFile } from "node:fs/promises";

interface ScoreData {
  best: number;
}

export async function loadScore(
  filePath: string
): Promise<number | null> {
  try {
    const raw = await readFile(filePath, "utf-8");
    const data: ScoreData = JSON.parse(raw);
    return data.best;
  } catch {
    return null;
  }
}

export async function saveScore(
  attempts: number,
  filePath: string
): Promise<boolean> {
  const current = await loadScore(filePath);
  if (current !== null && current <= attempts) {
    return false;
  }

  const data: ScoreData = { best: attempts };
  await writeFile(filePath, JSON.stringify(data), "utf-8");
  return true;
}
