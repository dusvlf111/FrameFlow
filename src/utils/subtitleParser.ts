/**
 * @interface SubtitleEntry
 * @description 파싱된 자막 항목의 구조를 정의합니다.
 * @property {string} id - 자막 항목의 고유 ID (SRT의 순번).
 * @property {number} startTime - 자막 시작 시간 (밀리초).
 * @property {number} endTime - 자막 종료 시간 (밀리초).
 * @property {string} text - 자막 내용.
 */
export interface SubtitleEntry {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

/**
 * @function parseSrt
 * @description SRT 형식의 문자열을 파싱하여 SubtitleEntry 배열로 변환합니다.
 * @param {string} srtContent - SRT 형식의 자막 문자열.
 * @returns {SubtitleEntry[]} 파싱된 자막 항목 배열.
 */
export function parseSrt(srtContent: string): SubtitleEntry[] {
  const entries: SubtitleEntry[] = [];
  // SRT 블록은 두 개의 개행 문자로 구분됩니다.
  const blocks = srtContent.trim().split(/\n\s*\n/);

  blocks.forEach(block => {
    const lines = block.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length < 2) return; // 최소한 ID와 시간 정보는 있어야 함

    const id = lines[0];
    const timeString = lines[1];
    const text = lines.slice(2).join('\n');

    // 시간 문자열 파싱 (예: 00:00:01,000 --> 00:00:03,000)
    const timeMatch = timeString.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
    if (!timeMatch || timeMatch.length < 3) return;

    const startTime = parseSrtTime(timeMatch[1]);
    const endTime = parseSrtTime(timeMatch[2]);

    if (startTime !== null && endTime !== null) {
      entries.push({
        id,
        startTime,
        endTime,
        text,
      });
    }
  });

  return entries;
}

/**
 * @function parseSrtTime
 * @description SRT 시간 형식 문자열 (HH:MM:SS,ms)을 밀리초 단위 숫자로 변환합니다.
 * @param {string} timeString - SRT 시간 형식 문자열.
 * @returns {number | null} 밀리초 단위 시간 또는 파싱 실패 시 null.
 */
function parseSrtTime(timeString: string): number | null {
  const parts = timeString.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
  if (!parts || parts.length < 5) return null;

  const hours = parseInt(parts[1], 10);
  const minutes = parseInt(parts[2], 10);
  const seconds = parseInt(parts[3], 10);
  const milliseconds = parseInt(parts[4], 10);

  return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
}

/**
 * @function parseVtt
 * @description VTT 형식의 문자열을 파싱하여 SubtitleEntry 배열로 변환합니다.
 *              (SRT와 유사하게 구현되지만, VTT 특성을 고려하여 추후 확장 가능)
 * @param {string} vttContent - VTT 형식의 자막 문자열.
 * @returns {SubtitleEntry[]} 파싱된 자막 항목 배열.
 */
export function parseVtt(vttContent: string): SubtitleEntry[] {
  // VTT 파일은 WEBVTT 헤더로 시작합니다.
  if (!vttContent.startsWith('WEBVTT')) {
    console.warn('Invalid VTT format: Missing WEBVTT header.');
    return [];
  }

  const entries: SubtitleEntry[] = [];
  // VTT 블록은 두 개의 개행 문자로 구분됩니다.
  // 첫 번째 블록(WEBVTT 헤더)은 건너뜁니다.
  const blocks = vttContent.trim().split(/\n\s*\n/).slice(1);

  blocks.forEach(block => {
    const lines = block.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length < 1) return; // 최소한 시간 정보는 있어야 함

    let id: string | undefined;
    let timeString: string;
    let text: string;

    // 첫 번째 라인이 시간 정보인지, 아니면 ID인지 확인
    if (lines[0].includes('-->')) {
      timeString = lines[0];
      text = lines.slice(1).join('\n');
    } else {
      id = lines[0];
      timeString = lines[1];
      text = lines.slice(2).join('\n');
    }

    // 시간 문자열 파싱 (예: 00:00:01.000 --> 00:00:03.000)
    const timeMatch = timeString.match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/);
    if (!timeMatch || timeMatch.length < 3) return;

    const startTime = parseVttTime(timeMatch[1]);
    const endTime = parseVttTime(timeMatch[2]);

    if (startTime !== null && endTime !== null) {
      entries.push({
        id: id || String(entries.length + 1), // ID가 없으면 순번으로 대체
        startTime,
        endTime,
        text,
      });
    }
  });

  return entries;
}

/**
 * @function parseVttTime
 * @description VTT 시간 형식 문자열 (HH:MM:SS.ms)을 밀리초 단위 숫자로 변환합니다.
 * @param {string} timeString - VTT 시간 형식 문자열.
 * @returns {number | null} 밀리초 단위 시간 또는 파싱 실패 시 null.
 */
function parseVttTime(timeString: string): number | null {
  const parts = timeString.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
  if (!parts || parts.length < 5) return null;

  const hours = parseInt(parts[1], 10);
  const minutes = parseInt(parts[2], 10);
  const seconds = parseInt(parts[3], 10);
  const milliseconds = parseInt(parts[4], 10);

  return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
}
