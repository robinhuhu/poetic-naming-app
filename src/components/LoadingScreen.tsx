import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { preloadAll } from '../services/dataLoader';

const CLASSIC_POEMS = [
  { sentence: "天行健，君子以自强不息。地势坤，君子以厚德载物。", source: "《周易》" },
  { sentence: "青青子衿，悠悠我心。", source: "《诗经·子衿》" },
  { sentence: "博学之，审问之，慎思之，明辨之，笃行之。", source: "《礼记》" },
  { sentence: "我有嘉宾，鼓瑟吹笙。", source: "《诗经·鹿鸣》" },
  { sentence: "行到水穷处，坐看云起时。", source: "《终南别业》" },
  { sentence: "关关雎鸠，在河之洲。窈窕淑女，君子好逑。", source: "《诗经·关雎》" },
  { sentence: "朝雨浥轻尘，客舍青青柳色新。", source: "《送元二使安西》" }
];

export function LoadingScreen() {
  const setDataReady = useAppStore((s) => s.setDataReady);
  const [error, setError] = useState<string | null>(null);
  const [poemIndex, setPoemIndex] = useState(0);

  // 经典古语轮播
  useEffect(() => {
    const timer = setInterval(() => {
      setPoemIndex((prev) => (prev + 1) % CLASSIC_POEMS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        await preloadAll();
        // 增加平滑过渡延迟以提升用户体验
        setTimeout(() => {
          setDataReady(true);
        }, 1200);
      } catch (err) {
        console.error(err);
        const errMsg = err instanceof Error ? err.message : '预加载命名数据库失败，请检查网络并刷新重试。';
        setError(errMsg);
      }
    }
    load();
  }, [setDataReady]);

  const currentPoem = CLASSIC_POEMS[poemIndex];

  return (
    <div className="loading-screen">
      <div className="loading-container">
        {/* 具有视差旋转刻度的八卦罗盘 */}
        <div className="loading-compass">
          <div className="loading-compass-outer-symbols"></div>
          <div className="loading-compass-inner"></div>
        </div>
        
        <div className="loading-title">国风诗意起名</div>
        
        <div className="loading-desc">
          {error ? (
            <span className="color-cinnabar font-bold">{error}</span>
          ) : (
            <div className="loading-poem-box">
              <div style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '6px' }}>
                “{currentPoem.sentence}”
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
                —— {currentPoem.source}
              </div>
            </div>
          )}
        </div>
        
        {!error && (
          <div style={{ marginTop: '30px', fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '1px' }}>
            正在开启天机，预加载汉字字典与古籍文库
            <span className="loading-dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
