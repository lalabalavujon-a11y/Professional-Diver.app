#!/usr/bin/env node

/**
 * Commit → Push → Wait for Railway → Purge Cloudflare cache
 *
 * Env vars (optional but recommended):
 *   RAILWAY_TOKEN         Railway API token
 *   RAILWAY_SERVICE_ID    Railway service ID to poll deployment status
 *   CLOUDFLARE_API_TOKEN  Cloudflare API token with Zone.Cache Purge
 *   CLOUDFLARE_ZONE_NAME  Domain to purge (default: professionaldiver.app)
 *
 * Usage:
 *   node scripts/commit-push-purge.mjs "chore: deploy"
 */

import { execSync, spawnSync } from "node:child_process";
import process from "node:process";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const run = (cmd, opts = {}) => {
  try {
    return execSync(cmd, { stdio: "pipe", encoding: "utf8", ...opts }).trim();
  } catch (error) {
    console.error(`❌ Command failed: ${cmd}`);
    if (error.stdout) console.error(error.stdout.toString());
    if (error.stderr) console.error(error.stderr.toString());
    process.exit(1);
  }
};

const hasStagedChanges = () => {
  try {
    execSync("git diff --cached --quiet", { stdio: "ignore" });
    return false; // exit code 0 => no changes
  } catch {
    return true; // exit code 1 => changes present
  }
};

const ensureChangesOrExit = () => {
  const status = run("git status --short");
  if (!status) {
    console.log("✅ No changes to commit. Skipping commit/push.");
    process.exit(0);
  }
};

const commitAndPush = (message) => {
  ensureChangesOrExit();

  console.log("🗂️ Staging changes...");
  run("git add -A");

  if (!hasStagedChanges()) {
    console.log("✅ No staged changes after add. Skipping commit/push.");
    process.exit(0);
  }

  console.log(`📝 Committing with message: "${message}"`);
  // SECURITY: Use spawnSync with array arguments to avoid shell injection vulnerabilities
  const result = spawnSync("git", ["commit", "-m", message], { 
    stdio: "pipe", 
    encoding: "utf8" 
  });
  if (result.status !== 0) {
    console.error("❌ Git commit failed");
    if (result.stderr) console.error(result.stderr);
    process.exit(1);
  }

  const branch = run("git rev-parse --abbrev-ref HEAD");
  console.log(`⬆️ Pushing to origin/${branch}...`);
  run(`git push origin ${branch}`, { stdio: "inherit" });
};

const pollRailway = async () => {
  const token = process.env.RAILWAY_TOKEN;
  const serviceId = process.env.RAILWAY_SERVICE_ID;

  if (!token || !serviceId) {
    console.log("⚠️ RAILWAY_TOKEN or RAILWAY_SERVICE_ID not set; waiting 180s as fallback.");
    await sleep(180_000);
    return;
  }

  console.log("⏳ Polling Railway for deployment status...");
  const maxAttempts = 30;
  const delayMs = 10_000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch("https://backboard.railway.app/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query:
            "query($serviceId:String!){ service(id:$serviceId){ deployments(first:1){ edges{ node{ id status updatedAt } } } } }",
          variables: { serviceId },
        }),
      });

      const json = await response.json();
      const status =
        json?.data?.service?.deployments?.edges?.[0]?.node?.status ?? "";

      if (status) {
        console.log(`🔎 Railway deployment status: ${status}`);
        if (["SUCCESS", "SUCCEEDED", "COMPLETED", "ACTIVE", "DEPLOYED"].includes(status)) {
          console.log("✅ Railway deployment complete.");
          return;
        }
        if (["FAILED", "FAILURE"].includes(status)) {
          throw new Error(`Railway deployment failed. Response: ${JSON.stringify(json)}`);
        }
      } else {
        console.log(
          `ℹ️ No deployment status found (attempt ${attempt}/${maxAttempts}). Response: ${JSON.stringify(
            json
          )}`
        );
      }
    } catch (error) {
      console.log(`⚠️ Error polling Railway (attempt ${attempt}/${maxAttempts}): ${error.message}`);
    }

    if (attempt < maxAttempts) {
      await sleep(delayMs);
    }
  }

  throw new Error("Timed out waiting for Railway deployment to finish.");
};

const purgeCloudflare = async () => {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const zoneName = process.env.CLOUDFLARE_ZONE_NAME || "professionaldiver.app";

  if (!apiToken) {
    throw new Error("CLOUDFLARE_API_TOKEN is required to purge cache.");
  }

  console.log(`🌐 Looking up Cloudflare Zone ID for ${zoneName}...`);
  const zoneResp = await fetch(`https://api.cloudflare.com/client/v4/zones?name=${zoneName}`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
  });
  const zoneJson = await zoneResp.json();
  if (!zoneJson.success || !zoneJson.result?.length) {
    throw new Error(`Failed to find zone "${zoneName}". Response: ${JSON.stringify(zoneJson)}`);
  }

  const zoneId = zoneJson.result[0].id;
  console.log(`✅ Found Zone ID: ${zoneId}`);

  console.log("🧹 Purging Cloudflare cache (purge_everything=true)...");
  const purgeResp = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ purge_everything: true }),
    }
  );

  const purgeJson = await purgeResp.json();
  if (!purgeJson.success) {
    throw new Error(`Cloudflare purge failed: ${JSON.stringify(purgeJson)}`);
  }

  console.log("✅ Cloudflare cache purged successfully.");
};

const main = async () => {
  const message = process.argv.slice(2).join(" ").trim() || "chore: deploy";

  commitAndPush(message);
  await pollRailway();
  await purgeCloudflare();

  console.log("🎉 Commit → Push → Deploy → Purge complete.");
};

main().catch((error) => {
  console.error(`❌ Deployment helper failed: ${error.message}`);
  process.exit(1);
});

