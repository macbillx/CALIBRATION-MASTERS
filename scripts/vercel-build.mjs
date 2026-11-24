import { spawnSync } from "node:child_process";

const cli = (packagePath, args) => {
  const result = spawnSync(process.execPath, [packagePath, ...args], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};

if (process.env.VERCEL_ENV === "production") {
  cli("node_modules/prisma/build/index.js", ["migrate", "deploy"]);
}

cli("node_modules/prisma/build/index.js", ["generate"]);
cli("node_modules/next/dist/bin/next", ["build"]);
