import { useState } from 'react';
import { useAppStore } from '../store';

export function BaziResult() {
  const baziResult = useAppStore((s) => s.baziResult);
  const [expanded, setExpanded] = useState(false);

  if (!baziResult) return null;

  // 根据命盘日元和强弱动态生成符合中式美学的精美批语
  const getBaziAdvice = () => {
    const { riyuan, status, preferredWuXing } = baziResult;
    const prefStr = preferredWuXing.join('、');
    
    if (status === '身旺') {
      return `此命盘日元【${riyuan.char}${riyuan.wuxing}】身旺，本命五行气势强盛，行运宜疏宜导。起名时，推荐喜用【${prefStr}】五行，以克泄日元之余威，使命局阴阳交泰、五气流通，达到平和通达之佳境。`;
    } else if (status === '身弱') {
      return `此命盘日元【${riyuan.char}${riyuan.wuxing}】身弱，本命元气稍显单薄。行运宜帮宜扶，起名时推荐喜用【${prefStr}】五行，以生助日元，犹如春雨润木、炉火添柴，以固本培元，福泽绵长。`;
    } else {
      return `此命盘日元【${riyuan.char}${riyuan.wuxing}】强弱适中，中和纯粹，五行气势分布相对均衡。起名时着重补益所缺或偏弱的【${prefStr}】五行，以使运势稳健前行，平步青云。`;
    }
  };

  const totalScores = Object.values(baziResult.scores).reduce((sum, n) => sum + n, 0) || 8;

  return (
    <div className="bazi-result-box d-flex flex-column mb-25 p-20">
      {/* 基础干支排盘 - 书法徽章挂轴竖排样式 */}
      <div className="d-flex justify-between w-full">
        {baziResult.eightChar.map((pillar, idx) => {
          const tianGan = pillar.charAt(0);
          const diZhi = pillar.charAt(1);
          const tianGanWx = baziResult.wuxing[idx].charAt(0);
          const diZhiWx = baziResult.wuxing[idx].charAt(1);
          const pillarLabel = ['年柱', '月柱', '日柱', '时柱'][idx];
          const nayinLabel = baziResult.nayin[idx].slice(0, 2);

          return (
            <div className="bazi-column" key={idx}>
              <div className="bazi-pillar d-flex flex-column align-center">
                <span className={`bazi-char ${tianGanWx}`} title={`天干: ${tianGan} (${tianGanWx})`}>
                  {tianGan}
                </span>
                <span className={`bazi-char ${diZhiWx}`} title={`地支: ${diZhi} (${diZhiWx})`}>
                  {diZhi}
                </span>
              </div>
              <div className="bazi-label mt-5">{pillarLabel}</div>
              <div className="fs-11 color-muted" style={{ transform: 'scale(0.9)', whiteSpace: 'nowrap' }}>
                {nayinLabel}
              </div>
            </div>
          );
        })}
      </div>

      {/* 展开深度面板切换按钮 */}
      <div className="text-center w-full mt-10">
        <button
          type="button"
          className="bazi-expand-btn"
          onClick={() => setExpanded(!expanded)}
        >
          <span>{expanded ? '收起八字深度分析' : '展开八字深度分析'}</span>
          <span className={`bazi-arrow-icon ${expanded ? 'expanded' : ''}`}>▼</span>
        </button>
      </div>

      {/* 展开的深度排盘统计 */}
      {expanded && (
        <div className="bazi-detail-panel w-full">
          <div className="font-serif fs-14 mb-12 color-gold font-bold">
            五行能量强弱统计 (干支分布):
          </div>
          
          {Object.entries(baziResult.scores).map(([wx, count]) => {
            const percent = Math.round((count / totalScores) * 100);
            return (
              <div className="wuxing-stat-row" key={wx}>
                <span className={`wuxing-stat-label color-${wx === '火' ? 'cinnabar' : wx === '土' ? 'gold' : 'muted'}`}>
                  {wx}
                </span>
                <div className="wuxing-stat-bar-container">
                  <div
                    className={`wuxing-stat-bar ${wx}`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <span className="wuxing-stat-val">{count} 个</span>
              </div>
            );
          })}

          <div className="bazi-advice-box text-left">
            <div className="font-serif color-cinnabar font-bold mb-5 fs-14">
              日主命盘总评：
            </div>
            {getBaziAdvice()}
          </div>
        </div>
      )}
    </div>
  );
}
