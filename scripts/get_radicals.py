import json
import re

def extract_radicals():
    input_path = r"E:\code\video-generator\tmp\naming-refs\PiPiName\data\chaizi-ft.dat"
    output_path = r"G:\poetic-naming-app\src\database\char_radical.json"
    
    # 常见核心部首的标准映射
    standard_radicals = {
        "亻": "亻", "人": "亻",
        "氵": "氵", "水": "氵",
        "艹": "艹", "草": "艹",
        "木": "木",
        "火": "火", "灬": "火",
        "土": "土",
        "金": "金", "钅": "金",
        "女": "女",
        "口": "口",
        "王": "王", "玉": "王",
        "忄": "心", "心": "心",
        "日": "日",
        "月": "月", "肉": "月",
        "竹": "竹", "⺮": "竹",
        "讠": "言", "言": "言",
        "辶": "辶",
        "纟": "纟", "糸": "纟",
        "扌": "扌", "手": "扌",
        "石": "石",
        "雨": "雨",
        "山": "山",
        "戈": "戈",
        "犭": "犭", "犬": "犭",
        "足": "足",
        "目": "目",
        "贝": "贝", "貝": "贝",
        "车": "车", "車": "车",
        "疒": "疒",
        "禾": "禾",
        "门": "门", "門": "门"
    }
    
    radical_map = {}
    
    with open(input_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split("\t")
            if not parts:
                continue
            
            char = parts[0].strip()
            if len(char) != 1:
                continue
                
            # 我们拿第一种拆分法
            if len(parts) >= 2:
                decomp = parts[1].strip().split(" ")
                if decomp:
                    first_part = decomp[0].strip()
                    # 映射为标准部首
                    radical = standard_radicals.get(first_part, first_part)
                    # 限制部首字长，不要提取一长串
                    if len(radical) == 1:
                        radical_map[char] = radical
                    else:
                        radical_map[char] = first_part[0] if first_part else ""
                        
    # 写入 JSON
    with open(output_path, "w", encoding="utf-8") as out_f:
        json.dump(radical_map, out_f, ensure_ascii=False, indent=2)
        
    print(f"偏旁部首库成功提取！包含字数: {len(radical_map)}，输出路径: {output_path}")

if __name__ == "__main__":
    extract_radicals()
