import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ViewerPage from '././pages/ViewerPage';
import { useTranslation } from 'react-i18next';

/**
 * @component App
 * @description 애플리케이션의 메인 컴포넌트입니다. 라우팅을 설정하고 페이지들을 렌더링합니다.
 *              언어 선택 UI를 포함합니다.
 */
function App() {
  const { i18n } = useTranslation();

  /**
   * @function changeLanguage
   * @description 애플리케이션의 언어를 변경합니다.
   * @param {React.ChangeEvent<HTMLSelectElement>} event - 언어 선택 드롭다운 변경 이벤트 객체.
   */
  const changeLanguage = (event: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <Router>
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}>
        <select onChange={changeLanguage} value={i18n.language}>
          <option value="en">English</option>
          <option value="ko">한국어</option>
        </select>
      </div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/viewer" element={<ViewerPage />} />
        {/* TODO: 404 페이지 또는 다른 라우트 추가 */}
      </Routes>
    </Router>
  );
}

export default App;
