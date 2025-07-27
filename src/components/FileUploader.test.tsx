import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUploader from './FileUploader';

describe('FileUploader', () => {
  /**
   * @test 파일 선택 시 onFileSelect 콜백이 올바른 파일로 호출되는지 테스트
   */
  it('should call onFileSelect when a file is chosen', async () => {
    const handleFileSelect = vi.fn(); // onFileSelect 콜백을 모킹
    render(
      <FileUploader onFileSelect={handleFileSelect} accept="video/*">
        <button>Upload Video</button> {/* children으로 버튼 제공 */}
      </FileUploader>
    );

    // 테스트용 파일 생성
    const file = new File(['dummy video content'], 'test-video.mp4', { type: 'video/mp4' });
    // label 텍스트를 통해 input 요소를 찾고, 그 이전 형제 요소(숨겨진 input[type="file"])를 가져옴
    const input = screen.getByLabelText('File Upload') as HTMLInputElement;

    // userEvent를 사용하여 파일 업로드 시뮬레이션
    await userEvent.upload(input, file);

    // onFileSelect 콜백이 올바른 파일 객체로 호출되었는지 확인
    expect(handleFileSelect).toHaveBeenCalledWith(file);
  });

  /**
   * @test 파일 드롭 시 onFileSelect 콜백이 올바른 파일로 호출되는지 테스트
   */
  it('should call onFileSelect when a file is dropped', async () => {
    const handleFileSelect = vi.fn();
    render(
      <FileUploader onFileSelect={handleFileSelect} accept="video/*">
        <div>Drop Video Here</div>
      </FileUploader>
    );

    const file = new File(['dummy video content'], 'test-video.mp4', { type: 'video/mp4' });
    const dropZone = screen.getByText('Drop Video Here').parentElement as HTMLDivElement; // 드롭 영역 요소

    // userEvent를 사용하여 파일 드롭 시뮬레이션
    await userEvent.setup().upload(dropZone, file);

    expect(handleFileSelect).toHaveBeenCalledWith(file);
  });

  /**
   * @test 허용되지 않는 파일 타입 드롭 시 onFileSelect가 호출되지 않는지 테스트
   */
  it('should not call onFileSelect when an unaccepted file type is dropped', async () => {
    const handleFileSelect = vi.fn();
    render(
      <FileUploader onFileSelect={handleFileSelect} accept="image/*">
        <div>Drop Image Here</div>
      </FileUploader>
    );

    // 허용되지 않는 타입의 파일 (비디오 파일)
    const unacceptedFile = new File(['dummy video content'], 'test-video.mp4', { type: 'video/mp4' });
    const dropZone = screen.getByText('Drop Image Here').parentElement as HTMLDivElement;

    await userEvent.setup().upload(dropZone, unacceptedFile);

    // onFileSelect 콜백이 호출되지 않았는지 확인
    expect(handleFileSelect).not.toHaveBeenCalled();
  });
});