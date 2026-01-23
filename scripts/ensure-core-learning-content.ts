import { ensureCoreLearningContent } from "../server/services/core-learning-content.js";

async function main() {
  console.log("🧭 Ensuring core learning content is present...");
  const result = await ensureCoreLearningContent({ enforceCounts: true });
  console.log("\n📊 Core Content Restore Summary:");
  console.log(`   Tracks restored: ${result.restoredTracks.length}`);
  if (result.restoredTracks.length > 0) {
    console.log(`   Restored slugs: ${result.restoredTracks.join(", ")}`);
  }
  console.log(`   Quizzes ensured: ${result.quizCount}`);
  console.log("✅ Core learning content check complete.");
}

main().catch((error) => {
  console.error("❌ Core learning content check failed:", error);
  process.exit(1);
});
