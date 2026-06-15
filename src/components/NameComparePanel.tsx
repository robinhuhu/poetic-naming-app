import { useState } from 'react';
import { useComparedNames, useAppStore } from '../store';
import { calculateWuGe } from '../engine/wuge';
import { getCharDict } from '../services/dataLoader';
import { validateNamePhonetics } from '../engine/phonetics';

const WUXING_ICONS: Record<string, string> = {
  金: '🔩 金',
  木: '🌿 木',
  水: '💧 水',
  火: '🔥 火',
  土: '🏔️ 土',
};

export function NameComparePanel() {
  const comparedNames = useComparedNames();
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const clearCompared = useAppStore((s) => s.clearCompared);
  const lastName = useAppStore((s) => s.lastName);

  const [isOpenModal, setIsOpenModal] = useState(false);

  if (comparedNames.length === 0) return null;

  const charDict = getCharDict();

  // 根据音律规则获取简短评语
  const getPhoneticRating = (firstName: string) => {
    if (firstName.length !== 2) {
      return '单字名 · 简炼爽朗';
    }
    const val = validateNamePhonetics(firstName[0], firstName[1]);
    return val.isValid ? `优秀 (${val.score}分)` : `温和 (${val.score}分)`;
  };

  return (
    <>
      {/* 底部悬浮对比抽屉栏 */}
      <div className="compare-drawer fade-in-up" role="complementary" aria-label="名字横向对比栏">
        <div className="compare-drawer-container">
          <div className="compare-drawer-left">
            <span className="compare-drawer-title font-serif">⚖️ 雅名备选对比</span>
            <span className="compare-drawer-count fs-12">已选择 {comparedNames.length}/3 个名字</span>
            <div className="compare-drawer-pills">
              {comparedNames.map((cand) => (
                <div key={cand.fullName} className="compare-pill font-serif">
                  <span>{cand.fullName}</span>
                  <button
                    type="button"
                    className="compare-pill-remove"
                    onClick={() => toggleCompare(cand)}
                    aria-label={`移除对比 ${cand.fullName}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="compare-drawer-right">
            <button
              type="button"
              className="text-btn fs-12 font-serif mr-10"
              style={{ color: 'var(--text-muted)' }}
              onClick={clearCompared}
            >
              清空
            </button>
            <button
              type="button"
              className="classic-btn compare-action-btn"
              disabled={comparedNames.length < 2}
              onClick={() => setIsOpenModal(true)}
              title={comparedNames.length < 2 ? '请至少选择 2 个名字进行对比' : '开启横向并排评测'}
            >
              横向对比评测
            </button>
          </div>
        </div>
      </div>

      {/* 对比详情全屏弹窗 */}
      {isOpenModal && (
        <div className="modal-overlay" onClick={() => setIsOpenModal(false)}>
          <div
            className="modal-content compare-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="compare-modal-title"
          >
            <button
              className="modal-close-btn"
              onClick={() => setIsOpenModal(false)}
              aria-label="关闭对比弹窗"
            >
              ×
            </button>
            <h3 id="compare-modal-title" className="font-serif border-b pb-10 mb-20 fs-18 text-center">
              雅名横向对决评估
            </h3>

            {/* 对比多列并排网格 */}
            <div className="compare-grid" style={{ gridTemplateColumns: `repeat(${comparedNames.length}, 1fr)` }}>
              {comparedNames.map((cand) => {
                const wuge = cand.wugeResult || calculateWuGe(lastName, cand.firstName);
                return (
                  <div key={cand.fullName} className="compare-column bg-gold-light-03 border-light-all radius-12 p-20 text-left">
                    {/* 名字大头 */}
                    <div className="text-center mb-15">
                      <div className="font-serif font-bold fs-28 color-cinnabar mb-5">{cand.fullName}</div>
                      <div className="fs-12 color-muted">
                        五格数理: <span className="font-bold color-gold">{cand.wugeScore}分</span>
                        {cand.matchScore !== undefined && ` · 多胎契合: ${cand.matchScore}分`}
                      </div>
                    </div>

                    {/* 基本信息 */}
                    <div className="compare-row-item">
                      <div className="compare-row-label">汉字字形五行</div>
                      <div className="compare-row-val">
                        {cand.firstName.split('').map((char, idx) => {
                          const info = charDict[char];
                          return (
                            <span key={idx} className="mr-10 fs-13 font-serif">
                              【{char}】{info ? WUXING_ICONS[info.wuxing] || info.wuxing : cand.wuxing[idx]} ({info?.stroke || cand.strokes[idx]}划)
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* 笔画及三才 */}
                    <div className="compare-row-item">
                      <div className="compare-row-label">三才五格吉凶</div>
                      <div className="compare-row-val">
                        <div className="fs-13 font-bold mb-4">
                          三才：{wuge.sancai.config} ({wuge.sancai.lucky})
                        </div>
                        <div className="fs-11 color-muted" style={{ lineHeight: 1.5 }}>
                          天格({wuge.tianGe.lucky}) · 人格({wuge.renGe.lucky}) · 地格({wuge.diGe.lucky}) · 总格({wuge.zongGe.lucky})
                        </div>
                      </div>
                    </div>

                    {/* 音韵点评 */}
                    <div className="compare-row-item">
                      <div className="compare-row-label">音韵特质</div>
                      <div className="compare-row-val fs-13" style={{ lineHeight: 1.4 }}>
                        声调评级：<span className="font-bold text-underline">{getPhoneticRating(cand.firstName)}</span>
                      </div>
                    </div>

                    {/* 出处释义 */}
                    <div className="compare-row-item" style={{ borderBottom: 'none' }}>
                      <div className="compare-row-label">经典文脉出处</div>
                      <div className="compare-row-val fs-12 color-muted" style={{ lineHeight: 1.6, maxHeight: '200px', overflowY: 'auto' }}>
                        {cand.sourceDescription}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="text-center mt-20">
              <button
                type="button"
                className="classic-btn px-40 py-10"
                onClick={() => setIsOpenModal(false)}
              >
                结束对比
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
