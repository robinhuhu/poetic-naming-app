import os
import sys
import json
import re

# 添加GoodGoodName的data目录到系统路径以便导入
sys.path.append(r"E:\code\video-generator\tmp\naming-refs\GoodGoodName")
from data import full_wuxing_dict as fwd

def convert_wuxing_and_strokes():
    print("开始融合五行与笔画字典...")
    # 建立汉字 -> (五行, 笔画) 映射
    wuxing_stroke_map = {}
    
    # 融合 GoodGoodName 中的五行数据
    wuxing_dicts = [
        ('金', fwd.jin_dict),
        ('木', fwd.mu_dict),
        ('火', fwd.huo_dict),
        ('水', fwd.shui_dict),
        ('土', fwd.tu_dict)
    ]
    
    for wx_name, wx_dict in wuxing_dicts:
        for stroke_num, char_list in wx_dict.items():
            for char in char_list:
                wuxing_stroke_map[char] = {
                    "wuxing": wx_name,
                    "stroke": int(stroke_num)
                }
                
    # 读取 name-generator 中的拼音字典
    pinyin_db_path = r"E:\code\video-generator\tmp\naming-refs\name-generator\database\char_db\zd_without_muilt_tone_char_db.json"
    with open(pinyin_db_path, "r", encoding="utf-8") as f:
        pinyin_db = json.load(f)
        
    # 融合两个字典
    merged_char_dict = {}
    for char, py_info in pinyin_db.items():
        # 如果能在五行字典里找到，才认为是起名可用字
        if char in wuxing_stroke_map:
            wx_info = wuxing_stroke_map[char]
            merged_char_dict[char] = {
                "char": char,
                "pinyin": py_info["pinyin"],
                "tone": py_info["tone"],
                "pinyin_without_tone": py_info["pinyin_without_tone"],
                "initial_声母": py_info["initial_声母"],
                "initial_method": py_info.get("initial_声母类别_发音方法", ""),
                "initial_part": py_info.get("initial_声母类别_发音部位", ""),
                "vowel": py_info["vowel_韵母"],
                "vowel_type": py_info.get("vowel_韵母类别", ""),
                "wuxing": wx_info["wuxing"],
                "stroke": wx_info["stroke"],
                "count": py_info.get("count", 0)
            }
            
    # 输出合并后的常用汉字字典
    output_path = r"G:\poetic-naming-app\src\database\char_dict.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(merged_char_dict, f, ensure_ascii=False, indent=2)
    print(f"融合字典已成功输出至: {output_path}，包含字数: {len(merged_char_dict)}")


def convert_classics():
    print("开始整合古籍经典数据库...")
    classics_list = []
    
    # 1. 诗经
    shijing_path = r"E:\code\video-generator\tmp\naming-refs\PiPiName\data\诗经.json"
    if os.path.exists(shijing_path):
        with open(shijing_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            for item in data:
                sentences = []
                for paragraph in item.get("content", []):
                    # 将长句按标点打碎成子句
                    sub_sentences = re.split(r'[，。！？、；\s]', paragraph)
                    sentences.extend([s.strip() for s in sub_sentences if s.strip()])
                classics_list.append({
                    "source": "诗经",
                    "title": item.get("title", ""),
                    "chapter": f"{item.get('chapter', '')} {item.get('section', '')}".strip(),
                    "sentences": sentences
                })
        print("诗经解析完成。")

    # 2. 论语
    lunyu_path = r"E:\code\video-generator\tmp\naming-refs\PiPiName\data\论语.json"
    if os.path.exists(lunyu_path):
        with open(lunyu_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            for item in data:
                sentences = []
                for paragraph in item.get("paragraphs", []):
                    sub_sentences = re.split(r'[，。！？、；：”」“「\s]', paragraph)
                    sentences.extend([s.strip() for s in sub_sentences if s.strip()])
                classics_list.append({
                    "source": "论语",
                    "title": item.get("chapter", ""),
                    "chapter": "论语",
                    "sentences": sentences
                })
        print("论语解析完成。")

    # 3. 楚辞
    chuci_path = r"E:\code\video-generator\tmp\naming-refs\PiPiName\data\楚辞.txt"
    if os.path.exists(chuci_path):
        with open(chuci_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            current_title = "楚辞"
            sentences = []
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                # 检测标题，比如 "一、离骚" 或 "离骚" 
                title_match = re.match(r'^(?:[一二三四五六七八九十]+、)?(\w+)$', line)
                if title_match and len(line) < 15:
                    if sentences:
                        classics_list.append({
                            "source": "楚辞",
                            "title": current_title,
                            "chapter": "楚辞",
                            "sentences": sentences
                        })
                    current_title = title_match.group(1)
                    sentences = []
                else:
                    sub_sentences = re.split(r'[，。！？、；\s]', line)
                    sentences.extend([s.strip() for s in sub_sentences if s.strip()])
            if sentences:
                classics_list.append({
                    "source": "楚辞",
                    "title": current_title,
                    "chapter": "楚辞",
                    "sentences": sentences
                })
        print("楚辞解析完成。")

    # 4. 周易
    zhouyi_path = r"E:\code\video-generator\tmp\naming-refs\PiPiName\data\周易.txt"
    if os.path.exists(zhouyi_path):
        with open(zhouyi_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            current_title = "周易"
            sentences = []
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                # 判断标题，类似 "说卦", "序卦", "01. 乾"
                title_match = re.match(r'^(?:\d+\.?\s*)?(\w+)$', line)
                if title_match and len(line) < 10 and not any(c in line for c in "，。：；！？"):
                    if sentences:
                        classics_list.append({
                            "source": "周易",
                            "title": current_title,
                            "chapter": "周易",
                            "sentences": sentences
                        })
                    current_title = title_match.group(1)
                    sentences = []
                else:
                    sub_sentences = re.split(r'[，。！？、；：\s]', line)
                    sentences.extend([s.strip() for s in sub_sentences if s.strip()])
            if sentences:
                classics_list.append({
                    "source": "周易",
                    "title": current_title,
                    "chapter": "周易",
                    "sentences": sentences
                })
        print("周易解析完成。")

    # 输出合并后的经典古籍库
    output_path = r"G:\poetic-naming-app\src\database\classics.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(classics_list, f, ensure_ascii=False, indent=2)
    print(f"古籍经典库已成功输出至: {output_path}，包含篇章数: {len(classics_list)}")


def copy_elite_names():
    print("开始复制精英人名库...")
    import shutil
    src_dir = r"E:\code\video-generator\tmp\naming-refs\name-generator\database\name_db"
    dest_dir = r"G:\poetic-naming-app\src\database\names"
    
    if os.path.exists(src_dir):
        for filename in os.listdir(src_dir):
            if filename.endswith(".json"):
                src_file = os.path.join(src_dir, filename)
                dest_file = os.path.join(dest_dir, filename)
                shutil.copy(src_file, dest_file)
                print(f"已复制人名库: {filename}")
    print("精英人名库复制完毕。")


if __name__ == "__main__":
    convert_wuxing_and_strokes()
    convert_classics()
    copy_elite_names()
    print("所有数据整合完毕！")
