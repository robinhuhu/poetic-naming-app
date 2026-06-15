import { getCharDict } from '../services/dataLoader';


export interface PhoneticValidation {
  isValid: boolean;          // 是否音律优美
  reasons: string[];         // 扣分或不优美的具体原因
  score: number;             // 音律评分 (满分 100)
}

/**
 * 校验两个字的姓名音律组合 (不包含姓氏，例如对名字二字进行校验)
 */
export function validateNamePhonetics(char1: string, char2: string): PhoneticValidation {
  const charDict = getCharDict();
  const c1 = charDict[char1];
  const c2 = charDict[char2];

  if (!c1 || !c2) {
    return { isValid: true, reasons: [], score: 90 };
  }

  const reasons: string[] = [];
  let score = 100;

  // 1. 避同音 (禁止拼音不带声调完全一致，例如 "李里")
  if (c1.pinyin_without_tone === c2.pinyin_without_tone) {
    reasons.push(`【同音】"${char1}"与"${char2}"拼音完全相同 (${c1.pinyin_without_tone})，听起来重复拗口`);
    score -= 40;
  }

  // 2. 避同声调 (例如两个字都是一声，一声+一声，读起来平淡无起伏)
  if (c1.tone === c2.tone) {
    reasons.push(`【同调】"${char1}"与"${char2}"声调相同 (均为 ${c1.tone} 声)，缺乏声调起伏平仄变化`);
    score -= 20;
  }

  // 3. 避叠双声 (声母相同，或声母发音方法、发音部位相同，例如 "刘兰")
  if (c1.initial_声母 === c2.initial_声母) {
    reasons.push(`【双声】"${char1}"与"${char2}"声母相同 (均为 "${c1.initial_声母}")`);
    score -= 15;
  } else {
    // 进一步检测发音方法/部位冲突 (若两个声母发音部位完全一致也会拗口)
    if (c1.initial_method && c1.initial_method === c2.initial_method) {
      reasons.push(`【叠声】声母发音方法同属 "${c1.initial_method}"，发音过于相似`);
      score -= 10;
    }
    if (c1.initial_part && c1.initial_part === c2.initial_part) {
      reasons.push(`【叠声】声母发音部位同属 "${c1.initial_part}"，发音部位重合`);
      score -= 10;
    }
  }

  // 4. 避叠韵 (韵母相同，或韵母类别相同，读起来容易像绕口令，例如 "江强")
  if (c1.vowel === c2.vowel) {
    reasons.push(`【叠韵】"${char1}"与"${char2}"韵母相同 (均为 "${c1.vowel}")，读音相近易生混淆`);
    score -= 20;
  } else if (c1.vowel_type && c1.vowel_type === c2.vowel_type) {
    reasons.push(`【叠韵】韵母类别同属古韵 "${c1.vowel_type}"，韵母相近`);
    score -= 10;
  }

  return {
    isValid: score >= 60,
    reasons,
    score: Math.max(0, score),
  };
}

/**
 * 校验全名 (姓氏 + 名字，共3个字) 的平仄与音律
 */
export function validateFullNamePhonetics(lastName: string, firstName: string): PhoneticValidation {
  const xing = lastName.split('');
  const ming = firstName.split('');

  const char1 = xing[xing.length - 1]; // 姓氏最后一个字
  const char2 = ming[0];               // 名字第一个字
  const char3 = ming[1];               // 名字第二个字 (如果有)

  const reasons: string[] = [];
  let score = 100;

  // 先计算名字内部二字
  if (char2 && char3) {
    const internalVal = validateNamePhonetics(char2, char3);
    score = internalVal.score;
    reasons.push(...internalVal.reasons);
  }

  // 计算姓氏末尾与名字开头的音韵冲突 (如姓氏 "张" 与名字 "照" 拼音冲突)
  if (char1 && char2) {
    const charDict = getCharDict();
    const c1 = charDict[char1];
    const c2 = charDict[char2];

    if (c1 && c2) {
      if (c1.pinyin_without_tone === c2.pinyin_without_tone) {
        reasons.push(`【姓氏冲突】姓氏末字"${char1}"与名字首字"${char2}"同音，发音重复`);
        score -= 25;
      }
      if (c1.initial_声母 === c2.initial_声母) {
        reasons.push(`【姓氏双声】姓氏末字"${char1}"与名字首字"${char2}"声母相同 ("${c1.initial_声母}")，比较难读`);
        score -= 10;
      }
      if (c1.vowel === c2.vowel) {
        reasons.push(`【姓氏叠韵】姓氏末字"${char1}"与名字首字"${char2}"韵母相同 ("${c1.vowel}")，产生叠韵`);
        score -= 10;
      }
    }
  }

  return {
    isValid: score >= 60,
    reasons,
    score: Math.max(0, score),
  };
}
