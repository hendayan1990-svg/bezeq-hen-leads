create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  plan text not null default 'free' check (plan in ('free','plus','pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('parent','guardian','child')),
  display_name text not null,
  active boolean not null default true,
  joined_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid not null references public.family_members(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_uid text not null unique,
  platform text not null default 'unknown' check (platform in ('ios','android','web','unknown')),
  device_name text,
  push_token text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pairing_codes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  code text not null,
  role text not null default 'child' check (role in ('child','guardian')),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index pairing_codes_active_code_uidx
  on public.pairing_codes(code)
  where used_at is null;

create table private.pairing_attempts (
  id bigserial primary key,
  user_id uuid,
  attempted_at timestamptz not null default now()
);
create index pairing_attempts_user_time_idx on private.pairing_attempts(user_id, attempted_at desc);

create table public.locations (
  id bigserial primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid not null references public.family_members(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy_m double precision,
  altitude_m double precision,
  speed_mps double precision,
  source text not null default 'device' check (source in ('device','manual','geofence','sos')),
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index locations_family_recorded_idx on public.locations(family_id, recorded_at desc);
create index locations_member_recorded_idx on public.locations(member_id, recorded_at desc);
create index locations_user_recorded_idx on public.locations(user_id, recorded_at desc);

create table public.safe_places (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  name text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  radius_m integer not null default 150 check (radius_m between 50 and 5000),
  notify_arrival boolean not null default true,
  notify_departure boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index safe_places_family_idx on public.safe_places(family_id);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid not null references public.family_members(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'I am safe',
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);
create index check_ins_family_created_idx on public.check_ins(family_id, created_at desc);

create table public.sos_alerts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid not null references public.family_members(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','acknowledged','resolved','cancelled')),
  latitude double precision,
  longitude double precision,
  note text,
  acknowledged_by uuid references auth.users(id) on delete set null,
  acknowledged_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index sos_alerts_family_status_created_idx on public.sos_alerts(family_id, status, created_at desc);

create table public.audio_sessions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  target_member_id uuid not null references public.family_members(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested','accepted','declined','active','ended','expired')),
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
create index audio_sessions_family_created_idx on public.audio_sessions(family_id, created_at desc);
create index audio_sessions_target_status_idx on public.audio_sessions(target_user_id, status, created_at desc);

create table public.privacy_events (
  id bigserial primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index privacy_events_family_created_idx on public.privacy_events(family_id, created_at desc);
create index privacy_events_target_created_idx on public.privacy_events(target_user_id, created_at desc);

create or replace function private.is_family_member(p_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.family_members fm
    where fm.family_id = p_family_id
      and fm.user_id = (select auth.uid())
      and fm.active = true
  );
$$;

create or replace function private.is_family_guardian(p_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.family_members fm
    where fm.family_id = p_family_id
      and fm.user_id = (select auth.uid())
      and fm.active = true
      and fm.role in ('parent','guardian')
  );
$$;

create or replace function private.can_add_member(p_family_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select (select count(*) from public.family_members fm where fm.family_id=p_family_id and fm.active=true) <
    case coalesce((select f.plan from public.families f where f.id=p_family_id),'free')
      when 'pro' then 10 when 'plus' then 6 else 2 end;
$$;

create or replace function private.can_add_safe_place(p_family_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select f.plan from public.families f where f.id=p_family_id),'free') <> 'free'
    or (select count(*) from public.safe_places sp where sp.family_id=p_family_id) < 2;
$$;

create or replace function private.can_use_safety_audio(p_family_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select f.plan from public.families f where f.id=p_family_id),'free') in ('plus','pro');
$$;

revoke all on function private.can_add_member(uuid) from public;
revoke all on function private.can_add_safe_place(uuid) from public;
revoke all on function private.can_use_safety_audio(uuid) from public;
grant execute on function private.can_add_member(uuid) to authenticated;
grant execute on function private.can_add_safe_place(uuid) to authenticated;
grant execute on function private.can_use_safety_audio(uuid) to authenticated;

revoke all on function private.is_family_member(uuid) from public;
revoke all on function private.is_family_guardian(uuid) from public;
grant execute on function private.is_family_member(uuid) to authenticated;
grant execute on function private.is_family_guardian(uuid) to authenticated;

create or replace function public.create_family(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_family_id uuid;
  v_name text := trim(coalesce(p_name, ''));
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then raise exception 'PERMANENT_ACCOUNT_REQUIRED'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 80 then raise exception 'INVALID_FAMILY_NAME'; end if;

  insert into public.profiles(user_id, display_name)
  values (v_uid, coalesce(auth.jwt()->>'email', 'Parent'))
  on conflict (user_id) do nothing;

  insert into public.families(name, owner_user_id)
  values (v_name, v_uid)
  returning id into v_family_id;

  insert into public.family_members(family_id, user_id, role, display_name)
  values (v_family_id, v_uid, 'parent', coalesce(nullif((select display_name from public.profiles where user_id = v_uid), ''), 'Parent'));

  return v_family_id;
end;
$$;

create or replace function public.create_pairing_code(p_family_id uuid, p_role text default 'child')
returns table(code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_exp timestamptz := now() + interval '10 minutes';
  v_tries int := 0;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not private.is_family_guardian(p_family_id) then raise exception 'FORBIDDEN'; end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then raise exception 'PERMANENT_ACCOUNT_REQUIRED'; end if;
  if p_role not in ('child','guardian') then raise exception 'INVALID_ROLE'; end if;
  if not private.can_add_member(p_family_id) then raise exception 'FAMILY_MEMBER_LIMIT'; end if;

  update public.pairing_codes
  set used_at = now()
  where family_id = p_family_id and used_at is null and expires_at <= now();

  loop
    v_tries := v_tries + 1;
    v_code := lpad(((get_byte(extensions.gen_random_bytes(4),0)::int * 65536
                     + get_byte(extensions.gen_random_bytes(4),1)::int * 256
                     + get_byte(extensions.gen_random_bytes(4),2)::int) % 1000000)::text, 6, '0');
    begin
      insert into public.pairing_codes(family_id, created_by, code, role, expires_at)
      values (p_family_id, v_uid, v_code, p_role, v_exp);
      exit;
    exception when unique_violation then
      if v_tries >= 8 then raise; end if;
    end;
  end loop;

  insert into public.privacy_events(family_id, actor_user_id, event_type, metadata)
  values (p_family_id, v_uid, 'pairing_code_created', jsonb_build_object('role', p_role));

  return query select v_code, v_exp;
end;
$$;

create or replace function public.join_family_with_code(
  p_code text,
  p_display_name text,
  p_platform text default 'unknown',
  p_device_uid text default null,
  p_device_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_pair public.pairing_codes%rowtype;
  v_member_id uuid;
  v_device_id uuid;
  v_attempts int;
  v_name text := trim(coalesce(p_display_name, ''));
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_code !~ '^[0-9]{6}$' then raise exception 'INVALID_CODE'; end if;
  if char_length(v_name) < 1 or char_length(v_name) > 80 then raise exception 'INVALID_DISPLAY_NAME'; end if;
  if p_platform not in ('ios','android','web','unknown') then p_platform := 'unknown'; end if;

  delete from private.pairing_attempts where attempted_at < now() - interval '1 hour';
  select count(*) into v_attempts
  from private.pairing_attempts
  where user_id = v_uid and attempted_at > now() - interval '10 minutes';
  if v_attempts >= 10 then raise exception 'PAIRING_RATE_LIMIT'; end if;
  insert into private.pairing_attempts(user_id) values (v_uid);

  select * into v_pair
  from public.pairing_codes
  where code = p_code and used_at is null and expires_at > now()
  order by created_at desc
  limit 1
  for update;

  if not found then raise exception 'PAIRING_CODE_INVALID_OR_EXPIRED'; end if;
  if v_pair.role = 'guardian' and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'PERMANENT_ACCOUNT_REQUIRED_FOR_GUARDIAN';
  end if;
  if not exists (select 1 from public.family_members fm where fm.family_id=v_pair.family_id and fm.user_id=v_uid)
     and not private.can_add_member(v_pair.family_id) then raise exception 'FAMILY_MEMBER_LIMIT'; end if;

  insert into public.profiles(user_id, display_name)
  values (v_uid, v_name)
  on conflict (user_id) do update set display_name = excluded.display_name, updated_at = now();

  insert into public.family_members(family_id, user_id, role, display_name)
  values (v_pair.family_id, v_uid, v_pair.role, v_name)
  on conflict (family_id, user_id) do update
    set role = excluded.role, display_name = excluded.display_name, active = true
  returning id into v_member_id;

  if nullif(trim(coalesce(p_device_uid,'')), '') is not null then
    insert into public.devices(family_id, member_id, user_id, device_uid, platform, device_name, last_seen_at)
    values (v_pair.family_id, v_member_id, v_uid, trim(p_device_uid), p_platform, p_device_name, now())
    on conflict (device_uid) do update
      set family_id = excluded.family_id,
          member_id = excluded.member_id,
          user_id = excluded.user_id,
          platform = excluded.platform,
          device_name = excluded.device_name,
          last_seen_at = now(),
          updated_at = now()
    returning id into v_device_id;
  end if;

  update public.pairing_codes set used_at = now(), used_by = v_uid where id = v_pair.id;

  insert into public.privacy_events(family_id, actor_user_id, target_user_id, event_type, metadata)
  values (v_pair.family_id, v_uid, v_uid, 'family_joined', jsonb_build_object('role', v_pair.role, 'member_id', v_member_id));

  return jsonb_build_object(
    'family_id', v_pair.family_id,
    'member_id', v_member_id,
    'device_id', v_device_id,
    'role', v_pair.role
  );
end;
$$;

revoke all on function public.create_family(text) from public, anon;
revoke all on function public.create_pairing_code(uuid,text) from public, anon;
revoke all on function public.join_family_with_code(text,text,text,text,text) from public, anon;
grant execute on function public.create_family(text) to authenticated;
grant execute on function public.create_pairing_code(uuid,text) to authenticated;
grant execute on function public.join_family_with_code(text,text,text,text,text) to authenticated;

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.devices enable row level security;
alter table public.pairing_codes enable row level security;
alter table public.locations enable row level security;
alter table public.safe_places enable row level security;
alter table public.check_ins enable row level security;
alter table public.sos_alerts enable row level security;
alter table public.audio_sessions enable row level security;
alter table public.privacy_events enable row level security;

revoke all on public.pairing_codes from anon, authenticated;
revoke all on all tables in schema public from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.families to authenticated;
grant update(name) on public.families to authenticated;
grant select on public.family_members to authenticated;
grant update(display_name) on public.family_members to authenticated;
grant select, insert, update on public.devices to authenticated;
grant select, insert on public.locations to authenticated;
grant select, insert, update, delete on public.safe_places to authenticated;
grant select, insert on public.check_ins to authenticated;
grant select, insert, update on public.sos_alerts to authenticated;
grant select, insert, update on public.audio_sessions to authenticated;
grant select on public.privacy_events to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create policy profiles_self_select on public.profiles for select to authenticated
using ((select auth.uid()) = user_id);
create policy profiles_self_insert on public.profiles for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy profiles_self_update on public.profiles for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy families_member_select on public.families for select to authenticated
using ((select private.is_family_member(id)));
create policy families_guardian_update on public.families for update to authenticated
using ((select private.is_family_guardian(id))) with check ((select private.is_family_guardian(id)));

create policy members_family_select on public.family_members for select to authenticated
using ((select private.is_family_member(family_id)));
create policy members_self_update on public.family_members for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id and family_id = family_members.family_id and role = family_members.role);
create policy members_guardian_update on public.family_members for update to authenticated
using ((select private.is_family_guardian(family_id)))
with check ((select private.is_family_guardian(family_id)));

create policy devices_family_select on public.devices for select to authenticated
using ((select private.is_family_member(family_id)));
create policy devices_self_insert on public.devices for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and (select private.is_family_member(family_id))
  and exists (
    select 1 from public.family_members fm
    where fm.id = member_id and fm.family_id = devices.family_id and fm.user_id = (select auth.uid()) and fm.active = true
  )
);
create policy devices_self_update on public.devices for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (select private.is_family_member(family_id))
  and exists (
    select 1 from public.family_members fm
    where fm.id = member_id and fm.family_id = devices.family_id and fm.user_id = (select auth.uid()) and fm.active = true
  )
);

create policy locations_family_select on public.locations for select to authenticated
using ((select private.is_family_member(family_id)));
create policy locations_self_insert on public.locations for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and (select private.is_family_member(family_id))
  and exists (
    select 1 from public.family_members fm
    where fm.id = member_id and fm.family_id = locations.family_id and fm.user_id = (select auth.uid()) and fm.active = true
  )
  and (device_id is null or exists (
    select 1 from public.devices d
    where d.id = device_id and d.family_id = locations.family_id and d.user_id = (select auth.uid())
  ))
);

create policy places_family_select on public.safe_places for select to authenticated
using ((select private.is_family_member(family_id)));
create policy places_guardian_insert on public.safe_places for insert to authenticated
with check ((select private.is_family_guardian(family_id)) and created_by = (select auth.uid()) and (select private.can_add_safe_place(family_id)));
create policy places_guardian_update on public.safe_places for update to authenticated
using ((select private.is_family_guardian(family_id))) with check ((select private.is_family_guardian(family_id)));
create policy places_guardian_delete on public.safe_places for delete to authenticated
using ((select private.is_family_guardian(family_id)));

create policy checkins_family_select on public.check_ins for select to authenticated
using ((select private.is_family_member(family_id)));
create policy checkins_self_insert on public.check_ins for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and (select private.is_family_member(family_id))
  and exists (
    select 1 from public.family_members fm
    where fm.id = member_id and fm.family_id = check_ins.family_id and fm.user_id = (select auth.uid()) and fm.active = true
  )
);

create policy sos_family_select on public.sos_alerts for select to authenticated
using ((select private.is_family_member(family_id)));
create policy sos_self_insert on public.sos_alerts for insert to authenticated
with check (
  (select auth.uid()) = created_by
  and (select private.is_family_member(family_id))
  and exists (
    select 1 from public.family_members fm
    where fm.id = member_id and fm.family_id = sos_alerts.family_id and fm.user_id = (select auth.uid()) and fm.active = true
  )
);
create policy sos_guardian_update on public.sos_alerts for update to authenticated
using ((select private.is_family_guardian(family_id)))
with check ((select private.is_family_guardian(family_id)));

create policy audio_family_select on public.audio_sessions for select to authenticated
using ((select private.is_family_member(family_id)));
create policy audio_guardian_request on public.audio_sessions for insert to authenticated
with check (
  requested_by = (select auth.uid())
  and (select private.is_family_guardian(family_id))
  and (select private.can_use_safety_audio(family_id))
  and exists (
    select 1 from public.family_members fm
    where fm.id = target_member_id and fm.family_id = audio_sessions.family_id and fm.user_id = target_user_id and fm.active = true
  )
);
create policy audio_participant_update on public.audio_sessions for update to authenticated
using (requested_by = (select auth.uid()) or target_user_id = (select auth.uid()))
with check (requested_by = audio_sessions.requested_by and target_user_id = audio_sessions.target_user_id and family_id = audio_sessions.family_id);

create policy privacy_family_select on public.privacy_events for select to authenticated
using ((select private.is_family_member(family_id)) and (actor_user_id = (select auth.uid()) or target_user_id = (select auth.uid()) or (select private.is_family_guardian(family_id))));

alter publication supabase_realtime add table public.locations;
alter publication supabase_realtime add table public.check_ins;
alter publication supabase_realtime add table public.sos_alerts;
alter publication supabase_realtime add table public.audio_sessions;

