import assert from 'assert';
import fs from 'fs';
import path from 'path';

// 引入需要 Mock 数据层的 dataLoader
import * as dataLoader from '../src/services/dataLoader';

console.log('=== 正在回填本地数据 Mock 到 dataLoader ===');

try {
  // 从 src/database 备份目录读取本地 JSON 数据
  const charDict = JSON.parse(fs.readFileSync(path.resolve('src/database/char_dict.json'), 'utf8'));
  const sancai = JSON.parse(fs.readFileSync(path.resolve('src/database/sancai.json'), 'utf8'));
  const classics = JSON.parse(fs.readFileSync(path.resolve('src/database/classics.json'), 'utf8'));
  const charRadical = JSON.parse(fs.readFileSync(path.resolve('src/database/char_radical.json'), 'utf8'));

  // 通过新接口注入 Mock 数据
  dataLoader.setMockData(charDict, sancai, classics, charRadical);

  console.log('   ✓ Mock 数据加载成功');
} catch (err) {
  console.error('Mock 回填失败，请检查备份的 src/database 目录中 JSON 文件是否完整：', err);
  process.exit(1);
}

// 引入起名引擎的模块
import { calculateBaZi } from '../src/engine/bazi';
import { calculateWuGe } from '../src/engine/wuge';
import { validateNamePhonetics } from '../src/engine/phonetics';
import { evaluateSiblingMatch } from '../src/engine/sibling';

console.log('\n=== 开始执行起名系统核心引擎单元测试 ===');

try {
  // 1. 验证生辰八字引擎
  console.log('1. 测试生辰八字推算...');
  const bazi = calculateBaZi(2026, 6, 8, 12);
  assert.strictEqual(bazi.eightChar.length, 4, '八字干支数应为 4 项');
  assert.strictEqual(bazi.eightChar[0], '丙午', '2026年年柱应为丙午');
  assert.strictEqual(bazi.riyuan.wuxing, '水', '日干五行应正确判定');
  console.log('   ✓ 八字排盘与喜用神推算通过');

  // 2. 验证三才五格数理引擎
  console.log('2. 测试三才五格数理及单双字名适配...');
  // 2.1 双字名测试
  const wugeDouble = calculateWuGe('陈', '朝雨');
  assert.ok(wugeDouble.totalScore >= 60, '合理姓名数理分应判定及格');
  assert.strictEqual(wugeDouble.tianGe.stroke, 17, '天格笔画应正确(陈16+1)');
  
  // 2.2 单字名测试
  const wugeSingle = calculateWuGe('陈', '亮');
  assert.strictEqual(wugeSingle.tianGe.stroke, 17, '单字名天格应正确');
  assert.strictEqual(wugeSingle.waiGe.stroke, 2, '单字名外格固定为 2 划');
  console.log('   ✓ 三才五格计算通过');

  // 3. 验证音律美学评估引擎
  console.log('3. 测试姓名音律平仄双声校验...');
  const phone1 = validateNamePhonetics('晨', '雨');
  assert.ok(phone1.isValid, '平仄相对、发音清晰应通过');
  
  const phone2 = validateNamePhonetics('陆', '丽'); // 两个字声母都是 l
  assert.ok(phone2.score < 90, '同声母(双声)音律应合理扣分');
  console.log('   ✓ 音韵美学分析通过');

  // 4. 验证多胎配对契合度引擎
  console.log('4. 测试多胎配偶对仗同源计算...');
  const sibling = evaluateSiblingMatch('陈朝雨', '陈晚晴');
  assert.strictEqual(sibling.level, '平顺相照', '朝雨与晚晴在无同源古籍和偏旁互补时，应评为平顺相照');
  console.log('   ✓ 多胎契合度评估通过');

  console.log('\n🎉 起名系统核心计算引擎全部单元测试顺利通过！');
} catch (error) {
  console.error('\n❌ 单元测试执行失败，断言未通过：');
  console.error(error);
  process.exit(1);
}
