># 诗意起名 App 优化计划

> 最后更新: 2026-06-08

---

## 目录

1. [总体策略](#1-总体策略)
2. [Phase 1 - 紧急修复 (1-2天)](#2-phase-1---紧急修复)
3. [Phase 2 - 性能优化 (2-3天)](#3-phase-2---性能优化)
4. [Phase 3 - 架构重构 (3-5天)](#4-phase-3---架构重构)
5. [Phase 4 - 功能补全 (3-5天)](#5-phase-4---功能补全)
6. [Phase 5 - 质量保障 (2-3天)](#6-phase-5---质量保障)
7. [依赖关系与排期总览](#7-依赖关系与排期总览)

---

## 1. 总体策略

按**紧急度**分 5 个阶段推进，每个阶段可独立交付、独立验证：

```
Phase 1 (紧急修复) → Phase 2 (性能) → Phase 3 (架构) → Phase 4 (功能) → Phase 5 (质量)
```

**核心原则：**
- 每个 Phase 结束后应用可正常运行，不留半成品
- 优先修 bug 和性能问题，再做架构调整
- 引入新功能前先稳固基础

---

## 2. Phase 1 - 紧急修复

**目标：** 消除已知 bug，恢复用户可感知的正确行为

### 1.1 修复 `sibling.ts` 中五行映射键名错误

- **文件:** `src/engine/sibling.ts:120`
- **问题:** `water: { ... }` 应为 `水: { ... }`
- **影响:** 水五行的 sibling 匹配评估永远查不到关系表，回退到兜底 60 分
- **改动量:** 1 行
- **验证:** 选取含"水"五行的名字对（如 "陈江海" vs "陈河清"），确认匹配评估中的"字形契合"维度给出正确的五行生克评价

### 1.2 修复 gender 参数未生效

- **文件:** `src/engine/generator.ts`
- **问题:** 用户选择"乾造"或"坤造"后，生成结果无任何性别过滤
- **改动方案:**
  1. 在 `char_dict.json` 中，部分汉字已隐含性别倾向（通过字义）。短期方案：新增一个 `gender_hint.json` 映射文件，标记常见男/女名用字
  2. 在 `generateNames` 函数中，当 `gender !== 'any'` 时，对候选字做性别倾向过滤
  3. 删除 generator.ts 末尾的 `if (gender === 'any') { // 临时消费变量 }` 垃圾代码
- **验证:** 设置 `gender='boy'` 生成名字，确认结果不含"婷""妍""婉"等明显女名用字；反之亦然

### 1.3 修复 App.tsx 卡片渲染中重复计算五格

- **文件:** `src/App.tsx` (~line 460)
- **问题:** `.map()` 内每张卡片调用 `calculateWuGe(lastName, cand.firstName)`，200 张卡片 = 200 次重复计算
- **改动方案:**
  - 方案 A（推荐）：在 `generateNames` 返回时就将 `wuge` 结果附在 `CandidateName` 上，避免前端重算
  - 方案 B：在组件内用 `useMemo` 缓存计算结果
- **改动量:** ~20 行
- **验证:** 打开 DevTools Performance 面板，对比优化前后渲染 200 张卡片的耗时

### Phase 1 验收标准

| 检查项 | 预期结果 |
|--------|----------|
| 水五行名字对匹配 | "字形契合"维度显示正确的五行生克关系 |
| 选"乾造"后生成 | 结果不含明显女名用字 |
| 选"坤造"后生成 | 结果不含明显男名用字 |
| 200 张卡片渲染 | 无明显卡顿，DevTools 无重复 `calculateWuGe` 调用 |

---

## 3. Phase 2 - 性能优化

**目标：** 解决大数据同步加载阻塞主线程、bundle 体积过大等问题

### 2.1 大 JSON 数据按需加载

- **现状:** `char_dict.json`（2MB）+ 7 个人名库 JSON（~1.5MB）在模块导入时全量同步加载
- **改动方案:**
  1. 将 `src/database/` 下的 JSON 文件移到 `public/data/`
  2. 创建 `src/services/dataLoader.ts`，用 `fetch()` 异步加载
  3. 在 `App.tsx` 首次进入时触发加载，显示 loading 骨架屏
  4. 数据加载完成后缓存到内存（单例），后续不再重复请求
- **预期效果:** 首屏渲染时间从 ~3s 降至 <1s，JS bundle 减少 ~3.5MB

### 2.2 Web Worker 卸载计算

- **现状:** `handleGenerate` 中 `setTimeout(() => {}, 200)` 是假异步，实际计算同步阻塞主线程
- **改动方案:**
  1. 创建 `src/workers/namingWorker.ts`
  2. 将 `generateNames` 整个逻辑移入 Worker
  3. 主线程通过 `postMessage` 发送参数，Worker 返回结果
  4. 删除 `setTimeout` 假延迟
- **预期效果:** 推算过程中 UI 保持流畅可交互

### 2.3 Vite 构建优化

- **现状:** 单一 3.5MB JS bundle，无代码分割
- **改动方案:**

```ts
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          lunar: ['lunar-javascript'],
        },
      },
    },
  },
});
```

- **预期效果:** 主包体积降至 <500KB，vendor 和 lunar 独立缓存

### 2.4 古籍名提取算法优化

- **现状:** 双重嵌套循环 + 每个候选字都查 charDict / 校验五行 / 计算五格
- **改动方案:**
  1. 预处理古籍库，建立**五行倒排索引**：`Map<string, string[]>`（五行 → 含该五行的字列表）
  2. 先按 `preferredWuXing` 从索引中取出候选字集，再做组合匹配
  3. 五格计算结果用 LRU 缓存（相同 `lastName + firstName` 组合不重算）
- **预期效果:** 推算耗时减少 50%+

### Phase 2 验收标准

| 检查项 | 预期结果 |
|--------|----------|
| 首次加载 | <1s 显示 UI，数据在后台异步加载 |
| 推算过程 | UI 保持流畅，无卡顿感 |
| Bundle 大小 | 主包 <500KB，gzip 后 <200KB |
| 推算耗时 | 200 个候选名生成 <500ms |

---

## 4. Phase 3 - 架构重构

**目标：** 拆分巨型组件，建立清晰的模块边界和样式体系

### 3.1 组件拆分

- **现状:** `App.tsx` 561 行，UI / 状态 / 业务逻辑全混在一起
- **改动方案:**

```
src/
  components/
    Header.tsx              # 页眉标题
    ModeTabs.tsx            # 单胎/多胎模式切换
    BaZiPanel.tsx           # 八字展示 + 五行选择
    NameSettings.tsx        # 基础设置表单（姓氏、性别、生日、辈分字）
    SiblingSettings.tsx     # 多胎模式额外设置
    SiblingEvalPanel.tsx    # 多胎两两评估面板
    ResultGrid.tsx          # 候选名列表容器
    NameCard.tsx            # 单张候选名片
    NameDetailModal.tsx     # 详情弹窗（五格表 + 多胎报告）
  hooks/
    useBaZi.ts              # 八字计算 + 状态管理
    useNameGeneration.ts    # 起名逻辑 + loading 状态
    useSiblingEval.ts       # 多胎评估逻辑
  types/
    index.ts                # 共享类型（从 engine 各模块 re-export）
```

- **App.tsx 重构后:** ~80 行，只负责组装子组件和顶层状态

### 3.2 样式体系重构

- **现状:** 12K 单一 CSS 文件 + 大量内联 `style={{...}}` 对象
- **改动方案:**
  1. 将 `App.tsx` 中所有内联样式抽到对应的 CSS 类中
  2. 采用 **CSS Modules**（Vite 原生支持 `*.module.css`），每个组件配套一个 `.module.css`
  3. 全局变量和主题保留在 `index.css`（作为 CSS 变量主题文件）
- **预期效果:** 消除渲染时的样式对象创建开销，样式作用域隔离

### 3.3 类型系统加固

- **现状:** `onChange={(e: any) => ...}` 多处强制类型断言；`charDict` 被 `as Record<string, any>` 宽泛断言
- **改动方案:**
  1. 定义 `CharInfo` 接口（`{ char, pinyin, tone, stroke, wuxing, ... }`），替换所有 `any`
  2. React 事件处理器使用正确的 `React.ChangeEvent<HTMLInputElement>` 类型
  3. 在 `tsconfig.app.json` 中启用 `strict: true`

### Phase 3 验收标准

| 检查项 | 预期结果 |
|--------|----------|
| App.tsx 行数 | <100 行 |
| 内联 style 数量 | 0 |
| TypeScript strict | 编译通过，无 `any` 类型 |
| 功能回归 | 所有原有功能正常运行 |

---

## 5. Phase 4 - 功能补全

**目标：** 补齐用户期望的核心功能

### 4.1 结果筛选与排序

- 在结果面板顶部增加筛选栏：
  - 五行筛选（多选 checkbox）
  - 笔画范围（滑块）
  - 来源筛选（古籍 / 精英 / 全部）
  - 排序方式（五格分 / 匹配分 / 笔画数）

### 4.2 分页或虚拟滚动

- 当前一次性渲染 200 张卡片
- **方案:** 使用虚拟列表（如 `react-window` 或手写 Intersection Observer 分页加载）
- 默认显示前 20 张，滚动到底部自动加载下一批

### 4.3 导出功能

- **导出为图片:** 将当前选中的名字 + 五格分析截图生成 PNG
- **导出为 PDF:** 使用 `html2canvas` + `jsPDF` 生成可打印报告
- **复制到剪贴板:** 一键复制候选名列表

### 4.4 名字收藏功能

- 用户可点击"收藏"标记喜欢的候选名
- 收藏列表持久化到 `localStorage`
- 收藏名可单独导出

### 4.5 深色模式手动切换

- **现状:** 仅跟随系统 `prefers-color-scheme`
- **改动:** 增加手动切换按钮，偏好存入 `localStorage`

### Phase 4 验收标准

| 检查项 | 预期结果 |
|--------|----------|
| 筛选功能 | 选"水"五行后列表只显示含水的名字 |
| 虚拟滚动 | 滚动 200 张卡片无卡顿 |
| 导出 | 可成功导出 PNG / PDF |
| 收藏 | 收藏后刷新页面仍在 |

---

## 6. Phase 5 - 质量保障

**目标：** 建立自动化测试和 CI 保障，防止回归

### 5.1 单元测试（引擎层）

- **测试框架:** Vitest（与 Vite 原生集成）
- **覆盖范围:**

| 模块 | 测试用例 | 优先级 |
|------|----------|--------|
| `bazi.ts` | 已知生辰的八字结果校验 | P0 |
| `bazi.ts` | 身旺/身弱/中和判断 | P0 |
| `wuge.ts` | 已知姓名的五格计算结果 | P0 |
| `wuge.ts` | 单姓/复姓 × 单名/双名 四种组合 | P1 |
| `phonetics.ts` | 同音 / 同调 / 双声 / 叠韵检测 | P1 |
| `sibling.ts` | 古籍同源检测 | P1 |
| `sibling.ts` | 五行生克评估（含修复后的水五行） | P0 |
| `generator.ts` | 空条件生成 | P1 |
| `generator.ts` | 必选字 + 五行 + 性别组合过滤 | P1 |

### 5.2 组件测试

- **测试框架:** Vitest + React Testing Library
- **覆盖范围:**
  - 表单输入 → 点击推算 → 结果列表出现
  - 模式切换 → UI 切换正确
  - 点击卡片 → 弹窗显示正确信息

### 5.3 E2E 测试（可选）

- **工具:** Playwright
- **场景:** 完整起名流程（填写表单 → 推算 → 查看详情 → 导出）

### 5.4 CI 集成

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npx vitest run
```

### 5.5 React Error Boundary

- 在 `App.tsx` 顶层包裹 Error Boundary
- 捕获计算异常时显示友好的错误提示，而非白屏

### Phase 5 验收标准

| 检查项 | 预期结果 |
|--------|----------|
| 单元测试 | 引擎层测试覆盖率 >80% |
| 组件测试 | 核心交互路径覆盖 |
| CI | push 后自动运行 lint + build + test |
| Error Boundary | 模拟异常时不白屏 |

---

## 7. 依赖关系与排期总览

```
Phase 1 (紧急修复)          ← 无依赖，立即开始
  ├── 1.1 五行键名 bug        [0.5h]
  ├── 1.2 性别过滤            [3h]
  └── 1.3 五格计算去重        [1h]

Phase 2 (性能优化)          ← 依赖 Phase 1
  ├── 2.1 数据懒加载          [4h]
  ├── 2.2 Web Worker          [4h]
  ├── 2.3 构建优化            [1h]
  └── 2.4 算法优化            [3h]

Phase 3 (架构重构)          ← 依赖 Phase 2
  ├── 3.1 组件拆分            [6h]
  ├── 3.2 样式重构            [4h]
  └── 3.3 类型加固            [2h]

Phase 4 (功能补全)          ← 依赖 Phase 3
  ├── 4.1 筛选排序            [3h]
  ├── 4.2 虚拟滚动            [3h]
  ├── 4.3 导出功能            [4h]
  ├── 4.4 收藏功能            [2h]
  └── 4.5 深色模式切换        [1h]

Phase 5 (质量保障)          ← 可与 Phase 4 并行
  ├── 5.1 引擎单元测试        [4h]
  ├── 5.2 组件测试            [3h]
  ├── 5.3 E2E 测试            [4h]
  ├── 5.4 CI 集成             [1h]
  └── 5.5 Error Boundary      [1h]
```

**预估总工时:** ~55 小时

| Phase | 工时 | 优先级 | 建议排期 |
|-------|------|--------|----------|
| Phase 1 | ~4.5h | 🔴 紧急 | 第 1 天 |
| Phase 2 | ~12h | 🟠 高 | 第 2-3 天 |
| Phase 3 | ~12h | 🟡 中 | 第 4-5 天 |
| Phase 4 | ~13h | 🟢 低 | 第 6-8 天 |
| Phase 5 | ~13h | 🟢 低 | 第 7-9 天（可与 P4 并行）|

---

## 附录：技术选型参考

| 需求 | 推荐方案 | 备选 |
|------|----------|------|
| 虚拟滚动 | `react-window` | 手写 Intersection Observer |
| 测试框架 | Vitest | Jest |
| 组件测试 | React Testing Library | Enzyme |
| E2E | Playwright | Cypress |
| CSS 方案 | CSS Modules | Tailwind / styled-components |
| PDF 导出 | `html2canvas` + `jsPDF` | `react-pdf` |
| 状态管理 | React hooks (当前) | Zustand (如状态复杂化) |
