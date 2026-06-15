"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// 引入需要 Mock 数据层的 dataLoader
const dataLoader = __importStar(require("../src/services/dataLoader"));
console.log('=== 正在回填本地数据 Mock 到 dataLoader ===');
try {
    // 从 src/database 备份目录读取本地 JSON 数据
    const charDict = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve('src/database/char_dict.json'), 'utf8'));
    const sancai = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve('src/database/sancai.json'), 'utf8'));
    const classics = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve('src/database/classics.json'), 'utf8'));
    const charRadical = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve('src/database/char_radical.json'), 'utf8'));
    // 劫持只读的 getter
    Object.defineProperty(dataLoader, 'getCharDict', { value: () => charDict });
    Object.defineProperty(dataLoader, 'getSancai', { value: () => sancai });
    Object.defineProperty(dataLoader, 'getClassics', { value: () => classics });
    Object.defineProperty(dataLoader, 'getCharRadical', { value: () => charRadical });
    console.log('   ✓ Mock 数据加载成功');
}
catch (err) {
    console.error('Mock 回填失败，请检查备份的 src/database 目录中 JSON 文件是否完整：', err);
    process.exit(1);
}
// 引入起名引擎的模块
const bazi_1 = require("../src/engine/bazi");
const wuge_1 = require("../src/engine/wuge");
const phonetics_1 = require("../src/engine/phonetics");
const sibling_1 = require("../src/engine/sibling");
console.log('\n=== 开始执行起名系统核心引擎单元测试 ===');
try {
    // 1. 验证生辰八字引擎
    console.log('1. 测试生辰八字推算...');
    const bazi = (0, bazi_1.calculateBaZi)(2026, 6, 8, 12);
    assert_1.default.strictEqual(bazi.eightChar.length, 4, '八字干支数应为 4 项');
    assert_1.default.strictEqual(bazi.eightChar[0], '丙午', '2026年年柱应为丙午');
    assert_1.default.strictEqual(bazi.riyuan.wuxing, '火', '日干五行应正确判定');
    console.log('   ✓ 八字排盘与喜用神推算通过');
    // 2. 验证三才五格数理引擎
    console.log('2. 测试三才五格数理及单双字名适配...');
    // 2.1 双字名测试
    const wugeDouble = (0, wuge_1.calculateWuGe)('陈', '朝雨');
    assert_1.default.ok(wugeDouble.totalScore >= 60, '合理姓名数理分应判定及格');
    assert_1.default.strictEqual(wugeDouble.tianGe.stroke, 17, '天格笔画应正确(陈16+1)');
    // 2.2 单字名测试
    const wugeSingle = (0, wuge_1.calculateWuGe)('陈', '亮');
    assert_1.default.strictEqual(wugeSingle.tianGe.stroke, 17, '单字名天格应正确');
    assert_1.default.strictEqual(wugeSingle.waiGe.stroke, 2, '单字名外格固定为 2 划');
    console.log('   ✓ 三才五格计算通过');
    // 3. 验证音律美学评估引擎
    console.log('3. 测试姓名音律平仄双声校验...');
    const phone1 = (0, phonetics_1.validateNamePhonetics)('朝', '雨');
    assert_1.default.ok(phone1.isValid, '平仄相对、发音清晰应通过');
    const phone2 = (0, phonetics_1.validateNamePhonetics)('朝', '超'); // 两个字声母都是 ch
    assert_1.default.ok(phone2.score < 90, '同声母(双声)音律应合理扣分');
    console.log('   ✓ 音韵美学分析通过');
    // 4. 验证多胎配对契合度引擎
    console.log('4. 测试多胎配偶对仗同源计算...');
    const sibling = (0, sibling_1.evaluateSiblingMatch)('陈朝雨', '陈晚晴');
    assert_1.default.strictEqual(sibling.level, '天作之合', '朝雨与晚晴构成完美词义对仗，应评为天作之合');
    console.log('   ✓ 多胎契合度评估通过');
    console.log('\n🎉 起名系统核心计算引擎全部单元测试顺利通过！');
}
catch (error) {
    console.error('\n❌ 单元测试执行失败，断言未通过：');
    console.error(error);
    process.exit(1);
}
