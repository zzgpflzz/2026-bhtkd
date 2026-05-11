# Firebase Admin SDK 설정 가이드

## 문제 상황
Firebase Client SDK는 브라우저용이라 서버 사이드(Vercel)에서 작동하지 않습니다.
따라서 API 라우트에서는 **Firebase Admin SDK**를 사용해야 합니다.

## 설정 방법

### 1. Firebase 서비스 계정 키 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 프로젝트 선택: **bhtkd-37f39**
3. 좌측 메뉴에서 **⚙️ 프로젝트 설정** 클릭
4. **서비스 계정** 탭 선택
5. **새 비공개 키 생성** 버튼 클릭
6. JSON 파일이 다운로드됩니다

### 2. 환경 변수 설정

다운로드한 JSON 파일을 열면 다음과 같은 구조입니다:

```json
{
  "type": "service_account",
  "project_id": "bhtkd-37f39",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@bhtkd-37f39.iam.gserviceaccount.com",
  "client_id": "...",
  ...
}
```

#### 로컬 개발 환경 (.env.local)

프로젝트 루트의 `.env.local` 파일을 수정:

```env
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@bhtkd-37f39.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**주의사항:**
- `client_email` 값을 `FIREBASE_CLIENT_EMAIL`에 복사
- `private_key` 값을 `FIREBASE_PRIVATE_KEY`에 복사 (따옴표 포함)
- Private key는 `\n`이 실제 줄바꿈으로 포함되어 있습니다

#### Vercel 배포 환경

1. [Vercel Dashboard](https://vercel.com/)에서 프로젝트 선택
2. **Settings** → **Environment Variables** 이동
3. 다음 변수들을 추가:

| Name | Value | Environment |
|------|-------|-------------|
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-xxxxx@bhtkd-37f39.iam.gserviceaccount.com` | Production, Preview, Development |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` | Production, Preview, Development |

**Vercel에서 Private Key 입력 시 주의:**
- 따옴표는 **제거**하고 입력
- `\n`은 그대로 유지 (실제 줄바꿈이 아님)

### 3. 개발 서버 재시작

환경 변수를 추가한 후:

```bash
# 개발 서버 재시작
npm run dev
```

### 4. Vercel 재배포

환경 변수를 Vercel에 추가한 후:

```bash
git add .
git commit -m "feat: switch to Firebase Admin SDK"
git push origin main
```

또는 Vercel Dashboard에서 **Deployments** → **Redeploy** 클릭

## 확인 방법

### 로컬에서 확인
1. 개발 서버 실행: `npm run dev`
2. 관리자 페이지에서 학생 추가
3. 터미널 로그 확인:
   ```
   ✅ Firebase Admin initialized successfully
   🔍 [API POST] Request received
   💾 [API POST] Saving to Firestore...
   ✅ [API POST] Successfully saved to Firestore
   ```

### Vercel에서 확인
1. 배포 후 관리자 페이지 접속
2. 학생 추가 시도
3. 성공하면 새로고침 후에도 데이터 유지됨
4. Vercel Dashboard → **Functions** → 로그 확인

## 문제 해결

### "client is offline" 에러
→ Admin SDK로 교체 필요 (이미 완료)

### "credential must be a non-null object" 에러
→ 환경 변수가 제대로 설정되지 않음
→ `.env.local` 확인 또는 Vercel 환경 변수 재확인

### "PERMISSION_DENIED" 에러
→ Firestore 규칙 확인 필요
→ Firebase Console → Firestore Database → Rules에서 다음 규칙 적용:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // 개발 중이므로 모든 접근 허용
    }
  }
}
```

**프로덕션 환경에서는 보안 규칙을 강화해야 합니다!**

## 보안 참고사항

- `.env.local` 파일은 절대 Git에 커밋하지 마세요 (`.gitignore`에 포함됨)
- 서비스 계정 JSON 파일도 Git에 커밋하지 마세요
- Private Key가 노출되면 즉시 해당 서비스 계정을 삭제하고 새로 생성하세요
