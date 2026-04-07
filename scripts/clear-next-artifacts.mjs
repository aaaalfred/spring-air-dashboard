import { promises as fs } from "node:fs";
import path from "node:path";

const targets = [".next", ".next-cache"];

await Promise.all(
  targets.map((target) =>
    fs.rm(path.join(process.cwd(), target), { recursive: true, force: true }),
  ),
);
