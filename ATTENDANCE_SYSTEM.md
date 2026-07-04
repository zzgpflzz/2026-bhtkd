# 출석체크 시스템

백호태권도 출석체크 시스템 사용 가이드

## 📋 시스템 개요

출석체크 시스템은 태권도장 원생들의 일일 출석을 관리하고, 월간 출석부를 생성하며, 완벽 출석자를 자동으로 선정하는 기능을 제공합니다.

**심사용 학생 데이터와 완전 분리** - 심사를 보지 않는 원생도 출석체크 대상으로 등록할 수 있습니다.

## 🗂️ 데이터 구조

### Firebase Collections

#### 1. `attendanceStudents` - 출석용 원생 정보
```typescript
{
  id: string;              // 고유 ID (예: "att-student-1783143537440")
  name: string;            // 원생 이름
  birthDate: string;       // 생년월일 (YYYY-MM-DD) - 나이 자동 계산용
  attendanceDays: string[];// 등원 요일 배열 ["월", "화", "수", "목", "금"]
  createdAt: string;       // 생성 시간 (ISO 8601)
}
```

#### 2. `attendanceRecords` - 출석 기록
```typescript
{
  id: string;              // 고유 ID (예: "{studentId}-{date}")
  studentId: string;       // 원생 ID (attendanceStudents 참조)
  date: string;            // 출석 날짜 (YYYY-MM-DD)
  status: string;          // 출석 상태 ("present" | "absent")
  reason?: string;         // 결석 사유 (결석일 때만)
  recordedAt: string;      // 기록 시간 (ISO 8601)
}
```

### 데이터 분리 정책

- **심사용**: `students` 컬렉션 (기존)
- **출석용**: `attendanceStudents` 컬렉션 (신규)
- 같은 아이가 양쪽에 모두 존재 가능
- 각각 독립적으로 관리됨

## 📁 페이지 구조

### 1. 출석체크 (`/attendance`)
- **기능**: 오늘의 출석 체크
- **특징**:
  - 오늘 요일에 등원 예정인 원생만 자동 표시
  - 주말에는 접근 불가 안내
  - 나이대별 그룹화 (유치부, 초등 저학년, 초등 고학년, 중고등부)
  - 결석 체크 + 사유 입력
  - 일괄 출석 처리 버튼

### 2. 원생 관리 (`/attendance/students`)
- **기능**: 원생 등록/수정/삭제
- **특징**:
  - 이름, 생년월일, 등원 요일 관리
  - 생년월일 입력 시 나이 자동 표시
  - 등원 요일 복수 선택 (월~금)
  - 나이대별 자동 그룹화
  - 원생 삭제 시 출석 기록도 함께 삭제

### 3. 월간 출석부 (`/attendance/monthly`)
- **기능**: 월별 출석 현황 조회
- **특징**:
  - 연도/월 선택 가능
  - 평일(월~금)만 표시
  - 출석(O), 결석(X), 등원 예정 없음(-) 구분
  - A4 가로 인쇄 최적화
  - 결석 사유 툴팁으로 확인 가능

### 4. 출석왕 (`/attendance/perfect`)
- **기능**: 완벽 출석자 명단
- **특징**:
  - 월별 선택 가능
  - 예정 등원일 100% 출석자만 표시
  - 나이대별 그룹화
  - 시각적 강조 (트로피 아이콘, 노란색 테마)

## 🎯 주요 기능

### 나이 자동 계산
- 생년월일 저장 → 한국 나이 자동 계산
- 매년 자동 갱신 (수동 업데이트 불필요)

```typescript
// 한국 나이 = 현재 연도 - 출생 연도 + 1
calculateAge("2015-04-12") // → 12세 (2026년 기준)
```

### 나이대 자동 그룹화
- **유치부**: 7세 이하
- **초등 저학년**: 8~10세
- **초등 고학년**: 11~13세
- **중고등부**: 14세 이상

### 출석왕 자동 계산
1. 해당 월의 평일(월~금) 중 원생의 등원 예정일 계산
2. 실제 출석 기록과 비교
3. 예정일에 모두 출석한 원생만 선정

**예시**: 
- 원생 A: 월/수/금 등원 예정
- 7월 월/수/금 = 13일
- 실제 출석 = 13일
- 결과: 출석왕 ✅

## 🔧 사용 방법

### 1. 원생 등록
1. `/attendance/students` 접속
2. "원생 추가" 버튼 클릭
3. 이름, 생년월일 입력
4. 등원 요일 선택 (복수 선택 가능)
5. 저장

### 2. 일일 출석 체크
1. `/attendance` 접속
2. 오늘 등원 예정인 원생 목록 확인
3. 결석한 원생 체크 (X 버튼 클릭)
4. 결석 사유 입력 (예: "감기", "가족 행사")
5. "출석 체크 완료" 버튼 클릭
6. 체크 안 된 원생은 자동으로 출석 처리됨

### 3. 월간 출석부 확인
1. `/attendance/monthly` 접속
2. 연도/월 선택
3. 출석 현황 확인
4. 인쇄 필요 시 "인쇄" 버튼 클릭

### 4. 출석왕 확인
1. `/attendance/perfect` 접속
2. 연도/월 선택
3. 해당 월 완벽 출석자 확인

## 🛠️ 기술 스택

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Lucide Icons (CheckCircle2, XCircle, Trophy, Award 등)

### Backend
- Next.js API Routes
- Firebase Firestore (데이터베이스)
- Firebase Admin SDK (서버 사이드)

### 상태 관리
- React Hooks (useState, useEffect)
- Client-side caching (30초 TTL)

## 📊 API 엔드포인트

### GET `/api/attendance`
**원생 목록 조회**
- `?type=students` - 전체 원생 목록
- `?type=students&id={id}` - 특정 원생 조회
- `?type=records` - 전체 출석 기록
- `?type=records&id={id}` - 특정 출석 기록

### PUT `/api/attendance`
**데이터 생성/수정**
- `?type=students&id={id}` - 원생 정보 저장
- `?type=records&id={id}` - 출석 기록 저장
- `?type=records&bulk=true` - 출석 기록 일괄 저장

### DELETE `/api/attendance`
**데이터 삭제**
- `?type=students&id={id}` - 원생 삭제 (출석 기록도 함께 삭제)

## 🔐 접근 권한

- 관리자 페이지(`/admin`) 로그인 필요
- 관리자 페이지 헤더의 "출석체크" 버튼으로 접근
- 또는 직접 `/attendance` URL 접속

## 📝 주의사항

### 주말 출석 체크
- 토요일, 일요일에는 출석체크 페이지 접근 시 안내 메시지 표시
- 평일(월~금)만 출석 체크 가능

### 데이터 삭제
- 원생 삭제 시 해당 원생의 모든 출석 기록도 함께 삭제됨
- 삭제 전 확인 메시지 표시

### 출석왕 조건
- 해당 월의 예정 등원일에 **모두** 출석해야 함
- 단 하루라도 결석하면 제외됨
- 공휴일은 자동으로 제외됨 (평일만 계산)

### 인쇄 최적화
- 월간 출석부는 A4 가로 방향 최적화
- 인쇄 시 헤더/네비게이션 자동 숨김
- 테이블 페이지 분할 방지

## 🚀 배포 시 체크리스트

- [ ] Firebase 프로젝트 설정 완료
- [ ] Firestore 인덱스 생성 (`attendanceRecords`의 `studentId` 필드)
- [ ] 환경변수 설정 (`.env.local`)
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
  - `FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] Firestore 보안 규칙 설정
- [ ] 관리자 비밀번호 변경 (`app/admin/page.tsx`)

## 📞 문제 해결

### 데이터가 로드되지 않을 때
1. Firebase 콘솔에서 Firestore 데이터 확인
2. 브라우저 콘솔에서 에러 메시지 확인
3. API 응답 상태 확인 (Network 탭)

### 출석 기록이 저장되지 않을 때
1. 결석 원생의 결석 사유가 모두 입력되었는지 확인
2. 네트워크 연결 상태 확인
3. Firebase Firestore 쓰기 권한 확인

### 출석왕이 표시되지 않을 때
1. 월말이 지났는지 확인 (월 중에는 데이터 불완전)
2. 모든 예정 등원일에 출석 기록이 있는지 확인
3. 해당 월에 등록된 원생이 있는지 확인

## 📚 관련 문서

- [Firebase Setup Guide](./FIREBASE_SETUP.md)
- [Data Persistence Guide](./DATA_PERSISTENCE.md)
- [Vercel Deployment Guide](./VERCEL_SETUP.md)
