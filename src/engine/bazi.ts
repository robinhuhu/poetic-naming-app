import { Solar } from 'lunar-javascript';

export interface BaZiResult {
  eightChar: string[];       // [年柱, 月柱, 日柱, 时柱]
  wuxing: string[];          // [年柱五行, 月柱五行, 日柱五行, 时柱五行]
  nayin: string[];           // [年柱纳音, 月柱纳音, 日柱纳音, 时柱纳音]
  scores: {                  // 金木水火土个数
    金: number;
    木: number;
    水: number;
    火: number;
    土: number;
  };
  riyuan: {
    char: string;            // 日元汉字 (如 "丙")
    wuxing: string;          // 日元五行 (如 "火")
  };
  status: string;            // "身旺" / "身弱" / "中和"
  preferredWuXing: string[]; // 推荐的喜用神五行 (如 ["木", "火"])
}

// 五行相生：木生火，火生土，土生金，金生水，水生木
// 五行相克：木克土，土克水，水克火，火克金，金克木
const WUXING_RELATION = {
  木: { support: ['木', '水'], oppose: ['火', '土', '金'] },
  火: { support: ['火', '木'], oppose: ['土', '金', '水'] },
  土: { support: ['土', '火'], oppose: ['金', '水', '木'] },
  金: { support: ['金', '土'], oppose: ['水', '木', '火'] },
  水: { support: ['水', '金'], oppose: ['木', '火', '土'] },
};

/**
 * 根据生辰公历计算八字和喜用神
 */
export function calculateBaZi(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number = 0
): BaZiResult {
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const eightCharObj = lunar.getEightChar();

  const eightChar = [
    eightCharObj.getYear(),
    eightCharObj.getMonth(),
    eightCharObj.getDay(),
    eightCharObj.getTime(),
  ];

  const wuxing = [
    eightCharObj.getYearWuXing(),
    eightCharObj.getMonthWuXing(),
    eightCharObj.getDayWuXing(),
    eightCharObj.getTimeWuXing(),
  ];

  const nayin = [
    eightCharObj.getYearNaYin(),
    eightCharObj.getMonthNaYin(),
    eightCharObj.getDayNaYin(),
    eightCharObj.getTimeNaYin(),
  ];

  // 计算五行个数
  const scores = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
  for (const wxPair of wuxing) {
    for (const char of wxPair.split('')) {
      if (char in scores) {
        scores[char as keyof typeof scores] += 1;
      }
    }
  }

  // 获取日元 (日柱的天干)
  const riyuanChar = eightChar[2].charAt(0);
  const riyuanWuXing = eightCharObj.getDayWuXing().charAt(0);

  // 估算日元强弱 (简易得分模型)
  // 生助日元的五行 (同类 + 生我) 得分，克泄耗得分为反对力量
  const relations = WUXING_RELATION[riyuanWuXing as keyof typeof WUXING_RELATION];
  let supportScore = 0;

  for (const [wx, count] of Object.entries(scores)) {
    if (relations.support.includes(wx)) {
      supportScore += count;
    }
  }

  // 加上日支的影响力 (日支如果是生助的，权重稍微高点，这里做简单加权)
  const dayZhiWuXing = eightCharObj.getDayWuXing().charAt(1);
  if (relations.support.includes(dayZhiWuXing)) {
    supportScore += 0.5;
  }

  let status: string;
  let preferredWuXing: string[];

  if (supportScore > 4.5) {
    status = '身旺';
    // 身旺则克泄耗，排除同类及印星，推荐克我的、我克的、我生的
    // 比如日元为火，身旺，克泄耗为 土 (我生)、金 (我克)、水 (克我)
    // 找出 scores 中数量相对较少的克泄耗五行作为喜用神
    const candidates = [...relations.oppose];
    // 按照已有数量从小到大排序，优先补最缺的
    candidates.sort((a, b) => scores[a as keyof typeof scores] - scores[b as keyof typeof scores]);
    preferredWuXing = [candidates[0], candidates[1]];
  } else if (supportScore < 3.5) {
    status = '身弱';
    // 身弱则生助，推荐生我的、同我的
    const candidates = [...relations.support];
    candidates.sort((a, b) => scores[a as keyof typeof scores] - scores[b as keyof typeof scores]);
    preferredWuXing = [candidates[0], candidates[1]];
  } else {
    status = '中和';
    // 中和则取最缺的那两个五行
    const allWx = ['金', '木', '水', '火', '土'];
    allWx.sort((a, b) => scores[a as keyof typeof scores] - scores[b as keyof typeof scores]);
    preferredWuXing = [allWx[0], allWx[1]];
  }

  return {
    eightChar,
    wuxing,
    nayin,
    scores,
    riyuan: {
      char: riyuanChar,
      wuxing: riyuanWuXing,
    },
    status,
    preferredWuXing,
  };
}
