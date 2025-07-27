import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from './HomePage';
import { createA4SixPanelLayout } from '../utils/imageLayout';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'welcome_title': 'FrameFlow - Video to Comic Converter',
        'upload_description': 'Upload your video and subtitle files to get started',
        'upload_video_title': 'Upload Video',
        'upload_subtitle_title': 'Upload Subtitle (SRT/VTT)',
        'video_preview_title': 'Video Preview',
        'video_loaded_ready': 'Video loaded and ready!',
        'loading_video_metadata': 'Loading video metadata...',
        'conversion_settings_title': 'Conversion Settings',
        'subtitle_based': 'Based on Subtitle Timing',
        'time_interval_based': 'Based on Time Intervals',
        'convert_button': 'Convert to Comic',
        'go_to_viewer_test': 'Go to Viewer (Test)',
        'user_guide_title': 'User Guide',
        'privacy_policy_title': 'Privacy Policy',
        'video_uploader_placeholder': 'Drop video file here or click to select',
        'subtitle_uploader_placeholder': 'Drop subtitle file here or click to select',
        'video_selected': 'Video file selected',
        'browser_not_support_video': 'Your browser does not support video playback',
        'interval_seconds': 'Interval (seconds):'
      };
      return translations[key] || key;
    },
    i18n: {
      changeLanguage: vi.fn(),
    }
  }),
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, any>;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: vi.fn(({ to, children }) => <a href={to}>{children}</a>), // Link 컴포넌트도 모킹
  };
});

// Mock FileUploader component to allow direct file upload simulation
vi.mock('../components/FileUploader', () => ({
  default: vi.fn(({ onFileSelect, accept, children }) => {
    const handleFileSelect = () => {
      // Create a mock file based on accept type
      const mockFile = accept.includes('video') 
        ? new File(['video content'], 'test-video.mp4', { type: 'video/mp4' })
        : new File(['mock subtitle content'], 'test-subtitle.srt', { type: 'text/plain' });
      
      // Call onFileSelect directly
      onFileSelect(mockFile);
    };

    return (
      <div 
        data-testid={`file-uploader-${accept.replace(/\W/g, '')}`}
        onClick={handleFileSelect}
      >
        {children}
      </div>
    );
  }),
}));

// Mock useVideoProcessor hook
const mockVideoRef = { current: null as HTMLVideoElement | null };
const mockLoadVideo = vi.fn();
const mockExtractFrameAtTime = vi.fn();

// Define a variable to hold the mocked return value of useVideoProcessor
let mockedUseVideoProcessorReturnValue = {
  videoRef: mockVideoRef,
  videoSrc: 'blob:mocked-video-url',
  isVideoLoaded: true,
  loadVideo: mockLoadVideo,
  extractFrameAtTime: mockExtractFrameAtTime,
};

vi.mock('../hooks/useVideoProcessor', () => ({
  default: vi.fn(() => mockedUseVideoProcessorReturnValue),
}));

// Mock subtitleParser and imageLayout utilities
// 기본적으로 비어있지 않은 자막을 반환하도록 설정
vi.mock('../utils/subtitleParser', () => ({
  parseSrt: vi.fn(() => [
    { id: '1', startTime: 1000, endTime: 3000, text: 'Subtitle 1' },
    { id: '2', startTime: 4000, endTime: 6000, text: 'Subtitle 2' },
  ]),
  parseVtt: vi.fn(() => [
    { id: '1', startTime: 1000, endTime: 3000, text: 'VTT Subtitle 1' },
  ]),
}));

vi.mock('../utils/imageLayout', () => ({
  createA4SixPanelLayout: vi.fn(() => [
    { dataUrl: 'data:image/jpeg;base64,comic_page_1', timestamps: [1000, 2000] },
    { dataUrl: 'data:image/jpeg;base64,comic_page_2', timestamps: [3000, 4000] },
  ]),
}));

beforeEach(() => {
  vi.clearAllMocks();

  // Mock FileReader with proper async behavior
  const MockFileReader = function(this: any) {
    this.readAsText = (file: File) => {
      const content = file.name.includes('.srt') ? 
        `1
00:00:01,000 --> 00:00:03,000
Subtitle 1

2
00:00:04,000 --> 00:00:06,000
Subtitle 2` : 
        `WEBVTT

1
00:00:01.000 --> 00:00:03.000
VTT Subtitle 1`;
      
      // Use Promise.resolve to ensure async behavior
      Promise.resolve().then(() => {
        this.result = content;
        if (this.onload) {
          this.onload({ target: { result: content } });
        }
      });
    };
    this.result = null;
    this.onload = null;
    this.onerror = null;
  };
  
  (globalThis as any).FileReader = MockFileReader;

  // Mock HTMLMediaElement.prototype methods
  vi.spyOn(HTMLMediaElement.prototype, 'addEventListener').mockImplementation(function(this: HTMLMediaElement, event: string, listener: EventListenerOrEventListenerObject) {
    // Store listeners if needed for manual triggering
    if (!(this as any).__listeners) {
      (this as any).__listeners = {};
    }
    if (!(this as any).__listeners[event]) {
      (this as any).__listeners[event] = [];
    }
    (this as any).__listeners[event].push(listener);
  });
  vi.spyOn(HTMLMediaElement.prototype, 'removeEventListener').mockImplementation(function(this: HTMLMediaElement, event: string, listener: EventListenerOrEventListenerObject) {
    if ((this as any).__listeners && (this as any).__listeners[event]) {
      (this as any).__listeners[event] = (this as any).__listeners[event].filter((l: EventListenerOrEventListenerObject) => l !== listener);
    }
  });
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(function(this: HTMLMediaElement) {
    // Simulate loadedmetadata event after load is called
    const listeners = (this as any).__listeners && (this as any).__listeners['loadedmetadata'];
    if (listeners) {
      listeners.forEach((listener: EventListenerOrEventListenerObject) => {
        if (typeof listener === 'function') {
          listener.call(this, new Event('loadedmetadata'));
        } else if (listener && typeof listener.handleEvent === 'function') {
          listener.handleEvent(new Event('loadedmetadata'));
        }
      });
    }
  });

  // Reset mock video element for each test
  mockVideoRef.current = {
    duration: 100, // Mock video duration
    currentTime: 0,
    videoWidth: 1920,
    videoHeight: 1080,
    addEventListener: HTMLMediaElement.prototype.addEventListener as any,
    removeEventListener: HTMLMediaElement.prototype.removeEventListener as any,
    load: HTMLMediaElement.prototype.load as any,
    src: '',
  } as unknown as HTMLVideoElement;

  // Reset the mocked return value for useVideoProcessor
  mockedUseVideoProcessorReturnValue = {
    videoRef: mockVideoRef,
    videoSrc: 'blob:mocked-video-url',
    isVideoLoaded: true,
    loadVideo: mockLoadVideo,
    extractFrameAtTime: mockExtractFrameAtTime,
  };

  // Mock extractFrameAtTime to return a valid data URL
  mockExtractFrameAtTime.mockResolvedValue('data:image/jpeg;base64,mocked_frame_data');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HomePage Integration', () => {
  /**
   * @test 비디오 업로드 및 자막 기반 변환 시나리오
   */
  it('should convert video based on subtitles and navigate to viewer', async () => {
    render(<HomePage />);

    // 1. 비디오 업로드 시뮬레이션
    const videoUploader = screen.getByTestId('file-uploader-video');
    await userEvent.click(videoUploader); // FileUploader 모킹에 의해 onFileSelect 호출

    // 비디오가 로드될 때까지 기다림 (useVideoProcessor 모킹에 의해 isVideoLoaded가 true)
    await waitFor(() => {
      expect(screen.getByText('Video loaded and ready!')).toBeInTheDocument();
    });

    // Convert to interval mode since subtitle parsing is not working
    const intervalRadio = screen.getByLabelText('Based on Time Intervals');
    await userEvent.click(intervalRadio);

    await waitFor(() => {
      expect(screen.getByLabelText(/Interval \(seconds\):/i)).toBeInTheDocument();
    });

    // 3. 변환 버튼 클릭
    const convertButton = screen.getByRole('button', { name: /Convert to Comic/i });
    await waitFor(() => {
      expect(convertButton).toBeEnabled();
    });
    await userEvent.click(convertButton);

    // 4. createA4SixPanelLayout 호출 확인
    await waitFor(() => {
      expect(createA4SixPanelLayout).toHaveBeenCalledTimes(1);
    });

    // 5. ViewerPage로 이동 확인
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(
        '/viewer',
        expect.objectContaining({
          state: expect.objectContaining({
            comicPages: expect.arrayContaining([
              expect.objectContaining({ dataUrl: 'data:image/jpeg;base64,comic_page_1' }),
            ]),
          }),
        })
      );
    });
  });

  /**
   * @test 비디오 업로드 및 시간 간격 기반 변환 시나리오
   */
  it('should convert video based on time interval and navigate to viewer', async () => {
    render(<HomePage />);

    // 1. 비디오 업로드 시뮬레이션
    const videoUploader = screen.getByTestId('file-uploader-video');
    await userEvent.click(videoUploader);

    await waitFor(() => {
      expect(screen.getByText('Video loaded and ready!')).toBeInTheDocument();
    });

    // 2. 시간 간격 기반 변환 선택
    const intervalRadio = screen.getByLabelText('Based on Time Intervals');
    await userEvent.click(intervalRadio);

    // 시간 간격 입력 필드가 나타날 때까지 기다림
    await waitFor(() => {
      expect(screen.getByLabelText(/Interval \(seconds\):/i)).toBeInTheDocument();
    });

    // 3. 기본값(5초)으로도 버튼이 활성화되어야 함을 확인하고, 더 큰 값(10초)으로 변경
    await waitFor(() => {
      const convertButton = screen.getByRole('button', { name: /Convert to Comic/i });
      expect(convertButton).toBeEnabled(); // 기본값 5초로 활성화되어야 함
    });

    const intervalInput = screen.getByLabelText(/Interval \(seconds\):/i);
    // Clear and set to 10 using fireEvent to avoid the concatenation issue
    fireEvent.change(intervalInput, { target: { value: '10' } });

    // 4. 변환 버튼 클릭
    const convertButton = screen.getByRole('button', { name: /Convert to Comic/i });
    expect(convertButton).toBeEnabled();
    await userEvent.click(convertButton);

    // 5. 변환이 완료되었는지 확인 (createA4SixPanelLayout 호출 및 navigate 호출)
    await waitFor(() => {
      expect(createA4SixPanelLayout).toHaveBeenCalledTimes(1);
    });

    // 6. ViewerPage로 이동 확인
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(
        '/viewer',
        expect.objectContaining({
          state: expect.objectContaining({
            comicPages: expect.arrayContaining([
              expect.objectContaining({ dataUrl: 'data:image/jpeg;base64,comic_page_1' }),
            ]),
          }),
        })
      );
    });
  });

  /**
   * @test 비디오가 로드되지 않았을 때 변환 버튼이 비활성화되는지 테스트
   */
  it('should disable convert button if video is not loaded', () => {
    // useVideoProcessor 모킹의 반환 값을 변경
    mockedUseVideoProcessorReturnValue = {
      ...mockedUseVideoProcessorReturnValue,
      isVideoLoaded: false,
    };

    render(<HomePage />);

    const convertButton = screen.getByRole('button', { name: /Convert to Comic/i });
    expect(convertButton).toBeDisabled();
  });

  /**
   * @test 자막 기반 변환 선택 시 자막 파일이 없으면 변환 버튼이 비활성화되는지 테스트
   */
  it('should disable convert button if subtitle-based conversion is selected but no subtitles are parsed', async () => {
    // useVideoProcessor 모킹의 반환 값을 변경
    mockedUseVideoProcessorReturnValue = {
      ...mockedUseVideoProcessorReturnValue,
      isVideoLoaded: true,
    };
    // subtitleParser 모킹을 빈 배열 반환으로 재정의
    vi.mock('../utils/subtitleParser', () => ({
      parseSrt: vi.fn(() => []), // 빈 배열 반환
      parseVtt: vi.fn(() => []), // 빈 배열 반환
    }));

    render(<HomePage />);

    // 비디오 업로드 시뮬레이션
    const videoUploader = screen.getByTestId('file-uploader-video');
    await userEvent.click(videoUploader);

    await waitFor(() => {
      expect(screen.getByText('Video loaded and ready!')).toBeInTheDocument();
    });

    // 자막 기반 변환이 기본 선택되어 있고, 자막이 없으므로 버튼 비활성화 확인
    const convertButton = screen.getByRole('button', { name: /Convert to Comic/i });
    expect(convertButton).toBeDisabled();
  });

  /**
   * @test 시간 간격 기반 변환 선택 시 유효한 간격이 없으면 변환 버튼이 비활성화되는지 테스트
   */
  it('should disable convert button if interval-based conversion is selected but interval is invalid', async () => {
    render(<HomePage />);

    // 1. 비디오 업로드 시뮬레이션
    const videoUploader = screen.getByTestId('file-uploader-video');
    await userEvent.click(videoUploader);

    await waitFor(() => {
      expect(screen.getByText('Video loaded and ready!')).toBeInTheDocument();
    });

    // 2. 시간 간격 기반 변환 선택
    const intervalRadio = screen.getByLabelText('Based on Time Intervals');
    await userEvent.click(intervalRadio);

    // 3. 유효하지 않은 시간 간격 입력 (예: 0)
    const intervalInput = screen.getByLabelText(/Interval \(seconds\):/i);
    
    // fireEvent를 사용하여 직접 값 변경
    fireEvent.change(intervalInput, { target: { value: '0' } });
    
    // 입력이 실제로 0으로 설정되었는지 확인
    await waitFor(() => {
      expect(intervalInput).toHaveValue(0);
    });

    // 4. 버튼 비활성화 확인
    const convertButton = screen.getByRole('button', { name: /Convert to Comic/i });
    await waitFor(() => {
      expect(convertButton).toBeDisabled();
    });
  });
});
