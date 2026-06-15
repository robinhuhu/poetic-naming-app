import { useState } from 'react';
import { useAppStore, type HistoryEntry } from '../store';

export function HistoryPanel() {
  const history = useAppStore((s) => s.history);
  const clearHistory = useAppStore((s) => s.clearHistory);
  const [showConfirm, setShowConfirm] = useState(false);

  // 表单状态的回填 setters
  const setMode = useAppStore((s) => s.setMode);
  const setLastName = useAppStore((s) => s.setLastName);
  const setGender = useAppStore((s) => s.setGender);
  const setBirthDate = useAppStore((s) => s.setBirthDate);
  const setBirthHour = useAppStore((s) => s.setBirthHour);
  const setSelectedWuXing = useAppStore((s) => s.setSelectedWuXing);
  const setMustIncludeChar = useAppStore((s) => s.setMustIncludeChar);
  const setNamingSource = useAppStore((s) => s.setNamingSource);
  const setSiblingFirstName = useAppStore((s) => s.setSiblingFirstName);

  if (history.length === 0) return null;

  const handleApply = (params: HistoryEntry['params']) => {
    if (params.mode) setMode(params.mode);
    if (params.lastName) setLastName(params.lastName);
    if (params.gender) setGender(params.gender);
    if (params.birthDate) setBirthDate(params.birthDate);
    if (params.birthHour !== undefined) setBirthHour(params.birthHour);
    if (params.selectedWuXing) setSelectedWuXing(params.selectedWuXing);
    if (params.mustIncludeChar !== undefined) setMustIncludeChar(params.mustIncludeChar);
    if (params.namingSource) setNamingSource(params.namingSource);
    if (params.siblingFirstName) setSiblingFirstName(params.siblingFirstName);
  };

  return (
    <div className="premium-panel mt-20">
      <div className="d-flex justify-between align-center border-b pb-10 mb-15">
        <h3 className="font-serif fs-16 mb-0 text-left">
          起名历程记录
        </h3>
        {showConfirm ? (
          <div className="d-flex align-center gap-10">
            <span className="fs-12 color-cinnabar font-bold">确定清除？</span>
            <button
              type="button"
              className="fs-12 cursor-pointer text-underline font-bold"
              style={{ background: 'transparent', border: 'none', color: 'var(--color-cinnabar, #b2584b)', padding: 0 }}
              onClick={() => {
                clearHistory();
                setShowConfirm(false);
              }}
            >
              确定
            </button>
            <span className="color-muted fs-12">/</span>
            <button
              type="button"
              className="fs-12 cursor-pointer color-muted text-underline"
              style={{ background: 'transparent', border: 'none', padding: 0 }}
              onClick={() => setShowConfirm(false)}
            >
              取消
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="fs-12 color-cinnabar cursor-pointer"
            style={{ background: 'transparent', border: 'none' }}
            onClick={() => setShowConfirm(true)}
          >
            清除
          </button>
        )}
      </div>
      <div className="history-list-scroll">
        {history.map((h) => {
          const dateStr = new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const genderLabel = h.params.gender === 'boy' ? '男' : h.params.gender === 'girl' ? '女' : '任意';
          
          return (
            <div
              key={h.id}
              className="history-item mb-8 p-15 radius-10 border-light-all cursor-pointer text-left"
              onClick={() => handleApply(h.params)}
              title="点击可一键回填此设置"
            >
              <div className="d-flex justify-between align-center fs-12 color-muted mb-4">
                <span>{dateStr}</span>
                <span>{genderLabel}宝宝</span>
              </div>
              <div className="d-flex justify-between align-center">
                <span className="font-serif font-bold fs-14">
                  姓氏【{h.params.lastName}】({h.resultCount}款)
                </span>
                <span className="fs-11 color-gold font-bold">回填设置 →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
