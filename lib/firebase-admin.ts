// Firebase Admin SDK 초기화 헬퍼
// 서버(API route)에서만 사용. 클라이언트에는 절대 import되지 않음.
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

let cachedApp: App | null = null;

type Credential = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function loadServiceAccount(): Credential {
  // 방식 A) 필드 분리 — FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (+ 선택: FIREBASE_PROJECT_ID)
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (clientEmail && privateKeyRaw) {
    let projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
      // service account 이메일에서 project_id 추출
      // 형태: name@PROJECT_ID.iam.gserviceaccount.com
      const m = clientEmail.match(/@([^.]+)\.iam\.gserviceaccount\.com$/);
      if (m) projectId = m[1];
    }
    if (!projectId) {
      throw new Error(
        "FIREBASE_PROJECT_ID 환경변수가 필요합니다 (또는 FIREBASE_CLIENT_EMAIL을 *@PROJECT_ID.iam.gserviceaccount.com 형식으로 입력).",
      );
    }
    return {
      projectId,
      clientEmail,
      // .env에 \n으로 적혀있던 줄바꿈 문자를 실제 개행으로 변환
      privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
    };
  }

  // 방식 B) base64 인코딩된 service-account JSON 통째
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 0) {
    try {
      const raw = Buffer.from(b64, "base64").toString("utf-8");
      const parsed = JSON.parse(raw);
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      };
    } catch (e) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_BASE64 디코딩/파싱 실패. base64 인코딩된 service-account JSON이 맞는지 확인하세요. ${e}`,
      );
    }
  }

  // 방식 C) 원본 JSON 문자열
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (rawJson && rawJson.length > 0) {
    try {
      const parsed = JSON.parse(rawJson);
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      };
    } catch (e) {
      throw new Error(`FIREBASE_SERVICE_ACCOUNT_KEY JSON 파싱 실패. ${e}`);
    }
  }

  throw new Error(
    "Firebase Admin 자격증명이 필요합니다. .env.local 에 (FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY) 또는 FIREBASE_SERVICE_ACCOUNT_BASE64 중 하나를 설정하세요.",
  );
}

function getAdminApp(): App {
  if (cachedApp) return cachedApp;

  // 다른 곳에서 이미 초기화했다면 그것 사용 (HMR 환경 대응)
  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0]!;
    return cachedApp;
  }

  const { projectId, clientEmail, privateKey } = loadServiceAccount();
  cachedApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return cachedApp;
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminStorage(): Storage {
  return getStorage(getAdminApp());
}
