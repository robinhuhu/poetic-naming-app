import { validateNamePhonetics } from './phonetics';
import { calculateWuGe, type WuGeResult } from './wuge';
import { evaluateSiblingMatch } from './sibling';
import {
  getCharDict,
  getGenderHints,
  getClassics,
  getNameDb_gurenyun,
  getNameDb_tashanshi,
  getNameDb_dengkewu,
  getNameDb_caifulun,
  getNameDb_wudaokou_funding,
  getNameDb_wudaokou_cnki,
  getNameDb_caifulun_all
} from '../services/dataLoader';

// 拟真百家姓氏库，用于为清洗掉姓氏的精英名录还原一个确定且稳定的真实全名
const POPULAR_SURNAMES = [
  '赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', 
  '卫', '蒋', '沈', '韩', '杨', '朱', '秦', '尤', '许', '何', 
  '吕', '施', '张', '孔', '曹', '严', '华', '金', '魏', '陶', 
  '姜', '戚', '谢', '邹', '喻', '柏', '水', '窦', '章', '云', 
  '苏', '潘', '葛', '奚', '范', '彭', '郎', '鲁', '韦', '昌', 
  '马', '苗', '凤', '花', '方', '俞', '任', '袁', '柳', '唐', 
  '费', '廉', '岑', '薛', '雷', '贺', '倪', '汤', '滕', '殷', 
  '罗', '毕', '郝', '邬', '安', '常', '乐', '于', '时', '傅',
];

function getDeterministicSurname(firstName: string): string {
  let hash = 0;
  for (let i = 0; i < firstName.length; i++) {
    hash += firstName.charCodeAt(i);
  }
  const index = hash % POPULAR_SURNAMES.length;
  return POPULAR_SURNAMES[index];
}

// 定义输入条件
export interface GeneratorParams {
  lastName: string;          // 姓氏
  gender: 'boy' | 'girl' | 'any'; // 性别
  preferredWuXing: string[]; // 期望五行 (如 ["金", "水"])
  mustIncludeChar: string;   // 必须包含的字 (如辈分字)
  mustIncludeCharPos: 'first' | 'second' | 'any'; // 必选字位置
  namingSource: 'classics' | 'elite' | 'both';    // 名字来源：古籍、精英人名、全部
  nameLength?: 'single' | 'double' | 'any';       // 名字字数：单字、双字、混合
  siblingFirstName?: string; // [多胎模式] 一胎名字的名 (不含姓，如 "朝雨")
  selectedClassics?: string[]; // 选中的古籍经典
  selectedElites?: string[]; // 选中的精英人名分类
}

export interface CandidateName {
  fullName: string;          // 全名 (如 "陈朝雨")
  firstName: string;         // 名字 (如 "朝雨")
  wuxing: string;            // 名字五行 (如 "水水")
  strokes: number[];         // 名字各自笔画数 (如 [14, 8])
  wugeScore: number;         // 三才五格打分
  wugeResult?: WuGeResult;   // 预计算的五格详情 (避免前端重复计算)
  matchScore?: number;       // [多胎模式] 与一胎的匹配评分
  sourceDescription: string; // 名字来源描述 (如出自诗经...)
}

/**
 * 智能起名主入口
 */
export function generateNames(params: GeneratorParams): CandidateName[] {
  const charDict = getCharDict();
  const genderHints = getGenderHints();
  const classicsDb = [...getClassics()].sort(() => Math.random() - 0.5);

  const {
    lastName,
    gender,
    preferredWuXing = [],
    mustIncludeChar = '',
    mustIncludeCharPos = 'any',
    namingSource = 'both',
    nameLength = 'double',
    siblingFirstName = '',
    selectedClassics = [],
    selectedElites = [],
  } = params;

  const candidates: CandidateName[] = [];
  const generatedSet = new Set<string>();

  // 性别匹配辅助函数：男宝宝模式下排除女宝字，女宝宝模式下排除男宝字
  const isGenderMatch = (char: string): boolean => {
    if (gender === 'any') return true;
    const excludeGender = gender === 'boy' ? 'girl' : 'boy';
    const excludeList = genderHints[excludeGender];
    if (!excludeList || excludeList.length === 0) return true;
    return !excludeList.includes(char);
  };

  const reqLen = nameLength || 'double';

  // 1. 从经典古籍提取名字 (诗经/楚辞/周易/论语等)
  if (namingSource === 'classics' || namingSource === 'both') {
    let classicsCount = 0;
    outerLoop:
    for (const poem of classicsDb) {
      // 古籍过滤
      if (selectedClassics && selectedClassics.length > 0) {
        if (!selectedClassics.includes(poem.source)) {
          continue;
        }
      }

      for (const sentence of poem.sentences) {
        // ---- A. 单字名提取 ----
        if (reqLen === 'single' || reqLen === 'any') {
          for (let i = 0; i < sentence.length; i++) {
            const char = sentence[i];
            if (char in charDict) {
              if (generatedSet.has(char)) continue;

              // 性别过滤
              if (gender !== 'any' && !isGenderMatch(char)) continue;

              // 校验必选字
              if (mustIncludeChar && char !== mustIncludeChar) continue;

              // 校验五行条件
              if (preferredWuXing.length > 0) {
                const wx = charDict[char].wuxing;
                if (!preferredWuXing.includes(wx)) continue;
              }

              // 计算五格分
              const wuge = calculateWuGe(lastName, char);
              if (wuge.totalScore < 60) continue;

              generatedSet.add(char);
              candidates.push({
                fullName: lastName + char,
                firstName: char,
                wuxing: charDict[char].wuxing,
                strokes: [charDict[char].stroke],
                wugeScore: wuge.totalScore,
                wugeResult: wuge,
                sourceDescription: `取自古籍【${poem.source} · 《${poem.title}》】的名句：“${sentence}”中的“${char}”字。`,
              });

              classicsCount++;
              if (classicsCount >= 1000) {
                break outerLoop;
              }
            }
          }
        }

        // ---- B. 双字名提取 ----
        if (reqLen === 'double' || reqLen === 'any') {
          for (let i = 0; i < sentence.length - 1; i++) {
            const char1 = sentence[i];
            const char2 = sentence[i + 1];

            if (char1 in charDict && char2 in charDict) {
              const first = char1 + char2;
              if (generatedSet.has(first)) continue;

              // Gender filtering
              if (gender !== 'any') {
                if (!isGenderMatch(char1) || !isGenderMatch(char2)) continue;
              }

              // 校验必选字条件
              if (mustIncludeChar) {
                if (mustIncludeCharPos === 'first' && char1 !== mustIncludeChar) continue;
                if (mustIncludeCharPos === 'second' && char2 !== mustIncludeChar) continue;
                if (mustIncludeCharPos === 'any' && !first.includes(mustIncludeChar)) continue;
              }

              // 校验五行条件 (名字第一个字或第二个字符合喜用五行之一即可)
              if (preferredWuXing.length > 0) {
                const wx1 = charDict[char1].wuxing;
                const wx2 = charDict[char2].wuxing;
                if (!preferredWuXing.includes(wx1) && !preferredWuXing.includes(wx2)) continue;
              }

              // 校验音律优美度
              const phoneticsVal = validateNamePhonetics(char1, char2);
              if (!phoneticsVal.isValid) continue;

              // 计算五格分
              const wuge = calculateWuGe(lastName, first);
              if (wuge.totalScore < 60) continue; // 排除五格凶的名字

              generatedSet.add(first);
              candidates.push({
                fullName: lastName + first,
                firstName: first,
                wuxing: charDict[char1].wuxing + charDict[char2].wuxing,
                strokes: [charDict[char1].stroke, charDict[char2].stroke],
                wugeScore: wuge.totalScore,
                wugeResult: wuge,
                sourceDescription: `出自古籍【${poem.source} · 《${poem.title}》】的名句：“${sentence}”`,
              });

              classicsCount++;
              if (classicsCount >= 1000) {
                break outerLoop;
              }
            }
          }
        }
      }
    }
  }

  // 2. 从精英人名脱壳复用
  if (namingSource === 'elite' || namingSource === 'both') {
    // 组合选中的人名数据库
    const rawNames: string[] = [];
    if (selectedElites && selectedElites.length > 0) {
      if (selectedElites.includes('历史名流')) {
        rawNames.push(...getNameDb_gurenyun(), ...getNameDb_tashanshi());
      }
      if (selectedElites.includes('登科进士')) {
        rawNames.push(...getNameDb_dengkewu());
      }
      if (selectedElites.includes('现代科研')) {
        rawNames.push(...getNameDb_wudaokou_funding(), ...getNameDb_wudaokou_cnki());
      }
      if (selectedElites.includes('金融商业')) {
        rawNames.push(...getNameDb_caifulun(), ...getNameDb_caifulun_all());
      }
    }

    let eliteCount = 0;
    for (const rawName of rawNames) {
      if (!rawName || rawName.length < 2 || rawName.length > 4) continue;

      const itemsToTry: string[] = [];
      if (reqLen === 'single' || reqLen === 'any') {
        itemsToTry.push(rawName.slice(-1));
      }
      if (reqLen === 'double' || reqLen === 'any') {
        itemsToTry.push(rawName.length === 2 ? rawName : rawName.slice(-2));
      }

      for (const first of itemsToTry) {
        if (!first || generatedSet.has(first)) continue;

        if (first.length === 1) {
          // ---- 单字名校验与拼装 ----
          const char = first;
          if (char in charDict) {
            if (gender !== 'any' && !isGenderMatch(char)) continue;
            if (mustIncludeChar && char !== mustIncludeChar) continue;
            if (preferredWuXing.length > 0) {
              const wx = charDict[char].wuxing;
              if (!preferredWuXing.includes(wx)) continue;
            }

            const wuge = calculateWuGe(lastName, char);
            if (wuge.totalScore < 60) continue;

            const deterministicSurname = getDeterministicSurname(char);
            const fullOriginalName = deterministicSurname + rawName;
            
            let sourceDesc = `复用自历史杰出名人录 (原名：${fullOriginalName})。`;
            if (getNameDb_wudaokou_funding().includes(rawName) || getNameDb_wudaokou_cnki().includes(rawName)) {
              sourceDesc = `复用自现代科研与高知学者名录 (原名：${fullOriginalName})。`;
            } else if (getNameDb_caifulun().includes(rawName) || getNameDb_caifulun_all().includes(rawName)) {
              sourceDesc = `复用自现代商业与金融精英名录 (原名：${fullOriginalName})。`;
            } else if (getNameDb_dengkewu().includes(rawName)) {
              sourceDesc = `复用自登科录历史进士名录 (原名：${fullOriginalName})。`;
            }

            generatedSet.add(char);
            candidates.push({
              fullName: lastName + char,
              firstName: char,
              wuxing: charDict[char].wuxing,
              strokes: [charDict[char].stroke],
              wugeScore: wuge.totalScore,
              wugeResult: wuge,
              sourceDescription: sourceDesc,
            });

            eliteCount++;
            if (eliteCount >= 1000) break;
          }
        } else {
          // ---- 双字名校验与拼装 ----
          const char1 = first[0];
          const char2 = first[1];

          if (char1 in charDict && char2 in charDict) {
            if (gender !== 'any') {
              if (!isGenderMatch(char1) || !isGenderMatch(char2)) continue;
            }
            if (mustIncludeChar) {
              if (mustIncludeCharPos === 'first' && char1 !== mustIncludeChar) continue;
              if (mustIncludeCharPos === 'second' && char2 !== mustIncludeChar) continue;
              if (mustIncludeCharPos === 'any' && !first.includes(mustIncludeChar)) continue;
            }
            if (preferredWuXing.length > 0) {
              const wx1 = charDict[char1].wuxing;
              const wx2 = charDict[char2].wuxing;
              if (!preferredWuXing.includes(wx1) && !preferredWuXing.includes(wx2)) continue;
            }

            const phoneticsVal = validateNamePhonetics(char1, char2);
            if (!phoneticsVal.isValid) continue;

            const wuge = calculateWuGe(lastName, first);
            if (wuge.totalScore < 60) continue;

            const deterministicSurname = getDeterministicSurname(first);
            const fullOriginalName = deterministicSurname + rawName;

            let sourceDesc = `复用自历史杰出名人录 (原名：${fullOriginalName})。`;
            if (getNameDb_wudaokou_funding().includes(rawName) || getNameDb_wudaokou_cnki().includes(rawName)) {
              sourceDesc = `复用自现代科研与高知学者名录 (原名：${fullOriginalName})。`;
            } else if (getNameDb_caifulun().includes(rawName) || getNameDb_caifulun_all().includes(rawName)) {
              sourceDesc = `复用自现代商业与金融精英名录 (原名：${fullOriginalName})。`;
            } else if (getNameDb_dengkewu().includes(rawName)) {
              sourceDesc = `复用自登科录历史进士名录 (原名：${fullOriginalName})。`;
            }

            generatedSet.add(first);
            candidates.push({
              fullName: lastName + first,
              firstName: first,
              wuxing: charDict[char1].wuxing + charDict[char2].wuxing,
              strokes: [charDict[char1].stroke, charDict[char2].stroke],
              wugeScore: wuge.totalScore,
              wugeResult: wuge,
              sourceDescription: sourceDesc,
            });

            eliteCount++;
            if (eliteCount >= 1000) break;
          }
        }
      }
      if (eliteCount >= 1000) break;
    }
  }

  // 3. 如果是多胎匹配起名模式，针对每一个候选名进行匹配度打分，并重新排序
  if (siblingFirstName && candidates.length > 0) {
    const siblingFull = lastName + siblingFirstName;
    
    // 预先筛选古籍库中包含大娃姓名中任意字的所有作品，用于快速评估，避开庞大的全局扫描
    const c1Chars = siblingFirstName.split('');
    const localClassicsDb = classicsDb.filter(poem => {
      const text = poem.sentences.join('');
      return c1Chars.some(char => text.includes(char));
    });

    for (const cand of candidates) {
      // 计算与大娃名字的匹配评估
      let genPos: 'first' | 'second' | 'none' = 'none';
      if (mustIncludeChar) {
        if (mustIncludeCharPos === 'first') genPos = 'first';
        else if (mustIncludeCharPos === 'second') genPos = 'second';
      }
      const matchResult = evaluateSiblingMatch(siblingFull, cand.fullName, genPos, localClassicsDb);
      cand.matchScore = matchResult.totalScore;
      if (matchResult.bestPoemSource) {
        cand.sourceDescription = `多胎古籍同源！与一胎同出自【${matchResult.bestPoemSource.poem}】名句：“${matchResult.bestPoemSource.sentence}”`;
      }
    }

    // 根据匹配度从高到低排序，其次根据五格分排序
    candidates.sort((a, b) => {
      const matchDiff = (b.matchScore || 0) - (a.matchScore || 0);
      if (matchDiff !== 0) return matchDiff;
      return b.wugeScore - a.wugeScore;
    });
  } else {
    // 否则，普通单胎模式，按三才五格分高低排序
    candidates.sort((a, b) => b.wugeScore - a.wugeScore);
  }

  // 限制返回的前 200 个最佳名字，避免前端页面卡顿
  return candidates.slice(0, 200);
}
