#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const root = process.cwd();
const envLocalPath = path.join(root, '.env.local');
const usersPath = path.join(root, 'data/users-cleaned.json');

function parseEnv(content) {
  const result = {};
  for (const row of content.split(/\r?\n/)) {
    const line = row.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx < 1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

async function main() {
  const env = parseEnv(await readFile(envLocalPath, 'utf8'));
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY(또는 SERVICE_ROLE_KEY)가 필요합니다.');
  }

  const users = JSON.parse(await readFile(usersPath, 'utf8'));
  const passwordHash = await bcrypt.hash('191435', 12);
  const nowIso = new Date().toISOString();

  const payload = users.map((user) => ({
    username: user.username,
    password: passwordHash,
    role: 'USER',
    createdAt: nowIso,
    updatedAt: nowIso,
  }));

  payload.push({
    username: '김주형관리자',
    password: passwordHash,
    role: 'ADMIN',
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from('User').upsert(payload, { onConflict: 'username' });
  if (error) {
    throw new Error(`User 업서트 실패: ${error.message}`);
  }

  const { count, error: countError } = await supabase
    .from('User')
    .select('id', { count: 'exact', head: true });
  if (countError) {
    throw new Error(`User 개수 조회 실패: ${countError.message}`);
  }

  console.log(`User 테이블 동기화 완료: ${payload.length}건 업서트 요청, 현재 총 ${count ?? 0}건`);
}

main().catch((error) => {
  console.error('[sync-users-to-supabase] 실패:', error instanceof Error ? error.message : error);
  process.exit(1);
});
