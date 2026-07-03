import { useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { getCharDict } from '../services/dataLoader';
import { validateNamePhonetics } from '../engine/phonetics';

const WUXING_ICONS: Record<string, string> = {
  金: '🔩 金',
  木: '🌿 木',
  水: '💧 水',
  火: '🔥 火',
  土: '🏔️ 土',
};

export function DetailModal() {
  const mode = useAppStore((s) => s.mode);
  const gender = useAppStore((s) => s.gender);
  const activeCandidate = useAppStore((s) => s.activeCandidate);
  const activeWuGe = useAppStore((s) => s.activeWuGe);
  const closeDetail = useAppStore((s) => s.closeDetail);
  const activeSiblingMatch = useAppStore((s) => s.activeSiblingMatch);
  const addToast = useAppStore((s) => s.addToast);

  const previousActiveElement = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // 监听全局键盘事件以支持 Esc 关闭及焦点捕获循环
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDetail();
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button:not([disabled]), [tabindex="0"]'
        );
        if (focusable.length === 0) return;
        const first = focusable[0] as HTMLElement;
        const last = focusable[focusable.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeDetail]);

  // 打开弹窗时锁定背景滚动并移交焦点
  useEffect(() => {
    if (activeCandidate) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        const closeBtn = modalRef.current?.querySelector('.modal-close-btn') as HTMLElement;
        if (closeBtn) {
          closeBtn.focus();
        } else {
          modalRef.current?.focus();
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [activeCandidate]);

  if (!activeCandidate || !activeWuGe) return null;

  const charDict = getCharDict();

  // 根据音律规则动态生成发音平仄及文学评语
  const getPhoneticEvaluation = () => {
    const cand = activeCandidate;
    if (cand.firstName.length !== 2) {
      return '单字名音律明晰，字义独立，朗朗上口。在日常书写中极具干练简洁之风范。';
    }
    const val = validateNamePhonetics(cand.firstName[0], cand.firstName[1]);
    if (val.isValid) {
      return `名字音律表现优秀 (评分 ${val.score} 分)。名字双字发音平仄起伏有度，避开了发音双声与同韵拗口，呼之清亮，具有诗意的诵读起伏变化，极其利于日常称谓与记忆。`;
    } else {
      return `名字音律表现温和 (评分 ${val.score} 分)。声调平仄相对平缓，韵母类型较为接近，听觉音色绵柔亲切。`;
    }
  };



  // 复制雅名报告为 Markdown 排版文本
  const handleCopyText = () => {
    const wuge = activeWuGe;
    const cand = activeCandidate;
    const genderLabel = gender === 'boy' ? '乾造 (男宝宝)' : gender === 'girl' ? '坤造 (女宝宝)' : '乾坤适宜 (中性美)';
    const luckyLabel = wuge.totalScore >= 95 ? '大吉' : wuge.totalScore >= 80 ? '吉' : '半吉';

    const detailText = `【国风诗意起名 — 雅名评估报告】
========================================
姓名：${cand.fullName}  (五行属性：${cand.wuxing.split('').join(' · ')})
适用性别：${genderLabel}
康熙笔画配比：${cand.strokes.join(' + ')}
----------------------------------------
一、三才五格数理分析：
- 综合评分：${cand.wugeScore} 分 (${luckyLabel})
- 三才配置：${wuge.sancai.config} (${wuge.sancai.lucky})
- 三才评语：${wuge.sancai.description}
- 天格数理：${wuge.tianGe.stroke} 划 (${wuge.tianGe.lucky}) · ${wuge.tianGe.description}
- 人格数理：${wuge.renGe.stroke} 划 (${wuge.renGe.lucky}) · ${wuge.renGe.description}
- 地格数理：${wuge.diGe.stroke} 划 (${wuge.diGe.lucky}) · ${wuge.diGe.description}
- 总格数理：${wuge.zongGe.stroke} 划 (${wuge.zongGe.lucky}) · ${wuge.zongGe.description}
- 外格数理：${wuge.waiGe.stroke} 划 (${wuge.waiGe.lucky}) · ${wuge.waiGe.description}
----------------------------------------
二、音韵及文脉来源：
- 音律点评：${getPhoneticEvaluation()}
- 出处释义：${cand.sourceDescription}
${mode === 'sibling' && activeSiblingMatch ? `----------------------------------------
三、多胎契合评估：
- 契合总分：${activeSiblingMatch.totalScore} 分 (${activeSiblingMatch.level})
- 评定细节：${activeSiblingMatch.details.map(d => `\n  * ${d.dimension}: ${d.evaluation}`).join('')}` : ''}
========================================
`;

    navigator.clipboard.writeText(detailText)
      .then(() => addToast('雅名评测报告已成功复制到剪贴板，可随时发给亲友分享！', 'success'))
      .catch((err) => {
        console.error('复制失败:', err);
        addToast('浏览器复制失败，您可以直接手动选择报告内容复制。', 'error');
      });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={closeDetail} ref={modalRef} tabIndex={-1}>
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={closeDetail} aria-label="关闭弹窗">×</button>
        
        {/* 全新双栏展卷布局 */}
        <div className="modal-grid">
          
          {/* 左半栏：大名字、逐字音律与出处释义 */}
          <div className="modal-col-left">
            <h2 id="modal-title" className="detail-title" style={{ marginBottom: '8px' }}>{activeCandidate.fullName}</h2>
            
            {/* 逐字偏旁/五行详细剖析 */}
            <div className="d-flex justify-center gap-10 mb-8 flex-wrap">
              {activeCandidate.firstName.split('').map((char, idx) => {
                const info = charDict[char];
                if (!info) return null;
                return (
                  <span key={idx} className="meta-tag fs-12">
                    【{char}】{WUXING_ICONS[info.wuxing] || info.wuxing} ({info.stroke}划)
                  </span>
                );
              })}
            </div>

            {/* 名字文脉与出处 */}
            <div className="bg-gold-light-04 border-light-all p-12 radius-12 text-left">
              <div className="color-gold font-bold fs-13 mb-5 font-serif">名字文脉出处：</div>
              <div className="fs-13 color-muted" style={{ lineHeight: 1.5 }}>
                {activeCandidate.sourceDescription}
              </div>
            </div>

            {/* 音律文学特质点评 */}
            <div className="bg-gold-light-04 border-light-all p-12 radius-12 text-left">
              <div className="color-cinnabar font-bold fs-13 mb-5 font-serif">姓名音律文学评价：</div>
              <div className="fs-13 color-muted" style={{ lineHeight: 1.5 }}>
                {getPhoneticEvaluation()}
              </div>
            </div>

            {/* Sibling match report (在左侧顺延展示，维持右侧等高) */}
            {mode === 'sibling' && activeSiblingMatch && (
              <div className="border-dashed-light pt-15 mt-10">
                <h4 className="font-serif border-b pb-5 text-left color-cinnabar d-flex justify-between fs-14">
                  <span>多胎配对评估报告</span>
                  <span>{activeSiblingMatch.totalScore} 分 ( {activeSiblingMatch.level} )</span>
                </h4>
                
                {activeSiblingMatch.bestPoemSource && (
                  <div className="bg-cinnabar-light-05 border-cinnabar-light-15 p-10 radius-10 mb-10 text-left">
                    <div className="color-cinnabar font-bold fs-12 mb-4">同源古籍名句：</div>
                    <div className="font-italic fs-13">“{activeSiblingMatch.bestPoemSource.sentence}”</div>
                    <div className="text-right fs-11 color-muted mt-2">—— {activeSiblingMatch.bestPoemSource.poem}</div>
                  </div>
                )}

                <div className="sibling-detail-box text-left">
                  {activeSiblingMatch.details.map((d, index) => (
                    <div className="sibling-detail-item" key={index}>
                      <div className="d-flex justify-between font-bold fs-13">
                        <span>{d.dimension} ({d.score}分)</span>
                      </div>
                      <div className="sibling-detail-desc fs-12">{d.evaluation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 右半栏：数理五格表格、三才配置与操作按钮 */}
          <div className="modal-col-right">
            
            {/* 五格表格 */}
            <h4 className="font-serif border-b pb-5 text-left fs-14" style={{ marginTop: 0, marginBottom: '8px' }}>
              三才五格数理分析
            </h4>
            <table className="wuge-table" style={{ marginBottom: '8px' }}>
              <thead>
                <tr>
                  <th>格位</th>
                  <th>五格笔画</th>
                  <th>五格五行</th>
                  <th>吉凶灵动</th>
                  <th style={{ width: '45%' }}>数理涵义</th>
                </tr>
              </thead>
              <tbody>
                {[activeWuGe.tianGe, activeWuGe.renGe, activeWuGe.diGe, activeWuGe.zongGe, activeWuGe.waiGe].map((ge, idx) => (
                  <tr key={idx}>
                    <td className="font-bold">{ge.name}</td>
                    <td>{ge.stroke} 划</td>
                    <td>{ge.wuxing}</td>
                    <td>
                      <span className={`wuge-lucky-tag ${ge.lucky}`} style={{ padding: '2px 8px' }}>{ge.lucky}</span>
                    </td>
                    <td className="fs-12 color-muted">{ge.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Sancai config */}
            <div className="bg-gold-light-05 border-light-all p-12 radius-12 text-left" style={{ marginBottom: '8px' }}>
              <div className="d-flex justify-between align-center mb-5">
                <span className="font-bold font-serif fs-14">
                  三才配比：{activeWuGe.sancai.config}
                </span>
                <span className={`wuge-lucky-tag ${activeWuGe.sancai.lucky}`} style={{ padding: '2px 8px' }}>{activeWuGe.sancai.lucky}</span>
              </div>
              <div className="fs-13 color-muted" style={{ lineHeight: 1.5 }}>
                {activeWuGe.sancai.description}
              </div>
            </div>

            {/* 操作控制栏 */}
            <div className="modal-action-bar" style={{ marginTop: '5px', gap: '10px' }}>
              <button className="classic-btn fs-13" onClick={handleCopyText}>
                复制报告
              </button>
              <button 
                className="classic-btn classic-btn-outline fs-13" 
                onClick={handlePrint}
              >
                打印报告
              </button>
              <button className="classic-btn fs-13" onClick={closeDetail}>
                确认关闭
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
