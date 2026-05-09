# 한국체대 백호태권도 · 성장 기록 시스템

학부모가 자녀의 태권도 심사 결과를 손쉽게 확인하고, 합격 상장을 이미지로 저장할 수 있는 Next.js 기반 웹 서비스입니다. 관장님은 비밀번호로 보호된 어드민 페이지에서 학생을 추가/수정/삭제할 수 있습니다.

## 기술 스택

- **Next.js 14** (App Router)
- **Tailwind CSS** (화이트 + 네이비 톤, Bento Grid 레이아웃)
- **Lucide React** (아이콘)
- **html2canvas** (상장 이미지 다운로드)
- **localStorage** 기반 데이터 저장 (백엔드 없이 즉시 동작)

## 빠른 시작

```bash
# 1) 의존성 설치
npm install

# 2) 개발 서버 실행
npm run dev

# 3) 브라우저에서 접속
# http://localhost:3000
```

빌드 / 배포:

```bash
npm run build
npm run start
```

## 페이지 구성

| 경로 | 설명 |
| --- | --- |
| `/` | 메인 페이지. 학생 이름 + 생년월일로 로그인. |
| `/student/[id]` | 학생 결과 조회. 별점 평가, 코멘트, 상장 다운로드. |
| `/admin` | 관리자 전용. 비밀번호 `66009873` 입력 후 학생 CRUD. |

## 테스트용 시드 데이터

처음 접속 시 다음 두 명의 샘플 학생이 자동으로 생성됩니다.

| 이름 | 생년월일 |
| --- | --- |
| 김도현 | 2015-04-12 |
| 박서연 | 2016-09-23 |

> 데이터는 모두 브라우저 `localStorage`에 저장되므로 새로고침/재접속 후에도 유지됩니다. 관리자 페이지에서 자유롭게 학생을 추가하고 항목을 수정해 보세요.

## 주요 기능 미리보기

- **Bento Grid 디자인**: 정보를 시각적 블록으로 구획화해 모바일에서도 한눈에 들어옵니다.
- **별점(Star Rating) 시스템**: 기본동작 / 품새 / 발차기 / 예의 / 노력 / 절제 / 인내를 1~5점으로 직관적으로 평가.
- **상장 다운로드**: 모달에서 미리보기 후 PNG 이미지로 저장 (html2canvas, scale 2x로 고해상도).
- **반응형**: 모바일 우선 레이아웃으로 학부모가 휴대폰에서 편하게 확인.
- **합격 도장 효과**: CSS만으로 제작한 회전형 빨간 도장이 상장 우측 하단에 자연스럽게 겹쳐집니다.

## html2canvas 핵심 코드 (참고)

```tsx
const html2canvas = (await import("html2canvas")).default;
const canvas = await html2canvas(certRef.current, {
  backgroundColor: "#fdfaf0",
  scale: 2,           // 고해상도
  useCORS: true,      // 외부 이미지 사용 시
});
const link = document.createElement("a");
link.download = `${student.name}_백호태권도_합격증.png`;
link.href = canvas.toDataURL("image/png");
link.click();
```

## 폴더 구조

```
.
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                # 로그인 메인
│   ├── student/[id]/page.tsx   # 결과 조회
│   └── admin/page.tsx          # 관리자
├── components/
│   ├── StarRating.tsx
│   └── Certificate.tsx
├── lib/
│   ├── types.ts
│   ├── storage.ts
│   └── clsx.ts
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── tsconfig.json
└── package.json
```

## 다음 단계 추천

- 백엔드 연결 (Supabase / Firebase) 시 `lib/storage.ts`만 교체하면 됩니다.
- 학생별 누적 심사 이력 페이지 (성장 그래프).
- 카카오톡 / 이메일로 결과지 자동 발송.
