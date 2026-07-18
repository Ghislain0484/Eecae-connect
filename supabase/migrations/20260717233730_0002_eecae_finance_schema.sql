/*
# EECAE — Module financier & comptabilité

## Description
Ajoute les tables du module financier : recettes, dîmes, promesses, dépenses,
caisses, comptes, clôtures de culte et budgets. Les données financières sont
rattachées à une assemblée et protégées par RLS (accès via can_view_finance).

## Nouvelles tables
- `contribution_categories` — catégories de recettes (offrande, dîme, don…).
- `contributions` — recettes (offrandes, dîmes globales, dons…).
- `tithes` — dîmes nominatives / anonymes.
- `pledges` — promesses et engagements financiers.
- `pledge_payments` — paiements liés à une promesse.
- `expense_categories` — catégories de dépenses.
- `expenses` — dépenses avec validateur et justificatif.
- `cash_accounts` — caisses (principale, par assemblée, programme, département).
- `bank_accounts` — comptes bancaires et Mobile Money.
- `cash_movements` — mouvements de caisse (entrées/sorties).
- `event_financial_closures` — clôture de culte (validée = non modifiable).
- `budgets` — budgets (annuel, mensuel, par assemblée, département…).
- `budget_lines` — lignes budgétaires.

## Sécurité (RLS)
- Accès lecture/écriture conditionné par `can_view_finance` dans
  user_church_access, OU super admin, OU rôle trésorier/hq_admin/senior_pastor.
- Fonction `user_can_view_finance(uuid)` centralise cette logique.
*/

-- ============================================================
-- FONCTION : accès financier
-- ============================================================
create or replace function public.user_can_view_finance(p_church_id uuid)
returns boolean language sql stable security invoker as $$
  select public.is_super_admin()
      or exists (
        select 1 from public.user_profiles up
        where up.id = auth.uid()
          and up.role in ('super_admin','hq_admin','treasurer','senior_pastor')
      )
      or exists (
        select 1 from public.user_church_access uca
        where uca.user_id = auth.uid()
          and uca.church_id = p_church_id
          and uca.is_active
          and (uca.can_view_finance or uca.role in ('treasurer','hq_admin','senior_pastor'))
      );
$$;

-- ============================================================
-- CATÉGORIES DE RECETTES
-- ============================================================
create table if not exists public.contribution_categories (
  id uuid primary key default gen_random_uuid(),
  church_id uuid references public.churches(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_contrib_cat_church on public.contribution_categories(church_id);

-- ============================================================
-- CONTRIBUTIONS (recettes)
-- ============================================================
create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  contribution_date date not null default current_date,
  category text not null,
  amount numeric(14,2) not null default 0,
  payment_method text check (payment_method in ('cash','check','bank_transfer','orange_money','mtn_money','moov_money','wave','card','other')),
  reference_number text,
  received_by text,
  counted_by text,
  validated_by text,
  comment text,
  receipt_url text,
  is_validated boolean not null default false,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz
);
create index if not exists idx_contributions_church on public.contributions(church_id);
create index if not exists idx_contributions_date on public.contributions(contribution_date);
create index if not exists idx_contributions_event on public.contributions(event_id);
create index if not exists idx_contributions_category on public.contributions(category);
create index if not exists idx_contributions_validated on public.contributions(is_validated);

-- ============================================================
-- DÎMES (nominatives / anonymes)
-- ============================================================
create table if not exists public.tithes (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  member_id uuid,
  contributor_name text,
  period text,
  amount numeric(14,2) not null default 0,
  tithe_date date not null default current_date,
  payment_method text check (payment_method in ('cash','check','bank_transfer','orange_money','mtn_money','moov_money','wave','card','other')),
  reference_number text,
  is_anonymous boolean not null default false,
  comment text,
  is_validated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz
);
create index if not exists idx_tithes_church on public.tithes(church_id);
create index if not exists idx_tithes_date on public.tithes(tithe_date);
create index if not exists idx_tithes_member on public.tithes(member_id);
create index if not exists idx_tithes_event on public.tithes(event_id);

-- ============================================================
-- PROMESSES
-- ============================================================
create table if not exists public.pledges (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  pledge_type text,
  member_id uuid,
  donor_name text,
  amount_promised numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  due_date date,
  frequency text,
  status text not null default 'open' check (status in ('open','partial','fulfilled','overdue','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz
);
create index if not exists idx_pledges_church on public.pledges(church_id);
create index if not exists idx_pledges_status on public.pledges(status);
create index if not exists idx_pledges_member on public.pledges(member_id);

create table if not exists public.pledge_payments (
  id uuid primary key default gen_random_uuid(),
  pledge_id uuid not null references public.pledges(id) on delete cascade,
  amount numeric(14,2) not null default 0,
  payment_date date not null default current_date,
  payment_method text,
  reference_number text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
create index if not exists idx_pledge_payments_pledge on public.pledge_payments(pledge_id);

-- ============================================================
-- DÉPENSES
-- ============================================================
create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  church_id uuid references public.churches(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_expense_cat_church on public.expense_categories(church_id);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  expense_date date not null default current_date,
  category text not null,
  supplier text,
  motive text,
  amount numeric(14,2) not null default 0,
  payment_method text check (payment_method in ('cash','check','bank_transfer','orange_money','mtn_money','moov_money','wave','card','other')),
  requested_by text,
  validated_by text,
  paid_by text,
  receipt_url text,
  piece_number text,
  status text not null default 'pending' check (status in ('pending','validated','paid','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz
);
create index if not exists idx_expenses_church on public.expenses(church_id);
create index if not exists idx_expenses_date on public.expenses(expense_date);
create index if not exists idx_expenses_category on public.expenses(category);
create index if not exists idx_expenses_status on public.expenses(status);

-- ============================================================
-- CAISSES & COMPTES
-- ============================================================
create table if not exists public.cash_accounts (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  name text not null,
  account_type text not null check (account_type in ('main','assembly','program','department','bank','mobile_money')),
  initial_balance numeric(14,2) not null default 0,
  currency text not null default 'XOF',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_cash_accounts_church on public.cash_accounts(church_id);

create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  bank_name text not null,
  account_holder text,
  account_number text,
  iban text,
  initial_balance numeric(14,2) not null default 0,
  currency text not null default 'XOF',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_bank_accounts_church on public.bank_accounts(church_id);

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  cash_account_id uuid not null references public.cash_accounts(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  movement_type text not null check (movement_type in ('in','out')),
  amount numeric(14,2) not null default 0,
  movement_date date not null default current_date,
  reason text,
  reference_type text,
  reference_id uuid,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
create index if not exists idx_cash_movements_account on public.cash_movements(cash_account_id);
create index if not exists idx_cash_movements_church on public.cash_movements(church_id);
create index if not exists idx_cash_movements_date on public.cash_movements(movement_date);

-- ============================================================
-- CLÔTURE DE CULTE
-- ============================================================
create table if not exists public.event_financial_closures (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  total_participants integer default 0,
  visitors_count integer default 0,
  total_offrandes numeric(14,2) not null default 0,
  total_tithes numeric(14,2) not null default 0,
  total_donations numeric(14,2) not null default 0,
  total_other_receipts numeric(14,2) not null default 0,
  immediate_expenses numeric(14,2) not null default 0,
  net_amount numeric(14,2) not null default 0,
  counted_by text,
  treasurer text,
  observations text,
  is_validated boolean not null default false,
  validated_at timestamptz,
  validated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_closures_event on public.event_financial_closures(event_id);
create index if not exists idx_closures_church on public.event_financial_closures(church_id);

-- ============================================================
-- BUDGETS
-- ============================================================
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  title text not null,
  scope text check (scope in ('annual','monthly','church','department','project','program')),
  period_year integer not null,
  period_month integer,
  total_planned numeric(14,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','approved','active','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
create index if not exists idx_budgets_church on public.budgets(church_id);
create index if not exists idx_budgets_year on public.budgets(period_year);

create table if not exists public.budget_lines (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets(id) on delete cascade,
  category text not null,
  planned_amount numeric(14,2) not null default 0,
  actual_income numeric(14,2) not null default 0,
  actual_expense numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_budget_lines_budget on public.budget_lines(budget_id);

-- ============================================================
-- RLS
-- ============================================================
alter table public.contribution_categories enable row level security;
alter table public.contributions enable row level security;
alter table public.tithes enable row level security;
alter table public.pledges enable row level security;
alter table public.pledge_payments enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.cash_accounts enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.cash_movements enable row level security;
alter table public.event_financial_closures enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_lines enable row level security;

-- Catégories : visibles par tous les users de l'assemblée
drop policy if exists "select_contribution_categories" on public.contribution_categories;
create policy "select_contribution_categories" on public.contribution_categories for select to authenticated using (church_id is null or public.user_can_access_church(church_id));
drop policy if exists "insert_contribution_categories" on public.contribution_categories;
create policy "insert_contribution_categories" on public.contribution_categories for insert to authenticated with check (public.user_can_access_church(church_id));

drop policy if exists "select_expense_categories" on public.expense_categories;
create policy "select_expense_categories" on public.expense_categories for select to authenticated using (church_id is null or public.user_can_access_church(church_id));
drop policy if exists "insert_expense_categories" on public.expense_categories;
create policy "insert_expense_categories" on public.expense_categories for insert to authenticated with check (public.user_can_access_church(church_id));

-- CONTRIBUTIONS : accès financier requis
drop policy if exists "select_contributions" on public.contributions;
create policy "select_contributions" on public.contributions for select to authenticated using (public.user_can_view_finance(church_id));
drop policy if exists "insert_contributions" on public.contributions;
create policy "insert_contributions" on public.contributions for insert to authenticated with check (public.user_can_view_finance(church_id));
drop policy if exists "update_contributions" on public.contributions;
create policy "update_contributions" on public.contributions for update to authenticated using (public.user_can_view_finance(church_id)) with check (public.user_can_view_finance(church_id));
drop policy if exists "delete_contributions" on public.contributions;
create policy "delete_contributions" on public.contributions for delete to authenticated using (public.user_can_view_finance(church_id));

-- TITHES
drop policy if exists "select_tithes" on public.tithes;
create policy "select_tithes" on public.tithes for select to authenticated using (public.user_can_view_finance(church_id));
drop policy if exists "insert_tithes" on public.tithes;
create policy "insert_tithes" on public.tithes for insert to authenticated with check (public.user_can_view_finance(church_id));
drop policy if exists "update_tithes" on public.tithes;
create policy "update_tithes" on public.tithes for update to authenticated using (public.user_can_view_finance(church_id)) with check (public.user_can_view_finance(church_id));
drop policy if exists "delete_tithes" on public.tithes;
create policy "delete_tithes" on public.tithes for delete to authenticated using (public.user_can_view_finance(church_id));

-- PLEDGES
drop policy if exists "select_pledges" on public.pledges;
create policy "select_pledges" on public.pledges for select to authenticated using (public.user_can_view_finance(church_id));
drop policy if exists "insert_pledges" on public.pledges;
create policy "insert_pledges" on public.pledges for insert to authenticated with check (public.user_can_view_finance(church_id));
drop policy if exists "update_pledges" on public.pledges;
create policy "update_pledges" on public.pledges for update to authenticated using (public.user_can_view_finance(church_id)) with check (public.user_can_view_finance(church_id));
drop policy if exists "delete_pledges" on public.pledges;
create policy "delete_pledges" on public.pledges for delete to authenticated using (public.user_can_view_finance(church_id));

-- PLEDGE_PAYMENTS
drop policy if exists "select_pledge_payments" on public.pledge_payments;
create policy "select_pledge_payments" on public.pledge_payments for select to authenticated using (exists (select 1 from public.pledges p where p.id = pledge_id and public.user_can_view_finance(p.church_id)));
drop policy if exists "insert_pledge_payments" on public.pledge_payments;
create policy "insert_pledge_payments" on public.pledge_payments for insert to authenticated with check (exists (select 1 from public.pledges p where p.id = pledge_id and public.user_can_view_finance(p.church_id)));
drop policy if exists "delete_pledge_payments" on public.pledge_payments;
create policy "delete_pledge_payments" on public.pledge_payments for delete to authenticated using (exists (select 1 from public.pledges p where p.id = pledge_id and public.user_can_view_finance(p.church_id)));

-- EXPENSES
drop policy if exists "select_expenses" on public.expenses;
create policy "select_expenses" on public.expenses for select to authenticated using (public.user_can_view_finance(church_id));
drop policy if exists "insert_expenses" on public.expenses;
create policy "insert_expenses" on public.expenses for insert to authenticated with check (public.user_can_view_finance(church_id));
drop policy if exists "update_expenses" on public.expenses;
create policy "update_expenses" on public.expenses for update to authenticated using (public.user_can_view_finance(church_id)) with check (public.user_can_view_finance(church_id));
drop policy if exists "delete_expenses" on public.expenses;
create policy "delete_expenses" on public.expenses for delete to authenticated using (public.user_can_view_finance(church_id));

-- CASH_ACCOUNTS
drop policy if exists "select_cash_accounts" on public.cash_accounts;
create policy "select_cash_accounts" on public.cash_accounts for select to authenticated using (public.user_can_view_finance(church_id));
drop policy if exists "insert_cash_accounts" on public.cash_accounts;
create policy "insert_cash_accounts" on public.cash_accounts for insert to authenticated with check (public.user_can_view_finance(church_id));
drop policy if exists "update_cash_accounts" on public.cash_accounts;
create policy "update_cash_accounts" on public.cash_accounts for update to authenticated using (public.user_can_view_finance(church_id)) with check (public.user_can_view_finance(church_id));
drop policy if exists "delete_cash_accounts" on public.cash_accounts;
create policy "delete_cash_accounts" on public.cash_accounts for delete to authenticated using (public.user_can_view_finance(church_id));

-- BANK_ACCOUNTS
drop policy if exists "select_bank_accounts" on public.bank_accounts;
create policy "select_bank_accounts" on public.bank_accounts for select to authenticated using (public.user_can_view_finance(church_id));
drop policy if exists "insert_bank_accounts" on public.bank_accounts;
create policy "insert_bank_accounts" on public.bank_accounts for insert to authenticated with check (public.user_can_view_finance(church_id));
drop policy if exists "update_bank_accounts" on public.bank_accounts;
create policy "update_bank_accounts" on public.bank_accounts for update to authenticated using (public.user_can_view_finance(church_id)) with check (public.user_can_view_finance(church_id));
drop policy if exists "delete_bank_accounts" on public.bank_accounts;
create policy "delete_bank_accounts" on public.bank_accounts for delete to authenticated using (public.user_can_view_finance(church_id));

-- CASH_MOVEMENTS
drop policy if exists "select_cash_movements" on public.cash_movements;
create policy "select_cash_movements" on public.cash_movements for select to authenticated using (public.user_can_view_finance(church_id));
drop policy if exists "insert_cash_movements" on public.cash_movements;
create policy "insert_cash_movements" on public.cash_movements for insert to authenticated with check (public.user_can_view_finance(church_id));
drop policy if exists "update_cash_movements" on public.cash_movements;
create policy "update_cash_movements" on public.cash_movements for update to authenticated using (public.user_can_view_finance(church_id)) with check (public.user_can_view_finance(church_id));
drop policy if exists "delete_cash_movements" on public.cash_movements;
create policy "delete_cash_movements" on public.cash_movements for delete to authenticated using (public.user_can_view_finance(church_id));

-- EVENT_FINANCIAL_CLOSURES
drop policy if exists "select_closures" on public.event_financial_closures;
create policy "select_closures" on public.event_financial_closures for select to authenticated using (public.user_can_view_finance(church_id));
drop policy if exists "insert_closures" on public.event_financial_closures;
create policy "insert_closures" on public.event_financial_closures for insert to authenticated with check (public.user_can_view_finance(church_id));
drop policy if exists "update_closures" on public.event_financial_closures;
create policy "update_closures" on public.event_financial_closures for update to authenticated using (public.user_can_view_finance(church_id)) with check (public.user_can_view_finance(church_id));
drop policy if exists "delete_closures" on public.event_financial_closures;
create policy "delete_closures" on public.event_financial_closures for delete to authenticated using (public.user_can_view_finance(church_id));

-- BUDGETS
drop policy if exists "select_budgets" on public.budgets;
create policy "select_budgets" on public.budgets for select to authenticated using (public.user_can_view_finance(church_id));
drop policy if exists "insert_budgets" on public.budgets;
create policy "insert_budgets" on public.budgets for insert to authenticated with check (public.user_can_view_finance(church_id));
drop policy if exists "update_budgets" on public.budgets;
create policy "update_budgets" on public.budgets for update to authenticated using (public.user_can_view_finance(church_id)) with check (public.user_can_view_finance(church_id));
drop policy if exists "delete_budgets" on public.budgets;
create policy "delete_budgets" on public.budgets for delete to authenticated using (public.user_can_view_finance(church_id));

-- BUDGET_LINES
drop policy if exists "select_budget_lines" on public.budget_lines;
create policy "select_budget_lines" on public.budget_lines for select to authenticated using (exists (select 1 from public.budgets b where b.id = budget_id and public.user_can_view_finance(b.church_id)));
drop policy if exists "insert_budget_lines" on public.budget_lines;
create policy "insert_budget_lines" on public.budget_lines for insert to authenticated with check (exists (select 1 from public.budgets b where b.id = budget_id and public.user_can_view_finance(b.church_id)));
drop policy if exists "update_budget_lines" on public.budget_lines;
create policy "update_budget_lines" on public.budget_lines for update to authenticated using (exists (select 1 from public.budgets b where b.id = budget_id and public.user_can_view_finance(b.church_id))) with check (exists (select 1 from public.budgets b where b.id = budget_id and public.user_can_view_finance(b.church_id)));
drop policy if exists "delete_budget_lines" on public.budget_lines;
create policy "delete_budget_lines" on public.budget_lines for delete to authenticated using (exists (select 1 from public.budgets b where b.id = budget_id and public.user_can_view_finance(b.church_id)));

-- Triggers updated_at
do $$
declare t text;
begin
  for t in select unnest(array[
    'contributions','tithes','pledges','expenses','cash_accounts',
    'cash_movements','event_financial_closures','budgets'
  ])
  loop
    execute format('drop trigger if exists trg_set_updated_at on public.%I', t);
    execute format('create trigger trg_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;
