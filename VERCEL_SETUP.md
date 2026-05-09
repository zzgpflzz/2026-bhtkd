# Vercel 배포 및 데이터 영구 저장 설정 가이드

## 1. Vercel에 프로젝트 배포

1. [Vercel](https://vercel.com)에 로그인
2. "Add New Project" 클릭
3. GitHub 저장소 연결
4. 프로젝트 Import

## 2. Vercel Blob Storage 설정

데이터를 영구적으로 저장하려면 Vercel Blob Storage를 사용해야 합니다.

### 설정 방법:

1. Vercel 대시보드에서 프로젝트 선택
2. **Storage** 탭 클릭
3. **Create Database** → **Blob** 선택
4. Blob Store 생성

Vercel이 자동으로 환경 변수 `BLOB_READ_WRITE_TOKEN`을 설정해줍니다.

## 3. 로컬 개발 환경 설정

로컬에서는 파일 시스템을 사용합니다:

```bash
npm install
npm run dev
```

데이터는 `data/students.json` 파일에 저장됩니다.

## 4. 주의사항

- **로컬 개발**: 데이터가 `data/students.json`에 저장됨 (Git에서 제외됨)
- **Vercel 배포**: 데이터가 Vercel Blob Storage에 저장됨 (영구 보존)
- Git push를 해도 Vercel의 데이터는 유지됩니다
- 초기 배포 시 기본 샘플 데이터가 자동 생성됩니다

## 5. 데이터 백업

Vercel Blob에 저장된 데이터를 백업하려면:

```bash
# API 엔드포인트에서 데이터 다운로드
curl https://your-domain.vercel.app/api/storage > backup.json
```

## 대안: 간단한 방법 (Git 기반 저장)

Vercel Blob 없이 Git으로 관리하고 싶다면:

1. `.gitignore`에서 `data/*.json` 제거
2. 데이터 변경 후 Git commit & push
3. Vercel이 자동 재배포

⚠️ 단점: 데이터 변경마다 Git 히스토리가 쌓임
