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
  // 각 테스트 후 mock clear
  // mockImageElement는 생성자이므로, 생성된 인스턴스의 mockClear를 호출해야 함
  // 여기서는 전역 mockImageElement를 사용했으므로, 각 테스트에서 생성된 인스턴스를 추적해야 함
  // 또는 Image 생성자 모킹을 통해 반환된 객체의 onload/onerror를 직접 clear
  // 현재 mockImageElement는 생성자 함수 자체를 모킹했으므로, 그 인스턴스의 onload/onerror를 clear해야 함
  // 간단하게, Image 생성자 모킹을 통해 반환된 객체의 onload/onerror를 clear하는 방식으로 변경
  // vi.spyOn(global, 'Image')를 사용했으므로, restoreAllMocks()가 충분히 clear 해줌
  mockCanvasContext.drawImage.mockClear();
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
      { dataUrl: 'data:image/jpeg;base64,frame0', timestamp: 0 },
      { dataUrl: 'invalid-url', timestamp: 1000 }, // 이 이미지는 로드 실패
      { dataUrl: 'data:image/jpeg;base64,frame2', timestamp: 2000 },
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
  });
});