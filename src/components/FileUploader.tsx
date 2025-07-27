import React, { useCallback } from 'react';
import styles from './FileUploader.module.css'; // CSS 모듈 임포트

/**
 * @interface FileUploaderProps
 * @property {function(File): void} onFileSelect - 파일이 선택되거나 드롭되었을 때 호출될 콜백 함수.
 * @property {string} accept - 허용되는 파일 타입을 지정하는 문자열 (예: "video/*", "audio/*", ".srt").
 * @property {React.ReactNode} children - 파일 업로더를 트리거할 UI 요소 (예: 버튼, 드롭 영역).
 * @property {string} id - 파일 업로더의 고유 ID (여러 개의 FileUploader 구분용).
 */
interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  accept: string;
  children: React.ReactNode;
  id?: string; // 선택적 prop으로 추가
}

/**
 * @component FileUploader
 * @description 사용자가 파일을 선택하거나 드래그 앤 드롭하여 업로드할 수 있는 컴포넌트.
 *              지정된 파일 타입만 허용하며, 파일 선택 시 onFileSelect 콜백을 호출합니다.
 */
const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, accept, children, id = 'file-upload' }) => {
  /**
   * @function handleFileChange
   * @description input[type="file"]을 통해 파일이 선택되었을 때 호출되는 핸들러.
   *              선택된 첫 번째 파일을 onFileSelect 콜백으로 전달합니다.
   * @param {React.ChangeEvent<HTMLInputElement>} event - 파일 입력 변경 이벤트 객체.
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  /**
   * @function handleDrop
   * @description 드래그 앤 드롭 이벤트 발생 시 호출되는 핸들러.
   *              기본 동작을 방지하고, 드롭된 파일 중 첫 번째 파일을 onFileSelect 콜백으로 전달합니다.
   *              허용된 파일 타입인지 확인합니다.
   * @param {React.DragEvent<HTMLDivElement>} event - 드래그 드롭 이벤트 객체.
   */
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault(); // 기본 동작(새 탭에서 파일 열기 등) 방지
      const file = event.dataTransfer.files?.[0];
      if (file) {
        // accept 속성에 따른 파일 타입 검증
        const isValidFile = accept.includes('*') 
          ? file.type.includes(accept.split('/')[0]) // video/*, audio/* 형태
          : accept.split(',').some(ext => file.name.toLowerCase().endsWith(ext.trim())); // .srt,.vtt 형태
        
        if (isValidFile) {
          onFileSelect(file);
        } else {
          console.warn('Invalid file type:', file.type, file.name);
        }
      }
    },
    [accept, onFileSelect] // 의존성 배열: accept와 onFileSelect가 변경될 때만 함수 재생성
  );

  /**
   * @function handleDragOver
   * @description 드래그 오버 이벤트 발생 시 호출되는 핸들러.
   *              기본 동작을 방지하여 드롭이 가능하도록 합니다.
   * @param {React.DragEvent<HTMLDivElement>} event - 드래그 오버 이벤트 객체.
   */
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // 기본 동작 방지 (드롭 가능하게 함)
  };

  return (
    <div onDrop={handleDrop} onDragOver={handleDragOver} className={styles.fileUploaderContainer}> {/* 인라인 스타일을 className으로 변경 */}
      {/* 실제 파일 선택 input은 숨기고, label을 통해 클릭 영역 제공 */}
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className={styles.hiddenInput} // 인라인 스타일을 className으로 변경
        id={id}
        aria-label="File Upload"
      />
      {/* label을 input과 연결하여 children 클릭 시 파일 선택 다이얼로그 열림 */}
      <label htmlFor={id} className={styles.fileUploaderLabel}> {/* 인라인 스타일을 className으로 변경 */}
        {children}
      </label>
    </div>
  );
};

export default FileUploader;
