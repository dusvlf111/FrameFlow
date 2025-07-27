import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // useTranslation 훅 임포트
import { ComicPage } from '../utils/imageLayout';
import { exportImagesAsZip } from '../utils/fileExport';
import { exportImagesAsPdf } from '../utils/pdfExport';
import styles from './ViewerPage.module.css'; // CSS 모듈 임포트

/**
 * @interface ViewerPageLocationState
 * @description ViewerPage로 전달될 state의 타입을 정의합니다.
 * @property {ComicPage[]} comicPages - 변환된 만화 페이지 배열.
 */
interface ViewerPageLocationState {
  comicPages: ComicPage[];
}

/**
 * @component ViewerPage
 * @description 변환된 만화 페이지를 보여주는 뷰어 페이지입니다.
 *              전달받은 만화 페이지를 표시하고, ZIP 파일 및 PDF로 내보내는 기능을 제공합니다.
 */
const ViewerPage: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation(); // 번역 함수 t를 가져옵니다.

  // useLocation 훅을 통해 전달받은 state에서 comicPages를 추출합니다.
  // state가 없을 경우를 대비하여 기본값을 빈 배열로 설정합니다.
  const { comicPages } = (location.state as ViewerPageLocationState) || { comicPages: [] };

  // 현재 보고 있는 페이지 인덱스
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  /**
   * @function handleNextPage
   * @description 다음 페이지로 이동합니다.
   */
  const handleNextPage = () => {
    setCurrentPageIndex((prevIndex) => Math.min(prevIndex + 1, comicPages.length - 1));
  };

  /**
   * @function handlePrevPage
   * @description 이전 페이지로 이동합니다.
   */
  const handlePrevPage = () => {
    setCurrentPageIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  /**
   * @function handleExportAllZip
   * @description 모든 만화 페이지를 ZIP 파일로 내보냅니다.
   */
  const handleExportAllZip = async () => {
    if (comicPages.length === 0) {
      alert(t('alert_no_comic_pages')); // 번역 키 사용
      return;
    }
    try {
      const imageDataUrls = comicPages.map(page => page.dataUrl);
      await exportImagesAsZip(imageDataUrls, 'FrameFlow_Comic.zip');
      alert(t('alert_zip_success')); // 번역 키 사용
    } catch (error) {
      console.error(t('alert_zip_fail'), error); // 번역 키 사용
      alert(t('alert_zip_fail')); // 번역 키 사용
    }
  };

  /**
   * @function handleExportAllPdf
   * @description 모든 만화 페이지를 PDF 파일로 내보냅니다.
   */
  const handleExportAllPdf = async () => {
    if (comicPages.length === 0) {
      alert(t('alert_no_comic_pages')); // 번역 키 사용
      return;
    }
    try {
      const imageDataUrls = comicPages.map(page => page.dataUrl);
      await exportImagesAsPdf(imageDataUrls, 'FrameFlow_Comic.pdf');
      alert(t('alert_pdf_success')); // 번역 키 사용
    } catch (error) {
      console.error(t('alert_pdf_fail'), error); // 번역 키 사용
      alert(t('alert_pdf_fail')); // 번역 키 사용
    }
  };

  const currentComicPage = comicPages[currentPageIndex];

  return (
    <div className={styles.viewerPageContainer}>
      <h1>{t('viewer_title')}</h1>

      {comicPages.length > 0 ? (
        <div className={styles.comicPageDisplay}>
          <p>{t('page_count', { current: currentPageIndex + 1, total: comicPages.length })}</p>
          <img 
            src={currentComicPage.dataUrl} 
            alt={t('comic_page_alt', { page: currentPageIndex + 1 })}
            className={styles.comicImage}
          />
          <div className={styles.pageNavigation}>
            <button onClick={handlePrevPage} disabled={currentPageIndex === 0}>{t('previous_button')}</button>
            <button onClick={handleNextPage} disabled={currentPageIndex === comicPages.length - 1}>{t('next_button')}</button>
          </div>
        </div>
      ) : (
        <p>{t('viewer_no_pages')}</p>
      )}

      <div className={styles.exportButtons}>
        <button onClick={handleExportAllZip} disabled={comicPages.length === 0}>{t('export_zip_button')}</button>
        <button onClick={handleExportAllPdf} disabled={comicPages.length === 0}>{t('export_pdf_button')}</button>
      </div>

      <div className={styles.homeLinkContainer}>
        <Link to="/">
          <button>{t('go_to_home')}</button>
        </Link>
      </div>
    </div>
  );
};

export default ViewerPage;
