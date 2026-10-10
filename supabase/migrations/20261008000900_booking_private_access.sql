-- Invoker guest RPCs need schema USAGE as well as function EXECUTE.
-- This does not grant access to any other private function or table.
grant usage on schema private to service_role;
