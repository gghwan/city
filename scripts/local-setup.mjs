#!/usr/bin/env node

import { randomBytes } from 'node:crypto';
import { access, copyFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const envExamplePath = path.join(rootDir, '.env.example');
const envLocalPath = path.join(rootDir, '.env.local');
const envPath = path.join(rootDir, '.env');

const REQUIRED_FOR_FULL_TEST = [
  'DATABASE_URL',
  'DIRECT_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
];

const REQUIRED_SECRET_KEYS = ['SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
const SANITIZE_TO_EMPTY_KEYS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GOOGLE_AI_API_KEY',
];

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function ensureLine(content, key, value) {
  const line = `${key}=${value}`;
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, line);
  }
  return `${content.trimEnd()}\n${line}\n`;
}

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

function isPlaceholder(value) {
  if (!value || !value.trim()) return true;
  const normalized = value.trim();

  return (
    normalized.includes('your_') ||
    normalized.includes('[password]') ||
    normalized.includes('xxx.supabase.co') ||
    normalized.includes('your-app.vercel.app')
  );
}

async function main() {
  if (!(await exists(envLocalPath))) {
    if (!(await exists(envExamplePath))) {
      throw new Error('.env.example 파일을 찾을 수 없습니다.');
    }
    await copyFile(envExamplePath, envLocalPath);
    console.log('`.env.local` 파일을 `.env.example` 기준으로 생성했습니다.');
  }

  let envLocal = await readFile(envLocalPath, 'utf8');

  envLocal = ensureLine(envLocal, 'NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
  envLocal = ensureLine(envLocal, 'NEXTAUTH_URL', 'http://localhost:3000');

  let envLocalValues = parseEnv(envLocal);

  for (const key of SANITIZE_TO_EMPTY_KEYS) {
    if (isPlaceholder(envLocalValues[key])) {
      envLocal = ensureLine(envLocal, key, '');
    }
  }

  envLocalValues = parseEnv(envLocal);
  if (isPlaceholder(envLocalValues.NEXTAUTH_SECRET)) {
    const generatedSecret = randomBytes(32).toString('hex');
    envLocal = ensureLine(envLocal, 'NEXTAUTH_SECRET', generatedSecret);
    console.log('`NEXTAUTH_SECRET`를 로컬용으로 자동 생성했습니다.');
  }

  await writeFile(envLocalPath, envLocal, 'utf8');

  await copyFile(envLocalPath, envPath);
  console.log('Prisma CLI 호환을 위해 `.env.local` 내용을 `.env`로 동기화했습니다.');

  const finalEnv = parseEnv(await readFile(envLocalPath, 'utf8'));
  const missing = REQUIRED_FOR_FULL_TEST.filter((key) => isPlaceholder(finalEnv[key]));
  const hasSecretKey = REQUIRED_SECRET_KEYS.some((key) => !isPlaceholder(finalEnv[key]));

  if (!hasSecretKey) {
    missing.push('SUPABASE_SECRET_KEY 또는 SUPABASE_SERVICE_ROLE_KEY');
  }

  if (missing.length) {
    console.log('\n[안내] 아래 값이 비어 있거나 예시 값이라 일부 기능 테스트가 제한될 수 있습니다.');
    for (const key of missing) {
      console.log(`- ${key}`);
    }
  } else {
    console.log('\n로컬 전체 기능 테스트에 필요한 주요 환경변수 구성이 확인되었습니다.');
  }
}

main().catch((error) => {
  console.error('[local-setup] 실패:', error instanceof Error ? error.message : error);
  process.exit(1);
});
