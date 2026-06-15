import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BaZiResult } from '../engine/bazi';
import type { WuGeResult } from '../engine/wuge';
import type { CandidateName } from '../engine/generator';
import type { SiblingMatchResult } from '../engine/sibling';

// ==================== 类型定义 ====================

/** 全局提示消息条目 */
export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  text: string;
}

/** 历史记录条目 */
export interface HistoryEntry {
  id: string;
  timestamp: number;
  params: {
    lastName: string;
    gender: 'boy' | 'girl' | 'any';
    birthDate: string;
    birthHour: number;
    selectedWuXing: string[];
    mustIncludeChar: string;
    namingSource: 'classics' | 'elite' | 'both';
    mode: 'single' | 'sibling';
    nameLength?: 'single' | 'double' | 'any';
    siblingFirstName?: string;
    selectedClassics?: string[];
    selectedElites?: string[];
  };
  resultCount: number;
}

/** 应用全局状态 */
export interface AppState {
  // === 模式 ===
  mode: 'single' | 'sibling';
  setMode: (mode: 'single' | 'sibling') => void;

  // === 表单输入 ===
  lastName: string;
  setLastName: (v: string) => void;
  gender: 'boy' | 'girl' | 'any';
  setGender: (v: 'boy' | 'girl' | 'any') => void;
  birthDate: string;
  setBirthDate: (v: string) => void;
  birthHour: number;
  setBirthHour: (v: number) => void;
  mustIncludeChar: string;
  setMustIncludeChar: (v: string) => void;
  mustIncludeCharPos: 'first' | 'second' | 'any';
  setMustIncludeCharPos: (v: 'first' | 'second' | 'any') => void;
  namingSource: 'classics' | 'elite' | 'both';
  setNamingSource: (v: 'classics' | 'elite' | 'both') => void;
  nameLength: 'single' | 'double' | 'any';
  setNameLength: (v: 'single' | 'double' | 'any') => void;
  selectedClassics: string[];
  setSelectedClassics: (v: string[]) => void;
  toggleClassic: (classic: string) => void;
  selectedElites: string[];
  setSelectedElites: (v: string[]) => void;
  toggleElite: (elite: string) => void;

  // === 八字 ===
  baziResult: BaZiResult | null;
  setBaziResult: (v: BaZiResult | null) => void;
  selectedWuXing: string[];
  setSelectedWuXing: (v: string[]) => void;
  /** 切换五行选择：已选则移除，未选则添加 */
  toggleWuXing: (wx: string) => void;

  // === 多胎 ===
  siblingFirstName: string;
  setSiblingFirstName: (v: string) => void;
  evalChild1: string;
  setEvalChild1: (v: string) => void;
  evalChild2: string;
  setEvalChild2: (v: string) => void;
  evalResult: SiblingMatchResult | null;
  setEvalResult: (v: SiblingMatchResult | null) => void;

  // === 起名结果 ===
  nameList: CandidateName[];
  setNameList: (v: CandidateName[]) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;

  // === 详情弹窗 ===
  activeCandidate: CandidateName | null;
  activeWuGe: WuGeResult | null;
  activeSiblingMatch: SiblingMatchResult | null;
  /** 一次性打开详情弹窗，设置候选名、五格、多胎匹配结果 */
  openDetail: (cand: CandidateName, wuge: WuGeResult, sibMatch?: SiblingMatchResult | null) => void;
  /** 关闭详情弹窗，清空所有弹窗状态 */
  closeDetail: () => void;

  // === 收藏 (persist) ===
  favorites: CandidateName[];
  /** 根据 fullName 切换收藏状态 */
  toggleFavorite: (cand: CandidateName) => void;
  /** 检查某个名字是否已收藏 */
  isFavorite: (fullName: string) => boolean;
  /** 清空所有收藏 */
  clearFavorites: () => void;

  // === 历史记录 (persist) ===
  history: HistoryEntry[];
  /** 在数组头部插入历史记录，最多保留 50 条 */
  addHistory: (entry: HistoryEntry) => void;
  /** 清空所有历史记录 */
  clearHistory: () => void;

  // === 数据加载 ===
  dataReady: boolean;
  setDataReady: (v: boolean) => void;

  // === 主题 (persist) ===
  theme: 'light' | 'dark' | 'system';
  setTheme: (v: 'light' | 'dark' | 'system') => void;

  // === 筛选排序 ===
  filterWuXing: string[];
  setFilterWuXing: (v: string[]) => void;
  filterSource: 'all' | 'classics' | 'elite';
  setFilterSource: (v: 'all' | 'classics' | 'elite') => void;
  sortBy: 'wugeScore' | 'matchScore' | 'strokes';
  setSortBy: (v: 'wugeScore' | 'matchScore' | 'strokes') => void;

  // === 计算属性 ===
  /** 基于筛选条件和排序方式，返回过滤后的名字列表 */
  filteredNameList: () => CandidateName[];

  // === 全局轻提示 ===
  toasts: ToastMessage[];
  addToast: (text: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  // === 重置表单 ===
  resetForm: () => void;

  // === 名字对比 ===
  comparedNames: CandidateName[];
  toggleCompare: (cand: CandidateName) => void;
  clearCompared: () => void;
  isCompared: (fullName: string) => boolean;

  // === 关注公众号解锁 ===
  isUnlocked: boolean;
  setIsUnlocked: (v: boolean) => void;
}

// ==================== Store 创建 ====================

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // === 模式 ===
      mode: 'single',
      setMode: (mode) => set({ mode }),

      // === 表单输入 ===
      lastName: '陈',
      setLastName: (v) => set({ lastName: v }),
      gender: 'any',
      setGender: (v) => set({ gender: v }),
      birthDate: '2026-06-02',
      setBirthDate: (v) => set({ birthDate: v }),
      birthHour: 12,
      setBirthHour: (v) => set({ birthHour: v }),
      mustIncludeChar: '',
      setMustIncludeChar: (v) => set({ mustIncludeChar: v }),
      mustIncludeCharPos: 'any',
      setMustIncludeCharPos: (v) => set({ mustIncludeCharPos: v }),
      namingSource: 'both',
      setNamingSource: (v) => set({ namingSource: v }),
      nameLength: 'double',
      setNameLength: (v) => set({ nameLength: v }),
      selectedClassics: ['诗经', '楚辞', '论语', '周易', '唐诗', '宋词', '道德经', '庄子', '礼记', '左传', '乐府诗集'],
      setSelectedClassics: (v) => set({ selectedClassics: v }),
      toggleClassic: (classic) =>
        set((state) => ({
          selectedClassics: state.selectedClassics.includes(classic)
            ? state.selectedClassics.filter((c) => c !== classic)
            : [...state.selectedClassics, classic],
        })),
      selectedElites: ['历史名流', '登科进士', '现代科研', '金融商业'],
      setSelectedElites: (v) => set({ selectedElites: v }),
      toggleElite: (elite) =>
        set((state) => ({
          selectedElites: state.selectedElites.includes(elite)
            ? state.selectedElites.filter((e) => e !== elite)
            : [...state.selectedElites, elite],
        })),

      // === 八字 ===
      baziResult: null,
      setBaziResult: (v) => set({ baziResult: v }),
      selectedWuXing: [],
      setSelectedWuXing: (v) => set({ selectedWuXing: v }),
      toggleWuXing: (wx) =>
        set((state) => ({
          selectedWuXing: state.selectedWuXing.includes(wx)
            ? state.selectedWuXing.filter((w) => w !== wx)
            : [...state.selectedWuXing, wx],
        })),

      // === 多胎 ===
      siblingFirstName: '朝雨',
      setSiblingFirstName: (v) => set({ siblingFirstName: v }),
      evalChild1: '陈朝雨',
      setEvalChild1: (v) => set({ evalChild1: v }),
      evalChild2: '陈轻尘',
      setEvalChild2: (v) => set({ evalChild2: v }),
      evalResult: null,
      setEvalResult: (v) => set({ evalResult: v }),

      // === 起名结果 ===
      nameList: [],
      setNameList: (v) => set({ nameList: v }),
      loading: false,
      setLoading: (v) => set({ loading: v }),

      // === 详情弹窗 ===
      activeCandidate: null,
      activeWuGe: null,
      activeSiblingMatch: null,
      openDetail: (cand, wuge, sibMatch = null) =>
        set({
          activeCandidate: cand,
          activeWuGe: wuge,
          activeSiblingMatch: sibMatch ?? null,
        }),
      closeDetail: () =>
        set({
          activeCandidate: null,
          activeWuGe: null,
          activeSiblingMatch: null,
        }),

      // === 收藏 ===
      favorites: [],
      toggleFavorite: (cand) =>
        set((state) => {
          const exists = state.favorites.some((f) => f.fullName === cand.fullName);
          return {
            favorites: exists
              ? state.favorites.filter((f) => f.fullName !== cand.fullName)
              : [...state.favorites, cand],
          };
        }),
      isFavorite: (fullName) => get().favorites.some((f) => f.fullName === fullName),
      clearFavorites: () => set({ favorites: [] }),

      // === 历史记录 ===
      history: [],
      addHistory: (entry) =>
        set((state) => ({
          history: [entry, ...state.history].slice(0, 50),
        })),
      clearHistory: () => set({ history: [] }),

      // === 数据加载 ===
      dataReady: false,
      setDataReady: (v) => set({ dataReady: v }),

      // === 主题 ===
      theme: 'system',
      setTheme: (v) => set({ theme: v }),

      // === 筛选排序 ===
      filterWuXing: [],
      setFilterWuXing: (v) => set({ filterWuXing: v }),
      filterSource: 'all',
      setFilterSource: (v) => set({ filterSource: v }),
      sortBy: 'wugeScore',
      setSortBy: (v) => set({ sortBy: v }),

      // === 计算属性 ===
      filteredNameList: () => {
        const { nameList, filterWuXing, filterSource, sortBy } = get();

        let result = [...nameList];

        // 按五行筛选：名字的五行字符中至少包含一个选中的五行
        if (filterWuXing.length > 0) {
          result = result.filter((name) =>
            filterWuXing.some((wx) => name.wuxing.includes(wx))
          );
        }

        // 按来源筛选
        if (filterSource !== 'all') {
          result = result.filter((name) => {
            if (filterSource === 'classics') {
              return name.sourceDescription.includes('古籍');
            }
            // 'elite' — 匹配精英人名相关来源描述
            return (
              name.sourceDescription.includes('名人录') ||
              name.sourceDescription.includes('学者名录') ||
              name.sourceDescription.includes('精英名录') ||
              name.sourceDescription.includes('进士名录')
            );
          });
        }

        // 排序
        result.sort((a, b) => {
          switch (sortBy) {
            case 'wugeScore':
              return b.wugeScore - a.wugeScore;
            case 'matchScore':
              return (b.matchScore ?? 0) - (a.matchScore ?? 0);
            case 'strokes':
              // 按总笔画数升序排列
              return (
                a.strokes.reduce((sum, s) => sum + s, 0) -
                b.strokes.reduce((sum, s) => sum + s, 0)
              );
            default:
              return 0;
          }
        });

        return result;
      },

      // === 全局轻提示 ===
      toasts: [],
      addToast: (text, type = 'info') => {
        const id = Math.random().toString(36).slice(2, 9);
        set((state) => ({ toasts: [...state.toasts, { id, type, text }] }));
        setTimeout(() => {
          get().removeToast(id);
        }, 3000);
      },
      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      // === 重置表单 ===
      resetForm: () =>
        set({
          lastName: '陈',
          gender: 'any',
          birthDate: '2026-06-02',
          birthHour: 12,
          selectedWuXing: [],
          mustIncludeChar: '',
          mustIncludeCharPos: 'any',
          namingSource: 'both',
          nameLength: 'double',
          selectedClassics: ['诗经', '楚辞', '论语', '周易', '唐诗', '宋词', '道德经', '庄子', '礼记', '左传', '乐府诗集'],
          selectedElites: ['历史名流', '登科进士', '现代科研', '金融商业'],
        }),

      // === 名字对比 ===
      comparedNames: [],
      toggleCompare: (cand) =>
        set((state) => {
          const exists = state.comparedNames.some((n) => n.fullName === cand.fullName);
          if (exists) {
            return { comparedNames: state.comparedNames.filter((n) => n.fullName !== cand.fullName) };
          }
          if (state.comparedNames.length >= 3) {
            get().addToast('最多只能同时对比 3 个候选名字', 'warning');
            return {};
          }
          return { comparedNames: [...state.comparedNames, cand] };
        }),
      clearCompared: () => set({ comparedNames: [] }),
      isCompared: (fullName) => get().comparedNames.some((n) => n.fullName === fullName),

      // === 关注公众号解锁 ===
      isUnlocked: true,
      setIsUnlocked: (v) => set({ isUnlocked: v }),
    }),
    {
      name: 'poetic-naming-app-storage',
      // 使用 partialize 精确控制持久化范围：持久化收藏、历史记录、主题和解锁状态
      partialize: (state) => ({
        favorites: state.favorites,
        history: state.history,
        theme: state.theme,
        isUnlocked: state.isUnlocked,
      }),
    }
  )
);

// ==================== Selector Hooks ====================
// 选择性订阅，避免不必要的重渲染

/** 当前模式 */
export const useMode = () => useAppStore((s) => s.mode);

/** 表单输入字段 */
export const useFormInputs = () =>
  useAppStore((s) => ({
    lastName: s.lastName,
    gender: s.gender,
    birthDate: s.birthDate,
    birthHour: s.birthHour,
    mustIncludeChar: s.mustIncludeChar,
    mustIncludeCharPos: s.mustIncludeCharPos,
    namingSource: s.namingSource,
    nameLength: s.nameLength,
  }));

/** 八字相关状态 */
export const useBaziState = () =>
  useAppStore((s) => ({
    baziResult: s.baziResult,
    selectedWuXing: s.selectedWuXing,
  }));

/** 起名结果 */
export const useNameResults = () =>
  useAppStore((s) => ({
    nameList: s.nameList,
    loading: s.loading,
  }));

/** 详情弹窗状态 */
export const useDetailModal = () =>
  useAppStore((s) => ({
    activeCandidate: s.activeCandidate,
    activeWuGe: s.activeWuGe,
    activeSiblingMatch: s.activeSiblingMatch,
  }));

/** 收藏列表 */
export const useFavorites = () => useAppStore((s) => s.favorites);

/** 主题偏好 */
export const useTheme = () => useAppStore((s) => s.theme);

/** 筛选排序状态 */
export const useFilterSort = () =>
  useAppStore((s) => ({
    filterWuXing: s.filterWuXing,
    filterSource: s.filterSource,
    sortBy: s.sortBy,
  }));

/** 多胎模式状态 */
export const useSiblingState = () =>
  useAppStore((s) => ({
    siblingFirstName: s.siblingFirstName,
    evalChild1: s.evalChild1,
    evalChild2: s.evalChild2,
    evalResult: s.evalResult,
  }));

/** 数据加载状态 */
export const useDataReady = () => useAppStore((s) => s.dataReady);

/** 历史记录 */
export const useHistory = () => useAppStore((s) => s.history);

/** 选中的古籍经典 */
export const useSelectedClassics = () =>
  useAppStore((s) => ({
    selectedClassics: s.selectedClassics,
    setSelectedClassics: s.setSelectedClassics,
    toggleClassic: s.toggleClassic,
  }));

/** 选中的精英人类类别 */
export const useSelectedElites = () =>
  useAppStore((s) => ({
    selectedElites: s.selectedElites,
    setSelectedElites: s.setSelectedElites,
    toggleElite: s.toggleElite,
  }));

/** 全局轻提示 */
export const useToasts = () => useAppStore((s) => s.toasts);
export const useAddToast = () => useAppStore((s) => s.addToast);
export const useRemoveToast = () => useAppStore((s) => s.removeToast);
export const useResetForm = () => useAppStore((s) => s.resetForm);
export const useComparedNames = () => useAppStore((s) => s.comparedNames);
export const useIsUnlocked = () => useAppStore((s) => s.isUnlocked);
export const useSetIsUnlocked = () => useAppStore((s) => s.setIsUnlocked);
