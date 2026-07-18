/*
# Add count_members_by_church RPC function

1. New Functions
- `count_members_by_church()` — returns a table of (church_id uuid, count bigint)
  counting non-archived members grouped by church. Uses `security invoker` so
  RLS on `members` applies: users only see counts for churches they can access.
2. Security
- No new tables. Function is read-only and RLS-respecting.
*/

create or replace function public.count_members_by_church()
returns table(church_id uuid, count bigint)
language sql stable security invoker as $$
  select church_id, count(*)::bigint
  from public.members
  where archived_at is null
  group by church_id
$$;
