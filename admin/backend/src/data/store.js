import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { ENV } from "../config/env.js";
import { buildSeedData } from "./seed.js";
import { ensureRolesInState, migrateUsers } from "./defaultRoles.js";

let cache = null;
let writeQueue = Promise.resolve();

const defaultState = () => ({
  users: [],
  roles: [],
  courses: [],
  semesters: [],
  labs: [],
  creditTransactions: [],
  meta: {},
});

function normalizeState(state) {
  ensureRolesInState(state);
  migrateUsers(state);
  return state;
}

export async function loadStore() {
  if (cache) return cache;

  if (!existsSync(ENV.dataFile)) {
    await fs.mkdir(path.dirname(ENV.dataFile), { recursive: true }).catch(() => {});
    cache = normalizeState(await buildSeedData());
    await persistStore(cache);
    return cache;
  }

  const raw = await fs.readFile(ENV.dataFile, "utf8");
  const parsed = JSON.parse(raw);
  const hadRoles = Boolean(parsed.roles?.length);
  cache = normalizeState(parsed);
  if (!hadRoles) {
    await persistStore(cache);
  }
  return cache;
}

async function persistStore(data) {
  const dir = path.dirname(ENV.dataFile);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(ENV.dataFile, JSON.stringify(data, null, 2), "utf8");
}

export function getStore() {
  if (!cache) throw new Error("Store not loaded. Call loadStore() first.");
  return cache;
}

export async function updateStore(mutator) {
  writeQueue = writeQueue.then(async () => {
    const state = await loadStore();
    const next = await mutator(structuredClone(state));
    cache = next;
    await persistStore(next);
    return next;
  });
  return writeQueue;
}

export async function resetStoreFromSeed() {
  cache = await buildSeedData();
  await persistStore(cache);
  return cache;
}
