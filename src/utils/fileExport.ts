import JSZip from 'jszip';

/**
 * @function dataURLtoBlob
 * @description Data URL을 Blob 객체로 변환합니다.
 * @param {string} dataurl - 변환할 Data URL.
 * @returns {Blob | null} 변환된 Blob 객체 또는 실패 시 null.
 */
function dataURLtoBlob(dataurl: string): Blob | null {
  const arr = dataurl.split(',');
  if (arr.length < 2) return null;

  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || mimeMatch.length < 2) return null;

  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * @function exportImagesAsZip
 * @description 이미지 Data URL 배열을 받아 ZIP 파일로 압축하고 다운로드합니다.
 * @param {string[]} imageDataUrls - 이미지 Data URL 배열.
 * @param {string} zipFileName - 생성될 ZIP 파일의 이름 (확장자 포함).
 * @returns {Promise<void>} ZIP 파일 생성 및 다운로드 완료 시 resolve되는 Promise.
 */
export async function exportImagesAsZip(imageDataUrls: string[], zipFileName: string): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('comic_pages'); // ZIP 파일 내에 폴더 생성

  if (!folder) {
    console.error('Failed to create folder in zip.');
    return Promise.reject('Failed to create folder');
  }

  for (let i = 0; i < imageDataUrls.length; i++) {
    const dataUrl = imageDataUrls[i];
    const blob = dataURLtoBlob(dataUrl);
    if (blob) {
      // 파일명은 페이지 번호로 지정
      folder.file(`page_${String(i + 1).padStart(3, '0')}.jpeg`, blob);
    } else {
      console.warn(`Skipping invalid image data URL at index ${i}`);
    }
  }

  // ZIP 파일 생성 및 다운로드
  return zip.generateAsync({ type: 'blob' }).then(function (content) {
    // FileSaver.js와 같은 라이브러리를 사용하면 더 편리하지만, 여기서는 간단한 다운로드 구현
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = zipFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }).catch(error => {
    console.error('Error generating ZIP file:', error);
    return Promise.reject(error);
  });
}
