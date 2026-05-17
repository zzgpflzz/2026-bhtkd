#!/usr/bin/env node
// Firebase service account JSON 파일을 받아서 .env.local 을 자동으로 채워주는 스크립트
//
// 사용법:
//   node scripts/setup-env.mjs
//     → ~/Downloads 폴더에서 bhtkd 관련 service account JSON 자동 탐지
//
//   node scripts/setup-env.mjs /path/to/key.json
//     → 경로 직접 지정

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

const args = process.argv.slice(2);
let jsonPath;

if (args[0]) {
  jsonPath = resolve(args[0]);
  if (!existsSync(jsonPath)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${jsonPath}`);
    process.exit(1);
  }
} else {
  const downloadsDir = join(homedir(), "Downloads");
  if (!existsSync(downloadsDir)) {
    console.error(`❌ ~/Downloads 폴더가 없습니다.`);
    process.exit(1);
  }

  // bhtkd + firebase-adminsdk 가 이름에 들어간 .json 파일 검색
  const candidates = readdirSync(downloadsDir)
    .filter((f) => /firebase-adminsdk.*\.json$/i.test(f) && /bhtkd/i.test(f))
    .map((f) => {
      const p = join(downloadsDir, f);
      return { name: f, path: p, mtime: statSync(p).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  if (candidates.length === 0) {
    console.error("❌ ~/Downloads 폴더에서 service account 키 파일을 찾을 수 없습니다.");
    console.error("");
    console.error("Firebase Console → 톱니바퀴 → '프로젝트 설정' → '서비스 계정' →");
    console.error("'새 비공개 키 생성' 버튼으로 JSON 파일을 다운받으신 후 다시 실행하세요.");
    console.error("");
    console.error("또는 파일 경로를 직접 지정:");
    console.error("  node scripts/setup-env.mjs /path/to/key.json");
    process.exit(1);
  }

  jsonPath = candidates[0].path;
  console.log(`📁 자동 탐지: ${candidates[0].name}`);
  if (candidates.length > 1) {
    console.log(`   (${candidates.length}개 중 가장 최근 파일 사용)`);
  }
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(jsonPath, "utf-8"));
} catch (e) {
  console.error(`❌ JSON 파일을 읽지 못했습니다: ${jsonPath}`);
  console.error(`   ${e.message}`);
  process.exit(1);
}

const { client_email, private_key, project_id } = serviceAccount;

if (!client_email || !private_key) {
  console.error("❌ JSON 파일에 client_email 또는 private_key 필드가 없습니다.");
  console.error("   Firebase service account 키 파일이 맞는지 확인하세요.");
  process.exit(1);
}

// .env 파일에서 줄바꿈은 \n 리터럴 두 글자로 저장
const privateKeyEscaped = private_key.replace(/\n/g, "\\n");

const envContent = `# Firebase Admin SDK 서비스 계정 설정
# scripts/setup-env.mjs 로 자동 생성 (${new Date().toISOString()})
# 이 파일은 .gitignore 로 깃에 올라가지 않도록 차단되어 있습니다.

FIREBASE_PROJECT_ID=${project_id}
FIREBASE_CLIENT_EMAIL=${client_email}
FIREBASE_PRIVATE_KEY="${privateKeyEscaped}"
`;

const envPath = resolve(process.cwd(), ".env.local");
writeFileSync(envPath, envContent, "utf-8");

console.log("");
console.log(`✅ .env.local 생성 완료`);
console.log(`   FIREBASE_PROJECT_ID  = ${project_id}`);
console.log(`   FIREBASE_CLIENT_EMAIL = ${client_email}`);
console.log(`   FIREBASE_PRIVATE_KEY  = ********** (${private_key.length}자)`);
console.log("");
console.log("다음 단계:");
console.log("  1) npm install");
console.log("  2) npm run dev");
console.log("  3) http://localhost:3000 에서 학생 저장 후 새로고침 테스트");
console.log("");
console.log("Vercel에도 같은 3개 환경변수 등록하시면 됩니다.");
