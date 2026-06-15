import { getCharDict, getCharRadical, getClassics, type ClassicEntry } from '../services/dataLoader';


export interface SiblingMatchDetail {
  dimension: string;     // 维度名称 (如 "音律协调")
  score: number;         // 维度评分 (0-100)
  evaluation: string;    // 该维度的文字评价
  details?: string[];    // 详细信息或匹配项 (如匹配到的诗词名句)
}

export interface SiblingMatchResult {
  totalScore: number;    // 综合匹配分 (0-100)
  level: string;         // 契合度评级 (如 "天作之合", "琴瑟和鸣", "珠联璧合", "略逊一筹")
  details: SiblingMatchDetail[];
  bestPoemSource?: {     // 最佳诗词出处
    poem: string;        // 诗名 
    sentence: string;    // 包含两胎名字的名句
    source: string;      // 出处 (如 诗经)
  };
}

// 辈分字匹配位置定义
export type GenerationWordPos = 'first' | 'second' | 'none';

// 国风多胎词义字面对仗词典
const SEMANTIC_OPPOSES: Record<string, string[]> = {
  朝: ['晚', '暮', '夕', '夜'],
  晚: ['朝', '晨', '曦', '明'],
  暮: ['朝', '晨', '曦', '东'],
  晨: ['暮', '晚', '夕', '夜'],
  曦: ['暮', '晚', '夕', '夜'],
  雨: ['晴', '雪', '风', '云', '露'],
  晴: ['雨', '雪', '风', '阴', '霾'],
  风: ['雅', '颂', '雨', '雪', '云', '月'],
  云: ['雨', '风', '月', '日', '星'],
  月: ['日', '星', '云', '川', '山'],
  日: ['月', '星', '辰', '海'],
  星: ['月', '日', '辰', '海'],
  山: ['川', '海', '河', '泽', '谷', '野'],
  川: ['山', '岳', '岭', '峰'],
  河: ['山', '岳', '海', '泽'],
  海: ['山', '陆', '川', '河'],
  谷: ['山', '岳', '峰', '丘'],
  泽: ['山', '水', '林', '木'],
  松: ['柏', '竹', '梅', '柳', '枫'],
  柏: ['松', '竹', '梅', '柳', '桐'],
  竹: ['松', '柏', '梅', '兰', '菊'],
  梅: ['松', '柏', '竹', '兰', '菊'],
  兰: ['竹', '梅', '菊', '蕙', '芝'],
  菊: ['竹', '梅', '兰', '荷', '莲'],
  瑾: ['瑜', '瑕', '璇', '壁'],
  瑜: ['瑾', '瑕', '璇', '琛'],
  怀: ['抱', '握', '舒', '揽'],
  握: ['怀', '抱', '放', '释'],
  抱: ['怀', '握', '释', '抛'],
  书: ['剑', '琴', '画', '诗', '墨'],
  剑: ['书', '琴', '画', '诗', '笔'],
  琴: ['书', '剑', '画', '诗', '瑟', '笙'],
  瑟: ['琴', '筑', '箫', '笛'],
  诗: ['书', '画', '琴', '酒', '茶'],
  画: ['书', '诗', '琴', '棋', '歌'],
  雅: ['风', '颂', '儒', '俗'],
  颂: ['风', '雅', '赞', '歌'],
  昭: ['华', '明', '暗', '幽'],
  华: ['昭', '实', '朴', '叶'],
  文: ['武', '质', '理', '行'],
  武: ['文', '和', '德', '艺'],
  修: ['齐', '治', '齐', '平'],
  齐: ['修', '治', '平', '正']
};

// 五行相生相克定义
const WUXING_RELATIONS: Record<string, { supports: string[]; opposes: string[] }> = {
  木: { supports: ['火', '木'], opposes: ['土', '金'] }, // 木生火，同木
  火: { supports: ['土', '火'], opposes: ['金', '水'] }, // 火生土
  土: { supports: ['金', '土'], opposes: ['水', '木'] }, // 土生金
  金: { supports: ['水', '金'], opposes: ['木', '火'] }, // 金生水
  水: { supports: ['木', '水'], opposes: ['火', '土'] }, // 水生木
};

/**
 * 评估二胎名字与一胎名字的契合匹配度
 * @param child1Full 一胎全名 (如 "陈朝雨")
 * @param child2Full 二胎全名 (如 "陈轻尘")
 * @param generationWordPos 排辈字位置 ('first'-名字第一个字, 'second'-名字第二个字, 'none'-无)
 */
export function evaluateSiblingMatch(
  child1Full: string,
  child2Full: string,
  generationWordPos: GenerationWordPos = 'none',
  customClassicsDb?: ClassicEntry[]
): SiblingMatchResult {
  const charDict = getCharDict();
  const charRadical = getCharRadical();
  const classicsDb = getClassics();
  // 提取一胎和二胎的姓与名
  // 假设第一个字或前两个字为姓。如果是双字姓，进行前二判断；如果是单字姓，为第一个字。
  // 简化起见：我们提取后面两字作为名
  const c1Name = child1Full.slice(-2);
  const c2Name = child2Full.slice(-2);

  const c1Char1 = c1Name[0];
  const c1Char2 = c1Name[1] || '';
  const c2Char1 = c2Name[0];
  const c2Char2 = c2Name[1] || '';

  const details: SiblingMatchDetail[] = [];
  let bestPoemSource: { poem: string; sentence: string; source: string; } | undefined = undefined;

  // 1. 古籍同源检测 (权重 30%)
  let classicScore = 0;
  let classicEval: string;
  const matchedPoems: string[] = [];

  const dbToSearch = customClassicsDb || classicsDb;
  for (const poem of dbToSearch) {
    for (const sentence of poem.sentences) {
      // 检查是否同时包含大娃名的汉字和二娃名的汉字
      const hasC1 = c1Name.split('').every(char => sentence.includes(char));
      const hasC2 = c2Name.split('').every(char => sentence.includes(char));

      if (hasC1 && hasC2) {
        // 两个名字所有字同在一句话里，这是完美同源！
        classicScore = 100;
        const poemInfo = `${poem.source} · 《${poem.title}》`;
        bestPoemSource = {
          poem: poemInfo,
          sentence,
          source: poem.source
        };
        matchedPoems.push(`完美同源于【${poemInfo}】中的名句：“${sentence}”`);
        break;
      }
    }
    if (classicScore === 100) break;
  }

  // 如果没有同句完美同源，看看是否在同一篇章的相邻句子或者同一篇章中
  if (classicScore === 0) {
    for (const poem of dbToSearch) {
      const textAll = poem.sentences.join('');
      const hasC1 = c1Name.split('').every(char => textAll.includes(char));
      const hasC2 = c2Name.split('').every(char => textAll.includes(char));
      
      if (hasC1 && hasC2) {
        classicScore = 65;
        matchedPoems.push(`同出自古籍【${poem.source} · 《${poem.title}》】不同句中。`);
        break;
      }
    }
  }

  if (classicScore === 100) {
    classicEval = '经典古籍完美同源！两个孩子姓名同出经典篇章的同一诗句，意义非凡。';
  } else if (classicScore === 65) {
    classicEval = '经典古籍同源。两个孩子姓名出自相同的古籍篇章，遥相呼应。';
  } else {
    classicScore = 30; // 兜底分
    classicEval = '古籍同源度较普通，词源独立。';
  }
  
  details.push({
    dimension: '经典同源',
    score: classicScore,
    evaluation: classicEval,
    details: matchedPoems.length > 0 ? matchedPoems : undefined
  });

  // 2. 字形与部首契合 (权重 25%)
  let radicalScore: number;
  let radicalEval: string;
  const matchedRadicals: string[] = [];

  const c1Radical1 = charRadical[c1Char1] || '';
  const c1Radical2 = charRadical[c1Char2] || '';
  const c2Radical1 = charRadical[c2Char1] || '';
  const c2Radical2 = charRadical[c2Char2] || '';

  // 检查是否有相同的偏旁部首
  const radicals1 = [c1Radical1, c1Radical2].filter(r => r);
  const radicals2 = [c2Radical1, c2Radical2].filter(r => r);
  
  let sharedRadical = '';
  for (const r of radicals1) {
    if (radicals2.includes(r)) {
      sharedRadical = r;
      break;
    }
  }

  if (sharedRadical) {
    radicalScore = 100;
    radicalEval = `同偏旁部首契合！大娃与二娃姓名共享了“${sharedRadical}”部偏旁，具有强烈的同胞传承感。`;
    matchedRadicals.push(`共享相同的部首偏旁：“${sharedRadical}”`);
  } else {
    // 如果偏旁不相同，但偏旁的五行能形成互补相生 (根据偏旁字自身的五行)
    const c1WX1 = charDict[c1Char1]?.wuxing || '';
    const c2WX1 = charDict[c2Char1]?.wuxing || '';
    
    if (c1WX1 && c2WX1 && WUXING_RELATIONS[c1WX1]?.supports.includes(c2WX1)) {
      radicalScore = 80;
      radicalEval = `五行部首生助！名字的首字五行形成了 ${c1WX1} 生 ${c2WX1}（或五行相同）的良性互动。`;
      matchedRadicals.push(`首字五行相生配合 (${c1WX1} -> ${c2WX1})`);
    } else {
      radicalScore = 60;
      radicalEval = '字形结构独立，五行搭配平顺。';
    }
  }

  details.push({
    dimension: '字形契合',
    score: radicalScore,
    evaluation: radicalEval,
    details: matchedRadicals.length > 0 ? matchedRadicals : undefined
  });

  // 3. 音律与声调对仗 (权重 20%)
  let phoneticScore: number;
  let phoneticEval: string;
  const matchedPhonetics: string[] = [];

  const c1Tone1 = charDict[c1Char1]?.tone || 0;
  const c1Tone2 = charDict[c1Char2]?.tone || 0;
  const c2Tone1 = charDict[c2Char1]?.tone || 0;
  const c2Tone2 = charDict[c2Char2]?.tone || 0;

  // 平仄判断：1,2声为平声，3,4声为仄声
  const getPingZe = (tone: number) => (tone === 1 || tone === 2) ? '平' : '仄';
  
  const c1LastPingZe = getPingZe(c1Tone2 || c1Tone1);
  const c2LastPingZe = getPingZe(c2Tone2 || c2Tone1);

  if (c1LastPingZe !== c2LastPingZe) {
    // 定平仄相对，如一个叫 "朝雨" (仄)，一个叫 "轻尘" (平)
    phoneticScore = 100;
    phoneticEval = '末字平仄声调完美相对！大娃名尾字为【' + c1LastPingZe + '】，二娃名尾字为【' + c2LastPingZe + '】，形成琴瑟合鸣之对仗美感。';
    matchedPhonetics.push(`尾字平仄相对：一胎【${c1LastPingZe}】声 vs 二胎【${c2LastPingZe}】声`);
  } else {
    phoneticScore = 70;
    phoneticEval = '两个名字末字同声调类型，音调变化平稳。';
    matchedPhonetics.push(`尾字平仄同声调类型 (${c1LastPingZe}声)`);
  }

  // 排除完全重音
  const c1Py1 = charDict[c1Char1]?.pinyin_without_tone || '';
  const c2Py1 = charDict[c2Char1]?.pinyin_without_tone || '';
  if (c1Py1 === c2Py1 && c1Char1 !== c2Char1) {
    phoneticScore = Math.max(40, phoneticScore - 30);
    matchedPhonetics.push(`注意：大娃首字"${c1Char1}"与二娃首字"${c2Char1}"发音相同，容易混淆。`);
  }

  details.push({
    dimension: '音律协调',
    score: phoneticScore,
    evaluation: phoneticEval,
    details: matchedPhonetics.length > 0 ? matchedPhonetics : undefined
  });

  // 4. 字义/词义对仗 (权重 15%)
  let semanticScore: number;
  let semanticEval: string;
  const matchedSemantics: string[] = [];

  let isOppose1 = false;
  let isOppose2 = false;

  // 检查大娃一字与二娃一字是否构成对仗
  if (c1Char1 in SEMANTIC_OPPOSES && SEMANTIC_OPPOSES[c1Char1].includes(c2Char1)) {
    isOppose1 = true;
  }
  // 检查大娃二字与二娃二字是否构成对仗
  if (c1Char2 && c2Char2 && c1Char2 in SEMANTIC_OPPOSES && SEMANTIC_OPPOSES[c1Char2].includes(c2Char2)) {
    isOppose2 = true;
  }
  // 交叉对仗
  if (c1Char1 in SEMANTIC_OPPOSES && SEMANTIC_OPPOSES[c1Char1].includes(c2Char2)) {
    isOppose2 = true;
  }

  if (isOppose1 || isOppose2) {
    semanticScore = 100;
    semanticEval = '词义国风成双对偶！两个名字中含有意义完美相对的汉字（如朝对暮，山对川，瑾对瑜），尽显文气底蕴。';
    if (isOppose1) matchedSemantics.push(`首字词义完美对仗：“${c1Char1}” vs “${c2Char1}”`);
    if (isOppose2) matchedSemantics.push(`尾字词义完美对仗：“${c1Char2}” vs “${c2Char2}”`);
  } else {
    semanticScore = 70;
    semanticEval = '词义清雅独立，语义无冲突。';
  }

  details.push({
    dimension: '词义对仗',
    score: semanticScore,
    evaluation: semanticEval,
    details: matchedSemantics.length > 0 ? matchedSemantics : undefined
  });

  // 5. 辈分排辈字匹配 (权重 10%)
  let generationScore: number;
  let generationEval: string;
  const matchedGeneration: string[] = [];

  if (generationWordPos === 'first') {
    if (c1Char1 === c2Char1) {
      generationScore = 100;
      generationEval = `符合辈分设定。两个名字共享了首字“${c1Char1}”作为辈分字，同辈序列清晰。`;
      matchedGeneration.push(`首字辈分字完全相同：“${c1Char1}”`);
    } else {
      generationScore = 30;
      generationEval = '未按照排辈字设置匹配首字，建议修改字型组合。';
      matchedGeneration.push(`未能匹配首辈分字（期望首字相同，但为 "${c1Char1}" 与 "${c2Char1}"）`);
    }
  } else if (generationWordPos === 'second') {
    if (c1Char2 === c2Char2) {
      generationScore = 100;
      generationEval = `符合辈分设定。两个名字共享了尾字“${c1Char2}”作为辈分字，同辈秩序优良。`;
      matchedGeneration.push(`尾字辈分字完全相同：“${c1Char2}”`);
    } else {
      generationScore = 30;
      generationEval = '未按照排辈字设置匹配尾字，建议调整名字次序。';
      matchedGeneration.push(`未能匹配尾辈分字（期望尾字相同，但为 "${c1Char2}" 与 "${c2Char2}"）`);
    }
  } else {
    // 未指定排辈，如果无意中首字或尾字相同，给高分，如果没有相同字，属于不排辈的正常模式，给 80 分
    if (c1Char1 === c2Char1 || (c1Char2 && c1Char2 === c2Char2)) {
      generationScore = 100;
      generationEval = `无意中形成同字排辈 (共享“${c1Char1 === c2Char1 ? c1Char1 : c1Char2}”)。`;
      matchedGeneration.push(`同字排辈：“${c1Char1 === c2Char1 ? c1Char1 : c1Char2}”`);
    } else {
      generationScore = 85;
      generationEval = '采用非排辈式起名模式，名字关联主要呈词义字形层面的轻盈对仗。';
    }
  }

  details.push({
    dimension: '同辈契合',
    score: generationScore,
    evaluation: generationEval,
    details: matchedGeneration.length > 0 ? matchedGeneration : undefined
  });

  // 6. 综合匹配分加权计算
  // 经典同源 30% + 字形契合 25% + 音律协调 20% + 词义对仗 15% + 同辈契合 10%
  const weightedScore = Math.round(
    classicScore * 0.30 +
    radicalScore * 0.25 +
    phoneticScore * 0.20 +
    semanticScore * 0.15 +
    generationScore * 0.10
  );

  let level = '略逊一筹';
  if (weightedScore >= 95) level = '天作之合';
  else if (weightedScore >= 85) level = '琴瑟和鸣';
  else if (weightedScore >= 75) level = '珠联璧合';
  else if (weightedScore >= 60) level = '平顺相照';

  return {
    totalScore: weightedScore,
    level,
    details,
    bestPoemSource
  };
}
