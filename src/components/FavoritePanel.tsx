import { useState } from 'react';
import { useAppStore } from '../store';
import type { CandidateName } from '../engine/generator';

interface FavoritePanelProps {
  onViewDetails: (cand: CandidateName) => void;
}

export function FavoritePanel({ onViewDetails }: FavoritePanelProps) {
  const favorites = useAppStore((s) => s.favorites);
  const clearFavorites = useAppStore((s) => s.clearFavorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const [showConfirm, setShowConfirm] = useState(false);

  if (favorites.length === 0) return null;

  return (
    <div className="premium-panel mt-20">
      <div className="d-flex justify-between align-center border-b pb-10 mb-15">
        <h3 className="font-serif fs-16 mb-0 text-left">
          雅名收藏册 ({favorites.length})
        </h3>
        {showConfirm ? (
          <div className="d-flex align-center gap-10">
            <span className="fs-12 color-cinnabar font-bold">确定清空？</span>
            <button
              type="button"
              className="fs-12 cursor-pointer text-underline font-bold"
              style={{ background: 'transparent', border: 'none', color: 'var(--color-cinnabar, #b2584b)', padding: 0 }}
              onClick={() => {
                clearFavorites();
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
            清空
          </button>
        )}
      </div>
      <div className="fav-list-scroll">
        {favorites.map((cand) => (
          <div
            key={cand.fullName}
            className="fav-item d-flex justify-between align-center mb-8 p-15 radius-10 border-light-all cursor-pointer bg-gold-light-03"
            onClick={() => onViewDetails(cand)}
          >
            <div>
              <span className="font-serif font-bold fs-15">{cand.fullName}</span>
              <span className="fs-11 color-muted ml-10">五行:{cand.wuxing}</span>
            </div>
            <button
              type="button"
              className="fav-remove-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(cand);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
