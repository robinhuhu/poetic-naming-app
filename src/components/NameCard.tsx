import { useAppStore } from '../store';
import type { CandidateName } from '../engine/generator';
import { calculateWuGe } from '../engine/wuge';
import { getCharDict } from '../services/dataLoader';

interface NameCardProps {
  cand: CandidateName;
  onViewDetails: (cand: CandidateName) => void;
}

export function NameCard({ cand, onViewDetails }: NameCardProps) {
  const lastName = useAppStore((s) => s.lastName);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const isFavorite = useAppStore((s) => s.isFavorite(cand.fullName));
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const isCompared = useAppStore((s) => s.isCompared(cand.fullName));

  const wuge = cand.wugeResult || calculateWuGe(lastName, cand.firstName);

  const handleFavClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止卡片点击事件
    toggleFavorite(cand);
  };

  // 动态从字库中生成汉字拼音
  const getPinyin = () => {
    try {
      const dict = getCharDict();
      return cand.firstName
        .split('')
        .map((char) => dict[char]?.pinyin || char)
        .join(' ');
    } catch {
      return cand.firstName;
    }
  };

  return (
    <div className="name-card fade-in-up" onClick={() => onViewDetails(cand)}>
      <div className="name-card-header">
        <div>
          <div className="name-display">{cand.fullName}</div>
          <div className="name-pinyin">{getPinyin()}</div>
        </div>
        <div className="d-flex align-center gap-10">
          {cand.matchScore !== undefined ? (
            <div className="name-matching-tag">{cand.matchScore} 契合分</div>
          ) : (
            <div className="name-score-tag">{cand.wugeScore} 数理分</div>
          )}
          
          <button 
            type="button" 
            className={`compare-card-btn ${isCompared ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleCompare(cand);
            }}
            title={isCompared ? "取消对比" : "加入横向对比"}
            aria-pressed={isCompared}
            aria-label={isCompared ? "取消对比" : "加入横向对比"}
          >
            ⚖️
          </button>

          <button 
            type="button" 
            className="fav-btn" 
            onClick={handleFavClick}
            title={isFavorite ? "取消收藏" : "加入收藏"}
          >
            <svg 
              className={`fav-star ${isFavorite ? 'active' : ''}`}
              viewBox="0 0 24 24"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="name-meta">
        <span className="meta-tag">五行：{cand.wuxing}</span>
        <span className="meta-tag">笔画：{cand.strokes.join('+')}</span>
        <span className="meta-tag" style={{ color: cand.sourceDescription.includes('古籍') ? 'var(--cinnabar)' : 'var(--classic-gold)' }}>
          {cand.sourceDescription.includes('古籍') ? '经典古籍' : '精英人名'}
        </span>
      </div>

      <div className="border-dashed-light pt-10 mt-5 mb-12 fs-13">
        <div className="d-flex justify-between align-center mb-4">
          <span className="font-bold">三才配置：{wuge.sancai.config}</span>
          <span className={`wuge-lucky-tag ${wuge.sancai.lucky} fs-11`}>{wuge.sancai.lucky}</span>
        </div>
        <div className="color-muted fs-11 d-flex gap-5 mt-5" style={{ letterSpacing: '0.5px' }}>
          <span>五格:</span>
          <span>天格({wuge.tianGe.lucky})</span>
          <span>·</span>
          <span>人格({wuge.renGe.lucky})</span>
          <span>·</span>
          <span>地格({wuge.diGe.lucky})</span>
          <span>·</span>
          <span>总格({wuge.zongGe.lucky})</span>
        </div>
      </div>

      <div className="name-source">{cand.sourceDescription}</div>
    </div>
  );
}
