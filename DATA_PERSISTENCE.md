# 데이터 영구 저장 시스템

## 개요

이 프로젝트는 학생 정보와 심사 기록을 **서버에 영구적으로 저장**합니다.

- **로컬 개발**: 파일 시스템 (`data/students.json`)
- **Vercel 배포**: Vercel Blob Storage (클라우드 영구 저장소)

## 작동 방식

### 1. 로컬 개발 환경

```bash
npm run dev
```

- 데이터가 `data/students.json` 파일에 저장됩니다
- 이 파일은 Git에서 제외되어 있습니다 (`.gitignore`)
- 서버를 재시작해도 데이터가 유지됩니다

### 2. Vercel 배포 환경

- 데이터가 **Vercel Blob Storage**에 저장됩니다
- Git push를 해도 데이터가 사라지지 않습니다
- Vercel 재배포를 해도 데이터가 유지됩니다

## Vercel 설정 방법

### 1단계: Blob Storage 생성

1. [Vercel 대시보드](https://vercel.com/dashboard)에서 프로젝트 선택
2. **Storage** 탭 클릭
3. **Create Database** → **Blob** 선택
4. Blob Store 생성

환경 변수 `BLOB_READ_WRITE_TOKEN`이 자동으로 설정됩니다.

### 2단계: 재배포

Blob Storage를 생성한 후 프로젝트를 재배포하면 자동으로 연결됩니다.

## API 엔드포인트

### GET `/api/storage?type=students`
학생 목록 조회

### GET `/api/storage?type=exams`
심사 기록 조회

### POST `/api/storage`
```json
{
  "type": "students",
  "data": [...]
}
```

## 데이터 백업

### Vercel 데이터 백업
```bash
curl https://your-domain.vercel.app/api/storage > backup.json
```

### 로컬 데이터 백업
```bash
cp data/students.json backup-$(date +%Y%m%d).json
```

## 문제 해결

### Q: 배포 후 데이터가 사라져요
A: Vercel Blob Storage를 생성했는지 확인하세요.

### Q: 로컬에서 데이터가 안 보여요
A: `data/students.json` 파일이 자동 생성되었는지 확인하세요.

### Q: Git push 후에도 Vercel 데이터 유지되나요?
A: 네! Vercel Blob Storage에 저장된 데이터는 코드 변경과 무관하게 유지됩니다.

## 기술 스택

- **Next.js 14** (App Router)
- **TypeScript**
- **Vercel Blob** (프로덕션 저장소)
- **Node.js fs** (로컬 개발)
