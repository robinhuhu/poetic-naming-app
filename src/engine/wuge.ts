import { getCharDict, getSancai } from '../services/dataLoader';


export interface GeResult {
  name: string;      // 格的名称 (如 "天格")
  stroke: number;    // 笔画数
  wuxing: string;    // 五行
  lucky: string;     // "大吉" / "中吉" / "吉" / "半吉" / "凶"
  description: string; // 81 数理描述
}

export interface WuGeResult {
  tianGe: GeResult;
  renGe: GeResult;
  diGe: GeResult;
  zongGe: GeResult;
  waiGe: GeResult;
  sancai: {
    config: string;   // 三才配置 (如 "木火土")
    lucky: string;    // 三才吉凶 (如 "大吉")
    description: string; // 三才评语
  };
  totalScore: number; // 五格综合评分 (满分 100)
}

// 81数理吉凶描述字典
const NUMEROLOGY_81: Record<number, { lucky: string; desc: string }> = {
  1: { lucky: '大吉', desc: '繁荣发达，万事顺意，富贵长寿之首领运。' },
  2: { lucky: '凶', desc: '动荡不安，波折重重，志大才疏，易生挫折。' },
  3: { lucky: '大吉', desc: '立身兴家，名利双收，才德兼备，温和吉祥。' },
  4: { lucky: '凶', desc: '前途坎坷，多灾多难，苦难折磨，意志薄弱。' },
  5: { lucky: '大吉', desc: '福禄双全，阴阳和合，生意兴隆，长寿富贵。' },
  6: { lucky: '大吉', desc: '天德相助，安稳余庆，财源广进，子孙繁荣。' },
  7: { lucky: '吉', desc: '精力旺盛，刚毅果断，克敌制胜，排除万难。' },
  8: { lucky: '吉', desc: '坚刚不拔，意志坚定，排除阻碍，终成大业。' },
  9: { lucky: '凶', desc: '名利空虚，孤独无靠，困苦多灾，多成多败。' },
  10: { lucky: '凶', desc: '雪上加霜，家运暗淡，孤立无援，万事空虚。' },
  11: { lucky: '大吉', desc: '稳健前行，富贵繁荣，兴家立业，健康长寿。' },
  12: { lucky: '凶', desc: '薄弱无力，常遭挫折，终生多劳，一生坎坷。' },
  13: { lucky: '大吉', desc: '智谋奇略，才艺双全，能言善辩，名扬四海。' },
  14: { lucky: '凶', desc: '家庭违和，骨肉分离，辛劳多灾，做事难成。' },
  15: { lucky: '大吉', desc: '谦恭做事，福泽深厚，德泽四方，富贵荣华。' },
  16: { lucky: '大吉', desc: '富贵之首领运，德高望重，一帆风顺，名成利就。' },
  17: { lucky: '吉', desc: '突破万难，权威显达，刚强不屈，排除万难。' },
  18: { lucky: '吉', desc: '有志竟成，意志坚强，排除阻碍，终成大业。' },
  19: { lucky: '凶', desc: '遮天蔽日，风云蔽日，多难多灾，怀才不遇。' },
  20: { lucky: '凶', desc: '破败之数，灾祸迭至，事与愿违，一生坎坷。' },
  21: { lucky: '大吉', desc: '首领之运，白手起家，权势尊贵，光前裕后。' },
  22: { lucky: '凶', desc: '薄弱无力，志大才疏，常遭忧患，常遭挫折。' },
  23: { lucky: '大吉', desc: '如旭日东升，权威显达，名震天下，大展宏图。' },
  24: { lucky: '大吉', desc: '白手起家，钱财丰盈，家运隆昌，子孙繁荣。' },
  25: { lucky: '吉', desc: '资性英敏，独行武断，克服万难，终获成功。' },
  26: { lucky: '半吉', desc: '英雄怪杰，多才多艺，命运波澜，成败交加。' },
  27: { lucky: '半吉', desc: '自我膨胀，易招诽谤，多成多败，宜养仁德。' },
  28: { lucky: '凶', desc: '鱼临深渊，孤立无靠，多灾多难，配偶易失。' },
  29: { lucky: '大吉', desc: '泉源丰足，才智过人，立业兴家，名利双收。' },
  30: { lucky: '半吉', desc: '命运吉凶浮沉，投机成功，成败一瞬间。' },
  31: { lucky: '大吉', desc: '志向立达，温和仁慈，有勇有谋，富贵荣华。' },
  32: { lucky: '大吉', desc: '侥幸多福，性情温和，得贵人相助，功成名就。' },
  33: { lucky: '大吉', desc: '权威独行，声名显赫，刚毅果断，富贵荣华。' },
  34: { lucky: '凶', desc: '雪上加霜，灾祸重重，万事难成，家运衰退。' },
  35: { lucky: '大吉', desc: '温和平静，优雅多才，文艺发展，富贵长寿。' },
  36: { lucky: '凶', desc: '波澜重重，侠义心肠，一生多劳，坎坷不断。' },
  37: { lucky: '吉', desc: '权威显达，德高望重，一往无前，终成大业。' },
  38: { lucky: '半吉', desc: '才艺出众，意志薄弱，宜守不宜攻，平安之数。' },
  39: { lucky: '大吉', desc: '富贵荣耀，权威独尊，子孙繁昌，富贵长寿。' },
  40: { lucky: '凶', desc: '多灾多难，胆小怕事，多劳少成，晚景凄凉。' },
  41: { lucky: '大吉', desc: '德高望重，财源广进，大图大展，终生荣华。' },
  42: { lucky: '半吉', desc: '博达多能，缺乏恒心，宜守不宜攻，平顺之数。' },
  43: { lucky: '凶', desc: '华而不实，外吉内凶，财来财去，一生多劳。' },
  44: { lucky: '凶', desc: '波折重重，劳而无功，精神苦闷，易遭灾祸。' },
  45: { lucky: '大吉', desc: '万事顺意，新生泰运，富贵名誉，一帆风顺。' },
  46: { lucky: '凶', desc: '试问坎坷不平，孤立无靠，多难多灾，晚景凄凉。' },
  47: { lucky: '大吉', desc: '子孙隆昌，发名成家，富贵长寿，福泽绵长。' },
  48: { lucky: '大吉', desc: '德泽深厚，才德兼备，顾问之星，一生平顺。' },
  49: { lucky: '半吉', desc: '吉凶各半，多成多败，晚年宜守，平安防灾。' },
  50: { lucky: '半吉', desc: '吉凶交织，一时成功，一时失败，宜稳中求进。' },
  51: { lucky: '半吉', desc: '盛极必衰，浮沉未定，宜守本分，平安之数。' },
  52: { lucky: '大吉', desc: '先见之明，有勇有谋，大图大展，富贵繁荣。' },
  53: { lucky: '半吉', desc: '内忧外患，外吉内凶，宜忍耐行事，平顺之数。' },
  54: { lucky: '凶', desc: '万事空虚，多灾多难，劳而无功，一生坎坷。' },
  55: { lucky: '半吉', desc: '盛极必衰，外表荣华，内藏忧患，宜守不宜攻。' },
  56: { lucky: '凶', desc: '坎坷不平，劳而无功，雪上加霜，多难多灾。' },
  57: { lucky: '吉', desc: '寒雪梅花，克服万难，立业兴家，终获成功。' },
  58: { lucky: '吉', desc: '先苦后甜，克服万难，立业兴家，终获成功。' },
  59: { lucky: '凶', desc: '多成多败，意志薄弱，多灾多难，晚景凄凉。' },
  60: { lucky: '凶', desc: '万事空虚，家运衰退，劳而无功，一生坎坷。' },
  61: { lucky: '吉', desc: '资性英敏，克服万难，终获成功，名成利就。' },
  62: { lucky: '凶', desc: '薄弱无力，志大才疏，多难多灾，一生坎坷。' },
  63: { lucky: '大吉', desc: '繁荣发达，万事顺意，子孙隆昌，大富大贵。' },
  64: { lucky: '凶', desc: '遮天蔽日，劳而无功，万事空虚，一生坎坷。' },
  65: { lucky: '大吉', desc: '名利双收，富贵长寿，万事顺意，一帆风顺。' },
  66: { lucky: '凶', desc: '防范坎坷不平，多难多灾，晚景凄凉，一生坎坷。' },
  67: { lucky: '吉', desc: '资性英敏，排除万难，终获成功，大富大贵。' },
  68: { lucky: '吉', desc: '有志竟成，意志坚定，排除阻碍，终成大业。' },
  69: { lucky: '凶', desc: '孤独无靠，多难多灾，晚景凄凉，一生坎坷。' },
  70: { lucky: '凶', desc: '万事空虚，家运衰退，劳而无功，一生坎坷。' },
  71: { lucky: '半吉', desc: '吉凶交织，多成多败，宜守本分，平顺之数。' },
  72: { lucky: '凶', desc: '坎坷不平，多难多灾，晚景凄凉，一生坎坷。' },
  73: { lucky: '半吉', desc: '盛极必衰，浮沉未定，宜守不宜攻，平顺之数. ' },
  74: { lucky: '凶', desc: '万事空虚，多灾多难，劳而无功，一生坎坷。' },
  75: { lucky: '半吉', desc: '吉凶交织，多成多败，宜守本分，平顺之数。' },
  76: { lucky: '凶', desc: '多难多灾，意志薄弱，一生坎坷，晚景凄凉。' },
  77: { lucky: '半吉', desc: '吉凶交织，多成多败，宜守本分，平顺之数。' },
  78: { lucky: '半吉', desc: '盛极必衰，浮沉未定，宜守不宜攻，平顺之数。' },
  79: { lucky: '凶', desc: '遮天蔽日，多灾多难，一生坎坷，晚景凄凉。' },
  80: { lucky: '凶', desc: '万事空虚，劳而无功，多难多灾，晚景凄凉。' },
  81: { lucky: '大吉', desc: '最极之数，白手起家，富贵长寿，万事顺意。' }
};

// 笔画对应五行
export function getWuXing(stroke: number): string {
  const mod = stroke % 10;
  if (mod === 1 || mod === 2) return '木';
  if (mod === 3 || mod === 4) return '火';
  if (mod === 5 || mod === 6) return '土';
  if (mod === 7 || mod === 8) return '金';
  return '水'; // 9, 0
}

// 获取单字的康熙笔画和五行
export function getCharStrokeAndWuXing(char: string): { stroke: number; wuxing: string } {
  const charDict = getCharDict();
  if (char in charDict) {
    return charDict[char];
  }
  // 如果字典中不存在该字，使用备用方案（即其默认字长，并以木属性兜底）
  return { stroke: char.length * 2, wuxing: '木' };
}

// 计算三才五格
export function calculateWuGe(lastName: string, firstName: string): WuGeResult {
  // 1. 拆分姓名汉字的笔画和五行
  const lastStrokes = lastName.split('').map(c => getCharStrokeAndWuXing(c));
  const firstStrokes = firstName.split('').map(c => getCharStrokeAndWuXing(c));

  // 计算姓氏笔画及名字笔画
  const l1 = lastStrokes[0]?.stroke || 0;
  const l2 = lastStrokes[1]?.stroke || 0;
  const m1 = firstStrokes[0]?.stroke || 0;
  const m2 = firstStrokes[1]?.stroke || 0;

  const isDoubleLastName = lastName.length >= 2;
  const isDoubleFirstName = firstName.length >= 2;

  let tian: number, ren: number, di: number, zong: number, wai: number;

  if (isDoubleLastName) {
    // 复姓
    tian = l1 + l2;
    if (isDoubleFirstName) {
      // 复姓双字名 (如 司马相如)
      ren = l2 + m1;
      di = m1 + m2;
      zong = l1 + l2 + m1 + m2;
      wai = zong - ren + 1;
    } else {
      // 复姓单字名 (如 司马懿)
      ren = l2 + m1;
      di = m1 + 1;
      zong = l1 + l2 + m1;
      wai = zong - ren + 1;
    }
  } else {
    // 单姓
    tian = l1 + 1;
    if (isDoubleFirstName) {
      // 单姓双字名 (如 刘德华)
      ren = l1 + m1;
      di = m1 + m2;
      zong = l1 + m1 + m2;
      wai = zong - ren + 1;
    } else {
      // 单姓单字名 (如 张三)
      ren = l1 + m1;
      di = m1 + 1;
      zong = l1 + m1;
      wai = 2; // 单字名单姓，外格固定为 2
    }
  }

  // 归一化到 1-81 数理范围
  const normalize = (num: number) => {
    let res = num;
    while (res > 81) res = res - 80;
    return res === 0 ? 81 : res;
  };

  const getGeResult = (name: string, stroke: number): GeResult => {
    const norm = normalize(stroke);
    const numInfo = NUMEROLOGY_81[norm] || { lucky: '吉', desc: '平稳发展。' };
    return {
      name,
      stroke,
      wuxing: getWuXing(stroke),
      lucky: numInfo.lucky,
      description: numInfo.desc,
    };
  };

  const tianGe = getGeResult('天格', tian);
  const renGe = getGeResult('人格', ren);
  const diGe = getGeResult('地格', di);
  const zongGe = getGeResult('总格', zong);
  const waiGe = getGeResult('外格', wai);

  // 2. 计算三才配置
  const sancaiDb = getSancai();
  const sancaiConfig = tianGe.wuxing + renGe.wuxing + diGe.wuxing;
  const sancaiInfo = sancaiDb[sancaiConfig] || { result: '半吉', evaluate: '三才配比一般，宜平稳行事。' };

  // 3. 评分模型 (总分 100)
  // 人格占 25 分，地格占 20 分，总格占 25 分，外格占 10 分，三才配置占 20 分
  const getLuckyScore = (lucky: string): number => {
    if (lucky === '大吉') return 100;
    if (lucky === '吉') return 85;
    if (lucky === '半吉' || lucky === '中吉') return 70;
    return 40; // 凶
  };

  const renScore = getLuckyScore(renGe.lucky) * 0.25;
  const diScore = getLuckyScore(diGe.lucky) * 0.20;
  const zongScore = getLuckyScore(zongGe.lucky) * 0.25;
  const waiScore = getLuckyScore(waiGe.lucky) * 0.10;
  const sancaiScore = getLuckyScore(sancaiInfo.result) * 0.20;

  const totalScore = Math.round(renScore + diScore + zongScore + waiScore + sancaiScore);

  return {
    tianGe,
    renGe,
    diGe,
    zongGe,
    waiGe,
    sancai: {
      config: sancaiConfig,
      lucky: sancaiInfo.result,
      description: sancaiInfo.evaluate,
    },
    totalScore,
  };
}
