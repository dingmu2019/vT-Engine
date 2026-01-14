-- ------------------------------------------------------------------------
-- Migration: migration_010_auth_email_login_codes.sql
-- Desc    : 邮箱验证码登录：存储验证码哈希、过期时间、尝试次数、使用状态
-- ------------------------------------------------------------------------

create table if not exists public.auth_email_login_codes (
  id bigint generated always as identity primary key,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  used_at timestamptz
);

create unique index if not exists uniq_auth_email_login_codes_email
  on public.auth_email_login_codes (email);

create index if not exists idx_auth_email_login_codes_expires_at
  on public.auth_email_login_codes (expires_at);

create trigger update_auth_email_login_codes_updated_at
before update on public.auth_email_login_codes
for each row
execute function public.update_updated_at_column();

comment on table public.auth_email_login_codes is '邮箱验证码登录：验证码哈希与使用状态';
comment on column public.auth_email_login_codes.email is '登录邮箱(唯一)';
comment on column public.auth_email_login_codes.code_hash is '验证码哈希(不存明文)';
comment on column public.auth_email_login_codes.expires_at is '过期时间';
comment on column public.auth_email_login_codes.attempts is '尝试次数';
comment on column public.auth_email_login_codes.used_at is '使用时间(非空表示已消费)';

alter table public.auth_email_login_codes enable row level security;
create policy "Enable all access for service role" on public.auth_email_login_codes for all using (true) with check (true);

