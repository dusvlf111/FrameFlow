/**
 * @interface ImageFrame
 * @description 이미지 프레임의 정보를 정의합니다.
 * @property {string} dataUrl - 이미지의 Data URL.
 * @property {number} timestamp - 이미지가 추출된 비디오의 시간 (초).
 */
export interface ImageFrame {
  dataUrl: string;
  timestamp: number;
}

/**
 * @interface ComicPage
 * @description 만화 페이지의 정보를 정의합니다.
 * @property {string} dataUrl - 만화 페이지 이미지의 Data URL.
 * @property {number[]} timestamps - 이 페이지에 포함된 프레임들의 타임스탬프 배열.
 */
export interface ComicPage {
  dataUrl: string;
  timestamps: number[];
}

/**
 * @function createA4SixPanelLayout
 * @description 주어진 이미지 프레임들을 A4 사이즈의 6컷 만화 레이아웃으로 조합하여 만화 페이지를 생성합니다.
 *              각 페이지는 6개의 프레임을 포함하며, 마지막 페이지는 남은 프레임 수에 따라 채워집니다.
 * @param {ImageFrame[]} frames - 조합할 이미지 프레임 배열.
 * @param {number} [a4WidthPx=2480] - A4 용지의 너비 (픽셀). 기본값은 300 DPI 기준.
 * @param {number} [a4HeightPx=3508] - A4 용지의 높이 (픽셀). 기본값은 300 DPI 기준.
 * @returns {Promise<ComicPage[]>} 생성된 만화 페이지 배열.
 */
export async function createA4SixPanelLayout(
  frames: ImageFrame[],
  a4WidthPx: number = 2480, // A4 width at 300 DPI
  a4HeightPx: number = 3508 // A4 height at 300 DPI
): Promise<ComicPage[]> {
  const comicPages: ComicPage[] = [];
  const framesPerPage = 6; // 한 페이지당 6컷

  // 각 프레임이 들어갈 패널의 크기 계산 (여백 고려)
  // 간단화를 위해 여기서는 여백을 0으로 가정하고 2x3 그리드로 나눕니다.
  const panelWidth = a4WidthPx / 2;
  const panelHeight = a4HeightPx / 3;

  for (let i = 0; i < frames.length; i += framesPerPage) {
    const pageFrames = frames.slice(i, i + framesPerPage);
    const canvas = document.createElement('canvas');
    canvas.width = a4WidthPx;
    canvas.height = a4HeightPx;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Failed to get 2D context for comic page canvas.');
      continue;
    }

    const pageTimestamps: number[] = [];

    for (let j = 0; j < pageFrames.length; j++) {
      const frame = pageFrames[j];
      const img = new Image();
      img.src = frame.dataUrl;

      // 이미지가 로드될 때까지 기다립니다.
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => {
          console.error(`Failed to load image for frame: ${frame.timestamp}`);
          resolve(); // 오류 발생 시에도 Promise를 해결하여 다음 작업 진행
        };
      });

      // 패널 위치 계산
      const col = j % 2; // 0 or 1
      const row = Math.floor(j / 2); // 0, 1, 2
      const x = col * panelWidth;
      const y = row * panelHeight;

      // 이미지 비율 유지하며 패널에 맞게 그리기
      const imgAspectRatio = img.width / img.height;
      const panelAspectRatio = panelWidth / panelHeight;

      let drawWidth = panelWidth;
      let drawHeight = panelHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (imgAspectRatio > panelAspectRatio) {
        // 이미지가 패널보다 가로로 길 때 (가로에 맞추고 세로 중앙 정렬)
        drawHeight = panelWidth / imgAspectRatio;
        offsetY = (panelHeight - drawHeight) / 2;
      } else {
        // 이미지가 패널보다 세로로 길 때 (세로에 맞추고 가로 중앙 정렬)
        drawWidth = panelHeight * imgAspectRatio;
        offsetX = (panelWidth - drawWidth) / 2;
      }

      ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
      pageTimestamps.push(frame.timestamp);
    }

    comicPages.push({
      dataUrl: canvas.toDataURL('image/jpeg', 0.9),
      timestamps: pageTimestamps,
    });
  }

  return comicPages;
}
