import { jsPDF } from 'jspdf';

/**
 * @function exportImagesAsPdf
 * @description 이미지 Data URL 배열을 받아 PDF 파일로 변환하고 다운로드합니다.
 *              각 이미지는 PDF의 한 페이지를 차지하며, A4 크기에 맞춰 조정됩니다.
 * @param {string[]} imageDataUrls - 이미지 Data URL 배열.
 * @param {string} pdfFileName - 생성될 PDF 파일의 이름 (확장자 포함).
 * @returns {Promise<void>} PDF 파일 생성 및 다운로드 완료 시 resolve되는 Promise.
 */
export async function exportImagesAsPdf(imageDataUrls: string[], pdfFileName: string): Promise<void> {
  // 이미지 배열이 비어있으면 PDF를 생성하지 않고 종료
  if (imageDataUrls.length === 0) {
    return;
  }

  // A4 사이즈 (mm 단위)
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;

  // jsPDF 인스턴스 생성 (세로 방향, mm 단위, A4 사이즈)
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  for (let i = 0; i < imageDataUrls.length; i++) {
    const dataUrl = imageDataUrls[i];

    // 첫 페이지가 아니면 새 페이지 추가
    if (i > 0) {
      doc.addPage();
    }

    // 이미지 로드
    const img = new Image();
    img.src = dataUrl;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        // 이미지의 원본 비율 유지하면서 A4 페이지에 맞게 크기 조정
        const imgWidth = img.width;
        const imgHeight = img.height;
        const imgAspectRatio = imgWidth / imgHeight;

        let finalWidth = A4_WIDTH_MM;
        let finalHeight = A4_HEIGHT_MM;

        if (imgAspectRatio > (A4_WIDTH_MM / A4_HEIGHT_MM)) {
          // 이미지가 A4보다 가로로 길면, 너비를 A4에 맞추고 높이 조정
          finalHeight = A4_WIDTH_MM / imgAspectRatio;
        } else {
          // 이미지가 A4보다 세로로 길면, 높이를 A4에 맞추고 너비 조정
          finalWidth = A4_HEIGHT_MM * imgAspectRatio;
        }

        // 이미지 중앙 정렬을 위한 x, y 좌표 계산
        const x = (A4_WIDTH_MM - finalWidth) / 2;
        const y = (A4_HEIGHT_MM - finalHeight) / 2;

        // PDF에 이미지 추가
        doc.addImage(dataUrl, 'JPEG', x, y, finalWidth, finalHeight);
        resolve();
      };
      img.onerror = (err) => {
        console.error(`Failed to load image for PDF: ${err}`);
        reject(new Error(`Failed to load image for PDF: ${err}`));
      };
    });
  }

  // PDF 저장
  doc.save(pdfFileName);
}
