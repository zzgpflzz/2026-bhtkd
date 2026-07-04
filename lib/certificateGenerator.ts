import html2canvas from "html2canvas";
import JSZip from "jszip";
import { Grade } from "./types";

export interface CertificateData {
  name: string;
  currentGrade: Grade;
  targetGrade: Grade;
  date: string;
  content: string;
}

/**
 * 나눔명조 폰트 로드
 */
async function loadNanumMyeongjo(): Promise<void> {
  if (document.fonts) {
    await document.fonts.load("bold 52px 'Nanum Myeongjo'");
    await document.fonts.load("bold 60px 'Nanum Myeongjo'");
  }
}

/**
 * 상장 HTML 요소 생성 (피그마 디자인 기준)
 */
export function createCertificateElement(data: CertificateData): HTMLDivElement {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "1414px"; // 피그마 디자인 width
  container.style.height = "2000px"; // 피그마 디자인 height

  container.innerHTML = `
    <div style="position: relative; width: 100%; height: 100%; background: white;">
      <img
        src="/certificate.jpg"
        style="width: 100%; height: 100%; object-fit: cover;"
        crossorigin="anonymous"
      />

      <!-- 소속 (fix) -->
      <div style="
        position: absolute;
        left: 200px;
        top: 616px;
        display: flex;
        align-items: center;
        gap: 24px;
        font-family: 'Nanum Myeongjo', serif;
        font-size: 52px;
        font-weight: bold;
        color: #012941;
      ">
        <span style="display: inline-block; width: 220px; text-align: justify; text-align-last: justify;">소 속</span>
        <span>:</span>
        <span>한국체대 백호태권도장</span>
      </div>

      <!-- 이름 -->
      <div style="
        position: absolute;
        left: 200px;
        top: 719px;
        display: flex;
        align-items: center;
        gap: 24px;
        font-family: 'Nanum Myeongjo', serif;
        font-size: 52px;
        font-weight: bold;
        color: #012941;
      ">
        <span style="display: inline-block; width: 220px; text-align: justify; text-align-last: justify;">이 름</span>
        <span>:</span>
        <span>${data.name}</span>
      </div>

      <!-- 현재 급수 -->
      <div style="
        position: absolute;
        left: 200px;
        top: 822px;
        display: flex;
        align-items: center;
        gap: 20px;
        font-family: 'Nanum Myeongjo', serif;
        font-size: 52px;
        font-weight: bold;
        color: #012941;
      ">
        <span style="display: inline-block; width: 220px; text-align: justify; text-align-last: justify;">현재 급수</span>
        <span>:</span>
        <span>${data.currentGrade}</span>
      </div>

      <!-- 승급 급수 -->
      <div style="
        position: absolute;
        left: 200px;
        top: 925px;
        display: flex;
        align-items: center;
        gap: 20px;
        font-family: 'Nanum Myeongjo', serif;
        font-size: 52px;
        font-weight: bold;
        color: #012941;
      ">
        <span style="display: inline-block; width: 220px; text-align: justify; text-align-last: justify;">승급 급수</span>
        <span>:</span>
        <span>${data.targetGrade}</span>
      </div>

      <!-- 날짜 -->
      <div style="
        position: absolute;
        left: 50%;
        top: 1466px;
        transform: translateX(-50%);
        font-size: 60px;
        color: #012941;
        font-family: 'Nanum Myeongjo', serif;
        white-space: nowrap;
        text-align: center;
      ">
        ${data.date}
      </div>
    </div>
  `;

  document.body.appendChild(container);
  return container;
}

/**
 * Canvas를 Blob으로 변환
 */
async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas to Blob 변환 실패"));
        }
      },
      "image/jpeg",
      0.95,
    );
  });
}

/**
 * 상장을 Canvas로 생성
 */
async function createCertificateCanvas(
  data: CertificateData,
): Promise<HTMLCanvasElement> {
  // 나눔명조 폰트 로드
  await loadNanumMyeongjo();

  const container = createCertificateElement(data);

  // 이미지 로딩 대기
  const img = container.querySelector("img") as HTMLImageElement;
  await new Promise((resolve) => {
    if (img.complete) {
      resolve(null);
    } else {
      img.onload = () => resolve(null);
      img.onerror = () => resolve(null);
    }
  });

  // 폰트 로딩 추가 대기 (안정성)
  await new Promise(resolve => setTimeout(resolve, 100));

  // Canvas로 변환
  const canvas = await html2canvas(container, {
    scale: 2, // 고해상도
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
  });

  // 메모리 정리
  document.body.removeChild(container);

  return canvas;
}

/**
 * 여러 상장을 ZIP 파일로 다운로드
 */
export async function downloadMultipleCertificates(
  dataList: CertificateData[],
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const zip = new JSZip();

  for (let i = 0; i < dataList.length; i++) {
    const data = dataList[i];

    // Canvas 생성
    const canvas = await createCertificateCanvas(data);

    // Blob으로 변환
    const blob = await canvasToBlob(canvas);

    // ZIP에 추가
    zip.file(`${data.name}_${data.targetGrade}.jpg`, blob);

    if (onProgress) {
      onProgress(i + 1, dataList.length);
    }
  }

  // ZIP 파일 생성
  const zipBlob = await zip.generateAsync({ type: "blob" });

  // 다운로드
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement("a");
  const today = new Date().toISOString().split("T")[0];
  link.download = `상장_${today}.zip`;
  link.href = url;
  link.click();

  // 메모리 정리
  URL.revokeObjectURL(url);
}
