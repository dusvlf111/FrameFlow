import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createA4SixPanelLayout, ImageFrame } from './imageLayout';

// Mock HTMLImageElement
// vi.fn()으로 모킹된 객체를 사용하여 mockClear를 사용할 수 있도록 함
const mockImageElement = vi.fn(() => ({
  src: '',
  onload: vi.fn(),
  onerror: vi.fn(),
  width: 100, // 기본 너비
  height: 100, // 기본 높이
})) as unknown as { new(): HTMLImageElement & { onload: any, onerror: any } };

// Mock HTMLCanvasElement and its 2D context
const mockCanvasContext = {
  drawImage: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 50 })), // Mock text measurement
  font: '',
  fillStyle: '',
  textAlign: '',
  textBaseline: '',
};

const mockCanvasElement = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => mockCanvasContext),
  toDataURL: vi.fn(() => 'data:image/jpeg;base64,mocked_comic_page_data'),
};

beforeEach(() => {
  // Image 생성자 모킹
  vi.spyOn(globalThis, 'Image').mockImplementation(() => {
    const img = new mockImageElement();
    // 이미지 로드 시 즉시 onload 호출
    setTimeout(() => img.onload(), 0);
    return img;
  });

  // document.createElement 모킹: 'canvas' 태그 요청 시 mockCanvasElement 반환
  const originalCreateElement = document.createElement;
  vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
    if (tagName === 'canvas') {
      return mockCanvasElement as any;
    }
    return originalCreateElement.call(document, tagName);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  // Mock context 메서드들 clear
  mockCanvasContext.drawImage.mockClear();
  mockCanvasContext.fillRect.mockClear();
  mockCanvasContext.fillText.mockClear();
  mockCanvasContext.measureText.mockClear();
  mockCanvasElement.getContext.mockClear();
  mockCanvasElement.toDataURL.mockClear();
});

describe('createA4SixPanelLayout', () => {
  /**
   * @test 6개의 프레임이 주어졌을 때 하나의 만화 페이지를 올바르게 생성하는지 테스트
   */
  it('should create one comic page for 6 frames', async () => {
    const frames: ImageFrame[] = Array.from({ length: 6 }, (_, i) => ({
      dataUrl: `data:image/jpeg;base64,frame${i}`,
      timestamp: i * 1000,
    }));

    const comicPages = await createA4SixPanelLayout(frames);

    expect(comicPages).toHaveLength(1);
    expect(comicPages[0].dataUrl).toBe('data:image/jpeg;base64,mocked_comic_page_data');
    expect(comicPages[0].timestamps).toEqual([0, 1000, 2000, 3000, 4000, 5000]);
    expect(mockCanvasContext.drawImage).toHaveBeenCalledTimes(6); // 6번 drawImage 호출
  });

  /**
   * @test 자막이 포함된 프레임들로 만화 페이지를 올바르게 생성하는지 테스트
   */
  it('should create comic page with subtitles', async () => {
    const frames: ImageFrame[] = [
      { dataUrl: 'data:image/jpeg;base64,frame0', timestamp: 0, subtitle: 'Hello world!' },
      { dataUrl: 'data:image/jpeg;base64,frame1', timestamp: 1000, subtitle: 'This is a subtitle' },
      { dataUrl: 'data:image/jpeg;base64,frame2', timestamp: 2000 }, // 자막 없음
    ];

    const comicPages = await createA4SixPanelLayout(frames);

    expect(comicPages).toHaveLength(1);
    expect(mockCanvasContext.drawImage).toHaveBeenCalledTimes(3);
    // 자막이 있는 프레임에 대해 fillRect와 fillText가 호출되어야 함
    expect(mockCanvasContext.fillRect).toHaveBeenCalledTimes(2); // 자막 배경 2개
    expect(mockCanvasContext.fillText).toHaveBeenCalled(); // 자막 텍스트 렌더링
  });

  /**
   * @test 빈 자막이나 공백만 있는 자막은 렌더링하지 않는지 테스트
   */
  it('should not render empty or whitespace-only subtitles', async () => {
    const frames: ImageFrame[] = [
      { dataUrl: 'data:image/jpeg;base64,frame0', timestamp: 0, subtitle: '' },
      { dataUrl: 'data:image/jpeg;base64,frame1', timestamp: 1000, subtitle: '   ' },
      { dataUrl: 'data:image/jpeg;base64,frame2', timestamp: 2000, subtitle: 'Valid subtitle' },
    ];

    const comicPages = await createA4SixPanelLayout(frames);

    expect(comicPages).toHaveLength(1);
    expect(mockCanvasContext.drawImage).toHaveBeenCalledTimes(3);
    // 유효한 자막이 하나만 있으므로 fillRect와 fillText가 1번씩만 호출되어야 함
    expect(mockCanvasContext.fillRect).toHaveBeenCalledTimes(1);
    expect(mockCanvasContext.fillText).toHaveBeenCalled();
  });

  /**
   * @test 7개의 프레임이 주어졌을 때 두 개의 만화 페이지를 올바르게 생성하는지 테스트
   */
  it('should create two comic pages for 7 frames', async () => {
    const frames: ImageFrame[] = Array.from({ length: 7 }, (_, i) => ({
      dataUrl: `data:image/jpeg;base64,frame${i}`,
      timestamp: i * 1000,
    }));

    const comicPages = await createA4SixPanelLayout(frames);

    expect(comicPages).toHaveLength(2);
    expect(comicPages[0].dataUrl).toBe('data:image/jpeg;base64,mocked_comic_page_data');
    expect(comicPages[1].dataUrl).toBe('data:image/jpeg;base64,mocked_comic_page_data');
    expect(comicPages[0].timestamps).toEqual([0, 1000, 2000, 3000, 4000, 5000]);
    expect(comicPages[1].timestamps).toEqual([6000]);
    expect(mockCanvasContext.drawImage).toHaveBeenCalledTimes(7); // 총 7번 drawImage 호출
  });

  /**
   * @test 빈 프레임 배열이 주어졌을 때 빈 만화 페이지 배열을 반환하는지 테스트
   */
  it('should return an empty array for empty frames', async () => {
    const frames: ImageFrame[] = [];
    const comicPages = await createA4SixPanelLayout(frames);
    expect(comicPages).toHaveLength(0);
    expect(mockCanvasContext.drawImage).not.toHaveBeenCalled();
  });

  /**
   * @test 이미지 로드 실패 시에도 다음 프레임 처리를 진행하는지 테스트
   */
  it('should proceed even if an image fails to load', async () => {
    const frames: ImageFrame[] = [
      { dataUrl: 'data:image/jpeg;base64,frame0', timestamp: 0, subtitle: 'First frame' },
      { dataUrl: 'invalid-url', timestamp: 1000, subtitle: 'Failed frame' }, // 이 이미지는 로드 실패
      { dataUrl: 'data:image/jpeg;base64,frame2', timestamp: 2000, subtitle: 'Third frame' },
    ];

    // Image 생성자 모킹을 재정의하여 특정 시나리오를 테스트
    vi.spyOn(globalThis, 'Image').mockImplementationOnce(() => {
      const img = new mockImageElement();
      setTimeout(() => img.onload(), 0);
      return img;
    }).mockImplementationOnce(() => {
      const img = new mockImageElement();
      setTimeout(() => img.onerror(), 0); // 두 번째 이미지는 오류 발생
      return img;
    }).mockImplementationOnce(() => {
      const img = new mockImageElement();
      setTimeout(() => img.onload(), 0);
      return img;
    });

    const comicPages = await createA4SixPanelLayout(frames);

    expect(comicPages).toHaveLength(1);
    expect(comicPages[0].timestamps).toEqual([0, 1000, 2000]); // 실패한 이미지의 타임스탬프도 포함
    expect(mockCanvasContext.drawImage).toHaveBeenCalledTimes(3); // 3번 drawImage 호출
    expect(mockCanvasContext.fillRect).toHaveBeenCalledTimes(3); // 자막 배경 3개
  });

  /**
   * @test 긴 자막 텍스트가 올바르게 줄바꿈되는지 테스트
   */
  it('should handle long subtitle text with word wrapping', async () => {
    const frames: ImageFrame[] = [
      { 
        dataUrl: 'data:image/jpeg;base64,frame0', 
        timestamp: 0, 
        subtitle: 'This is a very long subtitle that should be wrapped across multiple lines to fit within the panel width' 
      },
    ];

    const comicPages = await createA4SixPanelLayout(frames);

    expect(comicPages).toHaveLength(1);
    expect(mockCanvasContext.drawImage).toHaveBeenCalledTimes(1);
    expect(mockCanvasContext.fillRect).toHaveBeenCalledTimes(1); // 자막 배경
    expect(mockCanvasContext.fillText).toHaveBeenCalled(); // 자막 텍스트 (여러 줄일 수 있음)
    expect(mockCanvasContext.measureText).toHaveBeenCalled(); // 텍스트 측정이 호출되어야 함
  });
});