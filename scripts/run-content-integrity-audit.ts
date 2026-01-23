import { runContentIntegrityAudit } from "../server/services/content-integrity-service.js";

async function main() {
  console.log("🧪 Running content integrity audit...");
  const summary = await runContentIntegrityAudit({
    autoRepair: true,
    regenerateMedia: true,
    sendAlerts: true,
    trigger: "manual",
  });

  console.log("\n📊 Integrity Audit Summary:");
  console.log(`   OK: ${summary.ok ? "YES" : "NO"}`);
  console.log(`   Blocking issues: ${summary.blockingIssues}`);
  console.log(`   Warning issues: ${summary.warningIssues}`);
  console.log(`   Tracks checked: ${summary.stats.tracksChecked}`);
  console.log(`   Lessons checked: ${summary.stats.lessonsChecked}`);
  console.log(`   Missing lessons: ${summary.stats.missingLessons}`);
  console.log(`   Missing quizzes: ${summary.stats.missingQuizzes}`);
  console.log(`   Missing podcast URLs: ${summary.stats.missingPodcastUrls}`);
  console.log(`   Missing PDF URLs: ${summary.stats.missingPdfUrls}`);
  console.log(`   Missing podcast files: ${summary.stats.missingPodcastFiles}`);
  console.log(`   Missing PDF files: ${summary.stats.missingPdfFiles}`);

  if (!summary.ok) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Content integrity audit failed:", error);
  process.exit(1);
});
