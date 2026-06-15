import { useMemo, useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { NameCard } from './NameCard';
import type { CandidateName } from '../engine/generator';
import { getCharDict } from '../services/dataLoader';

interface NameFlowListProps {
  onViewDetails: (cand: CandidateName) => void;
}

export function NameFlowList({ onViewDetails }: NameFlowListProps) {
  const mode = useAppStore((s) => s.mode);
  const nameList = useAppStore((s) => s.nameList);
  const loading = useAppStore((s) => s.loading);
  
  // 筛选排序状态与 setter
  const filterWuXing = useAppStore((s) => s.filterWuXing);
  const setFilterWuXing = useAppStore((s) => s.setFilterWuXing);
  const filterSource = useAppStore((s) => s.filterSource);
  const setFilterSource = useAppStore((s) => s.setFilterSource);
  const sortBy = useAppStore((s) => s.sortBy);
  const setSortBy = useAppStore((s) => s.setSortBy);

  // 懒加载状态：初始只显示 30 个名字
  const [visibleCount, setVisibleCount] = useState(30);

  // 快速检索状态
  const [searchQuery, setSearchQuery] = useState('');

  // 是否显示回到顶部
  const [showBackToTop, setShowBackToTop] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

  // 当名字列表或筛选/排序/检索规则改变时，重置显示数量
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(30);
  }, [nameList, filterWuXing, filterSource, sortBy, searchQuery]);
  
  // 监听滚动触底增量加载及回顶状态
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 50) {
      setVisibleCount((prev) => Math.min(prev + 30, filteredList.length));
    }
    setShowBackToTop(target.scrollTop > 300);
  };

  const handleBackToTop = () => {
    if (gridRef.current) {
      gridRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 在组件内使用 useMemo 计算过滤排序后的列表，确保引用稳定性
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const filteredList = useMemo(() => {
    let result = [...nameList];

    // 快速检索过滤
    if (searchQuery) {
      const q = searchQuery.trim().toLowerCase();
      try {
        const dict = getCharDict();
        result = result.filter((name) => {
          if (name.fullName.includes(q) || name.firstName.includes(q)) return true;
          
          // 获取无声调拼音
          const pyList = name.firstName.split('').map((char) => {
            const rawPy = dict[char]?.pinyin_without_tone || dict[char]?.pinyin || '';
            return rawPy.replace(/[0-9]/g, '').toLowerCase();
          });
          const pyJoined = pyList.join('');
          const pySpaced = pyList.join(' ');
          const pyInitials = pyList.map((p) => p[0] || '').join('');
          
          return pyJoined.includes(q) || pySpaced.includes(q) || pyInitials.includes(q);
        });
      } catch {
        result = result.filter((name) => name.fullName.includes(q));
      }
    }

    if (filterWuXing.length > 0) {
      result = result.filter((name) =>
        filterWuXing.some((wx) => name.wuxing.includes(wx))
      );
    }

    if (filterSource !== 'all') {
      result = result.filter((name) => {
        if (filterSource === 'classics') {
          return name.sourceDescription.includes('古籍');
        }
        return (
          name.sourceDescription.includes('名人录') ||
          name.sourceDescription.includes('学者名录') ||
          name.sourceDescription.includes('精英名录') ||
          name.sourceDescription.includes('进士名录')
        );
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'wugeScore':
          return b.wugeScore - a.wugeScore;
        case 'matchScore':
          return (b.matchScore ?? 0) - (a.matchScore ?? 0);
        case 'strokes':
          return (
            a.strokes.reduce((sum, s) => sum + s, 0) -
            b.strokes.reduce((sum, s) => sum + s, 0)
          );
        default:
          return 0;
      }
    });

    return result;
  }, [nameList, filterWuXing, filterSource, sortBy, searchQuery]);

  // 切片渲染
  const visibleList = useMemo(() => {
    return filteredList.slice(0, visibleCount);
  }, [filteredList, visibleCount]);

  const handleToggleWuXing = (wx: string) => {
    if (filterWuXing.includes(wx)) {
      setFilterWuXing(filterWuXing.filter((w) => w !== wx));
    } else {
      setFilterWuXing([...filterWuXing, wx]);
    }
  };

  return (
    <div className="premium-panel min-h-500 d-flex flex-column result-panel">
      <h3 className="font-serif border-b pb-10 mb-20 fs-18 text-left">
        {mode === 'sibling' ? '多胎推荐候选名单' : '智能甄选名字列表'}
      </h3>

      {loading ? (
        <div className="name-flow-grid">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="name-card skeleton-card">
              <div className="name-card-header">
                <div className="skeleton-title"></div>
                <div className="skeleton-badge"></div>
              </div>
              <div className="skeleton-pinyin"></div>
              <div className="skeleton-meta">
                <div className="skeleton-tag"></div>
                <div className="skeleton-tag"></div>
              </div>
              <div className="skeleton-source"></div>
            </div>
          ))}
        </div>
      ) : nameList.length === 0 ? (
        <div className="empty-state-container color-muted">
          <img 
            src="/ink_landscape.png" 
            alt="水墨山水" 
            className="empty-state-img" 
          />
          <div className="fs-15 font-serif" style={{ letterSpacing: '1px', color: 'var(--text-main)' }}>
            乾坤推演 · 文脉寻迹
          </div>
          <div className="fs-13 color-muted mt-5">
            请在左侧设定选项并点击“智能推算起名”开始推演
          </div>
        </div>
      ) : (
        <>
          {/* 筛选排序工具栏 */}
          <div className="toolbar-panel">
            {/* 五行筛选 */}
            <div className="toolbar-section">
              <span className="toolbar-label">五行筛选:</span>
              <div className="wuxing-pill-group">
                {['金', '木', '水', '火', '土'].map((wx) => {
                  const isActive = filterWuXing.includes(wx);
                  return (
                    <button
                      key={wx}
                      type="button"
                      className={`wuxing-pill ${wx} ${isActive ? 'active' : ''}`}
                      onClick={() => handleToggleWuXing(wx)}
                    >
                      {wx}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 来源筛选 */}
            <div className="toolbar-section">
              <span className="toolbar-label">文脉来源:</span>
              <select
                className="form-select select-sm"
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value as 'all' | 'classics' | 'elite')}
              >
                <option value="all">全部来源</option>
                <option value="classics">纯经典古籍</option>
                <option value="elite">纯精英人名</option>
              </select>
            </div>

            {/* 排序方式 */}
            <div className="toolbar-section">
              <span className="toolbar-label">排序方式:</span>
              <select
                className="form-select select-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'wugeScore' | 'matchScore' | 'strokes')}
              >
                <option value="wugeScore">五格数理优先</option>
                {mode === 'sibling' && (
                  <option value="matchScore">多胎契合度优先</option>
                )}
                <option value="strokes">笔画由少到多</option>
              </select>
            </div>

            {/* 快速检索 */}
            <div className="toolbar-section search-section">
              <span className="toolbar-label">快速检索:</span>
              <input
                type="text"
                className="form-input search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="汉字/拼音/首字母..."
                aria-label="快速检索已生成的名字"
              />
            </div>
          </div>

          {/* 渲染列表 */}
          {filteredList.length === 0 ? (
            <div className="m-auto text-center color-muted">
              <div className="fs-15 mt-20">无匹配当前筛选条件的名字，请调整筛选选项</div>
            </div>
          ) : (
            <>
              <div 
                className="name-flow-grid" 
                onScroll={handleScroll} 
                ref={gridRef}
                style={{ 
                  paddingBottom: '20px' 
                }}
              >
                {visibleList.map((cand, idx) => (
                  <NameCard
                    key={cand.fullName + idx}
                    cand={cand}
                    onViewDetails={onViewDetails}
                  />
                ))}
                {visibleCount < filteredList.length && (
                  <div className="lazy-load-tip text-center py-10 color-muted fs-12 font-serif" style={{ width: '100%', gridColumn: '1 / -1', opacity: 0.7 }}>
                    📥 向上滑动，继续推演加载更多雅名
                  </div>
                )}
              </div>
            </>
          )}

          {showBackToTop && (
            <button
              type="button"
              className="back-to-top-btn fade-in"
              onClick={handleBackToTop}
              title="回到顶部"
              aria-label="回到名字列表顶部"
            >
              ▲
            </button>
          )}
        </>
      )}
    </div>
  );
}
