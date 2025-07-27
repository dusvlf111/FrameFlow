import { describe, it, expect } from 'vitest';
import { parseSrt, parseVtt } from './subtitleParser';

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
});
