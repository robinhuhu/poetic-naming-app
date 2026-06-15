import json
import re

def convert_sancai_txt():
    path = r"E:\code\video-generator\tmp\naming-refs\GoodGoodName\data\sancai.txt"
    out_path = r"G:\poetic-naming-app\src\database\sancai.json"
    
    sancai_db = {}
    
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # 我们用正则或规律切分。每一篇大约是：
    # 第一行: 木木木 111,222
    # 中间若干行: 评语
    # 最后一行包含: 【大吉】 【中吉】 【凶】 等
    
    # 我们可以通过查找三个五行字打头的行来分块
    # 匹配 木、火、土、金、水 的三个组合，例如 "木木木"、"金水木"
    # 我们先按行读取
    lines = content.split("\n")
    
    current_key = None
    current_text = []
    current_result = "未知"
    
    wuxing_chars = set("木火土金水")
    
    for line in lines:
        line_str = line.strip()
        if not line_str:
            continue
            
        # 如果是首行，例如 "木木木 111,222" 或 "木木木"
        # 或者是 "木金木　171282"
        # 判断前三个字是否都是五行字
        if len(line_str) >= 3 and all(c in wuxing_chars for c in line_str[:3]) and (len(line_str) == 3 or line_str[3] in " 　0123456789,"):
            # 保存上一个
            if current_key:
                sancai_db[current_key] = {
                    "result": current_result,
                    "evaluate": "\n".join(current_text).strip()
                }
            current_key = line_str[:3]
            current_text = []
            current_result = "未知"
            # 看看这一行有没有带吉凶
            res_match = re.search(r'【(.*?)】', line_str)
            if res_match:
                current_result = res_match.group(1)
        else:
            # 检查是否有吉凶
            res_match = re.search(r'【(.*?)】', line_str)
            if res_match:
                current_result = res_match.group(1)
                # 移去吉凶标记
                line_str = re.sub(r'【.*?】', '', line_str).strip()
            if line_str:
                current_text.append(line_str)
                
    # 存入最后一个
    if current_key:
        sancai_db[current_key] = {
            "result": current_result,
            "evaluate": "\n".join(current_text).strip()
        }
        
    with open(out_path, "w", encoding="utf-8") as out_f:
        json.dump(sancai_db, out_f, ensure_ascii=False, indent=2)
        
    print(f"三才数据处理完毕，共导出 {len(sancai_db)} 种配置，存至 {out_path}")

if __name__ == "__main__":
    convert_sancai_txt()
