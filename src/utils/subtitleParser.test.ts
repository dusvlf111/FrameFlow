import { describe, it, expect } from 'vitest';
import { parseSrt, parseVtt, convertToWebVTT, createSubtitleBlob } from './subtitleParser';

describe('subtitleParser', () => {
  /**
   *
   * @test parseSrt 함수가 간단한 SRT 문자열을 올바르게 파싱하는지 테스트
   */
  it('should correctly parse a simple SRT string', () => {
    const srtContent = `
1
00:00:01,000 --> 00:00:03,000
Hello, world!

2
00:00:04,000 --> 00:00:06,000
This is a test.
    `;
    const result = parseSrt(srtContent);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: '1',
      startTime: 1000,
      endTime: 3000,
      text: 'Hello, world!',
    });
    expect(result[1]).toEqual({
      id: '2',
      startTime: 4000,
      endTime: 6000,
      text: 'This is a test.',
    });
  });

  /**
   *
   * @test parseSrt 함수가 빈 SRT 내용을 처리하는지 테스트
   */
  it('should handle empty SRT content', () => {
    const srtContent = '';
    const result = parseSrt(srtContent);
    expect(result).toHaveLength(0);
  });

  /**
   *
   * @test parseSrt 함수가 여러 줄의 텍스트를 올바르게 파싱하는지 테스트
   */
  it('should correctly parse multi-line text', () => {
    const srtContent = `
1
00:00:01,000 --> 00:00:03,000
Line one
Line two
    `;
    const result = parseSrt(srtContent);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Line one\nLine two');
  });

  /**
   *
   * @test parseSrt 함수가 잘못된 시간 형식의 SRT 내용을 건너뛰는지 테스트
   */
  it('should skip invalid time format SRT content', () => {
    const srtContent = `
1
00:00:01,000 -- 00:00:03,000
Invalid time
    `;
    const result = parseSrt(srtContent);
    expect(result).toHaveLength(0);
  });

  /**
   *
   * @test parseVtt 함수가 간단한 VTT 문자열을 올바르게 파싱하는지 테스트
   */
  it('should correctly parse a simple VTT string', () => {
    const vttContent = `WEBVTT

1
00:00:01.000 --> 00:00:03.000
Hello, world!

2
00:00:04.000 --> 00:00:06.000
This is a test.
    `;
    const result = parseVtt(vttContent);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: '1',
      startTime: 1000,
      endTime: 3000,
      text: 'Hello, world!',
    });
    expect(result[1]).toEqual({
      id: '2',
      startTime: 4000,
      endTime: 6000,
      text: 'This is a test.',
    });
  });

  /**
   *
   * @test parseVtt 함수가 ID가 없는 VTT 문자열을 올바르게 파싱하는지 테스트
   */
  it('should correctly parse VTT string without ID', () => {
    const vttContent = `WEBVTT

00:00:01.000 --> 00:00:03.000
Hello, world!

00:00:04.000 --> 00:00:06.000
This is a test.
    `;
    const result = parseVtt(vttContent);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1'); // ID가 없으면 순번으로 대체
    expect(result[0].text).toBe('Hello, world!');
  });

  /**
   *
   * @test parseVtt 함수가 빈 VTT 내용을 처리하는지 테스트
   */
  it('should handle empty VTT content', () => {
    const vttContent = 'WEBVTT';
    const result = parseVtt(vttContent);
    expect(result).toHaveLength(0);
  });

  /**
   *
   * @test parseVtt 함수가 잘못된 VTT 헤더를 처리하는지 테스트
   */
  it('should handle invalid VTT header', () => {
    const vttContent = `NOTWEBPVTT

00:00:01.000 --> 00:00:03.000
Hello, world!
    `;
    const result = parseVtt(vttContent);
    expect(result).toHaveLength(0);
  });

  /**
   * @test convertToWebVTT 함수가 SubtitleEntry 배열을 올바른 WebVTT 형식으로 변환하는지 테스트
   */
  it('should convert SubtitleEntry array to WebVTT format', () => {
    const subtitles = [
      { id: '1', startTime: 1000, endTime: 3000, text: 'Hello, world!' },
      { id: '2', startTime: 4000, endTime: 6000, text: 'This is a test.' },
    ];
    
    const result = convertToWebVTT(subtitles);
    const lines = result.split('\n');
    
    expect(lines[0]).toBe('WEBVTT');
    expect(lines[2]).toBe('1');
    expect(lines[3]).toBe('00:00:01.000 --> 00:00:03.000');
    expect(lines[4]).toBe('Hello, world!');
    expect(lines[6]).toBe('2');
    expect(lines[7]).toBe('00:00:04.000 --> 00:00:06.000');
    expect(lines[8]).toBe('This is a test.');
  });

  /**
   * @test convertToWebVTT 함수가 빈 배열을 처리하는지 테스트
   */
  it('should handle empty SubtitleEntry array', () => {
    const subtitles: any[] = [];
    const result = convertToWebVTT(subtitles);
    expect(result).toBe('WEBVTT\n\n');
  });

  /**
   * @test createSubtitleBlob 함수가 올바른 Blob을 생성하는지 테스트
   */
  it('should create a valid WebVTT Blob', () => {
    const subtitles = [
      { id: '1', startTime: 1000, endTime: 3000, text: 'Hello, world!' },
    ];
    
    const blob = createSubtitleBlob(subtitles);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/vtt');
    expect(blob.size).toBeGreaterThan(0);
  });

  /**
   * @test parseSrt 함수가 잘못된 시간 범위를 수정하는지 테스트
   */
  it('should fix invalid time ranges in SRT content', () => {
    const srtContent = `
1
00:00:01,973 --> 00:00:01,812
"이글루 모텔"

2
00:00:02,449 --> 00:00:02,283
뭐야?
    `;
    const result = parseSrt(srtContent);
    expect(result).toHaveLength(2);
    
    // 첫 번째 자막: 시간이 바뀌어야 함
    expect(result[0].startTime).toBe(1812);
    expect(result[0].endTime).toBe(1973);
    expect(result[0].text).toBe('"이글루 모텔"');
    
    // 두 번째 자막: 시간이 바뀌어야 함
    expect(result[1].startTime).toBe(2283);
    expect(result[1].endTime).toBe(2449);
    expect(result[1].text).toBe('뭐야?');
  });

  /**
   * @test parseSrt 함수가 동일한 시간에 최소 지속시간을 추가하는지 테스트
   */
  it('should add minimum duration for same start and end times', () => {
    const srtContent = `
1
00:00:01,000 --> 00:00:01,000
Same time subtitle
    `;
    const result = parseSrt(srtContent);
    expect(result).toHaveLength(1);
    expect(result[0].startTime).toBe(1000);
    expect(result[0].endTime).toBe(2000); // 1초 추가됨
    expect(result[0].text).toBe('Same time subtitle');
  });
});
