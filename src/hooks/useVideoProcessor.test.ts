import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useVideoProcessor from './useVideoProcessor';

// Mock HTMLVideoElement instance that the ref will point to
const mockVideoElementInstance = {
  currentTime: 0,
  videoWidth: 1920,
  videoHeight: 1080,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  load: vi.fn(),
};

// Mock HTMLCanvasElement instance
const mockDrawImage = vi.fn();
const mockCanvasElement = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => ({
    drawImage: mockDrawImage,
  })),
  toDataURL: vi.fn(() => 'data:image/jpeg;base64,mocked_image_data'),
};

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mocked-video-url');
const mockRevokeObjectURL = vi.fn();

beforeEach(() => {
  // URL 객체 모킹
  vi.stubGlobal('URL', {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  });

  // document.createElement 모킹: 'canvas' 태그 요청 시 mockCanvasElement 반환
  // 다른 태그는 JSDOM의 원래 createElement를 사용하도록 함
  const originalCreateElement = document.createElement;
  vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
    if (tagName === 'canvas') {
      return mockCanvasElement as any; // 캔버스 요청 시 모킹된 캔버스 반환
    }
    // 다른 태그는 JSDOM의 실제 createElement를 호출
    return originalCreateElement.call(document, tagName);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  // 각 테스트 후 mockVideoElementInstance의 mock clear
  mockVideoElementInstance.addEventListener.mockClear();
  mockVideoElementInstance.removeEventListener.mockClear();
  mockVideoElementInstance.load.mockClear();
  mockCanvasElement.getContext.mockClear();
  mockCanvasElement.toDataURL.mockClear();
  mockDrawImage.mockClear();
  mockCreateObjectURL.mockClear();
  mockRevokeObjectURL.mockClear();
});

describe('useVideoProcessor', () => {
  /**
   * @test loadVideo 함수가 비디오 소스를 올바르게 설정하는지 테스트
   */
  it('should load video and set videoSrc', () => {
    const { result } = renderHook(() => useVideoProcessor(mockVideoElementInstance as any));

    const mockFile = new File([''], 'test.mp4', { type: 'video/mp4' });

    act(() => {
      result.current.loadVideo(mockFile);
    });

    expect(mockCreateObjectURL).toHaveBeenCalledWith(mockFile);
    expect(result.current.videoSrc).toBe('blob:mocked-video-url');
  });

  /**
   * @test extractFrameAtTime 함수가 특정 시간의 프레임을 추출하는지 테스트
   */
  it('should extract frame at specified time', async () => {
    const { result, rerender } = renderHook(() => useVideoProcessor(mockVideoElementInstance as any));
    rerender(); // videoRef.current가 설정된 후 useEffect가 실행되도록 강제

    const mockFile = new File([''], 'test.mp4', { type: 'video/mp4' });

    // 비디오 로드 시뮬레이션
    act(() => {
      result.current.loadVideo(mockFile);
    });

    // loadedmetadata 이벤트 리스너를 찾아서 호출하여 isVideoLoaded를 true로 만듦
    const loadedMetadataCallback = mockVideoElementInstance.addEventListener.mock.calls.find(call => call[0] === 'loadedmetadata')?.[1];
    if (loadedMetadataCallback) {
      act(() => {
        loadedMetadataCallback();
      });
    }
    rerender(); // 상태 업데이트를 반영하기 위해 훅을 다시 렌더링

    // 비디오가 로드된 상태인지 확인
    expect(result.current.isVideoLoaded).toBe(true);

    const timeToExtract = 10;
    let imageDataUrl: string | null = null;

    await act(async () => {
      // extractFrameAtTime 호출
      const promise = result.current.extractFrameAtTime(timeToExtract);

      // seeked 이벤트 리스너가 호출되도록 모킹
      const seekedCallback = mockVideoElementInstance.addEventListener.mock.calls.find(call => call[0] === 'seeked')?.[1];
      if (seekedCallback) {
        seekedCallback();
      }
      imageDataUrl = await promise;
    });

    expect(mockVideoElementInstance.currentTime).toBe(timeToExtract);
    expect(mockCanvasElement.getContext).toHaveBeenCalledWith('2d');
    expect(mockDrawImage).toHaveBeenCalledWith(
      mockVideoElementInstance, 0, 0, mockVideoElementInstance.videoWidth, mockVideoElementInstance.videoHeight
    );
    expect(mockCanvasElement.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.9);
    expect(imageDataUrl).toBe('data:image/jpeg;base64,mocked_image_data');
  });

  /**
   * @test 비디오가 로드되지 않았을 때 extractFrameAtTime이 null을 반환하는지 테스트
   */
  it('should return null if video is not loaded when extracting frame', async () => {
    const { result } = renderHook(() => useVideoProcessor(mockVideoElementInstance as any));

    let imageDataUrl: string | null = null;
    await act(async () => {
      imageDataUrl = await result.current.extractFrameAtTime(5);
    });

    expect(imageDataUrl).toBeNull();
  });

  /**
   * @test 기존 비디오 로드 시 이전 URL이 해제되는지 테스트
   */
  it('should revoke previous object URL when loading a new video', () => {
    const { result } = renderHook(() => useVideoProcessor(mockVideoElementInstance as any));

    const mockFile1 = new File([''], 'test1.mp4', { type: 'video/mp4' });
    const mockFile2 = new File([''], 'test2.mp4', { type: 'video/mp4' });

    act(() => {
      result.current.loadVideo(mockFile1);
    });
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).not.toHaveBeenCalled(); // 첫 로드 시에는 revoke 없음

    act(() => {
      result.current.loadVideo(mockFile2);
    });
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(2);
    expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1); // 두 번째 로드 시 이전 URL revoke
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mocked-video-url');
  });
});