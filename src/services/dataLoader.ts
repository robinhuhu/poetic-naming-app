/**
 * 异步数据加载服务 (v1.0.1)
 * 从 public/data/ 目录异步加载大 JSON 数据，从而使它们不打入 JS Bundle 中。
 */

export interface CharInfo {
  pinyin: string;
  tone: number;
  pinyin_without_tone: string;
  initial_声母: string;
  initial_method?: string;
  initial_part?: string;
  vowel?: string;
  vowel_type?: string;
  wuxing: string;
  stroke: number;
}

export interface ClassicEntry {
  source: string;
  title: string;
  chapter: string;
  sentences: string[];
}

export interface SancaiEntry {
  result: string;
  evaluate: string;
}

export interface GenderHints {
  boy: string[];
  girl: string[];
}

// 内存缓存单例
let _charDict: Record<string, CharInfo> | null = null;
let _classics: ClassicEntry[] | null = null;
let _sancai: Record<string, SancaiEntry> | null = null;
let _charRadical: Record<string, string> | null = null;
let _genderHints: GenderHints | null = null;

// 独立人名库缓存
let _nameDb_gurenyun: string[] | null = null;
let _nameDb_tashanshi: string[] | null = null;
let _nameDb_dengkewu: string[] | null = null;
let _nameDb_caifulun: string[] | null = null;
let _nameDb_wudaokou_funding: string[] | null = null;
let _nameDb_wudaokou_cnki: string[] | null = null;
let _nameDb_caifulun_all: string[] | null = null;

// 合并后的人名库
let _allNameDbs: string[] | null = null;

let _isReady = false;

// 辅助加载函数
async function fetchJson<T>(path: string): Promise<T> {
  const resp = await fetch(`/data/${path}?v=1.1.0`);
  if (!resp.ok) {
    throw new Error(`Failed to load ${path}: ${resp.status} ${resp.statusText}`);
  }
  return resp.json() as Promise<T>;
}

// 预加载所有数据
export async function preloadAll(): Promise<void> {
  if (_isReady) return;

  const [
    charDict,
    classics,
    sancai,
    charRadical,
    genderHints,
    dbGurenyun,
    dbTashanshi,
    dbDengkewu,
    dbCaifulun,
    dbWudaokouFunding,
    dbWudaokouCnki,
    dbCaifulunAll
  ] = await Promise.all([
    fetchJson<Record<string, CharInfo>>('char_dict.json'),
    fetchJson<ClassicEntry[]>('classics.json'),
    fetchJson<Record<string, SancaiEntry>>('sancai.json'),
    fetchJson<Record<string, string>>('char_radical.json'),
    fetchJson<GenderHints>('gender_hint.json'),
    fetchJson<string[]>('names/古人云_历史人名.json'),
    fetchJson<string[]>('names/他山石_已知人名.json'),
    fetchJson<string[]>('names/登科录_历史进士名.json'),
    fetchJson<string[]>('names/财富论_私募基金_精选集_出现3_300次.json'),
    fetchJson<string[]>('names/五道口_精选集_国家科研基金项目负责人名.json'),
    fetchJson<string[]>('names/五道口_集思录_cnki项目申报人名.json'),
    fetchJson<string[]>('names/财富论_私募基金_集思录_出现1_2次.json'),
  ]);

  _charDict = charDict;
  _classics = classics;
  _sancai = sancai;
  _charRadical = charRadical;
  _genderHints = genderHints;
  _nameDb_gurenyun = dbGurenyun;
  _nameDb_tashanshi = dbTashanshi;
  _nameDb_dengkewu = dbDengkewu;
  _nameDb_caifulun = dbCaifulun;
  _nameDb_wudaokou_funding = dbWudaokouFunding;
  _nameDb_wudaokou_cnki = dbWudaokouCnki;
  _nameDb_caifulun_all = dbCaifulunAll;

  // 合并所有名字库作为备选名
  _allNameDbs = [
    ...dbGurenyun,
    ...dbTashanshi,
    ...dbDengkewu,
    ...dbCaifulun,
    ...dbWudaokouFunding,
    ...dbWudaokouCnki,
    ...dbCaifulunAll
  ];

  _isReady = true;
}

export function isDataReady(): boolean {
  return _isReady;
}

// 检查并返回数据的辅助函数
function checkReady<T>(data: T | null, name: string): T {
  if (data === null) {
    throw new Error(`Data "${name}" is not ready. Call preloadAll() first.`);
  }
  return data;
}

// 同步 getter
export const getCharDict = () => checkReady(_charDict, 'charDict');
export const getClassics = () => checkReady(_classics, 'classics');
export const getSancai = () => checkReady(_sancai, 'sancai');
export const getCharRadical = () => checkReady(_charRadical, 'charRadical');
export const getGenderHints = () => checkReady(_genderHints, 'genderHints');
export const getAllNameDbs = () => checkReady(_allNameDbs, 'allNameDbs');

export const getNameDb_gurenyun = () => checkReady(_nameDb_gurenyun, 'names/古人云_历史人名.json');
export const getNameDb_tashanshi = () => checkReady(_nameDb_tashanshi, 'names/他山石_已知人名.json');
export const getNameDb_dengkewu = () => checkReady(_nameDb_dengkewu, 'names/登科录_历史进士名.json');
export const getNameDb_caifulun = () => checkReady(_nameDb_caifulun, 'names/财富论_私募基金_精选集_出现3_300次.json');
export const getNameDb_wudaokou_funding = () => checkReady(_nameDb_wudaokou_funding, 'names/五道口_精选集_国家科研基金项目负责人名.json');
export const getNameDb_wudaokou_cnki = () => checkReady(_nameDb_wudaokou_cnki, 'names/五道口_集思录_cnki项目申报人名.json');
export const getNameDb_caifulun_all = () => checkReady(_nameDb_caifulun_all, 'names/财富论_私募基金_集思录_出现1_2次.json');

/**
 * 专为单元测试提供的 Mock 数据注入接口
 */
export function setMockData(
  charDict: Record<string, CharInfo>,
  sancai: Record<string, SancaiEntry>,
  classics: ClassicEntry[],
  charRadical: Record<string, string>
) {
  _charDict = charDict;
  _sancai = sancai;
  _classics = classics;
  _charRadical = charRadical;
  _isReady = true;
}

