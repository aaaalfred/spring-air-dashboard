import net from "node:net";
import { spawn } from "node:child_process";
import path from "node:path";

const preferredPorts = [3001, 3002, 3003, 3010, 3100];

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, "::");
  });
}

async function findAvailablePort() {
  for (const port of preferredPorts) {
    if (await canListen(port)) {
      return port;
    }
  }

  let port = 3200;
  while (port < 3300) {
    if (await canListen(port)) {
      return port;
    }
    port += 1;
  }

  throw new Error("No se encontro un puerto disponible para next dev.");
}

const port = await findAvailablePort();
const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");

console.log(`Iniciando Next en http://localhost:${port}`);

const child = spawn(process.execPath, [nextBin, "dev", "-p", String(port)], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: String(port),
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
