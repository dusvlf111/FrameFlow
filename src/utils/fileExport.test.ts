import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportImagesAsZip } from './fileExport';
import JSZip from 'jszip';

// 실제 Base64 인코딩된 더미 이미지 데이터 (1x1 픽셀 투명 GIF)
const MOCKED_BASE64_IMAGE = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// JSZip 모킹
// JSZip 생성자 함수를 모킹하여 각 테스트에서 새로운 인스턴스를 반환하도록 함
const mockFileMethod = vi.fn();
const mockFolderMethod = vi.fn(() => ({
  file: mockFileMethod,
}));
const mockGenerateAsyncMethod = vi.fn(() => Promise.resolve(new Blob(['mock zip content'], { type: 'application/zip' })))

vi.mock('jszip', () => {
  return { 
    default: vi.fn(() => ({
      folder: mockFolderMethod,
      generateAsync: mockGenerateAsyncMethod,
    }))
  };
});

// URL.createObjectURL 및 URL.revokeObjectURL 모킹
const mockCreateObjectURL = vi.fn(() => 'blob:mocked-url');
const mockRevokeObjectURL = vi.fn();

// document.createElement 및 click 모킹
const mockLinkElement = {
  href: '',
  download: '',
  click: vi.fn(),
};

beforeEach(() => {
  vi.stubGlobal('URL', {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  });
  vi.spyOn(document, 'createElement').mockReturnValue(mockLinkElement as any);
  vi.spyOn(document.body, 'appendChild').mockImplementation(vi.fn());
  vi.spyOn(document.body, 'removeChild').mockImplementation(vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
  // 각 테스트 후 mock clear
  mockCreateObjectURL.mockClear();
  mockRevokeObjectURL.mockClear();
  mockLinkElement.click.mockClear();
  mockFolderMethod.mockClear();
  mockFileMethod.mockClear();
  mockGenerateAsyncMethod.mockClear();
});

describe('exportImagesAsZip', () => {
  /**
   * @test 이미지 데이터 URL 배열을 받아 ZIP 파일을 생성하고 다운로드하는지 테스트
   */
  it('should create a zip file and trigger download', async () => {
    const imageDataUrls = [
      `data:image/jpeg;base64,${MOCKED_BASE64_IMAGE}`,
      `data:image/jpeg;base64,${MOCKED_BASE64_IMAGE}`,
    ];
    const zipFileName = 'my_comic.zip';

    await exportImagesAsZip(imageDataUrls, zipFileName);

    // JSZip 인스턴스가 생성되었는지 확인
    expect(JSZip).toHaveBeenCalledTimes(1);
    // 폴더가 생성되었는지 확인
    expect(mockFolderMethod).toHaveBeenCalledWith('comic_pages');
    // 각 이미지가 ZIP 파일에 추가되었는지 확인
    expect(mockFileMethod).toHaveBeenCalledTimes(2);
    expect(mockFileMethod).toHaveBeenCalledWith(
      'page_001.jpeg', expect.any(Blob)
    );
    expect(mockFileMethod).toHaveBeenCalledWith(
      'page_002.jpeg', expect.any(Blob)
    );
    // ZIP 파일 생성이 호출되었는지 확인
    expect(mockGenerateAsyncMethod).toHaveBeenCalledWith({ type: 'blob' });

    // 다운로드 링크가 생성되고 클릭되었는지 확인
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockLinkElement.download).toBe(zipFileName);
    expect(mockLinkElement.click).toHaveBeenCalledTimes(1);
    // URL.createObjectURL 및 revokeObjectURL이 호출되었는지 확인
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
  });

  /**
   * @test 유효하지 않은 이미지 데이터 URL은 건너뛰는지 테스트
   */
  it('should skip invalid image data URLs', async () => {
    const imageDataUrls = [
      `data:image/jpeg;base64,${MOCKED_BASE64_IMAGE}`,
      'invalid-data-url',
      `data:image/jpeg;base64,${MOCKED_BASE64_IMAGE}`,
    ];
    const zipFileName = 'my_comic.zip';

    await exportImagesAsZip(imageDataUrls, zipFileName);

    // 유효한 이미지 2개만 파일에 추가되었는지 확인
    expect(mockFileMethod).toHaveBeenCalledTimes(2);
    expect(mockFileMethod).toHaveBeenCalledWith(
      'page_001.jpeg', expect.any(Blob)
    );
    expect(mockFileMethod).toHaveBeenCalledWith(
      'page_003.jpeg', expect.any(Blob) // 인덱스 2의 파일은 page_003.jpeg가 되어야 함
    );
  });

  /**
   * @test ZIP 파일 생성 실패 시 에러를 반환하는지 테스트
   */
  it('should throw an error if zip generation fails', async () => {
    // generateAsync가 reject하도록 모킹
    mockGenerateAsyncMethod.mockImplementationOnce(() => Promise.reject(new Error('ZIP error')));

    const imageDataUrls = [`data:image/jpeg;base64,${MOCKED_BASE64_IMAGE}`];
    const zipFileName = 'my_comic.zip';

    await expect(exportImagesAsZip(imageDataUrls, zipFileName)).rejects.toThrow('ZIP error');
  });
});
