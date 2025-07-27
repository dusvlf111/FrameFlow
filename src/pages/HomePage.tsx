import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // useTranslation 훅 임포트
import FileUploader from '../components/FileUploader';
import useVideoProcessor from '../hooks/useVideoProcessor';
import { SubtitleEntry, parseSrt, parseVtt, createSubtitleBlob } from '../utils/subtitleParser';
import { ImageFrame, createA4SixPanelLayout } from '../utils/imageLayout';
import styles from './HomePage.module.css'; // CSS 모듈 임포트

/**
 * @enum ConversionType
 * @description 동영상을 만화로 변환하는 기준을 정의합니다.
 */
enum ConversionType {
  SUBTITLE = 'subtitle',
  INTERVAL = 'interval',
}

/**
 * @component HomePage
 * @description 애플리케이션의 시작 페이지입니다. 동영상 업로드 및 변환 설정을 담당합니다.
 *              사용자가 동영상 파일과 자막 파일을 업로드하고 미리 볼 수 있는 기능을 제공합니다.
 */
const HomePage: React.FC = () => {
  const navigate = useNavigate(); // 페이지 이동을 위한 navigate 훅
  const { t } = useTranslation(); // 번역 함수 t를 가져옵니다.

  // 사용자가 선택한 비디오 파일을 저장하는 상태
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  // 사용자가 선택한 자막 파일을 저장하는 상태
  const [selectedSubtitleFile, setSelectedSubtitleFile] = useState<File | null>(null);
  // 파싱된 자막 데이터를 저장하는 상태
  const [parsedSubtitles, setParsedSubtitles] = useState<SubtitleEntry[]>([]);
  // 자막 파일의 Blob URL을 저장하는 상태 (비디오 미리보기용)
  const [subtitleBlobUrl, setSubtitleBlobUrl] = useState<string | null>(null);
  // 변환 기준 (자막 또는 시간 간격)을 저장하는 상태
  const [conversionType, setConversionType] = useState<ConversionType>(ConversionType.SUBTITLE);
  // 시간 간격 기준 변환 시 사용할 간격 (초)을 저장하는 상태
  const [intervalSeconds, setIntervalSeconds] = useState<string>('5'); // 기본값 5초, 문자열로 저장
  // 변환 중 상태를 나타내는 플래그
  const [isConverting, setIsConverting] = useState<boolean>(false);
  // 변환 진행률 (0-100)
  const [conversionProgress, setConversionProgress] = useState<number>(0);
  // 사용 설명서와 개인정보 방침 표시 상태
  const [showUserGuide, setShowUserGuide] = useState<boolean>(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState<boolean>(false);
  // 유효하지 않은 간격 입력 시 모달 표시 상태
  const [showInvalidIntervalModal, setShowInvalidIntervalModal] = useState<boolean>(false);

  // useVideoProcessor 훅을 사용하여 비디오 처리 로직을 가져옵니다.
  // 비디오 엘리먼트는 렌더링 시점에 ref를 통해 연결됩니다.
  const { videoRef, videoSrc, isVideoLoaded, loadVideo, extractFrameAtTime } = useVideoProcessor();

  /**
   * @function handleVideoFileSelect
   * @description FileUploader를 통해 비디오 파일이 선택되었을 때 호출되는 콜백 함수.
   *              선택된 파일을 상태에 저장하고, useVideoProcessor 훅을 통해 비디오를 로드합니다.
   * @param {File} file - 선택된 비디오 파일 객체.
   */
  const handleVideoFileSelect = (file: File) => {
    setSelectedVideoFile(file);
    loadVideo(file); // useVideoProcessor 훅을 통해 비디오 로드
  };

  /**
   * @function handleSubtitleFileSelect
   * @description FileUploader를 통해 자막 파일이 선택되었을 때 호출되는 콜백 함수.
   *              선택된 파일을 상태에 저장하고, 파일 내용을 읽어 파싱합니다.
   * @param {File} file - 선택된 자막 파일 객체.
   */
  const handleSubtitleFileSelect = (file: File) => {
    console.log('Subtitle file selected:', file.name, file.type, file.size);
    setSelectedSubtitleFile(file);
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      console.log('File content length:', content.length);
      console.log('File content preview:', content.substring(0, 200));
      
      let subtitles: SubtitleEntry[] = [];
      // 파일 확장자에 따라 다른 파서 사용
      if (file.name.endsWith('.srt')) {
        console.log('Parsing as SRT file');
        subtitles = parseSrt(content);
      } else if (file.name.endsWith('.vtt')) {
        console.log('Parsing as VTT file');
        subtitles = parseVtt(content);
      } else {
        console.warn(t('unsupported_subtitle_format')); // 번역 키 사용
      }
      
      console.log('Parsed subtitles count:', subtitles.length);
      setParsedSubtitles(subtitles);
      
      // 자막이 있으면 WebVTT Blob URL 생성
      if (subtitles.length > 0) {
        const blob = createSubtitleBlob(subtitles);
        const url = URL.createObjectURL(blob);
        setSubtitleBlobUrl(url);
      } else {
        setSubtitleBlobUrl(null);
      }
    };

    reader.onerror = (e) => {
      console.error(t('error_reading_subtitle'), e); // 번역 키 사용
      setParsedSubtitles([]);
    };

    reader.readAsText(file); // 파일을 텍스트로 읽기
  };

  // videoSrc가 변경될 때마다 비디오 엘리먼트의 src를 업데이트합니다.
  // 이 useEffect는 videoRef.current가 존재할 때만 실행됩니다.
  useEffect(() => {
    if (videoRef.current && videoSrc) {
      videoRef.current.src = videoSrc;
      videoRef.current.load(); // 비디오 로드 시작
    }
  }, [videoSrc, videoRef]);

  // 컴포넌트 언마운트 시 Blob URL 정리
  useEffect(() => {
    return () => {
      if (subtitleBlobUrl) {
        URL.revokeObjectURL(subtitleBlobUrl);
      }
    };
  }, [subtitleBlobUrl]);

  /**
   * @function handleConversionTypeChange
   * @description 변환 기준 라디오 버튼 변경 시 호출되는 핸들러.
   * @param {React.ChangeEvent<HTMLInputElement>} event - 변경 이벤트 객체.
   */
  const handleConversionTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConversionType(event.target.value as ConversionType);
  };

  /**
   * @function handleIntervalChange
   * @description 시간 간격 입력 필드 변경 시 호출되는 핸들러.
   *              모든 입력을 허용하고 문자열로 저장합니다.
   * @param {React.ChangeEvent<HTMLInputElement>} event - 변경 이벤트 객체.
   */
  const handleIntervalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIntervalSeconds(event.target.value); // 입력값을 그대로 문자열로 저장
  };

  /**
   * @function handleConvert
   * @description '만화로 변환' 버튼 클릭 시 호출되는 함수.
   *              비디오 프레임을 추출하고 만화 페이지를 생성한 후 뷰어 페이지로 이동합니다.
   */
  const handleConvert = async () => {
    if (!videoRef.current || !isVideoLoaded) {
      alert(t('alert_upload_video')); // 번역 키 사용
      return;
    }

    setIsConverting(true); // 변환 시작
    setConversionProgress(0); // 진행률 초기화

    const videoDuration = videoRef.current.duration; // 비디오 총 길이 (초)
    const framesToExtract: ImageFrame[] = [];
    let totalFrames = 0;

    try {
      if (conversionType === ConversionType.SUBTITLE) {
        // 자막 기준 변환
        if (parsedSubtitles.length === 0) {
          alert(t('alert_upload_subtitle')); // 번역 키 사용
          setIsConverting(false);
          return;
        }
        totalFrames = parsedSubtitles.length;
        for (let i = 0; i < totalFrames; i++) {
          const subtitle = parsedSubtitles[i];
          // 자막 시작 시간을 초 단위로 변환
          const timeInSeconds = subtitle.startTime / 1000;
          // 비디오 길이를 초과하는 시간은 건너뜀
          if (timeInSeconds <= videoDuration) {
            const dataUrl = await extractFrameAtTime(timeInSeconds);
            if (dataUrl) {
              framesToExtract.push({ 
                dataUrl, 
                timestamp: timeInSeconds,
                subtitle: subtitle.text // 자막 텍스트 추가
              });
            }
          }
          setConversionProgress(Math.floor(((i + 1) / totalFrames) * 100)); // 진행률 업데이트
        }
      } else { // ConversionType.INTERVAL
        // 시간 간격 기준 변환
        const intervalValue = parseFloat(intervalSeconds);
        if (intervalValue <= 0 || isNaN(intervalValue)) {
          setShowInvalidIntervalModal(true); // 모달 표시
          setIsConverting(false);
          return;
        }
        totalFrames = Math.floor(videoDuration / intervalValue) + 1; // 총 프레임 수 계산
        let frameCount = 0;
        for (let time = 0; time <= videoDuration; time += intervalValue) {
          const dataUrl = await extractFrameAtTime(time);
          if (dataUrl) {
            framesToExtract.push({ dataUrl, timestamp: time });
          }
          frameCount++;
          setConversionProgress(Math.floor((frameCount / totalFrames) * 100)); // 진행률 업데이트
        }
      }

      // 추출된 프레임으로 만화 페이지 생성
      // 이 단계는 시간이 오래 걸릴 수 있으므로, 별도의 진행률을 표시하거나 완료 후 100%로 설정
      setConversionProgress(99); // 프레임 추출 완료 후 레이아웃 생성 전
      const comicPages = await createA4SixPanelLayout(framesToExtract);
      console.log('Generated Comic Pages:', comicPages);

      setConversionProgress(100); // 모든 변환 완료
      // ViewerPage로 이동하며 만화 페이지 데이터 전달
      navigate('/viewer', { state: { comicPages } });

    } catch (error) {
      console.error(t('alert_conversion_error'), error); // 번역 키 사용
      alert(t('alert_conversion_error')); // 번역 키 사용
    } finally {
      setIsConverting(false); // 변환 완료 또는 오류 발생 시 상태 초기화
      setConversionProgress(0); // 진행률 초기화
    }
  };

  // 변환 버튼 활성화 조건:
  // 1. 비디오가 로드되어야 함
  // 2. 비디오 파일이 선택되어야 함
  // 3. 변환 타입이 '자막 기준'일 경우, 파싱된 자막이 있어야 함
  // 4. 변환 타입이 '시간 간격 기준'일 경우, 간격이 설정되어야 함 (유효성은 변환 시점에 체크)
  // 5. 변환 중이 아니어야 함
  const isConvertButtonEnabled = isVideoLoaded && selectedVideoFile !== null && !isConverting && (
    (conversionType === ConversionType.SUBTITLE && parsedSubtitles.length > 0) ||
    (conversionType === ConversionType.INTERVAL) // 간격 기준일 때는 항상 활성화 (유효성은 변환 시점에 체크)
  );

  return (
    <div className={styles.homePageContainer}> {/* 인라인 스타일을 className으로 변경 */}
      <h1>{t('welcome_title')}</h1> {/* 번역 키 사용 */}
      <p>{t('upload_description')}</p> {/* 번역 키 사용 */}

      {/* 비디오 파일 업로드 영역 */}
      <div className={styles.section}> {/* 인라인 스타일을 className으로 변경 */}
        <h2>{t('upload_video_title')}</h2> {/* 번역 키 사용 */}
        <FileUploader onFileSelect={handleVideoFileSelect} accept="video/*" id="video-upload">
          <div className={styles.fileUploaderArea}> {/* 인라인 스타일을 className으로 변경 */}
            {selectedVideoFile ? (
              <p>{t('video_selected', { fileName: selectedVideoFile.name })}</p> // 번역 키 사용
            ) : (
              <p>{t('video_uploader_placeholder')}</p> // 번역 키 사용
            )}
          </div>
        </FileUploader>
      </div>

      {/* 자막 파일 업로드 영역 */}
      <div className={styles.section}> {/* 인라인 스타일을 className으로 변경 */}
        <h2>{t('upload_subtitle_title')}</h2> {/* 번역 키 사용 */}
        <FileUploader onFileSelect={handleSubtitleFileSelect} accept=".srt,.vtt" id="subtitle-upload">
          <div className={styles.fileUploaderArea}> {/* 인라인 스타일을 className으로 변경 */}
            {selectedSubtitleFile ? (
              <p>{t('subtitle_selected', { fileName: selectedSubtitleFile.name })}</p> // 번역 키 사용
            ) : (
              <p>{t('subtitle_uploader_placeholder')}</p> // 번역 키 사용
            )}
          </div>
        </FileUploader>
        {parsedSubtitles.length > 0 && (
          <p style={{ marginTop: '10px', color: 'green' }}>
            {t('subtitles_parsed_success', { count: parsedSubtitles.length })} {/* 번역 키 사용 */}
          </p>
        )}
      </div>

      {/* 비디오 미리보기 영역 */}
      {videoSrc && (
        <div className={styles.videoPreview}>
          <h2>{t('video_preview_title')}</h2>
          <video
            ref={videoRef}
            controls
            className={styles.videoPreviewVideo}
          >
            {/* 자막 트랙 추가 */}
            {subtitleBlobUrl && (
              <track
                kind="subtitles"
                src={subtitleBlobUrl}
                srcLang="ko"
                label="Subtitles"
                default
              />
            )}
            {t('browser_not_support_video')}
          </video>
          {!isVideoLoaded && <p>{t('loading_video_metadata')}</p>}
          {isVideoLoaded && <p>{t('video_loaded_ready')}</p>}
        </div>
      )}

      {/* 변환 설정 영역 */}
      <div className={styles.conversionSettings}> {/* 인라인 스타일을 className으로 변경 */}
        <h2>{t('conversion_settings_title')}</h2> {/* 번역 키 사용 */}
        <div className={styles.radioGroup}> {/* 인라인 스타일을 className으로 변경 */}
          {/* 자막 기준 라디오 버튼 */}
          <label>
            <input
              type="radio"
              value={ConversionType.SUBTITLE}
              checked={conversionType === ConversionType.SUBTITLE}
              onChange={handleConversionTypeChange}
              disabled={parsedSubtitles.length === 0} // 자막이 없으면 선택 불가
            />
            {t('subtitle_based')} {/* 번역 키 사용 */}
          </label>
          {/* 시간 간격 기준 라디오 버튼 */}
          <label>
            <input
              type="radio"
              value={ConversionType.INTERVAL}
              checked={conversionType === ConversionType.INTERVAL}
              onChange={handleConversionTypeChange}
            />
            {t('time_interval_based')} {/* 번역 키 사용 */}
          </label>
        </div>

        {/* 시간 간격 입력 필드 (시간 간격 기준 선택 시에만 표시) */}
        {conversionType === ConversionType.INTERVAL && (
          <div className={styles.intervalInputContainer}> {/* 인라인 스타일을 className으로 변경 */}
            <label>
              {t('interval_seconds')} 
              <input
                type="number"
                value={intervalSeconds}
                onChange={handleIntervalChange}
                step="0.1" // 소수점 입력 허용
                className={styles.intervalInput} // 인라인 스타일을 className으로 변경
              />
            </label>
          </div>
        )}
      </div>

      {/* 변환 버튼 */}
      <button
        onClick={handleConvert} // handleConvert 함수 연결
        disabled={!isConvertButtonEnabled} // 변환 중일 때도 비활성화
        className={styles.convertButton} // 인라인 스타일을 className으로 변경
      >
        {isConverting ? t('converting_button') : t('convert_button')} {/* 번역 키 사용 */}
      </button>

      {/* 변환 진행률 표시 */}
      {isConverting && (
        <div style={{ marginTop: '10px', fontSize: '1.1em', color: '#007bff' }}>
          {t('conversion_progress', { progress: conversionProgress })} {/* 번역 키 사용 */}
        </div>
      )}

      {/* 사용 설명서 섹션 */}
      <div className={styles.userGuide}>
        <div 
          className={styles.guideHeader} 
          onClick={() => setShowUserGuide(!showUserGuide)}
        >
          <h2>{t('user_guide_title')}</h2>
          <span className={styles.toggleIcon}>
            {showUserGuide ? '▼' : '▶'}
          </span>
        </div>
        {showUserGuide && (
          <div className={styles.guideSteps}>
            <div className={styles.guideStep}>
              <h3>{t('user_guide_step1')}</h3>
              <p>{t('user_guide_step1_desc')}</p>
            </div>
            <div className={styles.guideStep}>
              <h3>{t('user_guide_step2')}</h3>
              <p>{t('user_guide_step2_desc')}</p>
            </div>
            <div className={styles.guideStep}>
              <h3>{t('user_guide_step3')}</h3>
              <p>{t('user_guide_step3_desc')}</p>
            </div>
            <div className={styles.guideStep}>
              <h3>{t('user_guide_step4')}</h3>
              <p>{t('user_guide_step4_desc')}</p>
            </div>
            <div className={styles.guideStep}>
              <h3>{t('user_guide_step5')}</h3>
              <p>{t('user_guide_step5_desc')}</p>
            </div>
          </div>
        )}
      </div>

      {/* 개인정보 처리방침 섹션 */}
      <div className={styles.privacyPolicy}>
        <div 
          className={styles.privacyHeader} 
          onClick={() => setShowPrivacyPolicy(!showPrivacyPolicy)}
        >
          <h2>{t('privacy_policy_title')}</h2>
          <span className={styles.toggleIcon}>
            {showPrivacyPolicy ? '▼' : '▶'}
          </span>
        </div>
        {showPrivacyPolicy && (
          <div className={styles.privacyContent}>
            <p className={styles.privacyIntro}>{t('privacy_policy_intro')}</p>
            
            <div className={styles.privacySection}>
              <h3>{t('privacy_policy_data_collection')}</h3>
              <p>{t('privacy_policy_data_collection_desc')}</p>
            </div>
            
            <div className={styles.privacySection}>
              <h3>{t('privacy_policy_file_processing')}</h3>
              <p>{t('privacy_policy_file_processing_desc')}</p>
            </div>
            
            <div className={styles.privacySection}>
              <h3>{t('privacy_policy_local_storage')}</h3>
              <p>{t('privacy_policy_local_storage_desc')}</p>
            </div>
            
            <div className={styles.privacySection}>
              <h3>{t('privacy_policy_cookies')}</h3>
              <p>{t('privacy_policy_cookies_desc')}</p>
            </div>
            
            <div className={styles.privacySection}>
              <h3>{t('privacy_policy_security')}</h3>
              <p>{t('privacy_policy_security_desc')}</p>
            </div>
            
            <div className={styles.privacySection}>
              <h3>{t('privacy_policy_contact')}</h3>
              <p>{t('privacy_policy_contact_desc')}</p>
            </div>
          </div>
        )}
      </div>

      {/* 유효하지 않은 간격 입력 모달 */}
      {showInvalidIntervalModal && (
        <div className={styles.modalOverlay} onClick={() => setShowInvalidIntervalModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>{t('invalid_interval_modal_title')}</h3>
            <p>{t('invalid_interval_modal_message')}</p>
            <div className={styles.modalButtons}>
              <button 
                className={styles.modalButton}
                onClick={() => setShowInvalidIntervalModal(false)}
              >
                {t('modal_ok_button')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
