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
    const text = cleanSubtitleText(lines.slice(2).join('\n'));

    // 시간 문자열 파싱 (예: 00:00:01,000 --> 00:00:03,000)
    const timeMatch = timeString.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
    if (!timeMatch || timeMatch.length < 3) return;

    const startTime = parseSrtTime(timeMatch[1]);
    const endTime = parseSrtTime(timeMatch[2]);

    if (startTime !== null && endTime !== null) {
      let finalStartTime = startTime;
      let finalEndTime = endTime;
      
      // 시작 시간이 끝 시간보다 큰 경우 수정
      if (startTime > endTime) {
        console.warn(`Invalid time range for subtitle ${id}: start=${startTime}, end=${endTime}. Swapping times.`);
        finalStartTime = endTime;
        finalEndTime = startTime;
      }
      
      // 시간이 같은 경우 최소 1초 지속시간 설정
      if (finalStartTime === finalEndTime) {
        finalEndTime = finalStartTime + 1000; // 1초 추가
      }
      
      entries.push({
        id,
        startTime: finalStartTime,
        endTime: finalEndTime,
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
      text = cleanSubtitleText(lines.slice(1).join('\n'));
    } else {
      id = lines[0];
      timeString = lines[1];
      text = cleanSubtitleText(lines.slice(2).join('\n'));
    }

    // 시간 문자열 파싱 (예: 00:00:01.000 --> 00:00:03.000)
    const timeMatch = timeString.match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/);
    if (!timeMatch || timeMatch.length < 3) return;

    const startTime = parseVttTime(timeMatch[1]);
    const endTime = parseVttTime(timeMatch[2]);

    if (startTime !== null && endTime !== null) {
      let finalStartTime = startTime;
      let finalEndTime = endTime;
      
      // 시작 시간이 끝 시간보다 큰 경우 수정
      if (startTime > endTime) {
        console.warn(`Invalid time range for VTT subtitle ${id}: start=${startTime}, end=${endTime}. Swapping times.`);
        finalStartTime = endTime;
        finalEndTime = startTime;
      }
      
      // 시간이 같은 경우 최소 1초 지속시간 설정
      if (finalStartTime === finalEndTime) {
        finalEndTime = finalStartTime + 1000; // 1초 추가
      }
      
      entries.push({
        id: id || String(entries.length + 1), // ID가 없으면 순번으로 대체
        startTime: finalStartTime,
        endTime: finalEndTime,
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

/**
 * @function convertToWebVTT
 * @description SubtitleEntry 배열을 WebVTT 형식의 문자열로 변환합니다.
 * @param {SubtitleEntry[]} subtitles - 변환할 자막 항목 배열.
 * @returns {string} WebVTT 형식의 자막 문자열.
 */
export function convertToWebVTT(subtitles: SubtitleEntry[]): string {
  let vttContent = 'WEBVTT\n\n';
  
  // CSS 스타일을 WebVTT에 추가하여 자막 스타일 조정
  vttContent += 'STYLE\n';
  vttContent += '::cue {\n';
  vttContent += '  background-color: rgba(0, 0, 0, 0.8);\n';
  vttContent += '  color: white;\n';
  vttContent += '  font-size: 16px;\n';
  vttContent += '  font-family: Arial, sans-serif;\n';
  vttContent += '  text-align: center;\n';
  vttContent += '  line-height: 1.4;\n';
  vttContent += '  padding: 8px 20px;\n';
  vttContent += '  border-radius: 0;\n';
  vttContent += '  white-space: pre-wrap;\n';
  vttContent += '  width: 100%;\n';
  vttContent += '  box-sizing: border-box;\n';
  vttContent += '  position: fixed;\n';
  vttContent += '  bottom: 100px;\n';
  vttContent += '  left: 0;\n';
  vttContent += '  right: 0;\n';
  vttContent += '  z-index: 9999;\n';
  vttContent += '}\n\n';
  
  subtitles.forEach((subtitle, index) => {
    const startTime = formatWebVTTTime(subtitle.startTime);
    const endTime = formatWebVTTTime(subtitle.endTime);
    
    vttContent += `${index + 1}\n`;
    vttContent += `${startTime} --> ${endTime}\n`; // 위치 설정 제거, CSS로만 제어
    vttContent += `${subtitle.text}\n\n`;
  });
  
  return vttContent;
}

/**
 * @function formatWebVTTTime
 * @description 밀리초를 WebVTT 형식의 시간 문자열로 변환합니다.
 * @param {number} milliseconds - 변환할 시간 (밀리초).
 * @returns {string} WebVTT 형식의 시간 문자열 (예: 00:01:23.456).
 */
function formatWebVTTTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const ms = milliseconds % 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * @function createSubtitleBlob
 * @description SubtitleEntry 배열을 WebVTT Blob으로 변환합니다.
 * @param {SubtitleEntry[]} subtitles - 변환할 자막 항목 배열.
 * @returns {Blob} WebVTT 형식의 Blob 객체.
 */
export function createSubtitleBlob(subtitles: SubtitleEntry[]): Blob {
  const vttContent = convertToWebVTT(subtitles);
  return new Blob([vttContent], { type: 'text/vtt' });
}

/**
 * @function cleanSubtitleText
 * @description 자막 텍스트에서 HTML 태그나 특수 문자를 제거하고 정리합니다.
 * @param {string} text - 원본 자막 텍스트
 * @returns {string} 정리된 자막 텍스트
 */
function cleanSubtitleText(text: string): string {
  // HTML 태그 제거
  let cleanText = text.replace(/<[^>]*>/g, '');
  
  // HTML 엔티티 디코딩
  cleanText = cleanText
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  // 연속된 공백을 하나로 줄이기 (단, 줄바꿈은 보존)
  cleanText = cleanText.replace(/ +/g, ' ');
  
  // 앞뒤 공백 제거 (각 줄별로)
  cleanText = cleanText.split('\n').map(line => line.trim()).join('\n');
  
  return cleanText;
}
