import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const distributionRoot = path.resolve(toolsDirectory,
    "../entry/src/main/resources/rawfile/weavecode");
const manifestPath = path.join(distributionRoot, "cacheManifest.json");
const changedPaths = [
    "appConfig.js",
    "brackets.js",
    "config.json",
    "help/HelpCommandHandlers.js",
    "legal/LEGAL_RELEASE_CHECKLIST.md",
    "legal/UPSTREAM.md",
    "index.html",
    "weave/account-vip-i18n.js",
    "weave/iap-vip.css",
    "weave/iap-vip.js"
];

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
for (const relativePath of changedPaths) {
    const bytes = await readFile(path.join(distributionRoot, ...relativePath.split("/")));
    manifest[relativePath] = createHash("sha256").update(bytes).digest("hex");
}

const ordered = Object.fromEntries(Object.entries(manifest).sort(([left], [right]) =>
    left.localeCompare(right, "en")));
await writeFile(manifestPath, `${JSON.stringify(ordered, null, 2)}\n`, "utf8");
console.log(`Updated ${changedPaths.length} cache-manifest entries.`);
