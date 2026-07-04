# 🎖️ 상장 제작 페이지 구현 Task

**상태**: 📋 대기 중 (출석체크 페이지 수정 후 진행)

---

## 📝 요구사항

### 기본 기능
1. 상장 배경 이미지 위에 텍스트 편집
2. 텍스트 내용 변경 가능
3. Google Fonts 연동으로 폰트 변경
4. 완성된 상장을 JPG 파일로 저장

### 최종 목표
- 관리자가 직접 상장 디자인에 텍스트를 입력
- 실시간 프리뷰 확인
- JPG 파일로 다운로드

---

## ✅ 기술적 가능성 검증 완료

### JPG 저장 방식
- **선택**: html2canvas 라이브러리 사용
- **이유**: 구현 빠름, CSS 스타일 그대로 반영, 충분한 품질
- **설치**: `npm install html2canvas`
- **예상 시간**: 10분

### Google Fonts 연동
- **방법 A**: Next.js `next/font/google` (정적, 추천)
- **방법 B**: Google Fonts API (동적)
- **추천**: 혼합 방식
  - 자주 쓰는 5-10개 폰트는 next/font로 정적 로드
  - 추가 폰트 필요시 동적 로드
- **예상 시간**: 20분

---

## 🎨 UI 구성

```
┌─────────────────────────────────────────────────┐
│  상장 제작                                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  [편집 패널]              [프리뷰 영역]           │
│                                                 │
│  ┌─────────────────┐    ┌─────────────────┐   │
│  │ 이름 입력        │    │  [상장 배경]     │   │
│  │ 날짜 선택        │    │   + 오버레이     │   │
│  │ 수상 내용        │    │     텍스트       │   │
│  │ 발급 기관        │    │                 │   │
│  │                 │    │  (실시간 반영)   │   │
│  │ 폰트 선택 ▼     │    │                 │   │
│  │ 폰트 크기       │    └─────────────────┘   │
│  │ 텍스트 색상     │                          │
│  └─────────────────┘                          │
│                                                 │
│         [JPG로 저장 버튼]                       │
└─────────────────────────────────────────────────┘
```

---

## 📁 파일 구조

```
app/certificate/
├── page.tsx              → 상장 편집기 메인
├── components/
│   ├── CertificateEditor.tsx   → 편집 패널
│   └── CertificatePreview.tsx  → 프리뷰 영역
└── templates/
    └── default.png       → 기본 상장 템플릿 이미지
```

---

## 🔧 구현 단계

### 1단계: 기본 페이지 생성 (10분)
- [ ] `/app/certificate/page.tsx` 생성
- [ ] 레이아웃 구성 (편집 패널 + 프리뷰)
- [ ] 관리자 페이지에서 접근 링크 추가

### 2단계: 텍스트 편집 기능 (15분)
- [ ] 입력 필드 구현
  - [ ] 수상자 이름
  - [ ] 수상 날짜 (date picker)
  - [ ] 수상 내용/사유
  - [ ] 발급 기관명
- [ ] State 관리 (useState)
- [ ] 실시간 프리뷰 반영

### 3단계: Google Fonts 연동 (20분)
- [ ] 한국어 폰트 5-10개 선택
  - [ ] Noto Serif KR (명조체)
  - [ ] Gowun Batang (고운 바탕)
  - [ ] Nanum Myeongjo (나눔명조)
  - [ ] Black Han Sans (검은고딕)
  - [ ] Jua (주아체)
- [ ] next/font/google 설정
- [ ] 폰트 선택 드롭다운 UI
- [ ] 선택한 폰트 적용

### 4단계: 스타일 조정 (10분)
- [ ] 폰트 크기 조절 (슬라이더 or 숫자 입력)
- [ ] 텍스트 색상 선택 (컬러 피커)
- [ ] 텍스트 위치 미세 조정 (선택사항)

### 5단계: JPG 저장 기능 (15분)
- [ ] html2canvas 설치
- [ ] 저장 함수 구현
```typescript
const handleSaveAsJPG = async () => {
  const element = document.getElementById('certificate-preview');
  const canvas = await html2canvas(element, {
    scale: 2, // 고해상도
    backgroundColor: '#ffffff',
  });
  
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `상장_${name}.jpg`;
    link.href = url;
    link.click();
  }, 'image/jpeg', 0.95); // JPG, 95% 품질
};
```
- [ ] 저장 버튼 UI
- [ ] 파일명 자동 생성 (예: 상장_홍길동_2026-07-04.jpg)

---

## 💻 핵심 코드 스니펫

### 기본 구조
```typescript
'use client';

import { useState } from 'react';
import html2canvas from 'html2canvas';
import { Noto_Serif_KR, Gowun_Batang } from 'next/font/google';

const notoSerif = Noto_Serif_KR({ weight: ['400', '700'], subsets: ['korean'] });
const gowunBatang = Gowun_Batang({ weight: ['400', '700'], subsets: ['korean'] });

export default function CertificateMaker() {
  const [name, setName] = useState('홍길동');
  const [date, setDate] = useState('2026년 7월 4일');
  const [content, setContent] = useState('태권도 3급 승급');
  const [organization, setOrganization] = useState('백호태권도');
  const [selectedFont, setSelectedFont] = useState('noto');
  const [fontSize, setFontSize] = useState(48);
  const [textColor, setTextColor] = useState('#000000');
  
  const fontMap = {
    noto: notoSerif.className,
    gowun: gowunBatang.className,
  };
  
  const handleSave = async () => {
    const element = document.getElementById('certificate-preview');
    const canvas = await html2canvas(element, { scale: 2 });
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob!);
      const link = document.createElement('a');
      link.download = `상장_${name}_${date}.jpg`;
      link.href = url;
      link.click();
    }, 'image/jpeg', 0.95);
  };
  
  return (
    <div className="grid grid-cols-2 gap-8">
      {/* 편집 패널 */}
      <div className="space-y-4">
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          placeholder="수상자 이름"
          className="form-input"
        />
        {/* ... 나머지 입력 필드 */}
        
        <button onClick={handleSave} className="btn-primary">
          JPG로 저장
        </button>
      </div>
      
      {/* 프리뷰 */}
      <div 
        id="certificate-preview" 
        className={`relative ${fontMap[selectedFont]}`}
        style={{ fontSize: `${fontSize}px`, color: textColor }}
      >
        <img src="/certificate-bg.png" alt="상장 배경" className="w-full" />
        <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2">
          {name}
        </div>
        {/* ... 나머지 텍스트 배치 */}
      </div>
    </div>
  );
}
```

---

## 🎨 추천 Google Fonts (한국어)

### 명조체 계열
1. **Noto Serif KR** - 깔끔한 명조, 가독성 좋음 ⭐
2. **Gowun Batang** - 전통적인 느낌
3. **Nanum Myeongjo** - 부드러운 명조

### 고딕체 계열
4. **Noto Sans KR** - 기본 고딕
5. **Nanum Gothic** - 친근한 고딕

### 특수 서체
6. **Black Han Sans** - 굵고 강한 느낌 (제목용)
7. **Jua** - 귀여운 손글씨 느낌
8. **Dokdo** - 손글씨 스타일
9. **Sunflower** - 부드러운 손글씨
10. **Gaegu** - 캐주얼 손글씨

---

## 📦 필요한 패키지

```bash
npm install html2canvas
```

---

## 🔗 접근 경로

- URL: `/certificate`
- 관리자 페이지에서 "상장 제작" 버튼 추가
- 또는 출석체크 페이지 헤더에 링크 추가

---

## 🚀 향후 확장 가능 기능

### Phase 2 (추가 기능)
- [ ] 여러 템플릿 지원
  - [ ] 승급 상장
  - [ ] 대회 수상 상장
  - [ ] 모범상
  - [ ] 출석왕 상장
- [ ] 텍스트 위치 드래그로 조정 (react-draggable)
- [ ] 로고 이미지 업로드 기능
- [ ] 인장/도장 이미지 추가

### Phase 3 (고급 기능)
- [ ] 일괄 생성
  - [ ] 엑셀 파일 업로드
  - [ ] 여러 명 상장 한 번에 생성
  - [ ] ZIP 파일로 다운로드
- [ ] 템플릿 에디터
  - [ ] 관리자가 직접 템플릿 디자인 편집
  - [ ] 텍스트 영역 좌표 설정
- [ ] 생성 이력 저장 (Firebase)

---

## ⏱️ 예상 작업 시간

| 단계 | 내용 | 시간 |
|-----|------|-----|
| 1단계 | 기본 페이지 | 10분 |
| 2단계 | 텍스트 편집 | 15분 |
| 3단계 | Google Fonts | 20분 |
| 4단계 | 스타일 조정 | 10분 |
| 5단계 | JPG 저장 | 15분 |
| **합계** | **기본 기능 완성** | **70분 (1시간 10분)** |

---

## 📋 체크리스트

### 구현 전 준비사항
- [ ] 상장 배경 이미지 준비 (PNG/JPG)
- [ ] 텍스트 배치 위치 결정
- [ ] 사용할 폰트 종류 선택
- [ ] 기본 텍스트 내용 정의

### 구현 중
- [ ] html2canvas 설치 확인
- [ ] Google Fonts 로드 확인
- [ ] 프리뷰 정상 작동 확인
- [ ] JPG 저장 테스트

### 완료 후
- [ ] 다양한 텍스트 길이 테스트
- [ ] 여러 폰트 테스트
- [ ] 다운로드 파일 확인
- [ ] 모바일 반응형 확인 (선택)

---

## 🎯 현재 상태

**대기 중** - 출석체크 페이지 수정 완료 후 착수 예정

---

## 📝 메모

- 상장 이미지는 A4 비율 (210 x 297mm) 권장
- 고해상도 권장: 최소 2000px 이상
- 배경 이미지는 `/public/certificates/` 폴더에 저장
- 텍스트 위치는 절대 위치(absolute) + % 사용으로 반응형 유지

---

## 참고 링크

- [html2canvas 공식 문서](https://html2canvas.hertzen.com/)
- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [Google Fonts 한국어](https://fonts.google.com/?subset=korean)
