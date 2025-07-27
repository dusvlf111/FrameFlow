import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * @interface VideoProcessorHook
 * @property {HTMLVideoElement | null} videoRef - 비디오 엘리먼트의 ref.
 * @property {string | null} videoSrc - 현재 로드된 비디오의 URL.
 * @property {boolean} isVideoLoaded - 비디오가 성공적으로 로드되었는지 여부.
 * @property {function(File): void} loadVideo - 비디오 파일을 로드하는 함수.
 * @property {function(number): Promise<string | null>} extractFrameAtTime - 특정 시간의 프레임을 추출하는 함수.
 */
interface VideoProcessorHook {
  videoRef: React.RefObject<HTMLVideoElement>;
  videoSrc: string | null;
  isVideoLoaded: boolean;
  loadVideo: (file: File) => void;
  extractFrameAtTime: (timeInSeconds: number) => Promise<string | null>;
}

/**
 * @function useVideoProcessor
 * @description 동영상 파일을 처리하고, 특정 시간의 프레임을 추출하는 커스텀 훅.
 *              비디오 로드, 재생 준비, 프레임 추출 로직을 캡슐화합니다.
 * @param {HTMLVideoElement} [initialVideoElement] - 테스트 목적으로 초기 비디오 엘리먼트를 주입할 때 사용합니다.
 * @returns {VideoProcessorHook} 비디오 엘리먼트 ref, 비디오 소스, 로드 상태, 비디오 로드 함수, 프레임 추출 함수.
 */
const useVideoProcessor = (initialVideoElement?: HTMLVideoElement): VideoProcessorHook => {
  const videoRef = useRef<HTMLVideoElement>(initialVideoElement || null); // 비디오 엘리먼트에 접근하기 위한 ref
  const [videoSrc, setVideoSrc] = useState<string | null>(null); // 비디오 소스 URL
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false); // 비디오 로드 상태

  /**
   * @function loadVideo
   * @description 사용자가 선택한 비디오 파일을 로드합니다.
   *              기존 URL이 있다면 해제하고, 새로운 파일의 URL을 생성하여 비디오 소스로 설정합니다.
   * @param {File} file - 로드할 비디오 파일 객체.
   */
  const loadVideo = useCallback((file: File) => {
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc); // 기존 비디오 URL 해제하여 메모리 누수 방지
    }
    const url = URL.createObjectURL(file); // 파일로부터 URL 생성
    setVideoSrc(url);
    setIsVideoLoaded(false); // 새로운 비디오 로드 시작이므로 로드 상태 초기화
  }, [videoSrc]);

  /**
   * @effect videoSrc가 변경될 때마다 비디오 엘리먼트의 로드 상태를 감지합니다.
   *           비디오 메타데이터가 로드되면 isVideoLoaded를 true로 설정합니다.
   */
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setIsVideoLoaded(true);
      console.log('Video metadata loaded.'); // 디버깅용 로그
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc); // 컴포넌트 언마운트 시 URL 해제
      }
    };
  }, [videoSrc]);

  /**
   * @function extractFrameAtTime
   * @description 비디오의 특정 시간(초)에 해당하는 프레임을 추출하여 이미지 데이터 URL로 반환합니다.
   *              비디오가 로드되어 있지 않거나, 유효한 시간이 아니면 null을 반환합니다.
   * @param {number} timeInSeconds - 프레임을 추출할 시간 (초 단위).
   * @returns {Promise<string | null>} 추출된 프레임의 데이터 URL 또는 null.
   */
  const extractFrameAtTime = useCallback(async (timeInSeconds: number): Promise<string | null> => {
    const videoElement = videoRef.current;
    if (!videoElement || !isVideoLoaded) {
      console.warn('Video not loaded or ready for frame extraction.');
      return null;
    }

    // 비디오 시간을 설정하고, seeked 이벤트가 발생할 때까지 기다립니다.
    // seeked 이벤트는 비디오가 지정된 시간으로 이동하여 재생 준비가 완료되었을 때 발생합니다.
    videoElement.currentTime = timeInSeconds;

    return new Promise((resolve) => {
      const handleSeeked = () => {
        // 캔버스 엘리먼트 생성
        const canvas = document.createElement('canvas');
        // 비디오의 현재 크기에 맞춰 캔버스 크기 설정
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // 캔버스에 비디오의 현재 프레임을 그립니다.
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          // 캔버스 내용을 이미지 데이터 URL로 변환하여 반환 (JPEG, 품질 0.9)
          const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          resolve(imageDataUrl);
        } else {
          console.error('Failed to get 2D context from canvas.');
          resolve(null);
        }
        // 이벤트 리스너 제거 (한 번만 실행되도록)
        videoElement.removeEventListener('seeked', handleSeeked);
      };

      // seeked 이벤트 리스너 추가
      videoElement.addEventListener('seeked', handleSeeked);
    });
  }, [isVideoLoaded]); // isVideoLoaded 상태에 의존

  return {
    videoRef,
    videoSrc,
    isVideoLoaded,
    loadVideo,
    extractFrameAtTime,
  };
};

export default useVideoProcessor;