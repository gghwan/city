#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const envLocalPath = path.join(process.cwd(), '.env.local');

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

function hasValue(value) {
  return Boolean(value && value.trim());
}

function run(command) {
  execSync(command, { stdio: 'inherit' });
}

async function main() {
  run('npm run prisma:generate');

  const env = parseEnv(await readFile(envLocalPath, 'utf8'));
  const hasDb = hasValue(env.DATABASE_URL) && hasValue(env.DIRECT_URL);

  if (!hasDb) {
    console.log('\n[local:setup] DATABASE_URL / DIRECT_URL가 비어 있어 DB 작업은 건너뜁니다.');
    console.log('[local:setup] 기본 화면/로그인/네비게이션 테스트는 `npm run dev`로 바로 가능합니다.');
    return;
  }

  run('npm run prisma:push');
  run('npm run prisma:seed');
  console.log('\n[local:setup] DB 스키마 반영 + 시드 데이터 준비가 완료되었습니다.');
}

main().catch((error) => {
  console.error('[local:setup] 실패:', error instanceof Error ? error.message : error);
  process.exit(1);
});
