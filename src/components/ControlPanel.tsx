import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { calculateBaZi } from '../engine/bazi';
import { generateNames } from '../engine/generator';
import { BaziResult } from './BaziResult';

const wxDescMap: Record<string, string> = {
  '金': '主义，性刚，色白。金能收敛运势，主坚毅与果断。',
  '木': '主仁，性直，色青。木能生发运势，主生长与仁爱。',
  '水': '主智，性聪，色黑。水能滋润格局，主智慧与变通。',
  '火': '主礼，性急，色红。火能温暖命局，主热情与礼仪。',
  '土': '主信，性重，色黄。土能万物孕育，主稳重与诚信。'
};

export function ControlPanel() {
  const mode = useAppStore((s) => s.mode);

  // 表单状态与 setter
  const lastName = useAppStore((s) => s.lastName);
  const setLastName = useAppStore((s) => s.setLastName);
  const gender = useAppStore((s) => s.gender);
  const setGender = useAppStore((s) => s.setGender);
  const birthDate = useAppStore((s) => s.birthDate);
  const setBirthDate = useAppStore((s) => s.setBirthDate);
  const birthHour = useAppStore((s) => s.birthHour);
  const setBirthHour = useAppStore((s) => s.setBirthHour);
  const mustIncludeChar = useAppStore((s) => s.mustIncludeChar);
  const setMustIncludeChar = useAppStore((s) => s.setMustIncludeChar);
  const mustIncludeCharPos = useAppStore((s) => s.mustIncludeCharPos);
  const setMustIncludeCharPos = useAppStore((s) => s.setMustIncludeCharPos);
  const namingSource = useAppStore((s) => s.namingSource);
  const setNamingSource = useAppStore((s) => s.setNamingSource);
  const nameLength = useAppStore((s) => s.nameLength);
  const setNameLength = useAppStore((s) => s.setNameLength);
  const selectedClassics = useAppStore((s) => s.selectedClassics);
  const setSelectedClassics = useAppStore((s) => s.setSelectedClassics);
  const toggleClassic = useAppStore((s) => s.toggleClassic);
  const selectedElites = useAppStore((s) => s.selectedElites);
  const setSelectedElites = useAppStore((s) => s.setSelectedElites);
  const toggleElite = useAppStore((s) => s.toggleElite);

  // 八字状态与 喜用神
  const baziResult = useAppStore((s) => s.baziResult);
  const setBaziResult = useAppStore((s) => s.setBaziResult);
  const selectedWuXing = useAppStore((s) => s.selectedWuXing);
  const setSelectedWuXing = useAppStore((s) => s.setSelectedWuXing);
  const toggleWuXing = useAppStore((s) => s.toggleWuXing);

  // 多胎
  const siblingFirstName = useAppStore((s) => s.siblingFirstName);
  const setSiblingFirstName = useAppStore((s) => s.setSiblingFirstName);

  // 起名结果 & loading
  const nameList = useAppStore((s) => s.nameList);
  const setNameList = useAppStore((s) => s.setNameList);
  const loading = useAppStore((s) => s.loading);
  const setLoading = useAppStore((s) => s.setLoading);
  const addHistory = useAppStore((s) => s.addHistory);
  const resetForm = useAppStore((s) => s.resetForm);

  // 交互增强状态
  const [lastNameError, setLastNameError] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [genderTip, setGenderTip] = useState('');

  // 监听出生时间计算八字
  useEffect(() => {
    try {
      const parts = birthDate.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        const res = calculateBaZi(y, m, d, birthHour);
        setBaziResult(res);
        // 默认回填喜用神五行
        setSelectedWuXing(res.preferredWuXing);
      }
    } catch (e) {
      console.error('生辰八字计算错误:', e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Zustand store actions 引用稳定，无需列入依赖
  }, [birthDate, birthHour]);

  // 监听表单数据变更，设为 Dirty 状态以提醒重新推演
  useEffect(() => {
    if (nameList.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDirty(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastName, gender, birthDate, birthHour, selectedWuXing, mustIncludeChar, mustIncludeCharPos, namingSource, nameLength, siblingFirstName, mode, selectedClassics, selectedElites]);

  const addToast = useAppStore((s) => s.addToast);

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as 'boy' | 'girl' | 'any';
    setGender(selected);
    
    // 性别更改的轻提示反馈
    if (selected === 'boy') setGenderTip('已切换为乾造 (男宝宝) 模式');
    else if (selected === 'girl') setGenderTip('已切换为坤造 (女宝宝) 模式');
    else setGenderTip('已切换为中性任意模式');

    const timer = setTimeout(() => {
      setGenderTip('');
    }, 2500);
    return () => clearTimeout(timer);
  };

  const handleGenerate = () => {
    // 姓氏防错校验
    if (!lastName) {
      setLastNameError(true);
      addToast('请先输入宝宝的姓氏', 'warning');
      return;
    }

    // 古籍筛选防错：若选了包含古籍，但没有勾选任何古籍，则拦截
    if (namingSource !== 'elite' && selectedClassics.length === 0) {
      addToast('请至少勾选一本可选用古籍范围', 'warning');
      return;
    }

    // 精英筛选防错：若选了包含精英，但没有勾选任何分类，则拦截
    if (namingSource !== 'classics' && selectedElites.length === 0) {
      addToast('请至少勾选一种精英传承类别', 'warning');
      return;
    }

    setLastNameError(false);
    setIsDirty(false);
    setLoading(true);

    // 稍微延迟展示中式推演过渡
    setTimeout(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            const params = {
              lastName,
              gender,
              preferredWuXing: selectedWuXing,
              mustIncludeChar,
              mustIncludeCharPos,
              namingSource,
              nameLength,
              siblingFirstName: mode === 'sibling' ? siblingFirstName : undefined,
              selectedClassics,
              selectedElites,
            };
            const list = generateNames(params);
            setNameList(list);

            // 添加到历史记录
            addHistory({
              id: Math.random().toString(36).slice(2, 9),
              timestamp: Date.now(),
              params: {
                lastName,
                gender,
                birthDate,
                birthHour,
                selectedWuXing,
                mustIncludeChar,
                namingSource,
                nameLength,
                mode,
                siblingFirstName: mode === 'sibling' ? siblingFirstName : undefined,
                selectedClassics,
                selectedElites,
              },
              resultCount: list.length,
            });
            addToast('雅名推演成功，已生成候选名单！', 'success');
          } catch (e) {
            console.error('起名生成发生错误:', e);
            addToast('起名推演失败，请检查参数是否合理', 'error');
          } finally {
            setLoading(false);
          }
        }, 0);
      });
    }, 1200); // 增加推演时间，让太极罗盘和骨架屏动效展示更充分
  };

  return (
    <div className="premium-panel">
      <h3 className="font-serif border-b pb-10 mb-20 fs-18 text-left">
        设置起名推演参数
      </h3>

      <div className="control-panel-stack">
        {/* 视觉分组一：天机生辰推演 */}
        <fieldset className="form-section-group mb-0">
          <legend className="form-section-title font-serif">天机生辰推演</legend>
          
          <div className="grid-2 gap-15">
            <div className="form-group">
              <label className="form-label" htmlFor="input-last-name">姓氏 *</label>
              <input
                id="input-last-name"
                type="text"
                className={`form-input ${lastNameError ? 'input-error' : ''}`}
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value.trim());
                  if (e.target.value.trim()) {
                    setLastNameError(false);
                  }
                }}
                placeholder="如：陈"
              />
              {lastNameError && (
                <div className="error-tip-text">请输入姓氏以推算天机命局</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="select-gender">性别倾向</label>
              <select 
                id="select-gender"
                className="form-select" 
                value={gender} 
                onChange={handleGenderChange}
              >
                <option value="any">任意 (中性美)</option>
                <option value="boy">乾造 (男宝宝)</option>
                <option value="girl">坤造 (女宝宝)</option>
              </select>
              {genderTip && (
                <div className="gender-tip-text fade-in-out">{genderTip}</div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="input-birth-date">出生时间 (公历)</label>
            <div className="d-flex gap-10">
              <input
                id="input-birth-date"
                type="date"
                className="form-input flex-2"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                aria-label="出生日期"
              />
              <select
                id="select-birth-hour"
                className="form-select flex-1"
                value={birthHour}
                onChange={(e) => setBirthHour(parseInt(e.target.value, 10))}
                aria-label="出生时辰"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>{i} 时</option>
                ))}
              </select>
            </div>
          </div>

          <BaziResult />

          {baziResult && (
            <div className="form-group">
              <label className="form-label">
                喜用五行推荐 (日主本体五行: <span className="color-cinnabar font-bold">{baziResult.riyuan.wuxing}</span>，八字{baziResult.status})
              </label>
              <div className="btn-toggle-group">
                {['金', '木', '水', '火', '土'].map((wx) => {
                  const isPref = baziResult.preferredWuXing.includes(wx);
                  const isSelected = selectedWuXing.includes(wx);
                  return (
                    <button
                      key={wx}
                      type="button"
                      className={`btn-toggle ${isSelected ? 'active' : ''} ${isPref ? 'bazi-preferred' : ''}`}
                      onClick={() => toggleWuXing(wx)}
                      aria-pressed={isSelected}
                    >
                      <span className="font-bold fs-16">{wx}</span>
                      <span className={`wuxing-badge ${isPref ? 'pref' : 'custom'}`}>
                        {isPref ? '推荐' : '自选'}
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* 五行选择属性说明 */}
              <div className="wuxing-explain-box mt-10">
                {selectedWuXing.length > 0 ? (
                  selectedWuXing.map((wx) => (
                    <div key={wx} className="wuxing-explain-item fs-12">
                      <span className={`wuxing-explain-badge ${wx}`}>{wx}</span>
                      <span className="color-muted ml-10">{wxDescMap[wx]}</span>
                    </div>
                  ))
                ) : (
                  <div className="fs-12 color-muted text-center italic">请至少选择一个喜用五行进行名脉过滤</div>
                )}
              </div>
            </div>
          )}
        </fieldset>

        {/* 视觉分组二：雅名字形文脉 */}
        <fieldset className="form-section-group mb-0">
            <legend className="form-section-title font-serif">雅名字形文脉</legend>

            <div className="grid-2 gap-15">
              <div className="form-group">
                <label className="form-label" htmlFor="input-must-include-char">必含辈分字 (选填)</label>
                <input
                  id="input-must-include-char"
                  type="text"
                  className="form-input"
                  maxLength={1}
                  value={mustIncludeChar}
                  onChange={(e) => setMustIncludeChar(e.target.value.trim())}
                  placeholder="例：国"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="select-must-include-char-pos">辈分字位置</label>
                <select
                  id="select-must-include-char-pos"
                  className="form-select"
                  value={mustIncludeCharPos}
                  onChange={(e) => setMustIncludeCharPos(e.target.value as 'first' | 'second' | 'any')}
                  disabled={!mustIncludeChar}
                >
                  <option value="any">任意位置</option>
                  <option value="first">名字第一个字 (张国×)</option>
                  <option value="second">名字第二个字 (张×国)</option>
                </select>
              </div>
            </div>

            <div className="grid-2 gap-15">
              <div className="form-group">
                <label className="form-label" htmlFor="select-name-length">名字字数</label>
                <select
                  id="select-name-length"
                  className="form-select"
                  value={nameLength}
                  onChange={(e) => setNameLength(e.target.value as 'single' | 'double' | 'any')}
                >
                  <option value="double">双字名 (推荐)</option>
                  <option value="single">单字名</option>
                  <option value="any">单双混合</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="select-naming-source">名字文脉来源</label>
                <select 
                  id="select-naming-source"
                  className="form-select" 
                  value={namingSource} 
                  onChange={(e) => setNamingSource(e.target.value as 'classics' | 'elite' | 'both')}
                >
                  <option value="both">全库混合模式</option>
                  <option value="classics">纯经典古籍</option>
                  <option value="elite">纯精英人名</option>
                </select>
              </div>

              {namingSource !== 'elite' && (
                <div className="form-group col-span-2 mt-10 classics-selector-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label d-flex justify-between align-center">
                    <span>可选用古籍范围 (多选)</span>
                    <div className="classics-action-links d-flex gap-10">
                      <button
                        type="button"
                        className="text-btn fs-12 font-serif"
                        onClick={() => setSelectedClassics(['诗经', '楚辞', '论语', '周易', '唐诗', '宋词', '道德经', '庄子', '礼记', '左传', '乐府诗集'])}
                      >
                        全选
                      </button>
                      <button
                        type="button"
                        className="text-btn fs-12 font-serif"
                        onClick={() => setSelectedClassics([])}
                      >
                        清空
                      </button>
                    </div>
                  </label>
                  <div className="classics-capsules-grid mt-8">
                    {['诗经', '楚辞', '论语', '周易', '唐诗', '宋词', '道德经', '庄子', '礼记', '左传', '乐府诗集'].map((classic) => {
                      const isSelected = selectedClassics.includes(classic);
                      return (
                        <button
                          key={classic}
                          type="button"
                          className={`classic-capsule ${isSelected ? 'active' : ''}`}
                          onClick={() => toggleClassic(classic)}
                          aria-pressed={isSelected}
                        >
                          {classic}
                        </button>
                      );
                    })}
                  </div>
                  {selectedClassics.length === 0 && (
                    <div className="error-tip-text mt-5">
                      请至少选择一部古籍以进行诗意起名
                    </div>
                  )}
                </div>
              )}

              {namingSource !== 'classics' && (
                <div className="form-group col-span-2 mt-10 classics-selector-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label d-flex justify-between align-center">
                    <span>可选用精英类别 (多选)</span>
                    <div className="classics-action-links d-flex gap-10">
                      <button
                        type="button"
                        className="text-btn fs-12 font-serif"
                        onClick={() => setSelectedElites(['历史名流', '登科进士', '现代科研', '金融商业'])}
                      >
                        全选
                      </button>
                      <button
                        type="button"
                        className="text-btn fs-12 font-serif"
                        onClick={() => setSelectedElites([])}
                      >
                        清空
                      </button>
                    </div>
                  </label>
                  <div className="classics-capsules-grid mt-8">
                    {['历史名流', '登科进士', '现代科研', '金融商业'].map((elite) => {
                      const isSelected = selectedElites.includes(elite);
                      return (
                        <button
                          key={elite}
                          type="button"
                          className={`classic-capsule ${isSelected ? 'active' : ''}`}
                          onClick={() => toggleElite(elite)}
                          aria-pressed={isSelected}
                        >
                          {elite}
                        </button>
                      );
                    })}
                  </div>
                  {selectedElites.length === 0 && (
                    <div className="error-tip-text mt-5">
                      请至少选择一个精英类别以复用人名
                    </div>
                  )}
                </div>
              )}
            </div>
          </fieldset>

          {/* 视觉分组三：多胎配对选项 */}
          {mode === 'sibling' && (
            <fieldset className="form-section-group mb-0 highlight-section">
              <legend className="form-section-title font-serif color-cinnabar">多胎配对选项</legend>
              <div className="form-group mb-0">
                <label className="form-label" htmlFor="input-sibling-first-name">一胎名字 (仅名，不含姓氏)</label>
                <input
                  id="input-sibling-first-name"
                  type="text"
                  className="form-input"
                  value={siblingFirstName}
                  onChange={(e) => setSiblingFirstName(e.target.value.trim())}
                  placeholder="例如：朝雨"
                />
              </div>
            </fieldset>
          )}
      </div>

      {/* 联动反馈提示栏与操作按钮 */}
      <div className="control-action-footer mt-20">
        {isDirty && nameList.length > 0 && (
          <div className="dirty-alert-tip fade-in-up mb-10">
            * 筛选参数已改变，可点击下方按钮重新推算起名
          </div>
        )}

        <div className="d-flex gap-10">
          <button
            type="button"
            className="classic-btn flex-3"
            onClick={handleGenerate}
            disabled={loading || (namingSource !== 'elite' && selectedClassics.length === 0) || (namingSource !== 'classics' && selectedElites.length === 0)}
            aria-busy={loading}
            aria-label={loading ? '正在为您推演天机...' : (mode === 'sibling' ? '智能配对多胎起名' : '智能推算起名')}
            style={{ width: 'auto' }}
          >
            {loading ? (
              <span className="d-flex align-center justify-center gap-10">
                {/* 旋转太极 Loading 图标 */}
                <svg className="taiji-spinner-icon" viewBox="0 0 24 24">
                  <path d="M12 2A10 10 0 0 1 12 22A5 5 0 0 1 12 12A5 5 0 0 0 12 2" fill="currentColor"/>
                  <circle cx="12" cy="7" r="1.5" fill="var(--bg-color)" />
                  <circle cx="12" cy="17" r="1.5" fill="var(--classic-gold)" />
                </svg>
                <span>乾坤推演中...</span>
              </span>
            ) : (
              mode === 'sibling' ? '智能配对多胎起名' : '智能推算起名'
            )}
          </button>
          
          <button
            type="button"
            className="classic-btn border-light-all bg-gold-light-03 flex-1"
            style={{ padding: '12px', minWidth: '80px', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}
            onClick={() => {
              resetForm();
              addToast('推演配置已重置为默认值', 'info');
            }}
            disabled={loading}
            title="一键恢复所有起名参数为默认设置"
          >
            重置
          </button>
        </div>

        {loading && (
          <div className="ink-progress-bar" aria-live="polite" aria-label="正在为您推演八字五行与起名文脉，请稍候">
            <div className="ink-progress-fill"></div>
          </div>
        )}
      </div>
    </div>
  );
}
