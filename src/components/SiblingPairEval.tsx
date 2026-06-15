import { useAppStore } from '../store';
import { evaluateSiblingMatch } from '../engine/sibling';

export function SiblingPairEval() {
  const mode = useAppStore((s) => s.mode);
  const evalChild1 = useAppStore((s) => s.evalChild1);
  const setEvalChild1 = useAppStore((s) => s.setEvalChild1);
  const evalChild2 = useAppStore((s) => s.evalChild2);
  const setEvalChild2 = useAppStore((s) => s.setEvalChild2);
  const evalResult = useAppStore((s) => s.evalResult);
  const setEvalResult = useAppStore((s) => s.setEvalResult);

  if (mode !== 'sibling') return null;

  const handleEvaluatePair = () => {
    try {
      const res = evaluateSiblingMatch(evalChild1, evalChild2);
      setEvalResult(res);
    } catch (e) {
      console.error('匹配评估出错:', e);
    }
  };

  return (
    <div className="premium-panel sibling-eval-panel">
      <h3 className="font-serif border-b pb-10 mb-20 fs-18 text-left">
        多胎名字两两契合评估
      </h3>
      <div className="grid-2 gap-15 mb-20">
        <div className="form-group mb-0">
          <label className="form-label">一胎姓名</label>
          <input
            type="text"
            className="form-input"
            value={evalChild1}
            onChange={(e) => setEvalChild1(e.target.value.trim())}
            placeholder="如：陈朝雨"
          />
        </div>
        <div className="form-group mb-0">
          <label className="form-label">二胎姓名</label>
          <input
            type="text"
            className="form-input"
            value={evalChild2}
            onChange={(e) => setEvalChild2(e.target.value.trim())}
            placeholder="如：陈轻尘"
          />
        </div>
      </div>

      <button
        type="button"
        className="classic-btn w-full border-cinnabar-2 color-cinnabar bg-gold-light-03 box-shadow-none"
        onClick={handleEvaluatePair}
      >
        开始匹配度测评
      </button>

      {evalResult && (
        <div className="mt-25 text-left">
          <div className="d-flex justify-between align-center mb-15">
            <span className="fs-18 font-bold">匹配综合评定：</span>
            <span className="name-matching-tag fs-16">
              {evalResult.totalScore} 分 · {evalResult.level}
            </span>
          </div>
          {evalResult.bestPoemSource && (
            <div className="bg-gold-light-08 border-light-all p-15 radius-10 mb-20">
              <div className="color-gold font-bold fs-14 mb-5">古籍同源诗词：</div>
              <div className="font-italic fs-15">“{evalResult.bestPoemSource.sentence}”</div>
              <div className="text-right fs-12 color-muted mt-5">—— {evalResult.bestPoemSource.poem}</div>
            </div>
          )}
          <div className="sibling-detail-box">
            {evalResult.details.map((d, index) => (
              <div className="sibling-detail-item" key={index}>
                <div className="d-flex justify-between font-bold fs-15">
                  <span>{d.dimension} ({d.score}分)</span>
                </div>
                <div className="sibling-detail-desc">{d.evaluation}</div>
                {d.details && (
                  <ul className="sibling-sub-details">
                    {d.details.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
