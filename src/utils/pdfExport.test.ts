import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { jsPDF } from 'jspdf';
import { exportImagesAsPdf } from './pdfExport';

// jsPDF 모킹
const mockAddPage = vi.fn();
const mockAddImage = vi.fn();
const mockSave = vi.fn();

vi.mock('jspdf', () => {
  return {
    jsPDF: vi.fn(() => ({
      addPage: mockAddPage,
      addImage: mockAddImage,
      save: mockSave,
    })),
  };
});

// Mock HTMLImageElement
const mockImageElement = vi.fn(() => ({
  src: '',
  onload: vi.fn(),
  onerror: vi.fn(),
  width: 100, // 기본 너비
  height: 100, // 기본 높이
})) as unknown as { new(): HTMLImageElement & { onload: any, onerror: any } };

beforeEach(() => {
  // Image 생성자 모킹
  vi.spyOn(globalThis, 'Image').mockImplementation(() => {
    const img = new mockImageElement();
    // 이미지 로드 시 즉시 onload 호출
    setTimeout(() => img.onload(), 0);
    return img;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  mockAddPage.mockClear();
  mockAddImage.mockClear();
  mockSave.mockClear();
});

describe('exportImagesAsPdf', () => {
  /**
   * @test 여러 이미지 데이터 URL을 받아 PDF 파일을 생성하고 다운로드하는지 테스트
   */
  it('should create a PDF file with multiple pages and trigger download', async () => {
    const imageDataUrls = [
      'data:image/jpeg;base64,image1_data',
      'data:image/jpeg;base64,image2_data',
      'data:image/jpeg;base64,image3_data',
    ];
    const pdfFileName = 'my_comic.pdf';

    await exportImagesAsPdf(imageDataUrls, pdfFileName);

    // jsPDF 인스턴스가 생성되었는지 확인
    expect(jsPDF).toHaveBeenCalledTimes(1);
    // 첫 페이지를 제외하고 두 번 addPage가 호출되었는지 확인
    expect(mockAddPage).toHaveBeenCalledTimes(2);
    // 각 이미지가 addImage로 추가되었는지 확인
    expect(mockAddImage).toHaveBeenCalledTimes(3);
    expect(mockAddImage).toHaveBeenCalledWith(
      'data:image/jpeg;base64,image1_data', 'JPEG', expect.any(Number), expect.any(Number), expect.any(Number), expect.any(Number)
    );
    expect(mockAddImage).toHaveBeenCalledWith(
      'data:image/jpeg;base64,image2_data', 'JPEG', expect.any(Number), expect.any(Number), expect.any(Number), expect.any(Number)
    );
    expect(mockAddImage).toHaveBeenCalledWith(
      'data:image/jpeg;base64,image3_data', 'JPEG', expect.any(Number), expect.any(Number), expect.any(Number), expect.any(Number)
    );
    // save가 호출되었는지 확인
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith(pdfFileName);
  });

  /**
   * @test 이미지가 하나일 때 PDF 파일을 올바르게 생성하는지 테스트
   */
  it('should create a PDF file with a single page for one image', async () => {
    const imageDataUrls = [
      'data:image/jpeg;base64,single_image_data',
    ];
    const pdfFileName = 'single_page.pdf';

    await exportImagesAsPdf(imageDataUrls, pdfFileName);

    expect(jsPDF).toHaveBeenCalledTimes(1);
    expect(mockAddPage).not.toHaveBeenCalled(); // 이미지가 하나일 때는 addPage 호출 안됨
    expect(mockAddImage).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  /**
   * @test 빈 이미지 배열이 주어졌을 때 PDF를 생성하지 않는지 테스트
   */
  it('should not create a PDF if no image data URLs are provided', async () => {
    const imageDataUrls: string[] = [];
    const pdfFileName = 'empty.pdf';

    await exportImagesAsPdf(imageDataUrls, pdfFileName);

    expect(jsPDF).not.toHaveBeenCalled();
    expect(mockAddPage).not.toHaveBeenCalled();
    expect(mockAddImage).not.toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  });

  /**
   * @test 이미지 로드 실패 시 에러를 반환하는지 테스트
   */
  it('should throw an error if image loading fails', async () => {
    const imageDataUrls = [
      'data:image/jpeg;base64,image1_data',
      'invalid-image-url', // 이 이미지는 로드 실패
    ];
    const pdfFileName = 'error.pdf';

    // Image 생성자 모킹을 재정의하여 특정 시나리오를 테스트
    vi.spyOn(globalThis, 'Image').mockImplementationOnce(() => {
      const img = new mockImageElement();
      setTimeout(() => img.onload(), 0);
      return img;
    }).mockImplementationOnce(() => {
      const img = new mockImageElement();
      setTimeout(() => img.onerror('mock error'), 0); // 두 번째 이미지는 오류 발생
      return img;
    });

    await expect(exportImagesAsPdf(imageDataUrls, pdfFileName)).rejects.toThrow('Failed to load image for PDF: mock error');
  });
});
