-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Gardens ───────────────────────────────────────────────────────────────
create table gardens (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  description text,
  location    text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);
alter table gardens enable row level security;
create policy "Users manage own gardens"
  on gardens for all using (auth.uid() = user_id);

-- ─── Garden Shapes ─────────────────────────────────────────────────────────
create table garden_shapes (
  id         uuid primary key default uuid_generate_v4(),
  garden_id  uuid references gardens(id) on delete cascade not null,
  type       text not null check (type in ('boundary', 'zone', 'path')),
  zone_type  text check (zone_type in ('zon', 'halfschaduw', 'schaduw')),
  svg_path   text not null,
  color      text,
  label      text,
  created_at timestamptz default now() not null
);
alter table garden_shapes enable row level security;
create policy "Users manage shapes in own gardens"
  on garden_shapes for all
  using (exists (select 1 from gardens where id = garden_id and user_id = auth.uid()));

-- ─── Plant Placements ──────────────────────────────────────────────────────
create table plant_placements (
  id              uuid primary key default uuid_generate_v4(),
  garden_id       uuid references gardens(id) on delete cascade not null,
  plant_id        integer,          -- references static plantenDb id
  custom_plant_id uuid,             -- references custom_plants.id
  x               numeric not null,
  y               numeric not null,
  notes           text,
  in_pot          boolean default false,
  photo_url       text,
  planted_at      date,
  created_at      timestamptz default now() not null
);
alter table plant_placements enable row level security;
create policy "Users manage placements in own gardens"
  on plant_placements for all
  using (exists (select 1 from gardens where id = garden_id and user_id = auth.uid()));

-- ─── Custom Plants ─────────────────────────────────────────────────────────
create table custom_plants (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  naam          text not null,
  latijn        text,
  cat           text,
  emoji         text default '🌱',
  zon           text check (zon in ('zon', 'halfschaduw', 'schaduw', 'beide')),
  water         text check (water in ('weinig', 'matig', 'veel')),
  wg            text check (wg in ('wintergroen', 'halfwintergroen', 'bladverliezen')),
  h             numeric,
  eco           jsonb default '{"ins":0,"vog":0,"bes":0}'::jsonb,
  care_schedule jsonb default '{}'::jsonb,
  photo_url     text,
  notes         text,
  created_at    timestamptz default now() not null
);
alter table custom_plants enable row level security;
create policy "Users manage own custom plants"
  on custom_plants for all using (auth.uid() = user_id);

-- ─── Care Logs ─────────────────────────────────────────────────────────────
create table care_logs (
  id           uuid primary key default uuid_generate_v4(),
  placement_id uuid references plant_placements(id) on delete cascade not null,
  task         text not null,
  done_at      date default current_date not null,
  notes        text,
  created_at   timestamptz default now() not null
);
alter table care_logs enable row level security;
create policy "Users manage care logs for own placements"
  on care_logs for all
  using (exists (
    select 1 from plant_placements pp
    join gardens g on g.id = pp.garden_id
    where pp.id = placement_id and g.user_id = auth.uid()
  ));

-- ─── Updated_at trigger ────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger gardens_updated_at before update on gardens
  for each row execute procedure update_updated_at();
