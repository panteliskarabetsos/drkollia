--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.5 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_migrations;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$_$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(objects.path_tokens, 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    patient_id uuid,
    reason text,
    appointment_time timestamp with time zone NOT NULL,
    duration_minutes integer DEFAULT 30,
    status text DEFAULT 'pending'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    is_exception boolean DEFAULT false,
    CONSTRAINT appointments_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: clinic_schedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinic_schedule (
    id integer NOT NULL,
    weekday integer NOT NULL,
    start_time time with time zone NOT NULL,
    end_time time with time zone NOT NULL
);


--
-- Name: clinic_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clinic_schedule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clinic_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clinic_schedule_id_seq OWNED BY public.clinic_schedule.id;


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    email text,
    phone text,
    birth_date date,
    gender text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    amka text,
    occupation text,
    first_visit_date date,
    marital_status text,
    children text,
    smoking text,
    alcohol text,
    medications text,
    gynecological_history text,
    hereditary_history text,
    current_disease text,
    physical_exam text,
    preclinical_screening text,
    updated_at timestamp with time zone DEFAULT now(),
    first_name text NOT NULL,
    last_name text NOT NULL,
    CONSTRAINT patients_gender_check CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    role text DEFAULT 'admin'::text,
    created_at timestamp with time zone DEFAULT now(),
    name text,
    email text,
    phone text,
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'editor'::text])))
);


--
-- Name: schedule_exceptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_exceptions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    exception_date date NOT NULL,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    reason text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: visit_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visit_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    appointment_id uuid,
    patient_id uuid NOT NULL,
    visit_date date NOT NULL,
    physical_exam text,
    preclinical_screening text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


--
-- Name: seed_files; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.seed_files (
    path text NOT NULL,
    hash text NOT NULL
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: clinic_schedule id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_schedule ALTER COLUMN id SET DEFAULT nextval('public.clinic_schedule_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
00000000-0000-0000-0000-000000000000	7ae737d3-c7f7-452a-a12b-b1533a44c9ce	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"karapantelis21@gmail.com","user_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","user_phone":""}}	2025-07-22 07:15:23.745952+00	
00000000-0000-0000-0000-000000000000	79355031-bc5f-482d-8ee3-cc1dd0d9acd2	{"action":"login","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 07:18:23.649356+00	
00000000-0000-0000-0000-000000000000	606731db-4f4a-4f58-845d-12bef8e6682f	{"action":"login","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 07:18:28.321052+00	
00000000-0000-0000-0000-000000000000	397aa4f3-f7e0-481a-88ca-f70ede2f1ddb	{"action":"login","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 07:19:52.442776+00	
00000000-0000-0000-0000-000000000000	91bc80e0-da10-4586-bdfa-9cce075e70fe	{"action":"login","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 07:20:56.05316+00	
00000000-0000-0000-0000-000000000000	ab63b6a2-6cb2-41e7-bc65-0deba2bc7e5e	{"action":"login","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 07:25:54.463711+00	
00000000-0000-0000-0000-000000000000	c0f31d49-3a24-4aca-9dc9-a087a6a9a3ee	{"action":"login","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 07:26:12.647005+00	
00000000-0000-0000-0000-000000000000	683bceda-6df5-4003-be56-e4557a98692b	{"action":"login","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 07:26:13.541671+00	
00000000-0000-0000-0000-000000000000	35ade899-8880-4581-8e94-70da3c26117b	{"action":"login","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 07:26:14.42004+00	
00000000-0000-0000-0000-000000000000	e23c1d31-6459-4054-b014-6093c597b673	{"action":"login","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 07:26:15.123909+00	
00000000-0000-0000-0000-000000000000	0e52a072-879e-4bbe-9971-bd39d9d82dd3	{"action":"login","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 07:26:15.931411+00	
00000000-0000-0000-0000-000000000000	37359a01-40c4-45ea-9450-acab884bb062	{"action":"login","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 07:28:29.507827+00	
00000000-0000-0000-0000-000000000000	ccedfffe-dc61-4700-9469-487fef41a27f	{"action":"user_confirmation_requested","actor_id":"bbebcc0b-64b1-4304-bafb-f352d02973a3","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-07-22 07:44:08.013244+00	
00000000-0000-0000-0000-000000000000	d297a84f-8a1b-4923-8d2f-388a6b2fa9c7	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"mzisis01@gmail.com","user_id":"bbebcc0b-64b1-4304-bafb-f352d02973a3","user_phone":""}}	2025-07-22 07:45:12.198205+00	
00000000-0000-0000-0000-000000000000	4a383379-a029-4d5a-891e-566e9aaff785	{"action":"user_confirmation_requested","actor_id":"51a5c6fc-e5ce-4f70-9c62-545fc20e5dbc","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-07-22 07:45:33.687713+00	
00000000-0000-0000-0000-000000000000	8d0744e3-e903-4490-bb8a-5c3501cac7f1	{"action":"user_signedup","actor_id":"51a5c6fc-e5ce-4f70-9c62-545fc20e5dbc","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2025-07-22 07:46:18.157428+00	
00000000-0000-0000-0000-000000000000	71417f3d-4c5b-48fb-ac58-2a3c0a6dd4f8	{"action":"login","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 07:47:30.505714+00	
00000000-0000-0000-0000-000000000000	92c3b39b-94a9-4fe8-b5f2-fedadbbbe351	{"action":"logout","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-22 07:55:23.696802+00	
00000000-0000-0000-0000-000000000000	0934090a-3384-4f2e-87ec-c5e6e9e89195	{"action":"login","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 07:55:37.703391+00	
00000000-0000-0000-0000-000000000000	7a36afc3-4a8e-4719-9b26-a7bd355a80ef	{"action":"logout","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-22 07:55:43.148149+00	
00000000-0000-0000-0000-000000000000	65d32d8e-5b2a-4eed-acda-56d0497cbabe	{"action":"user_repeated_signup","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-07-22 07:55:55.10474+00	
00000000-0000-0000-0000-000000000000	7ca84cd7-413d-471f-a562-11e45f164697	{"action":"login","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 07:56:01.361745+00	
00000000-0000-0000-0000-000000000000	71535339-457f-4545-84db-f22527000bd9	{"action":"user_repeated_signup","actor_id":"51a5c6fc-e5ce-4f70-9c62-545fc20e5dbc","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-07-22 07:57:57.374683+00	
00000000-0000-0000-0000-000000000000	68468a83-ab5d-4bc7-9b7d-ae846dcdc79f	{"action":"user_repeated_signup","actor_id":"51a5c6fc-e5ce-4f70-9c62-545fc20e5dbc","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-07-22 07:59:24.927403+00	
00000000-0000-0000-0000-000000000000	b8b6aa28-226e-467c-a066-965e7590bca9	{"action":"user_repeated_signup","actor_id":"51a5c6fc-e5ce-4f70-9c62-545fc20e5dbc","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-07-22 08:05:36.151506+00	
00000000-0000-0000-0000-000000000000	2faddb0f-f4b9-412f-9de7-5b72a0d8fc11	{"action":"login","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 08:05:55.531174+00	
00000000-0000-0000-0000-000000000000	42465fae-4d70-45f2-8275-93a357d406a6	{"action":"user_repeated_signup","actor_id":"51a5c6fc-e5ce-4f70-9c62-545fc20e5dbc","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-07-22 08:06:49.446272+00	
00000000-0000-0000-0000-000000000000	75f6fb99-5b61-4a5e-a28b-66fb3a865ece	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"mzisis01@gmail.com","user_id":"51a5c6fc-e5ce-4f70-9c62-545fc20e5dbc","user_phone":""}}	2025-07-22 08:09:23.260292+00	
00000000-0000-0000-0000-000000000000	e213482a-2e3f-41d9-8563-26294787866f	{"action":"user_signedup","actor_id":"735ca44e-b683-4ad7-8840-5240fce4b665","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2025-07-22 08:09:39.964779+00	
00000000-0000-0000-0000-000000000000	a1103005-54ca-410c-b7f6-e0880b3f69a4	{"action":"login","actor_id":"735ca44e-b683-4ad7-8840-5240fce4b665","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 08:09:39.968216+00	
00000000-0000-0000-0000-000000000000	93a7af33-f759-4cdf-ac5a-83166fbe62f9	{"action":"login","actor_id":"735ca44e-b683-4ad7-8840-5240fce4b665","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 08:09:54.223666+00	
00000000-0000-0000-0000-000000000000	55111cd3-c907-4795-b3e9-eef795712df7	{"action":"logout","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-22 08:13:47.770901+00	
00000000-0000-0000-0000-000000000000	121d5391-221c-40d7-8888-7d031b505861	{"action":"logout","actor_id":"735ca44e-b683-4ad7-8840-5240fce4b665","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-22 08:13:52.993303+00	
00000000-0000-0000-0000-000000000000	5f10e639-579b-4fc1-b9b1-b06732a1533a	{"action":"login","actor_id":"735ca44e-b683-4ad7-8840-5240fce4b665","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 08:14:09.080717+00	
00000000-0000-0000-0000-000000000000	26111361-ad62-4ded-94d8-efa22145c497	{"action":"login","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 08:14:55.563519+00	
00000000-0000-0000-0000-000000000000	a3061f35-a805-425e-b2bd-f6529b36fb11	{"action":"user_repeated_signup","actor_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-07-22 08:15:07.380412+00	
00000000-0000-0000-0000-000000000000	71ce75c9-7ee1-4efc-82d3-2a14dbef2273	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"karapantelis21@gmail.com","user_id":"813ebfe3-63e7-4ed5-b62e-4e115216d886","user_phone":""}}	2025-07-22 08:16:23.130747+00	
00000000-0000-0000-0000-000000000000	a7d7a4d2-6455-4ba2-a962-6c5f836c4416	{"action":"user_signedup","actor_id":"8956ff12-399f-4d2e-b4b3-c99c41548417","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2025-07-22 08:16:31.702093+00	
00000000-0000-0000-0000-000000000000	ed4baa5b-a3b1-4cf3-8675-71d75093e2df	{"action":"login","actor_id":"8956ff12-399f-4d2e-b4b3-c99c41548417","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 08:16:31.705574+00	
00000000-0000-0000-0000-000000000000	535bb58e-9007-4d0e-bdc3-1cfb309b0bea	{"action":"user_repeated_signup","actor_id":"8956ff12-399f-4d2e-b4b3-c99c41548417","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-07-22 08:19:26.016974+00	
00000000-0000-0000-0000-000000000000	88ff1473-835f-42ec-9ed5-9ad47356a1c0	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"karapantelis21@gmail.com","user_id":"8956ff12-399f-4d2e-b4b3-c99c41548417","user_phone":""}}	2025-07-22 08:19:52.360154+00	
00000000-0000-0000-0000-000000000000	2a92ebcb-ada9-43de-9035-6f9bbd4710b5	{"action":"user_signedup","actor_id":"ffde4928-8fc6-4fa0-9e3d-3c0bfd2f7127","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2025-07-22 08:20:25.198055+00	
00000000-0000-0000-0000-000000000000	41b9052e-f0b8-4785-be14-c6083ee69b22	{"action":"login","actor_id":"ffde4928-8fc6-4fa0-9e3d-3c0bfd2f7127","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 08:20:25.201405+00	
00000000-0000-0000-0000-000000000000	36091c36-af84-43b9-a1e2-97d087ab8b89	{"action":"login","actor_id":"ffde4928-8fc6-4fa0-9e3d-3c0bfd2f7127","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 08:20:27.926564+00	
00000000-0000-0000-0000-000000000000	fe671d17-144d-423c-b407-daee1ff5e42e	{"action":"logout","actor_id":"ffde4928-8fc6-4fa0-9e3d-3c0bfd2f7127","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-22 08:22:43.265174+00	
00000000-0000-0000-0000-000000000000	6f433b9d-c4e6-4d47-9911-13da4b94c4d0	{"action":"login","actor_id":"ffde4928-8fc6-4fa0-9e3d-3c0bfd2f7127","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 08:22:45.372728+00	
00000000-0000-0000-0000-000000000000	c2bfc2c5-f8ec-4e43-b623-2764efa2dfcf	{"action":"logout","actor_id":"ffde4928-8fc6-4fa0-9e3d-3c0bfd2f7127","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-22 08:22:47.133129+00	
00000000-0000-0000-0000-000000000000	646a942b-a7fa-4178-b607-bfc5d18933b9	{"action":"login","actor_id":"735ca44e-b683-4ad7-8840-5240fce4b665","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 08:23:03.686088+00	
00000000-0000-0000-0000-000000000000	4f9e6b15-ea05-4975-93b7-a5a7ddec6047	{"action":"logout","actor_id":"735ca44e-b683-4ad7-8840-5240fce4b665","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-22 08:24:13.648154+00	
00000000-0000-0000-0000-000000000000	248bba8c-87f4-435e-93ce-6dbf427effb1	{"action":"login","actor_id":"ffde4928-8fc6-4fa0-9e3d-3c0bfd2f7127","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 08:24:15.789752+00	
00000000-0000-0000-0000-000000000000	9d570133-9942-49b7-9f3d-bd3abb38dfb0	{"action":"logout","actor_id":"ffde4928-8fc6-4fa0-9e3d-3c0bfd2f7127","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-22 08:24:32.567755+00	
00000000-0000-0000-0000-000000000000	4488441c-1805-482d-a2e7-36a6c4968bd0	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"karapantelis21@gmail.com","user_id":"ffde4928-8fc6-4fa0-9e3d-3c0bfd2f7127","user_phone":""}}	2025-07-22 08:26:07.366017+00	
00000000-0000-0000-0000-000000000000	05816936-0456-40a4-8146-42a13e05937f	{"action":"user_signedup","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2025-07-22 08:26:46.905596+00	
00000000-0000-0000-0000-000000000000	32794034-4af2-4df9-adff-ff15e2c5d05a	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 08:26:46.908769+00	
00000000-0000-0000-0000-000000000000	d330fab2-fcb3-496b-905f-de91138442de	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 08:26:49.589365+00	
00000000-0000-0000-0000-000000000000	152ba6eb-8d75-4fa8-974d-6ccc67e375e3	{"action":"logout","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-22 08:34:27.72059+00	
00000000-0000-0000-0000-000000000000	8cfe1729-1d01-4fca-b0fc-5f061603ba3e	{"action":"login","actor_id":"735ca44e-b683-4ad7-8840-5240fce4b665","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 08:34:42.327117+00	
00000000-0000-0000-0000-000000000000	f673d39e-ccc2-4844-83c0-b10df9d77f7d	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 08:37:33.845155+00	
00000000-0000-0000-0000-000000000000	ce0b5ebd-593d-48c7-8033-331587ebe5de	{"action":"user_repeated_signup","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-07-22 08:42:48.066218+00	
00000000-0000-0000-0000-000000000000	b4d53fd5-f4c2-4e9f-9861-cbe3d8c9ba4c	{"action":"logout","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-22 08:45:01.286635+00	
00000000-0000-0000-0000-000000000000	0f805be0-d5aa-4218-8202-a37d860f3d09	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-22 08:45:50.481159+00	
00000000-0000-0000-0000-000000000000	84c0c5e6-a5e2-4837-a668-3750be444a31	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 11:40:54.2038+00	
00000000-0000-0000-0000-000000000000	4c57e7dd-4e6e-4d30-917f-708065dfee17	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 11:42:22.966434+00	
00000000-0000-0000-0000-000000000000	d01148de-8cc7-4a40-9760-95c42c502f4d	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 11:42:22.968397+00	
00000000-0000-0000-0000-000000000000	73a5a5ac-9fd3-45c4-9f34-8d72aa3f52a3	{"action":"login","actor_id":"735ca44e-b683-4ad7-8840-5240fce4b665","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 12:24:59.15292+00	
00000000-0000-0000-0000-000000000000	5a76d03b-e9e1-4c18-8334-f1dc06979e56	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 13:05:53.433332+00	
00000000-0000-0000-0000-000000000000	e132a7fa-6c7b-4ed9-954a-8bea7bfe0752	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 13:05:53.434081+00	
00000000-0000-0000-0000-000000000000	458a1307-fc87-40bf-a163-3cc8876213f1	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 13:15:38.377278+00	
00000000-0000-0000-0000-000000000000	ecf620ba-327e-4dc1-b2a1-a978dbb5fcef	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 13:15:38.379076+00	
00000000-0000-0000-0000-000000000000	49f7950a-f01a-49d7-a79a-2cde546eb352	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 14:05:31.081252+00	
00000000-0000-0000-0000-000000000000	276aec6e-704c-4a7d-b177-abd57fedb92e	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 14:05:31.082562+00	
00000000-0000-0000-0000-000000000000	4979a32d-b7fc-45b7-ae4e-b2f7ac371b42	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 15:14:18.849509+00	
00000000-0000-0000-0000-000000000000	0dd268b9-7a05-457d-ac7a-a2bb1b494c65	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 15:14:18.856306+00	
00000000-0000-0000-0000-000000000000	b97e7cda-f485-4f78-b58a-b491e02e2604	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 15:16:21.760538+00	
00000000-0000-0000-0000-000000000000	14b57c57-2191-4df8-a2f1-f446fffe70d6	{"action":"token_refreshed","actor_id":"735ca44e-b683-4ad7-8840-5240fce4b665","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 15:42:34.579861+00	
00000000-0000-0000-0000-000000000000	a3f19a8b-b673-4012-91a4-bd86204196ec	{"action":"token_revoked","actor_id":"735ca44e-b683-4ad7-8840-5240fce4b665","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 15:42:34.581312+00	
00000000-0000-0000-0000-000000000000	0468d0c2-5a46-4057-b208-1a97b7e4f224	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 15:56:05.811091+00	
00000000-0000-0000-0000-000000000000	75259191-28c6-402c-b6a6-a9869e9b0a92	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 15:56:05.813203+00	
00000000-0000-0000-0000-000000000000	97afdf45-4ce0-4ca4-858b-9311faf767b5	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 16:14:47.507298+00	
00000000-0000-0000-0000-000000000000	b53cf08a-d45f-46f5-992e-d9f77b6f00ec	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 16:14:47.509757+00	
00000000-0000-0000-0000-000000000000	d5724564-49b9-4dc1-b5ee-00296c306af5	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 16:32:50.759096+00	
00000000-0000-0000-0000-000000000000	bb375824-199d-4a95-9c22-444daf2ee997	{"action":"logout","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-23 16:33:03.216468+00	
00000000-0000-0000-0000-000000000000	32e0af61-5eb7-4276-909b-8bbeab4f824e	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 16:36:31.130416+00	
00000000-0000-0000-0000-000000000000	bd88bebb-0dfd-4144-8b8f-98fca596be69	{"action":"logout","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-23 16:36:37.462432+00	
00000000-0000-0000-0000-000000000000	48e31fcd-36f8-4401-8af0-4c6a3723a817	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 16:38:17.889599+00	
00000000-0000-0000-0000-000000000000	a450494a-eb12-487b-98b8-361700465aec	{"action":"logout","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-23 16:42:54.646643+00	
00000000-0000-0000-0000-000000000000	415185f1-26e0-4c2b-94fb-613765b0cbc9	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 16:43:06.70698+00	
00000000-0000-0000-0000-000000000000	8af656c8-68f2-4fdc-84b2-ce5dedcf4358	{"action":"logout","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-23 16:44:50.525064+00	
00000000-0000-0000-0000-000000000000	d2a07636-fc21-415e-bd9e-2344f7db63fe	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 16:44:52.082209+00	
00000000-0000-0000-0000-000000000000	4c21ace5-fc3d-4bc1-8a6e-89036a773e65	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 16:45:25.240994+00	
00000000-0000-0000-0000-000000000000	828e52a6-be74-44cc-aed7-4033b786931d	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 16:51:26.493607+00	
00000000-0000-0000-0000-000000000000	a7b7f7a3-b9a0-4158-9a0d-5f9448a059cf	{"action":"logout","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-23 16:52:58.763634+00	
00000000-0000-0000-0000-000000000000	e8315829-0f8e-49fe-abb3-62fca716ae4d	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 16:53:10.041146+00	
00000000-0000-0000-0000-000000000000	3febc5bc-6434-461e-9f38-3aba6abf181c	{"action":"logout","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-23 16:56:46.679168+00	
00000000-0000-0000-0000-000000000000	62d26ea1-24cb-4474-bcab-3685cb57ffc4	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 16:57:39.883793+00	
00000000-0000-0000-0000-000000000000	ff78df3a-7d71-43eb-9287-719c3466e309	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 16:59:04.954226+00	
00000000-0000-0000-0000-000000000000	7bf3724e-d1c5-41e3-913f-316be87cd85b	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 16:59:54.193029+00	
00000000-0000-0000-0000-000000000000	341f7dc5-a85d-4935-a300-99fe115d7862	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 17:04:01.618922+00	
00000000-0000-0000-0000-000000000000	a20278a4-7887-4a84-a3cf-5d5c25297183	{"action":"user_repeated_signup","actor_id":"735ca44e-b683-4ad7-8840-5240fce4b665","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-07-23 17:10:42.036579+00	
00000000-0000-0000-0000-000000000000	accadeb5-08d0-4ed0-8857-cf312b48671a	{"action":"token_refreshed","actor_id":"735ca44e-b683-4ad7-8840-5240fce4b665","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 17:14:13.91225+00	
00000000-0000-0000-0000-000000000000	12462f6e-3a78-4a05-82f9-3860aedcae6d	{"action":"token_revoked","actor_id":"735ca44e-b683-4ad7-8840-5240fce4b665","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 17:14:13.913756+00	
00000000-0000-0000-0000-000000000000	680af6f5-8d49-4f7f-821d-caaef4d4f284	{"action":"user_signedup","actor_id":"8d932c8f-9b7c-4bd0-af0f-80a54c394f55","actor_username":"contact@pkarabetsos.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2025-07-23 17:26:07.24971+00	
00000000-0000-0000-0000-000000000000	f1d75e2d-4197-4220-a2f1-fceb480011f8	{"action":"login","actor_id":"8d932c8f-9b7c-4bd0-af0f-80a54c394f55","actor_username":"contact@pkarabetsos.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 17:26:07.255634+00	
00000000-0000-0000-0000-000000000000	e71ca1a5-a810-4995-97bb-7caa8effdfb3	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 17:57:59.307002+00	
00000000-0000-0000-0000-000000000000	335b2a01-11d7-4602-8865-00267ccea384	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 17:57:59.309106+00	
00000000-0000-0000-0000-000000000000	a158b190-f189-432b-998b-7963728420f6	{"action":"logout","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-23 18:09:40.195347+00	
00000000-0000-0000-0000-000000000000	9305b37e-3ce9-4472-b386-b93bd5060bf3	{"action":"login","actor_id":"735ca44e-b683-4ad7-8840-5240fce4b665","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 18:10:16.811116+00	
00000000-0000-0000-0000-000000000000	4b9f3cd0-df0d-4541-8a2e-e5b2413ede7c	{"action":"logout","actor_id":"8d932c8f-9b7c-4bd0-af0f-80a54c394f55","actor_username":"contact@pkarabetsos.com","actor_via_sso":false,"log_type":"account"}	2025-07-23 18:15:42.145117+00	
00000000-0000-0000-0000-000000000000	f4b9effe-9de6-4f84-b43d-81f748de7396	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 18:15:45.167014+00	
00000000-0000-0000-0000-000000000000	d4cbe965-e000-4c4b-8c1d-286f4467f0bf	{"action":"user_signedup","actor_id":"1ca62d92-f62c-4ce7-a40c-491a84077146","actor_username":"gkollia@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2025-07-23 18:19:19.642176+00	
00000000-0000-0000-0000-000000000000	1a92e2c5-d930-4ae7-8a24-61010db9137d	{"action":"login","actor_id":"1ca62d92-f62c-4ce7-a40c-491a84077146","actor_username":"gkollia@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 18:19:19.648207+00	
00000000-0000-0000-0000-000000000000	464d0fdc-0e70-402d-84cb-cd455152eb34	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 18:46:30.075311+00	
00000000-0000-0000-0000-000000000000	78c7637f-90eb-4a47-b253-6cc439051ae5	{"action":"user_repeated_signup","actor_id":"1ca62d92-f62c-4ce7-a40c-491a84077146","actor_username":"gkollia@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-07-23 18:50:43.82669+00	
00000000-0000-0000-0000-000000000000	53904ba6-e83e-4117-aac3-5be64dec78b9	{"action":"user_signedup","actor_id":"4d9e7ea6-120c-4dd7-816f-d1525592af78","actor_username":"gokollia@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2025-07-23 18:50:54.236132+00	
00000000-0000-0000-0000-000000000000	7061f9b5-2963-4089-a7cc-c935033b1b43	{"action":"login","actor_id":"4d9e7ea6-120c-4dd7-816f-d1525592af78","actor_username":"gokollia@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 18:50:54.239865+00	
00000000-0000-0000-0000-000000000000	e7dda011-44a9-41f4-9c40-975702be3248	{"action":"logout","actor_id":"4d9e7ea6-120c-4dd7-816f-d1525592af78","actor_username":"gokollia@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-23 18:50:54.657765+00	
00000000-0000-0000-0000-000000000000	c2fbbf40-c0ee-4a37-90c6-22cd118588bc	{"action":"login","actor_id":"4d9e7ea6-120c-4dd7-816f-d1525592af78","actor_username":"gokollia@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 18:51:14.520481+00	
00000000-0000-0000-0000-000000000000	8f8ea75a-4f7c-48d0-b4e8-393a230697e4	{"action":"logout","actor_id":"4d9e7ea6-120c-4dd7-816f-d1525592af78","actor_username":"gokollia@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-23 18:51:46.835896+00	
00000000-0000-0000-0000-000000000000	681a9ae5-9c8b-446b-85cc-c0a1982597b1	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 18:51:48.77644+00	
00000000-0000-0000-0000-000000000000	a735a9f1-65f2-478e-841b-be5f9db680e1	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"mzisis01@gmail.com","user_id":"735ca44e-b683-4ad7-8840-5240fce4b665","user_phone":""}}	2025-07-23 18:57:55.353671+00	
00000000-0000-0000-0000-000000000000	513e1476-6724-43c3-928f-66c835968922	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"contact@pkarabetsos.com","user_id":"8d932c8f-9b7c-4bd0-af0f-80a54c394f55","user_phone":""}}	2025-07-23 18:57:57.599175+00	
00000000-0000-0000-0000-000000000000	b37092e7-2418-43a6-bb73-4b224f920f5f	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 12:37:07.979265+00	
00000000-0000-0000-0000-000000000000	88cff1a8-b201-429b-84f8-601750b08b22	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"gkollia@gmail.com","user_id":"1ca62d92-f62c-4ce7-a40c-491a84077146","user_phone":""}}	2025-07-23 18:57:59.722904+00	
00000000-0000-0000-0000-000000000000	ffb3d855-bcfe-497f-8155-2bf1e4486b77	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 19:50:49.132668+00	
00000000-0000-0000-0000-000000000000	3f133392-c9f8-4384-94d5-d42132fdd668	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 19:50:49.135913+00	
00000000-0000-0000-0000-000000000000	b2c3ffc4-ea5c-4dbe-a58e-7931ed6fd405	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 20:50:19.66906+00	
00000000-0000-0000-0000-000000000000	2dc425a1-fb87-464f-bffe-98269eadb213	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 20:50:19.671033+00	
00000000-0000-0000-0000-000000000000	e5da931c-69bc-448d-96f1-d5862a5107eb	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 21:49:26.22728+00	
00000000-0000-0000-0000-000000000000	cbae7b66-87e4-4108-a004-760e925b6c71	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-23 21:49:26.231146+00	
00000000-0000-0000-0000-000000000000	f79482e2-99f6-4cdb-8ca8-e678ce438088	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 23:10:38.525949+00	
00000000-0000-0000-0000-000000000000	a326dbf4-72cf-40e6-a8c6-9165bdfabc22	{"action":"user_signedup","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2025-07-23 23:17:23.717139+00	
00000000-0000-0000-0000-000000000000	7039744d-d95e-4463-a282-b3c721b42eb2	{"action":"login","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 23:17:23.721999+00	
00000000-0000-0000-0000-000000000000	f8eecd76-3a30-405f-8731-6a4b7e0447b7	{"action":"logout","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-23 23:17:24.154681+00	
00000000-0000-0000-0000-000000000000	5dc78ab1-68bd-44ff-b1e7-7710878bc275	{"action":"login","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 23:17:39.476014+00	
00000000-0000-0000-0000-000000000000	6c4e3c22-f3e7-430d-8815-af0a4e6dd77f	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-23 23:25:54.987764+00	
00000000-0000-0000-0000-000000000000	218b897b-5691-4a7a-b1b7-a91b6710921f	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 07:44:52.061292+00	
00000000-0000-0000-0000-000000000000	4670f962-b973-45f5-891c-efd22bcb8543	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 07:44:52.064486+00	
00000000-0000-0000-0000-000000000000	895ab14e-32f4-44ca-ad57-8212417d26c7	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 08:41:01.371021+00	
00000000-0000-0000-0000-000000000000	48349896-0d9f-4abb-8f63-2692c989041a	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 08:41:01.377595+00	
00000000-0000-0000-0000-000000000000	53ddb445-5584-412d-a924-5f05e5fc809a	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 08:46:57.305055+00	
00000000-0000-0000-0000-000000000000	953ee1d5-388a-4615-98a2-eaaa233423c2	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 08:46:57.305893+00	
00000000-0000-0000-0000-000000000000	762fd7d8-57db-48ac-b77f-e64f552eb5a6	{"action":"login","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-24 08:51:19.342335+00	
00000000-0000-0000-0000-000000000000	6156d3a1-0a0a-4db5-b27c-a55a191d730d	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 09:39:31.078007+00	
00000000-0000-0000-0000-000000000000	cd0b1f7e-4a92-4263-a421-38dacc4b83b0	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 09:39:31.079434+00	
00000000-0000-0000-0000-000000000000	b3ae2a03-083e-442b-9c7c-09ae855a5832	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-24 10:09:06.045314+00	
00000000-0000-0000-0000-000000000000	3d39d63f-51e6-428d-bb8c-ce8cd0a17cb8	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 10:23:20.889913+00	
00000000-0000-0000-0000-000000000000	8e069d25-8774-43da-9ab5-c2aa7fa2a995	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 10:23:20.890722+00	
00000000-0000-0000-0000-000000000000	f824e215-2b2a-4fd3-b6d0-887f07e38e37	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 10:40:27.538876+00	
00000000-0000-0000-0000-000000000000	c024b0b4-f808-4d33-8db4-101fef4ed812	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 10:40:27.540362+00	
00000000-0000-0000-0000-000000000000	44b130ca-33f3-4b7b-aa9c-1e596ceb59a8	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 11:07:12.279029+00	
00000000-0000-0000-0000-000000000000	1456bc24-ba2a-4b86-91d3-3b852d59bec2	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 11:07:12.282647+00	
00000000-0000-0000-0000-000000000000	d8fea6c6-db8d-45ff-95ad-693d7806ef21	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 11:38:42.007691+00	
00000000-0000-0000-0000-000000000000	4cf1319f-d2ee-49cd-962c-8664054973ae	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 11:38:42.011991+00	
00000000-0000-0000-0000-000000000000	d26e8d53-19db-4aa3-bb54-5d757dd9ef46	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 12:37:07.977231+00	
00000000-0000-0000-0000-000000000000	7aa6ca78-df5c-4c67-b4f9-52d6b8984684	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 13:16:43.160469+00	
00000000-0000-0000-0000-000000000000	6f511d04-5822-49f0-81c7-65c216f588db	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 13:16:43.162842+00	
00000000-0000-0000-0000-000000000000	521f9b04-0295-41c0-835b-7644d6150f01	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 13:26:46.058859+00	
00000000-0000-0000-0000-000000000000	46591996-bb0d-4d17-b1da-015a98fd06c9	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 13:26:46.061273+00	
00000000-0000-0000-0000-000000000000	9771b091-42f3-45b0-81e9-94bac48a2e31	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 14:11:41.021717+00	
00000000-0000-0000-0000-000000000000	6fb7a484-342a-4aa3-9e86-e1daa347ce0c	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 14:11:41.023662+00	
00000000-0000-0000-0000-000000000000	62b29f43-929d-48d3-8db8-290b7634a0d5	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-24 14:53:18.778961+00	
00000000-0000-0000-0000-000000000000	0c871d2b-9c57-4ea8-8a91-4245f13eace0	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 15:12:33.197811+00	
00000000-0000-0000-0000-000000000000	74b85c66-6769-484a-bf21-454e889930e7	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 15:12:33.200511+00	
00000000-0000-0000-0000-000000000000	89fed66e-799b-4647-8d2b-481699c3fd91	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-24 15:55:26.118347+00	
00000000-0000-0000-0000-000000000000	2449f501-a23d-4138-bb56-9c305284ffcf	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 16:10:43.751232+00	
00000000-0000-0000-0000-000000000000	ed2f683f-d6d7-4c77-8ec0-eb8d61f3b11b	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 16:10:43.753211+00	
00000000-0000-0000-0000-000000000000	1af914ca-b011-4018-8d86-6d07c89e1c9c	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 17:08:56.218322+00	
00000000-0000-0000-0000-000000000000	0dc4c4f0-f76f-4e0a-a8a8-8c26341422e9	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 17:08:56.219778+00	
00000000-0000-0000-0000-000000000000	ac1a8560-a291-43c1-89f7-c0754ebf1bba	{"action":"login","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-24 17:15:16.584986+00	
00000000-0000-0000-0000-000000000000	8b8f08f3-87dc-4b69-b086-d979f1018895	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 18:19:49.565162+00	
00000000-0000-0000-0000-000000000000	7dec2241-4dbf-4ea6-8303-318520951fe5	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 18:19:49.568063+00	
00000000-0000-0000-0000-000000000000	344eafab-e971-4af6-afad-ac8c3a0fbad6	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 19:40:54.403072+00	
00000000-0000-0000-0000-000000000000	eea0e614-76c6-4d58-9354-54a5e89a4fd5	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 19:40:54.407562+00	
00000000-0000-0000-0000-000000000000	edb27b28-fdcf-4162-acbc-ac66796a9b87	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 20:39:28.208303+00	
00000000-0000-0000-0000-000000000000	4babc22a-20b1-47ba-9cd4-acd4dd93b38b	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 20:39:28.210383+00	
00000000-0000-0000-0000-000000000000	fa677e04-f88c-4c86-912f-591543651a3a	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 22:20:58.601483+00	
00000000-0000-0000-0000-000000000000	a1f22c2f-12b4-4dfa-994b-6400ec14e879	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 22:20:58.603532+00	
00000000-0000-0000-0000-000000000000	16819c56-6afd-4a7d-a023-02a100bdfcd1	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 22:47:39.118434+00	
00000000-0000-0000-0000-000000000000	a626fbb9-6d83-439a-ae2b-7a773e406d0c	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-24 22:47:39.121475+00	
00000000-0000-0000-0000-000000000000	92126120-8712-410b-b59b-7d78f021f867	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-25 08:13:39.167026+00	
00000000-0000-0000-0000-000000000000	94f36a5a-1112-4b26-8d66-eafb385802f1	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 09:23:58.4616+00	
00000000-0000-0000-0000-000000000000	981c3908-ed12-46c2-87c3-624e7a0ed4ab	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 09:23:58.468484+00	
00000000-0000-0000-0000-000000000000	4323425a-2b46-44a7-92c1-b3799710ee0e	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 09:45:00.487537+00	
00000000-0000-0000-0000-000000000000	daace6cb-21b3-4bbe-9718-b7d45318d159	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 09:45:00.490407+00	
00000000-0000-0000-0000-000000000000	9db4d491-2afe-4f6f-a193-686132e18791	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 09:45:14.194309+00	
00000000-0000-0000-0000-000000000000	4ba7129e-9862-4261-9bac-2613ec66929e	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 09:45:14.194847+00	
00000000-0000-0000-0000-000000000000	c483a2c7-46d0-4a7d-bc8d-1aae07f71bb0	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 10:44:31.245514+00	
00000000-0000-0000-0000-000000000000	9e3ca36c-c66b-42ca-93dc-af12fd640dcb	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 10:44:31.247055+00	
00000000-0000-0000-0000-000000000000	d34d2177-abae-4577-a158-8646c671f5df	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 11:43:03.679293+00	
00000000-0000-0000-0000-000000000000	9c3ea67e-f989-4115-bffa-9add287a61f8	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 11:43:03.680755+00	
00000000-0000-0000-0000-000000000000	f1657a01-acde-4bca-862d-17b233ffd061	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 12:42:09.404115+00	
00000000-0000-0000-0000-000000000000	3c27685c-8b1c-4de3-b8cd-bd1a0bb21712	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 12:42:09.405632+00	
00000000-0000-0000-0000-000000000000	ab74e9d2-bee9-4610-aa45-462d0a52b6f3	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 13:34:19.581436+00	
00000000-0000-0000-0000-000000000000	70b4d076-01df-47ab-87a3-3a973487ae15	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 13:34:19.582901+00	
00000000-0000-0000-0000-000000000000	1dd116c5-2d3f-416d-b389-119948f6ab62	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 14:32:38.657381+00	
00000000-0000-0000-0000-000000000000	6eac3011-80c5-42a4-99a4-8bfd65816af3	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 14:32:38.659391+00	
00000000-0000-0000-0000-000000000000	1c64531a-e4e9-45af-a771-e0cfabe85de0	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 14:32:43.312704+00	
00000000-0000-0000-0000-000000000000	ee71603a-9b1e-462d-b3b7-b24c20aa00df	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 14:32:43.313242+00	
00000000-0000-0000-0000-000000000000	952b5394-90fb-4f5b-ab81-5e451795dbf0	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 16:13:20.543495+00	
00000000-0000-0000-0000-000000000000	34695ffc-6211-4841-9ac4-1b23aeb08343	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 16:13:20.548091+00	
00000000-0000-0000-0000-000000000000	4068bb0c-8024-475f-abaf-a82635c4dfb6	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 17:11:56.814971+00	
00000000-0000-0000-0000-000000000000	8b9d5892-3e64-4d3e-9bc0-7f3e0b391153	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 17:11:56.818735+00	
00000000-0000-0000-0000-000000000000	066ad51d-3b93-4bdd-bb45-b975733635ec	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 18:10:01.161806+00	
00000000-0000-0000-0000-000000000000	3773d585-112b-4ab9-8dee-e81d070bda04	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 18:10:01.164506+00	
00000000-0000-0000-0000-000000000000	af6e4671-eab2-4887-8aa2-b0610b887fa4	{"action":"logout","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-25 18:28:14.081376+00	
00000000-0000-0000-0000-000000000000	16acb844-1b90-4280-bd84-0fd6aad9c1c4	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-25 18:28:22.456195+00	
00000000-0000-0000-0000-000000000000	a9cb6780-5f2a-414b-a188-bef642b0ecb9	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 19:04:27.300408+00	
00000000-0000-0000-0000-000000000000	b5af5875-edd9-47b4-8201-7cbf76f1d427	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 19:04:27.301899+00	
00000000-0000-0000-0000-000000000000	2c0bf6b5-ef99-4690-8214-37898be200d7	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 19:53:19.465922+00	
00000000-0000-0000-0000-000000000000	e66ae1f4-2632-4a3a-abe8-12d2bfe39869	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 19:53:19.468704+00	
00000000-0000-0000-0000-000000000000	1cecb640-4f59-43da-85b7-d785e96ece0d	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 20:52:04.142039+00	
00000000-0000-0000-0000-000000000000	b94854f2-df29-4366-93a4-3a9aa1ad7ac0	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 20:52:04.144267+00	
00000000-0000-0000-0000-000000000000	86fd3b76-40d3-4cbe-9023-ab0376d22d6e	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 21:02:46.085435+00	
00000000-0000-0000-0000-000000000000	36032890-2a42-4bca-9d72-90146cbbe0b2	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 21:02:46.08847+00	
00000000-0000-0000-0000-000000000000	9778f27a-f253-4d7e-8a87-2b05aa3ed02f	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 22:15:57.365625+00	
00000000-0000-0000-0000-000000000000	ea597184-7bcf-44fd-b053-d2c1d7e66106	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-25 22:15:57.367679+00	
00000000-0000-0000-0000-000000000000	80d226bc-72a9-4747-a4f7-28590feb6f2c	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-26 08:19:42.371052+00	
00000000-0000-0000-0000-000000000000	afd45904-d30d-4485-a57f-6d1dd87780b2	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 09:03:02.515131+00	
00000000-0000-0000-0000-000000000000	cdadc68c-a147-47cc-bfad-97da3ebd778d	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 09:03:02.519079+00	
00000000-0000-0000-0000-000000000000	af2adece-eec6-45b3-b036-372e5ebcae33	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 10:01:06.748894+00	
00000000-0000-0000-0000-000000000000	948b5eba-f99c-4341-b379-6d2b6cabe57b	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 10:01:06.751994+00	
00000000-0000-0000-0000-000000000000	c45dcadf-c434-429a-8f5f-92500ae0a822	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 10:32:43.551038+00	
00000000-0000-0000-0000-000000000000	be8ec7bf-c0af-4507-ad03-3f6fed109769	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 10:32:43.552926+00	
00000000-0000-0000-0000-000000000000	7b4dab59-ba2e-46be-b3b0-2474f579baf6	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 11:07:25.186661+00	
00000000-0000-0000-0000-000000000000	769d3a79-c544-498e-9f3c-466a34c58557	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 11:07:25.188205+00	
00000000-0000-0000-0000-000000000000	8c6f757e-1c68-46f9-9e04-00dccbd3a33f	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 12:05:55.547034+00	
00000000-0000-0000-0000-000000000000	fdcc374d-0854-4b4f-98d3-3b148ddae379	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 12:05:55.549043+00	
00000000-0000-0000-0000-000000000000	87ad0299-6b80-4439-b260-7ea163cb097c	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 13:10:56.274593+00	
00000000-0000-0000-0000-000000000000	081c272c-52e7-45a3-a769-c77966dc29a2	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 13:10:56.276744+00	
00000000-0000-0000-0000-000000000000	384e1465-aef2-45bf-b9ab-195c713108ba	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 15:04:26.171718+00	
00000000-0000-0000-0000-000000000000	267d3e43-4f77-4fbe-bd8c-54a3fc0eef55	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 15:04:26.179485+00	
00000000-0000-0000-0000-000000000000	e8764856-632e-4adb-a20f-0761a98f17e2	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 16:06:07.287668+00	
00000000-0000-0000-0000-000000000000	2fb7efdc-9d5e-48cf-ac10-7de76bf6f4ae	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 16:06:07.289762+00	
00000000-0000-0000-0000-000000000000	f065e839-6ce1-4dfe-8a63-ded1ba9e0f51	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 17:23:23.431433+00	
00000000-0000-0000-0000-000000000000	4242d287-a9a6-4a42-b6a0-e7999fed257e	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 17:23:23.432937+00	
00000000-0000-0000-0000-000000000000	298550d0-bf11-4971-bace-3d84dc5408c2	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 17:57:37.190953+00	
00000000-0000-0000-0000-000000000000	bf29a775-d7c0-41c7-9fd7-a97fb6537385	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 17:57:37.192449+00	
00000000-0000-0000-0000-000000000000	14c42db8-2562-4ee0-9740-7ff0ab6d3e85	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 18:56:54.925361+00	
00000000-0000-0000-0000-000000000000	346a196e-6c1d-43e0-b84e-12b1aeef1fe1	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 18:56:54.926757+00	
00000000-0000-0000-0000-000000000000	fc8b2c35-538a-441b-8e80-8e4632cc7116	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 19:54:54.767468+00	
00000000-0000-0000-0000-000000000000	b2e92e74-2f06-484b-97b8-837e60f385be	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 19:54:54.769652+00	
00000000-0000-0000-0000-000000000000	dbf97575-7592-4588-b096-581b78b8649c	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 22:36:57.315491+00	
00000000-0000-0000-0000-000000000000	ff0d9354-f9e9-4075-8b7f-f206c785c180	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 22:36:57.317638+00	
00000000-0000-0000-0000-000000000000	dd71b316-4138-42bd-a294-57dece70bf74	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 23:38:12.947922+00	
00000000-0000-0000-0000-000000000000	0b77426f-826f-4167-88d7-80973ec978e8	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-26 23:38:12.952169+00	
00000000-0000-0000-0000-000000000000	d05a354e-b883-4f08-94c4-ebb6b07b2884	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 08:50:21.625357+00	
00000000-0000-0000-0000-000000000000	bb81f858-dca5-4a2a-9b6c-504a068c3947	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 08:50:21.631067+00	
00000000-0000-0000-0000-000000000000	6c3fa831-92ac-42c5-865a-0e10845107a5	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 09:54:34.09526+00	
00000000-0000-0000-0000-000000000000	c8964744-b924-48d3-8402-09be4ba1f743	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 09:54:34.097566+00	
00000000-0000-0000-0000-000000000000	4f7f125b-fbc9-4f05-9317-782005c7cc19	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 10:12:48.359168+00	
00000000-0000-0000-0000-000000000000	837c03cb-d6fc-4e75-b082-78348ba0028e	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 10:12:48.363425+00	
00000000-0000-0000-0000-000000000000	dc0c6f4f-b1b3-48aa-a9ab-ec00c0198980	{"action":"logout","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-27 10:53:22.774113+00	
00000000-0000-0000-0000-000000000000	d9268dc7-edc4-42e2-b868-85481cb8bce6	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-27 10:53:30.788356+00	
00000000-0000-0000-0000-000000000000	b1e5114b-5298-4b11-888e-51787affcf5d	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 11:52:05.591499+00	
00000000-0000-0000-0000-000000000000	fd04b4d3-0938-4fa6-978a-e9e996462028	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 11:52:05.595402+00	
00000000-0000-0000-0000-000000000000	92489f45-f039-46a3-bed2-f040a6181510	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 12:52:18.666503+00	
00000000-0000-0000-0000-000000000000	d02371b6-df5b-4ac7-87dc-657eeb28f385	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 12:52:18.667395+00	
00000000-0000-0000-0000-000000000000	5c538886-e6e8-4d8f-9a75-89ece3920e9d	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-27 13:36:56.737346+00	
00000000-0000-0000-0000-000000000000	9bcd77df-59dc-42e6-9a5d-2cd60a9335d0	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 14:50:30.440635+00	
00000000-0000-0000-0000-000000000000	b1a1bd88-5a66-4db2-8998-8ebdf710161c	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 14:50:30.443908+00	
00000000-0000-0000-0000-000000000000	aac08f00-e543-44bb-917b-410bf8189c40	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 15:02:04.644081+00	
00000000-0000-0000-0000-000000000000	f7148047-b26f-4409-940a-b27161cbad05	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 15:02:04.646145+00	
00000000-0000-0000-0000-000000000000	295edb29-a90d-4243-966a-584381eab0d2	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 15:56:06.365448+00	
00000000-0000-0000-0000-000000000000	8d68d5e7-a8dc-4a24-9872-a6839cd2106a	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 15:56:06.369988+00	
00000000-0000-0000-0000-000000000000	bdaf486e-0469-46b2-877f-0c0c89f99f6a	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 16:07:36.088858+00	
00000000-0000-0000-0000-000000000000	9c65e489-e7a5-4198-bd8d-96bae00e7f72	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 16:07:36.092721+00	
00000000-0000-0000-0000-000000000000	88d1285b-d0f6-4309-b82a-5b3c2cd35e0a	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 16:54:50.406936+00	
00000000-0000-0000-0000-000000000000	d75b9816-f8b2-4f01-b4d6-74c277c33a04	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 16:54:50.410746+00	
00000000-0000-0000-0000-000000000000	0669509d-eb47-4b37-aef2-cf5cb344c7f4	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-27 19:03:03.765523+00	
00000000-0000-0000-0000-000000000000	7bfa7304-6bde-4db5-ba19-ed1a2cbf6855	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 21:03:57.682473+00	
00000000-0000-0000-0000-000000000000	3457928d-e046-4279-99ae-2275bed4d836	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 21:03:57.685472+00	
00000000-0000-0000-0000-000000000000	ef1f2d16-ce09-43db-9596-ceaedd6b2884	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 22:22:24.41826+00	
00000000-0000-0000-0000-000000000000	8221454f-d148-44fa-af04-56343d91d1c8	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 22:22:24.422148+00	
00000000-0000-0000-0000-000000000000	c1606ff2-fe6f-4aec-971a-1a29adc56f3e	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 23:30:07.353796+00	
00000000-0000-0000-0000-000000000000	76bb8845-12f4-44c1-ae52-4e8ba2b2cd0c	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-27 23:30:07.356478+00	
00000000-0000-0000-0000-000000000000	f5a7f2be-e8c7-48d5-b1b2-45598201a90d	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 00:38:11.539156+00	
00000000-0000-0000-0000-000000000000	88973686-40a8-4a0d-9a76-88894bfa2184	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 00:38:11.543388+00	
00000000-0000-0000-0000-000000000000	bbadcf75-33c3-4a15-98bd-810c15041ca2	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 01:38:51.139393+00	
00000000-0000-0000-0000-000000000000	ef0b97c8-a0ce-44c7-9dd0-41fe7a08e69d	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 01:38:51.141345+00	
00000000-0000-0000-0000-000000000000	783b69e4-a236-4256-928b-0a5041f8af98	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 02:39:35.682897+00	
00000000-0000-0000-0000-000000000000	0f565f91-79a3-412d-8c37-8b353b591edb	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 02:39:35.684311+00	
00000000-0000-0000-0000-000000000000	e37eb4c4-8fe8-4429-bd78-1ab3f63542e6	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 03:40:53.931483+00	
00000000-0000-0000-0000-000000000000	cf759915-6c34-4eea-ae72-63d60c8f0f28	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 03:40:53.933063+00	
00000000-0000-0000-0000-000000000000	696e3132-b7c4-4df7-b948-2a818b110a0e	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 04:38:53.980825+00	
00000000-0000-0000-0000-000000000000	148ae5cc-f909-4e93-85d3-b43418c1d410	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 04:38:53.983596+00	
00000000-0000-0000-0000-000000000000	e5d7df2c-4c37-4288-8ad1-d4a2b9ef8eba	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 05:41:34.347416+00	
00000000-0000-0000-0000-000000000000	166ea11d-d701-489c-8a39-093686336107	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 05:41:34.349484+00	
00000000-0000-0000-0000-000000000000	393983c7-b238-4a89-a123-ceb517d7ca26	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 06:39:53.433307+00	
00000000-0000-0000-0000-000000000000	505ab372-fe48-4e0f-a71c-ab68a5bb70a6	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 06:39:53.43707+00	
00000000-0000-0000-0000-000000000000	fb0c5b3c-5924-4076-88b2-806ec37b2063	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 07:38:01.289744+00	
00000000-0000-0000-0000-000000000000	0c4ecd93-9095-4927-9ff4-2467677fe4d4	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 07:38:01.292981+00	
00000000-0000-0000-0000-000000000000	7749b727-0703-409a-ab20-ee56b1e6667e	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 08:00:53.314968+00	
00000000-0000-0000-0000-000000000000	2c5fdccc-d7a6-4cf4-a2c5-d0a184efa4e4	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 08:00:53.317655+00	
00000000-0000-0000-0000-000000000000	80e4c2f3-301a-41f8-ab6c-5fd0a146bc01	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 08:36:57.609083+00	
00000000-0000-0000-0000-000000000000	7996c4ec-a823-40f6-ae89-3a35bba93eac	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 08:36:57.615883+00	
00000000-0000-0000-0000-000000000000	cb457a87-143d-4d93-9069-d775f0bec213	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 09:35:28.221661+00	
00000000-0000-0000-0000-000000000000	6f9a4fec-edaa-4d2c-9320-7f63b6d3e97d	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 09:35:28.223662+00	
00000000-0000-0000-0000-000000000000	387754e5-561b-4606-be83-18559c889396	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 10:39:32.216054+00	
00000000-0000-0000-0000-000000000000	33f8176b-c20a-4cac-9ec4-5b759209c3eb	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 10:39:32.218619+00	
00000000-0000-0000-0000-000000000000	6fae540a-ccf3-4be8-8c28-6c669560f198	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 11:39:29.623144+00	
00000000-0000-0000-0000-000000000000	270648e5-0e74-4f9c-a698-d8c42c77fa01	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 11:39:29.625207+00	
00000000-0000-0000-0000-000000000000	d7f5742f-eb76-47b4-94f4-b0b2828a43b3	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 12:37:59.499259+00	
00000000-0000-0000-0000-000000000000	5fa1ebb2-8554-458f-8db2-54094afdbbbf	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 12:37:59.50077+00	
00000000-0000-0000-0000-000000000000	c835c569-f27d-45b5-af95-04a8ee936cef	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 13:54:29.627391+00	
00000000-0000-0000-0000-000000000000	4f800033-892e-4de3-99c1-f9f303237330	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 13:54:29.628855+00	
00000000-0000-0000-0000-000000000000	a78dffa3-8b42-440f-b747-f0d2ede61010	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 14:57:45.558028+00	
00000000-0000-0000-0000-000000000000	c01d26c5-995b-464e-9cdf-cbfe506e57a3	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 14:57:45.559485+00	
00000000-0000-0000-0000-000000000000	5cbe6285-11f6-4bf6-a612-15e051240eb3	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 15:56:03.714917+00	
00000000-0000-0000-0000-000000000000	19937624-1f59-4843-9169-42c949028e6c	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 15:56:03.717495+00	
00000000-0000-0000-0000-000000000000	7441743a-398f-46cc-8d6a-baa47624589c	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-28 16:31:24.00895+00	
00000000-0000-0000-0000-000000000000	3fdb7a05-6d0e-455b-af06-f4df94297d6b	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 16:54:35.516224+00	
00000000-0000-0000-0000-000000000000	7bad03c2-495d-4d13-9dec-d684809586a8	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 16:54:35.517824+00	
00000000-0000-0000-0000-000000000000	cb6d54bc-3a00-466c-8574-4333d2fe1248	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 19:24:36.118258+00	
00000000-0000-0000-0000-000000000000	ee308d63-eced-47ff-ade2-9355cd6973a7	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 19:24:36.120858+00	
00000000-0000-0000-0000-000000000000	e08be204-3ca8-4c3c-9691-85e1cf17f25b	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 20:15:09.518774+00	
00000000-0000-0000-0000-000000000000	e8f35dd9-7fb3-46b5-a075-7b119218cda7	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 20:15:09.522218+00	
00000000-0000-0000-0000-000000000000	7957b391-2bcb-4814-819d-346a23c50578	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 20:30:56.502233+00	
00000000-0000-0000-0000-000000000000	06b87fd0-d286-4185-a382-2d4915224b31	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 20:30:56.503549+00	
00000000-0000-0000-0000-000000000000	2a346ce8-1116-4f27-b652-5671771b8831	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 21:29:27.819423+00	
00000000-0000-0000-0000-000000000000	c685522a-62a4-4089-ab5b-46e94b75e661	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 21:29:27.822752+00	
00000000-0000-0000-0000-000000000000	234a700e-d794-4da6-9889-f6dc8f7ecce1	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 22:37:05.196838+00	
00000000-0000-0000-0000-000000000000	a6e92142-f8e9-402d-9112-d24f788df4a3	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 22:37:05.199438+00	
00000000-0000-0000-0000-000000000000	236b2ea7-cb4e-46cf-9b0c-32e797ab56a3	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 23:36:50.66218+00	
00000000-0000-0000-0000-000000000000	0587aff5-3ef5-48d4-8d99-a115607a9455	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-28 23:36:50.663758+00	
00000000-0000-0000-0000-000000000000	8c0f4846-1bb9-44ee-a3f9-2a4a1e139625	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 00:35:33.958358+00	
00000000-0000-0000-0000-000000000000	3bce98a0-86f6-447d-8a24-ca195be1525d	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 00:35:33.961521+00	
00000000-0000-0000-0000-000000000000	319489ff-5696-4d16-99ef-59a220d17b92	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-29 00:36:26.129173+00	
00000000-0000-0000-0000-000000000000	9555a01a-5634-4378-8ecf-9b1bdf0a79d4	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 08:10:02.889719+00	
00000000-0000-0000-0000-000000000000	d2e3d5e9-0980-402e-9517-332b91aced4c	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 08:10:02.901052+00	
00000000-0000-0000-0000-000000000000	c7c25cce-c8e0-446d-81b0-787dcf708383	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 08:41:02.284865+00	
00000000-0000-0000-0000-000000000000	eb1170f0-7ece-4f66-82a3-431e6a251214	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 08:41:02.287113+00	
00000000-0000-0000-0000-000000000000	8f033728-47b9-4560-bae8-f7325f484aab	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 11:52:37.792651+00	
00000000-0000-0000-0000-000000000000	9ce824a2-019a-4c41-b951-55e72117d20c	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 11:52:37.795181+00	
00000000-0000-0000-0000-000000000000	7794c3b7-dbe4-42d6-9014-3dd97496dce2	{"action":"user_signedup","actor_id":"049357d9-42bc-46ae-a6bf-3e910b849fd1","actor_username":"jpkarabetsos@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2025-07-29 12:24:19.461162+00	
00000000-0000-0000-0000-000000000000	d3ba5c8b-3552-42e7-b39f-dd918d8646d0	{"action":"login","actor_id":"049357d9-42bc-46ae-a6bf-3e910b849fd1","actor_username":"jpkarabetsos@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-29 12:24:19.473948+00	
00000000-0000-0000-0000-000000000000	ed9a7eac-8b96-4705-ba5b-841972616738	{"action":"logout","actor_id":"049357d9-42bc-46ae-a6bf-3e910b849fd1","actor_username":"jpkarabetsos@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-29 12:24:19.879938+00	
00000000-0000-0000-0000-000000000000	b0dfe3ad-920e-481e-8abb-41c2cdb9e5da	{"action":"login","actor_id":"049357d9-42bc-46ae-a6bf-3e910b849fd1","actor_username":"jpkarabetsos@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-29 12:24:32.723417+00	
00000000-0000-0000-0000-000000000000	a5f0ca08-31e2-4a2c-b493-485354a93d69	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-29 12:26:34.539686+00	
00000000-0000-0000-0000-000000000000	29c8adcc-39e6-4b3d-9ab0-4fb8ea40fd7e	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-29 12:30:05.303176+00	
00000000-0000-0000-0000-000000000000	16d3bd24-7617-4693-9b70-49e4421ffcac	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"jpkarabetsos@gmail.com","user_id":"049357d9-42bc-46ae-a6bf-3e910b849fd1","user_phone":""}}	2025-07-29 12:30:56.483441+00	
00000000-0000-0000-0000-000000000000	10a7b9a3-2d41-4c34-b219-287fc7191158	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-29 14:56:51.687043+00	
00000000-0000-0000-0000-000000000000	bd63a886-99df-4e5e-9bb5-af7886253cac	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 17:32:10.67766+00	
00000000-0000-0000-0000-000000000000	199694aa-298f-44b8-893e-693682d27217	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 17:32:10.682365+00	
00000000-0000-0000-0000-000000000000	6eda26f6-e2e6-4692-bc1a-66c19e5aae37	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-29 18:14:24.141072+00	
00000000-0000-0000-0000-000000000000	26d83034-76f0-4ebc-82e2-948c7739b325	{"action":"user_signedup","actor_id":"e73c24e8-e2a8-4a3d-af99-da531a9db9f0","actor_username":"jpkarabetsos@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2025-07-29 18:14:46.89087+00	
00000000-0000-0000-0000-000000000000	e45a7bc5-2e0e-42cf-ae79-d282180b5bac	{"action":"login","actor_id":"e73c24e8-e2a8-4a3d-af99-da531a9db9f0","actor_username":"jpkarabetsos@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-29 18:14:46.894535+00	
00000000-0000-0000-0000-000000000000	85ecd0dc-4ccc-40e5-87ac-a5ff57735639	{"action":"logout","actor_id":"e73c24e8-e2a8-4a3d-af99-da531a9db9f0","actor_username":"jpkarabetsos@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-29 18:14:47.203185+00	
00000000-0000-0000-0000-000000000000	3383105e-f2bb-4f17-9a77-5748afa59635	{"action":"login","actor_id":"e73c24e8-e2a8-4a3d-af99-da531a9db9f0","actor_username":"jpkarabetsos@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-29 18:14:50.801596+00	
00000000-0000-0000-0000-000000000000	27ec619e-6d65-40d8-a965-17e75f2ea492	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-29 18:15:01.668605+00	
00000000-0000-0000-0000-000000000000	08c56ca6-f168-454b-b079-cef08aa43672	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 18:30:19.526799+00	
00000000-0000-0000-0000-000000000000	ff19d42c-4b4b-41ff-a86f-6cfadde974b4	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 18:30:19.530009+00	
00000000-0000-0000-0000-000000000000	f63bad3a-cd9a-471c-8f0e-068a639872d7	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 19:01:48.46388+00	
00000000-0000-0000-0000-000000000000	7f51288d-5b3c-4f0d-98dd-fe8b9df4e597	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 19:01:48.468441+00	
00000000-0000-0000-0000-000000000000	73aa6a86-d009-4a78-b022-d512617e0022	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 20:00:09.952181+00	
00000000-0000-0000-0000-000000000000	660d6ab4-9fa8-4dda-b9d1-90a54d3d4dea	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 20:00:09.954186+00	
00000000-0000-0000-0000-000000000000	70941084-5327-4f83-9ac4-000057ee061a	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 21:07:07.488498+00	
00000000-0000-0000-0000-000000000000	f1585d57-d2ae-42cd-8405-bc3c57b7b4f9	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 21:07:07.491196+00	
00000000-0000-0000-0000-000000000000	38562d5b-d3f0-4d1f-be46-63cb3a1a5fc9	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"jpkarabetsos@gmail.com","user_id":"e73c24e8-e2a8-4a3d-af99-da531a9db9f0","user_phone":""}}	2025-07-29 21:07:27.413585+00	
00000000-0000-0000-0000-000000000000	cb2e3b2f-5eea-4cbf-9e68-b48dbf55276d	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 21:12:33.104043+00	
00000000-0000-0000-0000-000000000000	c23b5272-849e-4760-8847-78a3b6c644c8	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 21:12:33.106298+00	
00000000-0000-0000-0000-000000000000	42d78463-f56c-4c53-a76c-ac9c673d883d	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 22:10:57.521455+00	
00000000-0000-0000-0000-000000000000	98be29bd-29c4-403f-a414-21f2fba1c0a4	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 22:10:57.523013+00	
00000000-0000-0000-0000-000000000000	327bc3d3-8e31-487f-ac50-8075777c5cf2	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 22:20:30.583327+00	
00000000-0000-0000-0000-000000000000	05bf28d5-effb-419a-a1e2-e41cfa5864cb	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 22:20:30.584189+00	
00000000-0000-0000-0000-000000000000	b824926c-935f-424d-9ebc-9f636b4b3a66	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 23:08:57.538479+00	
00000000-0000-0000-0000-000000000000	a5bc41ac-f24e-4d10-a8be-a21c9453d9a9	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-29 23:08:57.539948+00	
00000000-0000-0000-0000-000000000000	c1bcdc82-3c11-4e56-8775-ec5546d9dc81	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 00:14:04.905907+00	
00000000-0000-0000-0000-000000000000	bc7b38fe-76ba-4f25-aaf8-0e70a1b93408	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 00:14:04.907403+00	
00000000-0000-0000-0000-000000000000	a2d1a163-c1a1-4c9a-a7ee-97637ffa473f	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 01:12:20.039858+00	
00000000-0000-0000-0000-000000000000	a619fcf5-38c3-4a33-a045-500771bea5ec	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 01:12:20.048036+00	
00000000-0000-0000-0000-000000000000	4fd71436-6945-4770-94f5-c83186bc0bbd	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 02:14:09.211232+00	
00000000-0000-0000-0000-000000000000	081172ea-932f-4679-8736-1dda4d2e6e1c	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 02:14:09.216102+00	
00000000-0000-0000-0000-000000000000	fe9257f1-062c-433b-97e8-324db59e6c87	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 03:12:39.206077+00	
00000000-0000-0000-0000-000000000000	423afb8d-81c6-4317-8c2a-9b83e8f9669f	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 03:12:39.209608+00	
00000000-0000-0000-0000-000000000000	18cd4bd7-d366-405e-a297-1bbc6b10172b	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 04:11:03.595032+00	
00000000-0000-0000-0000-000000000000	cd256b2a-e4fc-4eb9-af58-5ed360ebe915	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 04:11:03.598256+00	
00000000-0000-0000-0000-000000000000	797a7d79-7ead-49b1-9f29-5e2281fb3705	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 05:09:26.498857+00	
00000000-0000-0000-0000-000000000000	d88ff619-342f-41ff-8597-c4ac341490c6	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 05:09:26.501798+00	
00000000-0000-0000-0000-000000000000	963a6698-73f3-4f67-a96e-913cc43c5b1f	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 05:45:37.670268+00	
00000000-0000-0000-0000-000000000000	9c40de22-b852-4fb5-8637-3d7f2e7301a6	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 05:45:37.671968+00	
00000000-0000-0000-0000-000000000000	2d5e5afb-2dbc-480f-819a-a59ed9d41957	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 06:07:35.8694+00	
00000000-0000-0000-0000-000000000000	77af06d5-7b28-4c3f-8064-600c0a42048b	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 06:07:35.872897+00	
00000000-0000-0000-0000-000000000000	39458fa2-be49-4417-b2ff-1b2f573177c1	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 07:05:35.734976+00	
00000000-0000-0000-0000-000000000000	eccf11e5-7f26-4446-9e9a-e117a315f324	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 07:05:35.738119+00	
00000000-0000-0000-0000-000000000000	32cfa971-a99f-4008-b7f3-9fa1eb8944a9	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 08:03:35.751377+00	
00000000-0000-0000-0000-000000000000	34135ec9-68a5-4238-bd53-40bdbdeae5ab	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 08:03:35.754137+00	
00000000-0000-0000-0000-000000000000	76ad6e91-2e4f-47d5-88ad-6697afdd6681	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 09:01:35.729128+00	
00000000-0000-0000-0000-000000000000	a0688934-27e5-4b69-b563-3bf2fab2abe2	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 09:01:35.729886+00	
00000000-0000-0000-0000-000000000000	5117d614-c8a5-40a3-b5e2-9faeba0b517c	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 09:59:35.783205+00	
00000000-0000-0000-0000-000000000000	e437556d-454b-4194-a65e-5d085558b2e7	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 09:59:35.784649+00	
00000000-0000-0000-0000-000000000000	40d8d621-37ab-48c5-a498-cf976865c6a3	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 10:57:35.760108+00	
00000000-0000-0000-0000-000000000000	703f6a6c-33fe-4e09-8d07-8176bb5fd36f	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 10:57:35.770971+00	
00000000-0000-0000-0000-000000000000	014aeac7-87c4-4eee-82e2-7865cf5d9a9e	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 11:20:28.830223+00	
00000000-0000-0000-0000-000000000000	2d1ede48-d69d-4c13-8165-4bd2b87d4b2b	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 11:20:28.832971+00	
00000000-0000-0000-0000-000000000000	97b1d7eb-a5a6-49ae-86df-962bf9154b94	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 12:46:18.07371+00	
00000000-0000-0000-0000-000000000000	3c78a1b8-77ba-4e5a-8767-47bd7c2e1b10	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 12:46:18.074496+00	
00000000-0000-0000-0000-000000000000	1f42ed3f-3082-4ff1-90f8-d745c4a65d8f	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 13:15:23.415335+00	
00000000-0000-0000-0000-000000000000	9aed3fe7-a20b-48eb-9ed0-cb52b11c723b	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 13:15:23.416152+00	
00000000-0000-0000-0000-000000000000	8d400d51-9890-4379-9f84-035a2950aa80	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 13:16:19.07292+00	
00000000-0000-0000-0000-000000000000	583baa2f-4ec8-4c1b-bb0f-b0dd85ac4a7d	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 13:16:19.0735+00	
00000000-0000-0000-0000-000000000000	7c4fbd42-1b90-464d-8ed0-612282667432	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 13:55:40.975196+00	
00000000-0000-0000-0000-000000000000	cef86d32-9849-45a4-9083-390b52a57cb9	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 13:55:40.978179+00	
00000000-0000-0000-0000-000000000000	00ec2b58-14c9-41e2-ae1e-a3443b97ed32	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 14:15:46.84193+00	
00000000-0000-0000-0000-000000000000	faa681b6-74af-4acb-b6b5-1805e059af13	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 14:15:46.845219+00	
00000000-0000-0000-0000-000000000000	2efd041b-4307-48d6-954e-f583d2cd4c35	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 14:57:02.146607+00	
00000000-0000-0000-0000-000000000000	63442d59-eeee-4d51-9f7c-74d4aaa61921	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 14:57:02.149927+00	
00000000-0000-0000-0000-000000000000	52d0adc7-e1fc-48c6-8b21-b615fcc8f6ca	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 15:14:08.402773+00	
00000000-0000-0000-0000-000000000000	dc292d41-87df-4dfd-81a8-44c2256df24b	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 15:14:08.406124+00	
00000000-0000-0000-0000-000000000000	81bb0f36-9261-405e-a4df-cb041e346f13	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 16:17:50.199111+00	
00000000-0000-0000-0000-000000000000	8d1670ef-2388-4a92-b4e3-5d60c5b073ff	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 16:17:50.203383+00	
00000000-0000-0000-0000-000000000000	a1d3671f-f60a-4c32-8c24-d5b54de82bab	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 17:16:21.976895+00	
00000000-0000-0000-0000-000000000000	47e38323-4dfb-4ad2-8070-c6172705fca0	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 17:16:21.98506+00	
00000000-0000-0000-0000-000000000000	9c850194-b4d5-494f-b341-590f17577f08	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 18:15:05.555681+00	
00000000-0000-0000-0000-000000000000	028ae621-2949-4c02-842a-84af35511bb7	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 18:15:05.558437+00	
00000000-0000-0000-0000-000000000000	21c47817-0e75-4dd7-8378-1069b8c3bc86	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 19:14:43.930067+00	
00000000-0000-0000-0000-000000000000	503ea2c6-0ed8-400b-86ea-3369af628cce	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 19:14:43.933308+00	
00000000-0000-0000-0000-000000000000	90f88cc1-ce5a-4546-862e-6a43a5176a9e	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-30 19:26:30.895292+00	
00000000-0000-0000-0000-000000000000	8e0daf10-e070-4fb2-aa76-4ab87d545154	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 20:28:45.277359+00	
00000000-0000-0000-0000-000000000000	61c5abcd-2b3f-4452-ba66-116c9567b695	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 20:28:45.282981+00	
00000000-0000-0000-0000-000000000000	e5c6c7b9-31bf-462d-ac70-c45eae9b5e58	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 21:01:08.425735+00	
00000000-0000-0000-0000-000000000000	8ff9a610-943b-46c4-80dd-cb3c1fe6b0dc	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 21:01:08.429728+00	
00000000-0000-0000-0000-000000000000	08a8e7c1-3101-40fb-9bf9-0db8516a8d7a	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 21:27:43.716759+00	
00000000-0000-0000-0000-000000000000	ee507eb1-381b-4d55-9f17-0c5647bd2126	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 21:27:43.719178+00	
00000000-0000-0000-0000-000000000000	35f61b33-7bc1-4377-af6a-d9d7b167d759	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 21:33:48.952778+00	
00000000-0000-0000-0000-000000000000	845e117c-3be3-4d9c-a238-28e3e4acff57	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-30 21:33:48.954821+00	
00000000-0000-0000-0000-000000000000	1ad8b3ae-1692-4e9b-a094-7edf4ede6709	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 05:52:53.209642+00	
00000000-0000-0000-0000-000000000000	c0117b75-a377-4c93-aef2-1a467692d427	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 05:52:53.214912+00	
00000000-0000-0000-0000-000000000000	b74bac08-c768-4b14-a781-6bd95dc158f2	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 06:43:24.295448+00	
00000000-0000-0000-0000-000000000000	d3637c77-e8b5-4e48-8ed1-c10fc9fd774a	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 06:43:24.298833+00	
00000000-0000-0000-0000-000000000000	aeed384e-ac17-4f9a-bfd7-0a0739295e80	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 06:44:03.343856+00	
00000000-0000-0000-0000-000000000000	4b72acc7-7e8f-4c3c-b402-3e82c760ef0f	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 06:44:03.344409+00	
00000000-0000-0000-0000-000000000000	44d3f3e1-9013-4450-861a-4fe9dc2687e7	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 07:44:27.670469+00	
00000000-0000-0000-0000-000000000000	64454a45-b47b-4df0-ab63-57ae51575ca9	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 07:44:27.67384+00	
00000000-0000-0000-0000-000000000000	0394002d-5eea-497b-be37-eeb437c00849	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 08:30:23.790156+00	
00000000-0000-0000-0000-000000000000	95c8de8c-8250-418f-8ed2-f1ea96b0db19	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 08:30:23.792818+00	
00000000-0000-0000-0000-000000000000	554a85f7-1991-45bc-ad87-b06c8b2166f3	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 09:28:49.437162+00	
00000000-0000-0000-0000-000000000000	6acb6f60-cebc-4a5f-9b8a-98f5ddc5fe54	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 09:28:49.439823+00	
00000000-0000-0000-0000-000000000000	295e8f7a-8518-4d86-a11b-a236082c5c6e	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 10:07:08.266948+00	
00000000-0000-0000-0000-000000000000	71fb7ed9-587b-4c00-bced-d243d2cdbf8c	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 10:07:08.270245+00	
00000000-0000-0000-0000-000000000000	fa94997f-2233-47e3-98a9-09931466d6fc	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 11:05:42.887945+00	
00000000-0000-0000-0000-000000000000	713e2725-095c-49ec-a34d-49c213a505d8	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 11:05:42.891105+00	
00000000-0000-0000-0000-000000000000	1618eab6-4d0c-4107-bdf6-b46818e01148	{"action":"token_refreshed","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 12:22:07.275672+00	
00000000-0000-0000-0000-000000000000	838cea0e-5ccc-4efc-9232-e618a5bbfe33	{"action":"token_revoked","actor_id":"c09b6a16-1e12-4c16-88e0-1d4c0364be1f","actor_username":"mzisis01@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 12:22:07.28177+00	
00000000-0000-0000-0000-000000000000	9b301df3-e7bd-4ca2-bb1f-903ebfb22a01	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 12:24:01.270512+00	
00000000-0000-0000-0000-000000000000	9ef9b6ed-52f6-41fa-b37b-68a9b4962afc	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 12:24:01.271289+00	
00000000-0000-0000-0000-000000000000	800de4d8-8a73-4480-8711-6dd1b288b43b	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-31 12:35:19.133161+00	
00000000-0000-0000-0000-000000000000	540ba546-56b7-4818-b761-6cb3390cb5b6	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-31 13:04:23.882891+00	
00000000-0000-0000-0000-000000000000	9b0c04e5-7fab-4066-9260-d274c742780c	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 13:27:41.21701+00	
00000000-0000-0000-0000-000000000000	7061b68a-ba67-4835-902e-eaba412ae463	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 13:27:41.220946+00	
00000000-0000-0000-0000-000000000000	f1f3c711-8e2a-4796-b201-05a339741262	{"action":"logout","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-31 13:30:04.531141+00	
00000000-0000-0000-0000-000000000000	cd24d8a0-4e08-4770-a99b-d0a03600802a	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-31 13:30:54.478668+00	
00000000-0000-0000-0000-000000000000	9f9ff227-dd21-41f2-84b6-d70b752ea463	{"action":"logout","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-07-31 13:34:41.268687+00	
00000000-0000-0000-0000-000000000000	36b66999-d7ff-45cc-8d82-f7cdbd7aa9b0	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-31 13:41:03.831898+00	
00000000-0000-0000-0000-000000000000	ce435fa7-dce4-424b-bcfe-4177da7d7da0	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 14:40:22.165464+00	
00000000-0000-0000-0000-000000000000	3aa900c0-b52d-4755-8a73-1d0c5e36be60	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 14:40:22.167004+00	
00000000-0000-0000-0000-000000000000	3ea86e20-6511-4aef-9d65-24acef5a1b6a	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-31 15:33:57.120235+00	
00000000-0000-0000-0000-000000000000	25b826e7-92f3-4103-9390-ad0212f8fb21	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-31 15:38:04.002544+00	
00000000-0000-0000-0000-000000000000	cf28002c-0704-469f-af39-0e252cf73584	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 15:40:39.509895+00	
00000000-0000-0000-0000-000000000000	bc7983ad-28a6-4770-8b89-984e17b164c1	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 15:40:39.511414+00	
00000000-0000-0000-0000-000000000000	d6ee12e9-2870-4947-825f-22ae620972b6	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 16:44:10.710982+00	
00000000-0000-0000-0000-000000000000	f16a51ba-2cfa-4bbe-af1a-9925a26f3997	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 16:44:10.714181+00	
00000000-0000-0000-0000-000000000000	42465dc5-43a8-4672-b3ed-f5424d6e34b8	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 17:33:48.20418+00	
00000000-0000-0000-0000-000000000000	cae0381a-dc7b-4932-a371-115aa3fb6457	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 17:33:48.209525+00	
00000000-0000-0000-0000-000000000000	af000ee1-74e5-4db9-bb7e-644d10ba69a6	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 17:42:48.301216+00	
00000000-0000-0000-0000-000000000000	02ee9b85-5035-444e-a5e7-dae75944c746	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 17:42:48.303342+00	
00000000-0000-0000-0000-000000000000	226ba03e-1ec0-4f41-a278-947467bbbbe4	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-31 18:52:45.555507+00	
00000000-0000-0000-0000-000000000000	31af7bdb-bc5a-4ed3-a838-7a98a39a40c8	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 18:58:57.317348+00	
00000000-0000-0000-0000-000000000000	c1e6e943-c0c8-49d9-bce4-2e65e3618300	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 18:58:57.318859+00	
00000000-0000-0000-0000-000000000000	a7ce8e24-9f11-4fcb-9949-dab6a9f168d4	{"action":"login","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-07-31 18:59:17.120548+00	
00000000-0000-0000-0000-000000000000	cc623568-bdea-4ac9-b942-b6359db00d00	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 19:58:05.283077+00	
00000000-0000-0000-0000-000000000000	161ea2fa-9622-489c-ba1d-588d95c64913	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 19:58:05.286401+00	
00000000-0000-0000-0000-000000000000	fc6a5ab6-0937-472a-ab01-f77a3f1cf273	{"action":"token_refreshed","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 20:22:34.980477+00	
00000000-0000-0000-0000-000000000000	86c3f368-b23f-45ac-9642-9434fae84708	{"action":"token_revoked","actor_id":"b64bb7d2-efc7-444b-8e42-dd9d1f82c426","actor_username":"karapantelis21@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-07-31 20:22:34.983789+00	
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
b64bb7d2-efc7-444b-8e42-dd9d1f82c426	b64bb7d2-efc7-444b-8e42-dd9d1f82c426	{"sub": "b64bb7d2-efc7-444b-8e42-dd9d1f82c426", "name": "Pantelis", "email": "karapantelis21@gmail.com", "email_verified": false, "phone_verified": false}	email	2025-07-22 08:26:46.902307+00	2025-07-22 08:26:46.903281+00	2025-07-22 08:26:46.903281+00	0f07bba2-6e53-4c43-b644-005744766373
4d9e7ea6-120c-4dd7-816f-d1525592af78	4d9e7ea6-120c-4dd7-816f-d1525592af78	{"sub": "4d9e7ea6-120c-4dd7-816f-d1525592af78", "name": "Γεωργία", "email": "gokollia@gmail.com", "email_verified": false, "phone_verified": false}	email	2025-07-23 18:50:54.23008+00	2025-07-23 18:50:54.230124+00	2025-07-23 18:50:54.230124+00	58dc116c-6231-4cee-8a92-fefa4f128588
c09b6a16-1e12-4c16-88e0-1d4c0364be1f	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	{"sub": "c09b6a16-1e12-4c16-88e0-1d4c0364be1f", "name": "Marios", "email": "mzisis01@gmail.com", "email_verified": false, "phone_verified": false}	email	2025-07-23 23:17:23.713892+00	2025-07-23 23:17:23.713942+00	2025-07-23 23:17:23.713942+00	2ce6d4ee-e152-48a6-b85f-80918e3cf60e
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
78b82597-ffef-401c-9e16-7922b7b104ac	2025-07-23 23:17:39.478617+00	2025-07-23 23:17:39.478617+00	password	0e516528-82eb-4a21-8a59-ff8b12c147af
62f6bcc9-00a6-42b1-b838-ed1a7d46332b	2025-07-24 08:51:19.362251+00	2025-07-24 08:51:19.362251+00	password	ef948a2e-207b-4590-be61-f231d7ba6f08
5359e717-f13f-4657-b69f-907c82a5af20	2025-07-24 17:15:16.590462+00	2025-07-24 17:15:16.590462+00	password	4d03a241-70da-4310-b555-2c64206b9d04
620225ea-be65-4cfe-a57e-02f6ede8e0be	2025-07-31 13:41:03.838893+00	2025-07-31 13:41:03.838893+00	password	67c9e6c6-78ec-487f-ab13-7ef44c8e9bbd
dddce563-9634-4469-9be1-257947832b93	2025-07-31 15:33:57.130372+00	2025-07-31 15:33:57.130372+00	password	e8003eca-1a7c-44a3-8bf1-5ddf0195f3f3
e5143852-455a-4c35-b824-2ce15c462e2f	2025-07-31 15:38:04.012695+00	2025-07-31 15:38:04.012695+00	password	152618a1-6b5d-43bd-bd88-03499634fe44
b635ce72-3c58-4b23-ad77-69e7e0eae409	2025-07-31 18:52:45.573389+00	2025-07-31 18:52:45.573389+00	password	2fd6cb2b-c8d7-46c2-be53-b7fba2b1f61d
c0df7925-500c-48d3-b73a-3f2754f4f7b9	2025-07-31 18:59:17.124035+00	2025-07-31 18:59:17.124035+00	password	179ece4d-5209-4d8b-9af7-2f37bd70a0f3
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
00000000-0000-0000-0000-000000000000	124	tfktfj32xxtr	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-26 16:06:07.292151+00	2025-07-26 17:23:23.433454+00	pflxjoohwaau	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	91	nddzn6kksyie	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-24 17:15:16.587861+00	2025-07-31 12:22:07.284593+00	\N	5359e717-f13f-4657-b69f-907c82a5af20
00000000-0000-0000-0000-000000000000	241	avxw5uv4lhij	b64bb7d2-efc7-444b-8e42-dd9d1f82c426	t	2025-07-31 15:33:57.126908+00	2025-07-31 17:33:48.210711+00	\N	dddce563-9634-4469-9be1-257947832b93
00000000-0000-0000-0000-000000000000	244	ibjslu74gdbb	b64bb7d2-efc7-444b-8e42-dd9d1f82c426	t	2025-07-31 16:44:10.71656+00	2025-07-31 17:42:48.304569+00	nc3rip4h5nar	620225ea-be65-4cfe-a57e-02f6ede8e0be
00000000-0000-0000-0000-000000000000	104	lfe2nsqbw6nc	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-25 13:34:19.585921+00	2025-07-25 19:04:27.302388+00	da6fsdqv2dtf	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	247	u76qlmao2sys	b64bb7d2-efc7-444b-8e42-dd9d1f82c426	t	2025-07-31 18:52:45.569332+00	2025-07-31 20:22:34.984976+00	\N	b635ce72-3c58-4b23-ad77-69e7e0eae409
00000000-0000-0000-0000-000000000000	251	xkvdzssmimnf	b64bb7d2-efc7-444b-8e42-dd9d1f82c426	f	2025-07-31 20:22:34.986293+00	2025-07-31 20:22:34.986293+00	u76qlmao2sys	b635ce72-3c58-4b23-ad77-69e7e0eae409
00000000-0000-0000-0000-000000000000	111	jhsrvdbaf7dt	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-25 19:04:27.303048+00	2025-07-25 21:02:46.089008+00	lfe2nsqbw6nc	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	125	5mcexisrqi26	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-26 17:23:23.434701+00	2025-07-27 08:50:21.632375+00	tfktfj32xxtr	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	114	kpqdtn5uvpic	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-25 21:02:46.091056+00	2025-07-25 22:15:57.368208+00	jhsrvdbaf7dt	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	131	uigg4oqlzcea	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-27 08:50:21.640675+00	2025-07-27 09:54:34.098136+00	5mcexisrqi26	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	115	lwcsexq3kxak	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-25 22:15:57.369566+00	2025-07-26 09:03:02.519569+00	kpqdtn5uvpic	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	117	2dm3tyf4vooj	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-26 09:03:02.521905+00	2025-07-26 10:01:06.753825+00	lwcsexq3kxak	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	70	h2hjp6h3pvfi	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-23 23:17:39.477429+00	2025-07-24 07:44:52.065022+00	\N	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	132	hbijueu66rhp	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-27 09:54:34.098837+00	2025-07-27 12:52:18.667982+00	uigg4oqlzcea	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	118	aut72cndj53y	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-26 10:01:06.756844+00	2025-07-26 11:07:25.188695+00	2dm3tyf4vooj	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	72	3rgegv46sx2u	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-24 07:44:52.071619+00	2025-07-24 08:46:57.306416+00	h2hjp6h3pvfi	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	75	mri3ht4gtfhg	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	f	2025-07-24 08:51:19.358097+00	2025-07-24 08:51:19.358097+00	\N	62f6bcc9-00a6-42b1-b838-ed1a7d46332b
00000000-0000-0000-0000-000000000000	120	k3kxtnytcdmt	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-26 11:07:25.191779+00	2025-07-26 12:05:55.549547+00	aut72cndj53y	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	74	q4zhyygaxf2q	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-24 08:46:57.309425+00	2025-07-24 10:23:20.891198+00	3rgegv46sx2u	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	121	e26hu5laaoxa	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-26 12:05:55.550266+00	2025-07-26 13:10:56.277334+00	k3kxtnytcdmt	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	136	2ecouzpommp2	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-27 12:52:18.669272+00	2025-07-27 15:02:04.646634+00	hbijueu66rhp	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	122	idivl4egjx2u	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-26 13:10:56.278707+00	2025-07-26 15:04:26.180031+00	e26hu5laaoxa	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	123	pflxjoohwaau	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-26 15:04:26.186581+00	2025-07-26 16:06:07.290227+00	idivl4egjx2u	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	139	nhumwg3k4wek	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-27 15:02:04.648567+00	2025-07-27 16:07:36.093253+00	2ecouzpommp2	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	78	d5wdlcuciy7r	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-24 10:23:20.89252+00	2025-07-24 13:16:43.163337+00	q4zhyygaxf2q	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	83	tmp7acqh7adb	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-24 13:16:43.166023+00	2025-07-24 22:47:39.122007+00	d5wdlcuciy7r	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	141	d23kz3j2kutp	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-27 16:07:36.095693+00	2025-07-28 08:00:53.318206+00	nhumwg3k4wek	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	96	da6fsdqv2dtf	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-24 22:47:39.12398+00	2025-07-25 13:34:19.583374+00	tmp7acqh7adb	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	155	xiu6syfjkl34	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-28 08:00:53.321776+00	2025-07-29 00:35:33.962611+00	d23kz3j2kutp	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	239	2rafsjfcisbn	b64bb7d2-efc7-444b-8e42-dd9d1f82c426	t	2025-07-31 13:41:03.836449+00	2025-07-31 14:40:22.168233+00	\N	620225ea-be65-4cfe-a57e-02f6ede8e0be
00000000-0000-0000-0000-000000000000	242	2q3ujk7krkle	b64bb7d2-efc7-444b-8e42-dd9d1f82c426	f	2025-07-31 15:38:04.009484+00	2025-07-31 15:38:04.009484+00	\N	e5143852-455a-4c35-b824-2ce15c462e2f
00000000-0000-0000-0000-000000000000	245	5x26uqyqwjpx	b64bb7d2-efc7-444b-8e42-dd9d1f82c426	f	2025-07-31 17:33:48.215472+00	2025-07-31 17:33:48.215472+00	avxw5uv4lhij	dddce563-9634-4469-9be1-257947832b93
00000000-0000-0000-0000-000000000000	249	4ym2bnm267aq	b64bb7d2-efc7-444b-8e42-dd9d1f82c426	f	2025-07-31 18:59:17.122151+00	2025-07-31 18:59:17.122151+00	\N	c0df7925-500c-48d3-b73a-3f2754f4f7b9
00000000-0000-0000-0000-000000000000	248	ddlscz33rosh	b64bb7d2-efc7-444b-8e42-dd9d1f82c426	t	2025-07-31 18:58:57.320607+00	2025-07-31 19:58:05.287502+00	g5shgegju6qu	620225ea-be65-4cfe-a57e-02f6ede8e0be
00000000-0000-0000-0000-000000000000	172	lrtm52ldbqph	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-29 00:35:33.966829+00	2025-07-29 08:10:02.901647+00	xiu6syfjkl34	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	174	6gzxr2egxztu	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	t	2025-07-29 08:10:02.914223+00	2025-07-29 11:52:37.795655+00	lrtm52ldbqph	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	176	hpo445wm3qps	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	f	2025-07-29 11:52:37.80285+00	2025-07-29 11:52:37.80285+00	6gzxr2egxztu	78b82597-ffef-401c-9e16-7922b7b104ac
00000000-0000-0000-0000-000000000000	240	g7jkvnhghs3s	b64bb7d2-efc7-444b-8e42-dd9d1f82c426	t	2025-07-31 14:40:22.169056+00	2025-07-31 15:40:39.511934+00	2rafsjfcisbn	620225ea-be65-4cfe-a57e-02f6ede8e0be
00000000-0000-0000-0000-000000000000	243	nc3rip4h5nar	b64bb7d2-efc7-444b-8e42-dd9d1f82c426	t	2025-07-31 15:40:39.51264+00	2025-07-31 16:44:10.715275+00	g7jkvnhghs3s	620225ea-be65-4cfe-a57e-02f6ede8e0be
00000000-0000-0000-0000-000000000000	246	g5shgegju6qu	b64bb7d2-efc7-444b-8e42-dd9d1f82c426	t	2025-07-31 17:42:48.305916+00	2025-07-31 18:58:57.319969+00	ibjslu74gdbb	620225ea-be65-4cfe-a57e-02f6ede8e0be
00000000-0000-0000-0000-000000000000	250	wpulh6s2cdtw	b64bb7d2-efc7-444b-8e42-dd9d1f82c426	f	2025-07-31 19:58:05.288819+00	2025-07-31 19:58:05.288819+00	ddlscz33rosh	620225ea-be65-4cfe-a57e-02f6ede8e0be
00000000-0000-0000-0000-000000000000	233	eny5xfmpz3fj	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	f	2025-07-31 12:22:07.288176+00	2025-07-31 12:22:07.288176+00	nddzn6kksyie	5359e717-f13f-4657-b69f-907c82a5af20
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag) FROM stdin;
62f6bcc9-00a6-42b1-b838-ed1a7d46332b	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	2025-07-24 08:51:19.348773+00	2025-07-24 08:51:19.348773+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	156.67.94.122	\N
e5143852-455a-4c35-b824-2ce15c462e2f	b64bb7d2-efc7-444b-8e42-dd9d1f82c426	2025-07-31 15:38:04.006052+00	2025-07-31 15:38:04.006052+00	\N	aal1	\N	\N	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15	94.66.118.36	\N
dddce563-9634-4469-9be1-257947832b93	b64bb7d2-efc7-444b-8e42-dd9d1f82c426	2025-07-31 15:33:57.123779+00	2025-07-31 17:33:48.223743+00	\N	aal1	\N	2025-07-31 17:33:48.223646	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	104.28.60.66	\N
78b82597-ffef-401c-9e16-7922b7b104ac	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	2025-07-23 23:17:39.476753+00	2025-07-29 11:52:37.805356+00	\N	aal1	\N	2025-07-29 11:52:37.805287	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	104.28.60.66	\N
5359e717-f13f-4657-b69f-907c82a5af20	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	2025-07-24 17:15:16.586058+00	2025-07-31 12:22:07.299503+00	\N	aal1	\N	2025-07-31 12:22:07.299422	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/138.0.7204.156 Mobile/15E148 Safari/604.1	156.67.94.156	\N
c0df7925-500c-48d3-b73a-3f2754f4f7b9	b64bb7d2-efc7-444b-8e42-dd9d1f82c426	2025-07-31 18:59:17.121317+00	2025-07-31 18:59:17.121317+00	\N	aal1	\N	\N	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15	104.28.60.66	\N
620225ea-be65-4cfe-a57e-02f6ede8e0be	b64bb7d2-efc7-444b-8e42-dd9d1f82c426	2025-07-31 13:41:03.83423+00	2025-07-31 19:58:05.291988+00	\N	aal1	\N	2025-07-31 19:58:05.291922	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	94.66.118.36	\N
b635ce72-3c58-4b23-ad77-69e7e0eae409	b64bb7d2-efc7-444b-8e42-dd9d1f82c426	2025-07-31 18:52:45.562587+00	2025-07-31 20:22:34.988618+00	\N	aal1	\N	2025-07-31 20:22:34.98854	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15	104.28.60.66	\N
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	c09b6a16-1e12-4c16-88e0-1d4c0364be1f	authenticated	authenticated	mzisis01@gmail.com	$2a$10$v331r.EiEeawS1m6phew9ecLFgmlQV3k4a6XWjwZYpNjNCy2fCz8.	2025-07-23 23:17:23.718531+00	\N		\N		\N			\N	2025-07-24 17:15:16.585978+00	{"provider": "email", "providers": ["email"]}	{"sub": "c09b6a16-1e12-4c16-88e0-1d4c0364be1f", "name": "Marios", "email": "mzisis01@gmail.com", "email_verified": true, "phone_verified": false}	\N	2025-07-23 23:17:23.705254+00	2025-07-31 12:22:07.291422+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	b64bb7d2-efc7-444b-8e42-dd9d1f82c426	authenticated	authenticated	karapantelis21@gmail.com	$2a$10$5nvT3lJi8NokivIvjHirG.qzOMRR0opoygvziQEOkRBPER3lmvx7K	2025-07-22 08:26:46.906061+00	\N		\N		\N			\N	2025-07-31 18:59:17.121234+00	{"provider": "email", "providers": ["email"]}	{"sub": "b64bb7d2-efc7-444b-8e42-dd9d1f82c426", "name": "Pantelis", "email": "karapantelis21@gmail.com", "email_verified": true, "phone_verified": false}	\N	2025-07-22 08:26:46.898593+00	2025-07-31 20:22:34.987361+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	4d9e7ea6-120c-4dd7-816f-d1525592af78	authenticated	authenticated	gokollia@gmail.com	$2a$10$TYEEamU7qq4QqdLBkfGLxekAJahMdHIiGDeyIoxTDeHc5yZBTnW52	2025-07-23 18:50:54.236609+00	\N		\N		\N			\N	2025-07-23 18:51:14.52115+00	{"provider": "email", "providers": ["email"]}	{"sub": "4d9e7ea6-120c-4dd7-816f-d1525592af78", "name": "Γεωργία", "email": "gokollia@gmail.com", "email_verified": true, "phone_verified": false}	\N	2025-07-23 18:50:54.226165+00	2025-07-23 18:51:14.522988+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.appointments (id, patient_id, reason, appointment_time, duration_minutes, status, notes, created_at, is_exception) FROM stdin;
ddde0af1-c20d-40b4-8f58-b2187ec8eb16	ef939d2b-bcd3-4497-a171-4a479c93d1d9		2025-08-01 18:00:00+00	30	approved		2025-07-31 17:46:13.090596+00	t
3a7e5e95-dbe1-4a0e-bf49-eb4d40114ef4	ef939d2b-bcd3-4497-a171-4a479c93d1d9	Γενικός Έλεγχος	2025-08-16 12:30:00+00	30	approved	ok	2025-07-23 21:32:27.568765+00	f
2db59725-9d43-4fc5-88ed-5d12c3fc3c8e	6564ed46-9d4b-41e2-9dc1-447b2aec4e50		2025-07-29 19:30:00+00	30	approved		2025-07-28 23:53:46.882386+00	t
911a9aa2-f6a7-481b-bd84-e72c65b80857	6564ed46-9d4b-41e2-9dc1-447b2aec4e50	Εξέταση	2025-07-31 07:00:00+00	30	approved		2025-07-29 00:02:02.110216+00	f
e8ea88ac-cf8f-4678-93a7-fb7b66a7de64	ef939d2b-bcd3-4497-a171-4a479c93d1d9	Αξιολόγηση Αποτελεσμάτων	2025-08-11 07:00:00+00	15	cancelled		2025-07-31 07:52:46.295984+00	f
6d2e8416-09e1-4e38-9001-3315229554ce	6564ed46-9d4b-41e2-9dc1-447b2aec4e50	Εξέταση	2025-07-31 06:00:00+00	30	approved		2025-07-27 10:16:50.190679+00	f
17f273de-142e-41af-8eba-42a9ac22c69c	6564ed46-9d4b-41e2-9dc1-447b2aec4e50	Αξιολόγηση Αποτελεσμάτων	2025-07-27 14:15:00+00	15	approved		2025-07-27 10:17:49.362935+00	f
0285311a-17de-49c0-9629-fa6efe829c05	ef939d2b-bcd3-4497-a171-4a479c93d1d9	Εξέταση	2025-07-28 05:00:00+00	30	approved		2025-07-28 09:27:31.672612+00	f
904b69e2-4359-4925-95ad-040be30adb43	ef939d2b-bcd3-4497-a171-4a479c93d1d9	Αξιολόγηση Αποτελεσμάτων	2025-07-28 10:00:00+00	15	approved		2025-07-28 11:36:50.439951+00	f
43bb5285-f08b-4c5e-8d12-03be033bc001	ef939d2b-bcd3-4497-a171-4a479c93d1d9	Εξέταση	2025-07-30 10:00:00+00	30	approved		2025-07-28 11:51:56.079804+00	f
1d18d667-a4bb-4ac2-971b-bb316df10a34	ef939d2b-bcd3-4497-a171-4a479c93d1d9	Εξέταση	2025-07-30 11:15:00+00	30	approved		2025-07-28 12:41:12.415954+00	f
a016e996-0f36-49e4-ba9d-6c1552c267a3	ef939d2b-bcd3-4497-a171-4a479c93d1d9	Εξέταση	2025-08-21 07:00:00+00	30	approved		2025-07-31 07:11:53.606741+00	f
1845e30f-cce1-4da9-93bd-e6e86ad2707c	ef939d2b-bcd3-4497-a171-4a479c93d1d9	Αξιολόγηση Αποτελεσμάτων	2025-07-30 08:00:00+00	60	approved		2025-07-28 21:29:32.68329+00	f
2bab67e7-33e6-4987-bc76-560b3e377fbf	ef939d2b-bcd3-4497-a171-4a479c93d1d9	Εξέταση	2025-07-30 09:00:00+00	30	approved		2025-07-28 21:42:21.254785+00	f
3515a130-49be-448b-8d35-a6876c9ebba1	\N	Ιατρικός Επισκέπτης	2025-08-05 14:30:00+00	15	approved	Εταιρεία: Lecalcif	2025-07-30 14:39:43.231365+00	f
a4452adf-839f-4dcf-a197-ea5c91b12a29	\N	Ιατρικός Επισκέπτης	2025-08-27 09:15:00+00	15	approved	Εταιρεία: Novartis	2025-07-30 14:52:45.464561+00	f
6f745f7a-c0b2-42a3-bea0-2aec7d66d79a	ef939d2b-bcd3-4497-a171-4a479c93d1d9	Εξέταση	2025-08-28 07:00:00+00	30	approved		2025-07-31 07:14:25.090526+00	f
140663cd-a492-4415-b6bc-59448d0d3482	ef939d2b-bcd3-4497-a171-4a479c93d1d9	Εξέταση	2025-08-19 17:00:00+00	30	approved		2025-07-31 07:20:49.081161+00	f
b816c529-eda8-42ff-b7f3-c85076a3cc40	ef939d2b-bcd3-4497-a171-4a479c93d1d9	Εξέταση	2025-08-13 07:00:00+00	30	approved		2025-07-30 17:06:36.996636+00	f
abd7ef60-8093-42a8-a132-20349593c406	ef939d2b-bcd3-4497-a171-4a479c93d1d9	Εξέταση	2025-08-26 14:30:00+00	30	approved		2025-07-31 07:28:33.280342+00	f
59d326de-0ffa-4221-ab2c-98fdc97a7b87	ef939d2b-bcd3-4497-a171-4a479c93d1d9	Αξιολόγηση Αποτελεσμάτων	2025-08-14 07:00:00+00	15	approved		2025-07-31 11:38:01.538515+00	f
547cd2f1-ad13-4004-a90f-9dedbd59c03e	ef939d2b-bcd3-4497-a171-4a479c93d1d9	Αξιολόγηση Αποτελεσμάτων	2025-08-20 07:30:00+00	15	approved		2025-07-31 11:48:41.641616+00	f
dd16b823-c729-41ab-8e17-8f849500a779	ef939d2b-bcd3-4497-a171-4a479c93d1d9		2025-07-31 12:45:00+00	30	approved		2025-07-31 12:36:14.103222+00	t
\.


--
-- Data for Name: clinic_schedule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clinic_schedule (id, weekday, start_time, end_time) FROM stdin;
13	1	10:00:00+00	12:30:00+00
14	1	17:30:00+00	20:30:00+00
15	2	17:30:00+00	20:30:00+00
16	3	10:00:00+00	12:30:00+00
17	4	10:00:00+00	12:30:00+00
18	4	17:30:00+00	20:30:00+00
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patients (id, email, phone, birth_date, gender, notes, created_at, amka, occupation, first_visit_date, marital_status, children, smoking, alcohol, medications, gynecological_history, hereditary_history, current_disease, physical_exam, preclinical_screening, updated_at, first_name, last_name) FROM stdin;
ef939d2b-bcd3-4497-a171-4a479c93d1d9	karapantelis21@gmail.com	6945639228	2002-03-21	male	21/07: tttttt\n\n\n\n\n26/12: tttt	2025-07-23 12:05:43.895558+00	21077101489	Προγραμματιστής 	2025-07-06	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-30 16:31:15.138+00	Παντελης	Καραμπέτσος
6564ed46-9d4b-41e2-9dc1-447b2aec4e50	pyrkagia@bekou.gr	698850257	1990-09-04	female	ok	2025-07-24 18:59:20.757661+00	2803985472	\N	\N	Άγαμος/η	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-31 14:49:45.076+00	Μπία	Μπέκου
92f9d4e8-6f14-4e49-9d1f-5857643498d3	nteikonst@gmail.com	69875745	2000-09-04	male	\N	2025-07-25 12:47:25.308671+00	040605854	\N	\N	\N	\N	Πρώην καπνιστής	Καθημερινά	\N	\N	\N	\N	\N	\N	2025-07-31 14:49:58.308+00	Κωνσταντίνος	Ντειμεντές
9ac26bd7-6a80-4608-a989-8eb0cbb39e3e	mzisis01@gmail.com	6908364804	2001-05-08	male		2025-07-31 14:50:35.744372+00	08050147825		\N											2025-07-31 14:50:35.744372+00	Μάριος	Ζήσης
c285cd6c-8195-4758-8636-99035f79dcd4	contact@pkarabetsos.com	6988506337	\N	other	\N	2025-07-31 20:27:06.829768+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-31 20:27:06.829768+00	Μαριάνθη	Καραμπέτσου
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, role, created_at, name, email, phone) FROM stdin;
b64bb7d2-efc7-444b-8e42-dd9d1f82c426	admin	2025-07-22 08:26:47.040138+00	Pantelis	karapantelis21@gmail.com	\N
4d9e7ea6-120c-4dd7-816f-d1525592af78	admin	2025-07-23 18:50:54.475543+00	Γεωργία	gokollia@gmail.com	\N
c09b6a16-1e12-4c16-88e0-1d4c0364be1f	admin	2025-07-23 23:17:23.999318+00	Marios	mzisis01@gmail.com	\N
\.


--
-- Data for Name: schedule_exceptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.schedule_exceptions (id, exception_date, start_time, end_time, reason, created_at) FROM stdin;
c02ccbb5-ad54-44b7-b89f-f6f826d2594d	2025-08-05	2025-08-05 14:30:00+00	2025-08-05 15:30:00+00	\N	2025-07-31 20:47:42.982116+00
\.


--
-- Data for Name: visit_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.visit_notes (id, appointment_id, patient_id, visit_date, physical_exam, preclinical_screening, notes, created_at, updated_at) FROM stdin;
789fd4d8-f6d1-4a5c-a1b9-2731c52e7a9a	\N	92f9d4e8-6f14-4e49-9d1f-5857643498d3	2025-07-27	K	L	M	2025-07-25 21:03:23.737516+00	2025-07-25 21:03:23.737516+00
0f871583-cac2-443a-bbf4-783f00c6567d	\N	92f9d4e8-6f14-4e49-9d1f-5857643498d3	2025-07-01	k	h	h	2025-07-25 21:04:13.181607+00	2025-07-25 21:04:13.181607+00
1536152f-1132-41f2-91ff-56e15965687b	\N	92f9d4e8-6f14-4e49-9d1f-5857643498d3	2025-07-30	K	K	K	2025-07-29 22:23:59.216075+00	2025-07-29 22:23:59.216075+00
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2025-07-21 21:13:30
20211116045059	2025-07-21 21:13:32
20211116050929	2025-07-21 21:13:34
20211116051442	2025-07-21 21:13:35
20211116212300	2025-07-21 21:13:37
20211116213355	2025-07-21 21:13:39
20211116213934	2025-07-21 21:13:40
20211116214523	2025-07-21 21:13:43
20211122062447	2025-07-21 21:13:44
20211124070109	2025-07-21 21:13:46
20211202204204	2025-07-21 21:13:47
20211202204605	2025-07-21 21:13:49
20211210212804	2025-07-21 21:13:54
20211228014915	2025-07-21 21:13:56
20220107221237	2025-07-21 21:13:57
20220228202821	2025-07-21 21:13:59
20220312004840	2025-07-21 21:14:00
20220603231003	2025-07-21 21:14:03
20220603232444	2025-07-21 21:14:05
20220615214548	2025-07-21 21:14:06
20220712093339	2025-07-21 21:14:08
20220908172859	2025-07-21 21:14:10
20220916233421	2025-07-21 21:14:11
20230119133233	2025-07-21 21:14:13
20230128025114	2025-07-21 21:14:15
20230128025212	2025-07-21 21:14:17
20230227211149	2025-07-21 21:14:18
20230228184745	2025-07-21 21:14:20
20230308225145	2025-07-21 21:14:21
20230328144023	2025-07-21 21:14:23
20231018144023	2025-07-21 21:14:25
20231204144023	2025-07-21 21:14:28
20231204144024	2025-07-21 21:14:29
20231204144025	2025-07-21 21:14:31
20240108234812	2025-07-21 21:14:33
20240109165339	2025-07-21 21:14:34
20240227174441	2025-07-21 21:14:37
20240311171622	2025-07-21 21:14:39
20240321100241	2025-07-21 21:14:43
20240401105812	2025-07-21 21:14:47
20240418121054	2025-07-21 21:14:49
20240523004032	2025-07-21 21:14:55
20240618124746	2025-07-21 21:14:57
20240801235015	2025-07-21 21:14:58
20240805133720	2025-07-21 21:15:00
20240827160934	2025-07-21 21:15:01
20240919163303	2025-07-21 21:15:04
20240919163305	2025-07-21 21:15:05
20241019105805	2025-07-21 21:15:07
20241030150047	2025-07-21 21:15:13
20241108114728	2025-07-21 21:15:15
20241121104152	2025-07-21 21:15:17
20241130184212	2025-07-21 21:15:19
20241220035512	2025-07-21 21:15:20
20241220123912	2025-07-21 21:15:22
20241224161212	2025-07-21 21:15:23
20250107150512	2025-07-21 21:15:25
20250110162412	2025-07-21 21:15:27
20250123174212	2025-07-21 21:15:28
20250128220012	2025-07-21 21:15:30
20250506224012	2025-07-21 21:15:31
20250523164012	2025-07-21 21:15:33
20250714121412	2025-07-21 21:15:34
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-07-21 21:13:28.812618
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-07-21 21:13:28.816736
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2025-07-21 21:13:28.819016
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-07-21 21:13:28.837428
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-07-21 21:13:28.849062
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-07-21 21:13:28.852398
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2025-07-21 21:13:28.855915
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-07-21 21:13:28.860908
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-07-21 21:13:28.863851
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2025-07-21 21:13:28.866972
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2025-07-21 21:13:28.869939
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-07-21 21:13:28.873241
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-07-21 21:13:28.876611
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-07-21 21:13:28.879657
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-07-21 21:13:28.882784
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-07-21 21:13:28.897308
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-07-21 21:13:28.90024
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-07-21 21:13:28.903154
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-07-21 21:13:28.906461
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-07-21 21:13:28.910372
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-07-21 21:13:28.913398
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-07-21 21:13:28.919277
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-07-21 21:13:28.929344
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-07-21 21:13:28.937793
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-07-21 21:13:28.94079
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-07-21 21:13:28.943996
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: supabase_migrations; Owner: -
--

COPY supabase_migrations.schema_migrations (version, statements, name) FROM stdin;
20250721231152	{"-- Enable UUID generation extension\ncreate extension if not exists \\"uuid-ossp\\"","-- ============================================\n-- 1. Testimonials Table\n-- ============================================\ncreate table testimonials (\n  id uuid primary key default uuid_generate_v4(),\n  name text not null,\n  text text not null,\n  source text default 'Google',\n  rating numeric check (rating >= 0 and rating <= 5),\n  created_at timestamptz default now()\n)","-- ============================================\n-- 2. Profiles Table (linked to Supabase Auth users)\n-- ============================================\ncreate table profiles (\n  id uuid primary key references auth.users on delete cascade,\n  role text check (role in ('admin', 'editor')) default 'admin',\n  created_at timestamptz default now()\n)","-- ============================================\n-- 3. Patients Table\n-- ============================================\ncreate table patients (\n  id uuid primary key default uuid_generate_v4(),\n  full_name text not null,\n  email text,\n  phone text,\n  birth_date date,\n  gender text check (gender in ('male', 'female', 'other')),\n  notes text,\n  created_at timestamptz default now()\n)","-- ============================================\n-- 4. Appointments Table\n-- ============================================\ncreate table appointments (\n  id uuid primary key default uuid_generate_v4(),\n  patient_id uuid references patients(id) on delete cascade,\n  reason text,\n  appointment_time timestamptz not null,\n  duration_minutes int default 30,\n  status text check (status in ('scheduled', 'completed', 'cancelled')) default 'scheduled',\n  notes text,\n  created_at timestamptz default now()\n)","-- ============================================\n-- 5. Optional: Admin Notes or Logs\n-- ============================================\ncreate table admin_logs (\n  id uuid primary key default uuid_generate_v4(),\n  action text not null,\n  performed_by uuid references profiles(id),\n  timestamp timestamptz default now()\n)"}	init
20250722075316	{"alter table profiles\nadd column full_name text"}	add_full_name_to_profiles
20250723131322	{"ALTER TABLE patients ADD COLUMN amka text unique"}	update-patients-add-amka
20250723170758	{"alter table profiles add column email text","alter table profiles add column phone text"}	add_name_and_email_to_profiles
\.


--
-- Data for Name: seed_files; Type: TABLE DATA; Schema: supabase_migrations; Owner: -
--

COPY supabase_migrations.seed_files (path, hash) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 251, true);


--
-- Name: clinic_schedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.clinic_schedule_id_seq', 20, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: clinic_schedule clinic_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_schedule
    ADD CONSTRAINT clinic_schedule_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: schedule_exceptions schedule_exceptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_exceptions
    ADD CONSTRAINT schedule_exceptions_pkey PRIMARY KEY (id);


--
-- Name: visit_notes visit_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_notes
    ADD CONSTRAINT visit_notes_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: seed_files seed_files_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.seed_files
    ADD CONSTRAINT seed_files_pkey PRIMARY KEY (path);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: patients_amka_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX patients_amka_unique_idx ON public.patients USING btree (amka) WHERE (amka IS NOT NULL);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: visit_notes visit_notes_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_notes
    ADD CONSTRAINT visit_notes_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: visit_notes visit_notes_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_notes
    ADD CONSTRAINT visit_notes_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles Admins can see all admins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can see all admins" ON public.profiles FOR SELECT TO authenticated USING (true);


--
-- Name: appointments Allow admins to read appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow admins to read appointments" ON public.appointments FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))));


--
-- Name: appointments Allow delete for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for authenticated users" ON public.appointments FOR DELETE USING (true);


--
-- Name: patients Allow insert for all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for all" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: appointments Allow insert for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for all users" ON public.appointments FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: patients Allow insert for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for authenticated" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: appointments Allow insert for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for authenticated users" ON public.appointments FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: profiles Allow insert for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for authenticated users" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));


--
-- Name: appointments Allow insert to appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert to appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: appointments Allow select for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select for authenticated users" ON public.appointments FOR SELECT TO authenticated USING (true);


--
-- Name: profiles Allow select for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select for authenticated users" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: appointments Allow update for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for authenticated users" ON public.appointments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: appointments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

--
-- Name: clinic_schedule authenticated users can DELETE; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "authenticated users can DELETE" ON public.clinic_schedule FOR DELETE TO authenticated USING (true);


--
-- Name: schedule_exceptions authenticated users can DELETE; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "authenticated users can DELETE" ON public.schedule_exceptions FOR DELETE TO authenticated USING (true);


--
-- Name: clinic_schedule authenticated users can INSERT; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "authenticated users can INSERT" ON public.clinic_schedule FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: schedule_exceptions authenticated users can INSERT; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "authenticated users can INSERT" ON public.schedule_exceptions FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: schedule_exceptions authenticated users can SELECT; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "authenticated users can SELECT" ON public.schedule_exceptions FOR SELECT TO authenticated USING (true);


--
-- Name: clinic_schedule authenticated users can select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "authenticated users can select" ON public.clinic_schedule FOR SELECT TO authenticated USING (true);


--
-- Name: clinic_schedule; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clinic_schedule ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: schedule_exceptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.schedule_exceptions ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

