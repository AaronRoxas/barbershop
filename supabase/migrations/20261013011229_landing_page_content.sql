ALTER TABLE "public"."businesses"
  ADD COLUMN "landing_content" jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "public"."businesses"
  ADD CONSTRAINT "businesses_landing_content_check" CHECK (((jsonb_typeof(landing_content) = 'object'::text) AND (octet_length((landing_content)::text) <= 100000)));

COMMENT ON COLUMN "public"."businesses"."landing_content" IS 'Public landing-page and footer text overrides; never store private data here.';

