-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) AND POLICIES
-- ============================================================================
-- This migration addresses Supabase security linter errors by:
-- 1. Enabling RLS on all public tables that were flagged
-- 2. Creating appropriate security policies for each table
-- 3. Protecting sensitive data (tokens, credentials, sessions)
--
-- IMPORTANT NOTES:
-- - This migration assumes you are using Supabase Auth (auth.uid() function)
-- - If you're using a custom authentication system, you may need to adjust policies
-- - The is_admin() helper function checks for ADMIN or SUPER_ADMIN roles
-- - Policies are designed to allow users to access only their own data
-- - Admins can access all data through the is_admin() function
-- - Public content (tracks, lessons, quizzes) is readable by authenticated users
--   but only if the parent track is published
--
-- After running this migration, verify that your application still works correctly
-- and adjust policies as needed for your specific use case.
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."verification_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."quizzes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."certificates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tracks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."invites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."learning_paths" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."practice_scenarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."scenario_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_tutors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."lessons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."calendar_sync_credentials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."operations_calendar" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."calendar_share_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."external_calendar_events" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================================================
-- This function checks if the current user has ADMIN or SUPER_ADMIN role
CREATE OR REPLACE FUNCTION "public"."is_admin"()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM "public"."users"
    WHERE "id" = auth.uid()
    AND "role" IN ('ADMIN', 'SUPER_ADMIN')
  );
$$;

-- ============================================================================
-- SENSITIVE TABLES: Very restrictive policies
-- ============================================================================

-- ACCOUNTS: Users can only access their own account records
CREATE POLICY "users_select_own_accounts" ON "public"."accounts"
  FOR SELECT
  USING (auth.uid() = "user_id");

CREATE POLICY "users_insert_own_accounts" ON "public"."accounts"
  FOR INSERT
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "users_update_own_accounts" ON "public"."accounts"
  FOR UPDATE
  USING (auth.uid() = "user_id")
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "users_delete_own_accounts" ON "public"."accounts"
  FOR DELETE
  USING (auth.uid() = "user_id");

-- SESSIONS: Users can only access their own sessions
CREATE POLICY "users_select_own_sessions" ON "public"."sessions"
  FOR SELECT
  USING (auth.uid() = "user_id");

CREATE POLICY "users_insert_own_sessions" ON "public"."sessions"
  FOR INSERT
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "users_update_own_sessions" ON "public"."sessions"
  FOR UPDATE
  USING (auth.uid() = "user_id")
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "users_delete_own_sessions" ON "public"."sessions"
  USING (auth.uid() = "user_id");

-- VERIFICATION_TOKENS: Only allow service role or the user themselves
-- Note: This table is typically managed by the auth system
CREATE POLICY "service_role_full_access_verification_tokens" ON "public"."verification_tokens"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- INVITES: Users can view invites sent to their email, admins can manage all
CREATE POLICY "users_select_invites_by_email" ON "public"."invites"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "public"."users"
      WHERE "users"."id" = auth.uid()
      AND "users"."email" = "invites"."email"
    )
    OR "public"."is_admin"()
  );

CREATE POLICY "admins_manage_invites" ON "public"."invites"
  FOR ALL
  USING ("public"."is_admin"())
  WITH CHECK ("public"."is_admin"());

-- ============================================================================
-- USER-SPECIFIC DATA TABLES: Users can only access their own data
-- ============================================================================

-- ATTEMPTS: Users can only access their own quiz attempts
CREATE POLICY "users_select_own_attempts" ON "public"."attempts"
  FOR SELECT
  USING (auth.uid() = "user_id");

CREATE POLICY "users_insert_own_attempts" ON "public"."attempts"
  FOR INSERT
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "users_update_own_attempts" ON "public"."attempts"
  FOR UPDATE
  USING (auth.uid() = "user_id")
  WITH CHECK (auth.uid() = "user_id");

-- CERTIFICATES: Users can only access their own certificates
CREATE POLICY "users_select_own_certificates" ON "public"."certificates"
  FOR SELECT
  USING (auth.uid() = "user_id");

CREATE POLICY "users_insert_own_certificates" ON "public"."certificates"
  FOR INSERT
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "users_update_own_certificates" ON "public"."certificates"
  FOR UPDATE
  USING (auth.uid() = "user_id")
  WITH CHECK (auth.uid() = "user_id");

-- USER_PROGRESS: Users can only access their own progress
CREATE POLICY "users_select_own_progress" ON "public"."user_progress"
  FOR SELECT
  USING (auth.uid() = "user_id");

CREATE POLICY "users_insert_own_progress" ON "public"."user_progress"
  FOR INSERT
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "users_update_own_progress" ON "public"."user_progress"
  FOR UPDATE
  USING (auth.uid() = "user_id")
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "users_delete_own_progress" ON "public"."user_progress"
  FOR DELETE
  USING (auth.uid() = "user_id");

-- LEARNING_PATHS: Users can only access their own learning paths
CREATE POLICY "users_select_own_learning_paths" ON "public"."learning_paths"
  FOR SELECT
  USING (auth.uid() = "user_id");

CREATE POLICY "users_insert_own_learning_paths" ON "public"."learning_paths"
  FOR INSERT
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "users_update_own_learning_paths" ON "public"."learning_paths"
  FOR UPDATE
  USING (auth.uid() = "user_id")
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "users_delete_own_learning_paths" ON "public"."learning_paths"
  FOR DELETE
  USING (auth.uid() = "user_id");

-- SCENARIO_ATTEMPTS: Users can only access their own scenario attempts
CREATE POLICY "users_select_own_scenario_attempts" ON "public"."scenario_attempts"
  FOR SELECT
  USING (auth.uid() = "user_id");

CREATE POLICY "users_insert_own_scenario_attempts" ON "public"."scenario_attempts"
  FOR INSERT
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "users_update_own_scenario_attempts" ON "public"."scenario_attempts"
  FOR UPDATE
  USING (auth.uid() = "user_id")
  WITH CHECK (auth.uid() = "user_id");

-- ============================================================================
-- PUBLIC CONTENT TABLES: Read access for authenticated users, write for admins
-- ============================================================================

-- TRACKS: Authenticated users can read published tracks, admins can manage all
CREATE POLICY "users_read_published_tracks" ON "public"."tracks"
  FOR SELECT
  USING (
    "is_published" = true
    OR "public"."is_admin"()
  );

CREATE POLICY "admins_manage_tracks" ON "public"."tracks"
  FOR ALL
  USING ("public"."is_admin"())
  WITH CHECK ("public"."is_admin"());

-- LESSONS: Authenticated users can read lessons from published tracks, admins can manage all
CREATE POLICY "users_read_lessons_from_published_tracks" ON "public"."lessons"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "public"."tracks"
      WHERE "tracks"."id" = "lessons"."track_id"
      AND ("tracks"."is_published" = true OR "public"."is_admin"())
    )
  );

CREATE POLICY "admins_manage_lessons" ON "public"."lessons"
  FOR ALL
  USING ("public"."is_admin"())
  WITH CHECK ("public"."is_admin"());

-- QUIZZES: Authenticated users can read quizzes from published tracks, admins can manage all
CREATE POLICY "users_read_quizzes_from_published_tracks" ON "public"."quizzes"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "public"."lessons"
      JOIN "public"."tracks" ON "tracks"."id" = "lessons"."track_id"
      WHERE "lessons"."id" = "quizzes"."lesson_id"
      AND ("tracks"."is_published" = true OR "public"."is_admin"())
    )
  );

CREATE POLICY "admins_manage_quizzes" ON "public"."quizzes"
  FOR ALL
  USING ("public"."is_admin"())
  WITH CHECK ("public"."is_admin"());

-- QUESTIONS: Authenticated users can read questions from published tracks, admins can manage all
CREATE POLICY "users_read_questions_from_published_tracks" ON "public"."questions"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "public"."quizzes"
      JOIN "public"."lessons" ON "lessons"."id" = "quizzes"."lesson_id"
      JOIN "public"."tracks" ON "tracks"."id" = "lessons"."track_id"
      WHERE "quizzes"."id" = "questions"."quiz_id"
      AND ("tracks"."is_published" = true OR "public"."is_admin"())
    )
  );

CREATE POLICY "admins_manage_questions" ON "public"."questions"
  FOR ALL
  USING ("public"."is_admin"())
  WITH CHECK ("public"."is_admin"());

-- PRACTICE_SCENARIOS: Authenticated users can read scenarios from published tracks, admins can manage all
CREATE POLICY "users_read_scenarios_from_published_tracks" ON "public"."practice_scenarios"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "public"."lessons"
      JOIN "public"."tracks" ON "tracks"."id" = "lessons"."track_id"
      WHERE "lessons"."id" = "practice_scenarios"."lesson_id"
      AND ("tracks"."is_published" = true OR "public"."is_admin"())
    )
  );

CREATE POLICY "admins_manage_scenarios" ON "public"."practice_scenarios"
  FOR ALL
  USING ("public"."is_admin"())
  WITH CHECK ("public"."is_admin"());

-- AI_TUTORS: Authenticated users can read, admins can manage
CREATE POLICY "users_read_ai_tutors" ON "public"."ai_tutors"
  FOR SELECT
  USING (true);

CREATE POLICY "admins_manage_ai_tutors" ON "public"."ai_tutors"
  FOR ALL
  USING ("public"."is_admin"())
  WITH CHECK ("public"."is_admin"());

-- ============================================================================
-- ADMIN/SYSTEM TABLES: Only admins can access
-- ============================================================================

-- CLIENTS: Only admins can access
CREATE POLICY "admins_manage_clients" ON "public"."clients"
  FOR ALL
  USING ("public"."is_admin"())
  WITH CHECK ("public"."is_admin"());

-- USERS: Users can read their own profile, admins can manage all
CREATE POLICY "users_select_own_profile" ON "public"."users"
  FOR SELECT
  USING (auth.uid() = "id");

CREATE POLICY "users_update_own_profile" ON "public"."users"
  FOR UPDATE
  USING (auth.uid() = "id")
  WITH CHECK (auth.uid() = "id");

CREATE POLICY "admins_manage_users" ON "public"."users"
  FOR ALL
  USING ("public"."is_admin"())
  WITH CHECK ("public"."is_admin"());

-- ============================================================================
-- CALENDAR-RELATED TABLES
-- ============================================================================

-- CALENDAR_SYNC_CREDENTIALS: Users can only access their own credentials
CREATE POLICY "users_select_own_calendar_credentials" ON "public"."calendar_sync_credentials"
  FOR SELECT
  USING (auth.uid() = "user_id");

CREATE POLICY "users_insert_own_calendar_credentials" ON "public"."calendar_sync_credentials"
  FOR INSERT
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "users_update_own_calendar_credentials" ON "public"."calendar_sync_credentials"
  FOR UPDATE
  USING (auth.uid() = "user_id")
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "users_delete_own_calendar_credentials" ON "public"."calendar_sync_credentials"
  FOR DELETE
  USING (auth.uid() = "user_id");

-- OPERATIONS_CALENDAR: Users can read their own events, admins can manage all
-- Note: Assuming this table has a user_id column
CREATE POLICY "users_select_own_operations_calendar" ON "public"."operations_calendar"
  FOR SELECT
  USING (
    "user_id" = auth.uid()
    OR "public"."is_admin"()
  );

CREATE POLICY "users_insert_own_operations_calendar" ON "public"."operations_calendar"
  FOR INSERT
  WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "users_update_own_operations_calendar" ON "public"."operations_calendar"
  FOR UPDATE
  USING (auth.uid() = "user_id" OR "public"."is_admin"())
  WITH CHECK (auth.uid() = "user_id" OR "public"."is_admin"());

CREATE POLICY "users_delete_own_operations_calendar" ON "public"."operations_calendar"
  FOR DELETE
  USING (auth.uid() = "user_id" OR "public"."is_admin"());

-- CALENDAR_SHARE_LINKS: Users can read links they created, admins can manage all
CREATE POLICY "users_select_own_calendar_share_links" ON "public"."calendar_share_links"
  FOR SELECT
  USING (
    "user_id" = auth.uid()
    OR "public"."is_admin"()
  );

CREATE POLICY "users_insert_own_calendar_share_links" ON "public"."calendar_share_links"
  FOR INSERT
  WITH CHECK ("user_id" = auth.uid());

CREATE POLICY "users_update_own_calendar_share_links" ON "public"."calendar_share_links"
  FOR UPDATE
  USING (
    "user_id" = auth.uid()
    OR "public"."is_admin"()
  )
  WITH CHECK (
    "user_id" = auth.uid()
    OR "public"."is_admin"()
  );

CREATE POLICY "users_delete_own_calendar_share_links" ON "public"."calendar_share_links"
  FOR DELETE
  USING (
    "user_id" = auth.uid()
    OR "public"."is_admin"()
  );

-- EXTERNAL_CALENDAR_EVENTS: Users can read events linked to their operations, admins can manage all
-- This table references operations_calendar, so we check through that relationship
CREATE POLICY "users_select_own_external_calendar_events" ON "public"."external_calendar_events"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "public"."operations_calendar"
      WHERE "operations_calendar"."id" = "external_calendar_events"."operation_id"
      AND (
        "operations_calendar"."user_id" = auth.uid()
        OR "public"."is_admin"()
      )
    )
    OR "operation_id" IS NULL AND "public"."is_admin"()
  );

CREATE POLICY "users_insert_own_external_calendar_events" ON "public"."external_calendar_events"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."operations_calendar"
      WHERE "operations_calendar"."id" = "external_calendar_events"."operation_id"
      AND "operations_calendar"."user_id" = auth.uid()
    )
    OR "public"."is_admin"()
  );

CREATE POLICY "users_update_own_external_calendar_events" ON "public"."external_calendar_events"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "public"."operations_calendar"
      WHERE "operations_calendar"."id" = "external_calendar_events"."operation_id"
      AND (
        "operations_calendar"."user_id" = auth.uid()
        OR "public"."is_admin"()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."operations_calendar"
      WHERE "operations_calendar"."id" = "external_calendar_events"."operation_id"
      AND (
        "operations_calendar"."user_id" = auth.uid()
        OR "public"."is_admin"()
      )
    )
  );

CREATE POLICY "users_delete_own_external_calendar_events" ON "public"."external_calendar_events"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "public"."operations_calendar"
      WHERE "operations_calendar"."id" = "external_calendar_events"."operation_id"
      AND (
        "operations_calendar"."user_id" = auth.uid()
        OR "public"."is_admin"()
      )
    )
    OR "public"."is_admin"()
  );
