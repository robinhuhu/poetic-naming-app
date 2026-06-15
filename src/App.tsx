import { useAppStore } from './store';
import { calculateWuGe } from './engine/wuge';
import { evaluateSiblingMatch } from './engine/sibling';
import type { CandidateName } from './engine/generator';

// 子组件导入
import { LoadingScreen } from './components/LoadingScreen';
import { ThemeSwitch } from './components/ThemeSwitch';
import { ControlPanel } from './components/ControlPanel';
import { SiblingPairEval } from './components/SiblingPairEval';
import { FavoritePanel } from './components/FavoritePanel';
import { HistoryPanel } from './components/HistoryPanel';
import { NameFlowList } from './components/NameFlowList';
import { DetailModal } from './components/DetailModal';
import { ToastList } from './components/ToastList';
import { NameComparePanel } from './components/NameComparePanel';

function App() {
  const dataReady = useAppStore((s) => s.dataReady);
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const setNameList = useAppStore((s) => s.setNameList);

  const lastName = useAppStore((s) => s.lastName);
  const siblingFirstName = useAppStore((s) => s.siblingFirstName);
  const openDetail = useAppStore((s) => s.openDetail);

  // 打开名字详情弹窗并预计算所需的五格及多胎匹配数据
  const handleViewDetails = (cand: CandidateName) => {
    const wuge = cand.wugeResult || calculateWuGe(lastName, cand.firstName);
    let siblingMatch = null;
    if (mode === 'sibling' && siblingFirstName) {
      const siblingFull = lastName + siblingFirstName;
      siblingMatch = evaluateSiblingMatch(siblingFull, cand.fullName);
    }
    openDetail(cand, wuge, siblingMatch);
  };

  // 渲染骨架数据预加载界面
  if (!dataReady) {
    return <LoadingScreen />;
  }

  return (
    <>
      <div className="fade-in-up">
        {/* 顶部国风页眉 */}
        <header className="app-header">
          <ThemeSwitch />
          <h1 className="app-title">国风诗意起名与多胎匹配系统</h1>
          <div className="app-subtitle">融合经典古籍 · 精英传承 · 音韵美学 · 传统数理</div>
        </header>

        {/* 标签导航模式切换 */}
        <div className="tabs-navigation">
          <button
            className={`tab-btn ${mode === 'single' ? 'active' : ''}`}
            onClick={() => {
              setMode('single');
              setNameList([]);
            }}
          >
            单胎智能起名
          </button>
          <button
            className={`tab-btn ${mode === 'sibling' ? 'active' : ''}`}
            onClick={() => {
              setMode('sibling');
              setNameList([]);
            }}
          >
            多胎配对与评估
          </button>
        </div>

        <div className="app-main-layout">
          {/* 左半侧配置与辅助大栏 */}
          <div className="app-left-section">
            <ControlPanel />
            <div className="grid-2 gap-20 mt-20">
              <SiblingPairEval />
              <FavoritePanel onViewDetails={handleViewDetails} />
              <HistoryPanel />
            </div>
          </div>

          {/* 右半侧姓名列表栏，置于最上方与配置面板对齐 */}
          <div className="app-right-section">
            <NameFlowList onViewDetails={handleViewDetails} />
          </div>
        </div>

        {/* 精致的国风页脚 */}
        <footer className="app-footer">
          <div className="app-disclaimer" style={{ marginBottom: '12px', fontSize: '12px', opacity: 0.6, borderBottom: '1px dashed rgba(120, 100, 80, 0.15)', paddingBottom: '10px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.6' }}>
            声明：本系统来源于中国民俗学的一些测算方法，并非科学研究成果，仅供休闲娱乐，请勿迷信，按此操作一切后果自负！
          </div>
          <div className="d-flex justify-center align-center gap-10">
            <span>🏮 国风诗意起名与多胎匹配系统</span>
            <span>·</span>
            <span>版本 v1.2.0</span>
          </div>
          <div className="mt-8 opacity-70">
            © 2026 妙名天成命名工坊. 融合经典文献与传统数理科学推演.
          </div>
        </footer>
      </div>

      {/* 全局详情模态框 */}
      <DetailModal />
      <NameComparePanel />
      <ToastList />
    </>
  );
}

export default App;
