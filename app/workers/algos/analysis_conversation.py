# ================== 常量与路径 ==================
import json
import os
import tiktoken
from app.utils.llm_selector import chat_with_llm

TAXONOMY_PATH = os.path.join(os.path.dirname(__file__), "dialogue_taxonomy_en_full.json")
RELATION_PATH = os.path.join(os.path.dirname(__file__), "event_relationship.json")

# ---- one process for all -----；

ONE_IN_ALL_PROMPT_V0 = """
You are a dialogue segmentation and analysis expert. You will receive conversations in JSON format, where each utterance follows:
{{
  "index": 3,
  "speaker": "SPEAKER_00"/Tom,  # Speaker ID or name
  "content": "Example utterance."
}}

Your tasks:

## Task 1: Segmentation & Suspicious Utterances

### Segmentation Guidelines
- Segment the conversation into coherent, logically complete topic blocks ("segments") **only when** there is a clear, sustained shift in topic or purpose, and the new topic has been substantially discussed (i.e., multiple related utterances, not just a passing mention).
- **Avoid over-segmentation. Segments must be long and information-rich.** Segments that are too short (less than 3–5 meaningful utterances) or that cover only small talk, brief clarifications, or unimportant exchanges are NOT allowed.
- **A single segment may cover multiple closely related topics** if these topics are discussed together or naturally intertwined. Do NOT force a segment to map to exactly one topic/subtopic; prioritize segment length, completeness, and conversational flow.
- If some minor, peripheral, or tangential topics are discussed only briefly (e.g., in 1–2 turns), **do NOT start a new segment for these.** Instead, include them in the broader segment until there is enough depth for a natural, substantial break.
- Only segment at **natural, major logical boundaries.** Wait for a true topic shift and sufficient development before splitting. If unsure, prefer **fewer, longer segments** over excessive splits.
- Segments should maximize user reading experience, ensuring each block contains a meaningful chunk of the conversation (i.e., a self-contained discussion or a logical set of related discussions).
- **Never create a segment consisting solely of a single topic if this would lead to fragmentation or loss of conversational context.**

Minimize segments; aim for logical completeness and substantial coverage.

### Suspicious Utterances
Flag clearly irrelevant utterances only if highly confident, e.g.:
- Background noise, unrelated conversations, media playback.

Explain flagged utterances briefly in `suspicious_reason`.

**Constraints:**
- Do NOT paraphrase or output utterance content.
- Cover all utterances without overlaps or omissions.

## Task 2: Segment Analysis
For each segment:
- **Classify and Summarize:**
  - Determine topic/subtopic using provided taxonomy; reuse unless clearly changed.
  - Create a concise, specific `current_title`.
  - Update cumulative summary; avoid repetition.
  - Maintain 3–5 concise, readable hashtags:
    - Start from previous hashtags.
    - Add only for significant new topics.
    - Avoid acronyms or complex phrases.
  - If unclear, set topic/subcategory to `null`.

## Task 3: Attention Items Extraction
Extract actionable items clearly indicating follow-ups or important notes, structured as:
- `type`: To-Do, Schedule, Reminder, Note
- `description`: Short, exact action description.
- `date`: Specific date or "unspecified"
- `related_people`: Person involved or "unspecified"
- `source_text`: List of related utterance indices (e.g., [1,2])
- `temporal`: Choose ONE:
  - Atemporal (valid_from = valid_to = "NA")
  - Static (provide `valid_from`)
  - Dynamic (provide both `valid_from`, `valid_to`)

## Task 4: Speaker Identity Inference
Maintain/update `speaker_role` mapping:
- Keyed by Speaker ID or name (e.g., "SPEAKER_00", "Tom"):
  - `name`: Given or Infer from dialogue or "unknown"
  - `role_info`: Job/social role or "unknown"
  - `other_identity`: Relationships, nicknames, or "unknown"
- Only update with explicit new information.

## Task 5: Extract named individuals (named_of_context) in content:
- name: clear references(name) only (e.g., \"Tracy\", \"Dr. Smith\")
- type: family / work / travelling, or unknown
- related_to: speaker ID, e.g., \"Speaker_01\", or \"unknown\" 
- role: e.g., \"daughter\", \"friend\", or \"unknown\"

## Output JSON Format (no additional text) and example
Ensure your entire output is enclosed within a JSON object. Do NOT output plain text or comments outside JSON. Here is the example:
{{
  "segments": [
    {{
      "chunk_range": [0,12],
      "reason": "Brief reason for segmentation.",
      "current_title": "Concise segment title",
      "summary": "Updated cumulative summary.",
      "main_topic": {{"name": "", "description": ""}},
      "subcategory": {{"name": "", "description": ""}},
      "hashtags": ["#Tag1", "#Tag2"],
      "attention_items": [
                    {{
                    "type": "To-Do",
                    "description": "Action description.",
                    "date": "YYYY-MM-DD/unspecified",
                    "related_people": "Name/unspecified/Speaker ID",
                    "source_text": [1,2],
                    "temporal": "Atemporal|Static|Dynamic",
                    "valid_from": "YYYY-MM-DD/NA",
                    "valid_to": "YYYY-MM-DD/NA"
                    }}
        ]，
      "suspicious_utterances": [
            {{"index": 5, "suspicious_reason": "Brief reason for suspicion."}}]
  ],
  "speaker_role": [
    {{"speaker_id": "SPEAKER_01", name": "Jack", "role_info": "customer", "other_identity": "Tom's wife"}},
    {{"speaker_id": "NA", "name": "Tom", "role_info": "Writer", "other_identity": "Larua's wife"}}
  ],
  "named_of_context": [
    {{"name": "Tracy", "type": "family", "related_to": "SPEAKER_01", "role": "mother"}}
  ]
}}

--- Conversation (JSON) ---
{conversation_json_str}

--- Taxonomy Brief ---
{taxonomy_brief}
"""
# Change log: 
# attention items: for index to locate the source, expand also the context, allowing for disjoint utterances. 
# add relations -> event relations...
# change unknown, unspecified, NA -> null
# Add event relationship extraction (Task 6)
# change the input conversation format to save the token
ONE_IN_ALL_PROMPT = """
You are a dialogue segmentation and analysis expert. You will receive conversations in JSON format, where each utterance follows:
{{
  "index": 3,
  "speaker": "SPEAKER_00"/Tom,  # Speaker ID or name
  "content": "Example utterance."
}}

Your tasks:

## Task 1: Segmentation & Suspicious Utterances

### Segmentation Guidelines
- Segment the conversation into coherent, logically complete topic blocks ("segments") **only when** there is a clear, sustained shift in topic or purpose, and the new topic has been substantially discussed (i.e., multiple related utterances, not just a passing mention).
- **Avoid over-segmentation. Segments must be long and information-rich.** Segments that are too short (less than 3–5 meaningful utterances) or that cover only small talk, brief clarifications, or unimportant exchanges are NOT allowed.
- **A single segment may cover multiple closely related topics** if these topics are discussed together or naturally intertwined. Do NOT force a segment to map to exactly one topic/subtopic; prioritize segment length, completeness, and conversational flow.
- If some minor, peripheral, or tangential topics are discussed only briefly (e.g., in 1–2 turns), **do NOT start a new segment for these.** Instead, include them in the broader segment until there is enough depth for a natural, substantial break.
- Only segment at **natural, major logical boundaries.** Wait for a true topic shift and sufficient development before splitting. If unsure, prefer **fewer, longer segments** over excessive splits.
- Segments should maximize user reading experience, ensuring each block contains a meaningful chunk of the conversation (i.e., a self-contained discussion or a logical set of related discussions).
- **Never create a segment consisting solely of a single topic if this would lead to fragmentation or loss of conversational context.**

Minimize segments; aim for logical completeness and substantial coverage.

### Suspicious Utterances
Flag clearly irrelevant utterances only if highly confident, e.g.:
- Background noise, unrelated conversations, media playback.

Explain flagged utterances briefly in `suspicious_reason`.

**Constraints:**
- Do NOT paraphrase or output utterance content.
- Cover all utterances without overlaps or omissions.

## Task 2: Segment Analysis
For each segment:
- **Classify and Summarize:**
  - Determine topic/subtopic using provided taxonomy; reuse unless clearly changed.
  - Create a concise, specific `current_title`.
  - Update cumulative summary; avoid repetition.
  - Maintain 3–5 concise, readable hashtags:
    - Start from previous hashtags.
    - Add only for significant new topics.
    - Avoid acronyms or complex phrases.
  - If unclear, set topic/subcategory to `null`.

## Task 3: Attention Items Extraction
Extract actionable items clearly indicating follow-ups or important notes, structured as:
- `type` (str): One of "To-Do" | "Schedule" | "Reminder" | "Note".
- `description` (str): Short, exact action description.
- `priority` (str|null): If type is "To-Do", required one of "low" | "medium" | "high"; Otherwise, always null.
- `related_people` (str|null): Person involved; Comma-separated.
- `source_text` (number[]): List of all directly relevant utterance indices; include extra context indices even if disjoint. Must reference valid indices within the segment's `chunk_range` only.
- `temporal` (str): One of "Atemporal" (valid_from = valid_to = null) | "Static" (provide `valid_from`) | "Dynamic" (provide both `valid_from`, `valid_to`)
- `valid_from` (str|null): Start time of the item in ISO format or null.
- `valid_to` (str|null): End time of the item in ISO format or null.

## Task 4: Speaker Identity Inference
Maintain/update `speaker_role` mapping:
- Keyed by Speaker ID or name (e.g., "SPEAKER_00", "Tom"):
  - `name`: Given or Infer from dialogue or null
  - `role_info`: Job/social role or null
  - `other_identity`: Relationships, nicknames, or null
- Only update with explicit new information.

## Task 5: Extract named individuals (named_of_context) in content:
- name: clear references(name) only (e.g., \"Tracy\", \"Dr. Smith\")
- type: family / work / travelling, or null
- related_to: speaker ID, e.g., \"Speaker_01\", or null 
- role: e.g., \"daughter\", \"friend\", or null

## Task 6: Event Graph Relationship Extraction
Extract relationships between segments ("events") using the predefined relationship types provided in `event_relationships.json`. Each relationship entry must contain:
- source_event: the `chunk_range` of the source segment  
  **Note: Must exactly match the `chunk_range` values from Task 1.**
- target_event: the `chunk_range` of the target segment  
  **Note: Must exactly match the `chunk_range` values from Task 1.**
- relationship_type: one of the allowed types defined in the external JSON schema
- confidence: a float value between 0.0 and 1.0 indicating the confidence level of the relationship
- reason: a brief justification based strictly on dialogue content

**Constraints:**
- Only extract relationships that are *clearly and explicitly* supported by the dialogue content.
- Do *not* make speculative or weakly supported inferences.
- Ensure that `source_event` and `target_event` match the exact `chunk_range` arrays generated in Task 1 (same values, same order).
- Treat each segment from Task 1 as a node (Event) in the event graph.
- Multiple edges between the same event pair are permitted if they reflect different relationship types.
- Ignore event pairs with no clear relationship — prioritize **precision over recall**.


## Output JSON Format (no additional text) and example
Ensure your entire output is enclosed within a JSON object. Do NOT output plain text or comments outside JSON. Here is the example:
{{
  "segments": [
    {{
      "chunk_range": [0,12],
      "reason": "Brief reason for segmentation.",
      "current_title": "Concise segment title",
      "summary": "Updated cumulative summary.",
      "main_topic": {{"name": "", "description": ""}},
      "subcategory": {{"name": "", "description": ""}},
      "hashtags": ["#Tag1", "#Tag2"],
      "attention_items": [
                    {{
                    "type": "To-Do",
                    "description": "Action description.",
                    "priority": "low",
                    "related_people": "Tim, Mary",
                    "source_text": [3,4,7,10],
                    "temporal": "Static",
                    "valid_from": "2025-08-23T16:45:42+00:00",
                    "valid_to": null
                    }}
        ],
      "suspicious_utterances": [
            {{"index": 5, "suspicious_reason": "Brief reason for suspicion."}}]
  ],
  "speaker_role": [
    {{"speaker_id": "SPEAKER_01", "name": "Jack", "role_info": "customer", "other_identity": null}},
    {{"speaker_id": null, "name": "Tom", "role_info": "Writer", "other_identity": null}}
  ],
  "named_of_context": [
    {{"name": "Tracy", "type": "family", "related_to": "SPEAKER_01", "role": "mother"}}
  ],
  "event_relationships": [
    {{
      "source_event": {{"chunk_range": [0,12]}},
      "target_event": {{"chunk_range": [13,22]}},
      "relationship_type": "follow_up",
      "confidence": 0.95,
      "reason": "short reason for relationship."
    }}
  ]
}}

--- Conversation (JSON) ---
{conversation_json_str}

--- Taxonomy Brief ---
{taxonomy_brief}

--- Event Relationship Definitions ---
{event_relationship_definitions}
"""

CONVERSATION_SUMMARY_PROMPT = """
You are a precise conversation summarizer.

Given several topic-slice summaries from one long conversation, produce:
- title: 5–10 words, Title Case.
- summary: 30–50 words covering goals, decisions, actions, context.
- topics: 3–5 short noun phrases; no sentences or duplicates.

Return ONLY valid JSON:
{{
  "title": string,
  "summary": string,
  "topics": string[]
}}

SLICES:
{segments}
"""


def extract_event_relationship_definitions(json_path=None):
    """
    Load event relationship definitions from event_relationships.json.
    If not found, return a brief placeholder.
    """
    if json_path is None:
        json_path = os.path.join(os.path.dirname(__file__), "..", "Conversation_process", "event_relationships.json")
    if not os.path.exists(json_path):
        return "No event relationship definitions found."
    with open(json_path, 'r', encoding='utf-8') as f:
        definitions = json.load(f)
    lines = []
    for rel_type, info in definitions.items():
        desc = info.get("description", "")
        lines.append(f"- {rel_type}: {desc}")
    return '\n'.join(lines)


# ================== 工具函数 ==================
# 保存调试用的 JSON 文件
def save_json_debug(data, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# 提取 taxonomy 简要结构，供 prompt 使用
def extract_taxonomy_full_brief(json_path=TAXONOMY_PATH):
    with open(json_path, 'r', encoding='utf-8') as f:
        taxonomy = json.load(f)
    lines = []
    for l1_name, l1_info in taxonomy.items():
        lines.append(f"# {l1_name}")
        subcats = l1_info.get('subcategories', {})
        if subcats:
            lines.append(f"  - Subcategories:")
            for l2_name, l2_info in subcats.items():
                lines.append(f"    * {l2_name}")
    return '\n'.join(lines)

# 提取 event relationship 定义文本，供 prompt 使用
def extract_event_relationship_definitions(json_path=RELATION_PATH):
    """
    Extracts event relationship definitions from the JSON file and outputs them in a taxonomy-style format:
    # relationship_type
      - Description:
        * description
    """
    if not os.path.exists(json_path):
        return "No event relationship definitions found."
    with open(json_path, 'r', encoding='utf-8') as f:
        definitions = json.load(f)
    rel_list = definitions.get("relationship_definitions", [])
    lines = []
    for rel in rel_list:
        rel_type = rel.get("type", "")
        desc = rel.get("description", "")
        lines.append(f"# {rel_type}\n  - Description:    * {desc}")
    return '\n'.join(lines)

# 只保留 index、speaker、content 字段，简化 utterances
def filter_utterances_minimal(utterances):
    filtered = []
    for idx, utt in enumerate(utterances):
        filtered.append({
            'index': idx, # this is very important
            'speaker': utt.get("speaker_name") if utt.get("speaker_name") else utt.get('speaker_id'),
            'content': utt.get('sentence')
        })
    return filtered

# 构建完整分段分析 prompt
# 支持保存调试用 prompt 到文件
def build_full_dialogue_segmentation_prompt(conversation_json, save_debug=False, debug_path=None):
    if isinstance(conversation_json, list):
        conversation_json = filter_utterances_minimal(conversation_json)
        conversation_json_str = json.dumps(conversation_json, ensure_ascii=False, indent=2)
    else:
        conversation_json_str = conversation_json
    prompt = ONE_IN_ALL_PROMPT.format(conversation_json_str=conversation_json_str, taxonomy_brief=extract_taxonomy_full_brief(),event_relationship_definitions=extract_event_relationship_definitions())
    if save_debug and debug_path:
        os.makedirs(os.path.dirname(debug_path), exist_ok=True)
        with open(debug_path, 'w', encoding='utf-8') as f:
            f.write(prompt)
    return prompt

# 将原始 utterances 按 chunk_range 加入每个 segment
def insert_current_chunk_to_segments(conversation, segments):
    for seg in segments:
        if 'chunk_range' in seg and isinstance(seg['chunk_range'], list):
            start, end = seg['chunk_range'][0], seg['chunk_range'][-1]
            seg['current_chunk'] = [conversation[i] for i in range(start, end + 1) if i < len(conversation)]
    return segments

# 按 offset 调整分段、attention_items、suspicious_utterances 的 index
# 用于多段拼接时 index 对齐
def adjust_indices_for_segment(seg, offset):
    if 'chunk_range' in seg and isinstance(seg['chunk_range'], list):
        seg['chunk_range'] = [i + offset for i in seg['chunk_range']]
    if 'attention_items' in seg:
        for item in seg['attention_items']:
            indices = item.get('source_text', [])
            if isinstance(indices, int):
                item['source_text'] = [indices + offset]
            elif isinstance(indices, list):
                item['source_text'] = [idx + offset for idx in indices]
            elif isinstance(indices, str):
                try:
                    indices_list = json.loads(indices)
                    if isinstance(indices_list, list):
                        item['source_text'] = [idx + offset for idx in indices_list]
                    else:
                        item['source_text'] = [indices_list + offset]
                except Exception:
                    item['source_text'] = [indices]
    if 'suspicious_utterances' in seg:
        for item in seg['suspicious_utterances']:
            if 'index' in item and isinstance(item['index'], int):
                item['index'] = item['index'] + offset

# 按 offset 调整 event_relationships 的 chunk_range
# 用于多段拼接时 event graph 对齐
def adjust_event_relationship_indices(event_relationships, offset):
    for rel in event_relationships:
        for key in ["source_event", "target_event"]:
            if key in rel and "chunk_range" in rel[key]:
                rel[key]["chunk_range"] = [i + offset for i in rel[key]["chunk_range"]]
    return event_relationships

# attention_items 剔除 source_text index 落在 overlap 区间的条目
# 用于分段拼接时去除重复/冲突
def filter_attention_items(items, overlap_start, overlap_end):
    filtered = []
    for item in items:
        indices = item.get('source_text', [])
        if isinstance(indices, int):
            indices = [indices]
        if isinstance(indices, str):
            try:
                indices = json.loads(indices)
            except Exception:
                indices = [indices]
        if not any(isinstance(idx, int) and overlap_start <= idx <= overlap_end for idx in indices):
            filtered.append(item)
    return filtered

# suspicious_utterances 剔除 index 落在 overlap 区间的条目
# 用于分段拼接时去除重复/冲突
def filter_suspicious_utterances(items, overlap_start, overlap_end):
    return [item for item in items if not (overlap_start <= item.get('index', -1) <= overlap_end)]

# 合并去重的字典列表，保持第一次出现的顺序
# 用于 speaker_role/named_of_context 等合并
def merge_unique_dict_list(dict_list, key_func, merge_func):
    seen = []
    result = []
    for item in dict_list:
        unique_key = key_func(item)
        if unique_key is None:
            continue
        found = False
        for existing_item in seen:
            if merge_func(existing_item, item):
                found = True
                break
        if not found:
            result.append(item)
            seen.append(item)
    return result

# ================== 主分析流程 ==================
def analyze_conversation_with_one_in_all(
    conversation,
    temperature=0.2,
    max_tokens=4096,
    max_retry=3
):
    """
    用 ONE_IN_ALL_PROMPT 对对话进行分段和分析。
    conversation: List[Dict]，每个元素包含 index, speaker, content
    taxonomy_brief: str，简化版分类体系
    可选参数：temperature, max_tokens, max_retry
    """
    def check_suspicious_in_segments(segments, suspicious_utterances):
        segment_ranges = []
        for seg in segments:
            if 'chunk_range' in seg and isinstance(seg['chunk_range'], list):
                start, end = seg['chunk_range'][0], seg['chunk_range'][-1]
                segment_ranges.append((start, end))
        invalid_indices = []
        # Assign suspicious_utterances to segments and collect invalids as [seg_id, suspicious_id]
        for seg_id, seg in enumerate(segments):
            seg_start, seg_end = None, None
            if 'chunk_range' in seg and isinstance(seg['chunk_range'], list):
                seg_start, seg_end = seg['chunk_range'][0], seg['chunk_range'][-1]
            seg_suspicious = []
            for suspicious_id, item in enumerate(suspicious_utterances):
                idx = item.get('index')
                if seg_start is not None and seg_end is not None and seg_start <= idx <= seg_end:
                    seg_suspicious.append(item)
                else:
                    # Only add if this suspicious index is not covered by any segment
                    if not any(start <= idx <= end for start, end in segment_ranges):
                        invalid_indices.append([seg_id, suspicious_id])
            if seg_suspicious:
                seg['suspicious_utterances'] = seg_suspicious
        if invalid_indices:
            print(f"[WARNING] suspicious_utterances indices not in any segment range: {invalid_indices}")
        return invalid_indices

    def check_segment_overlap(segments):
        index_coverage = set()
        overlap_indices = set()
        for seg in segments:
            if 'chunk_range' in seg and isinstance(seg['chunk_range'], list):
                start, end = seg['chunk_range'][0], seg['chunk_range'][-1]
                for idx in range(start, end + 1):
                    if idx in index_coverage:
                        overlap_indices.add(idx)
                    index_coverage.add(idx)
        if overlap_indices:
            print(f"[WARNING] Segment overlap detected at indices: {sorted(list(overlap_indices))}")
        return sorted(list(overlap_indices))

    prompt = build_full_dialogue_segmentation_prompt(conversation)
    response = None
    parsed_response = None
    for retry in range(max_retry):
        response = chat_with_qwen(prompt, temperature=temperature, max_tokens=max_tokens)
        try:
            parsed_response = json.loads(response)
        except Exception as e:
            Error_Message = str(e)
            print(f"[ERROR] JSON parsing failed: {Error_Message}")
            for _ in range(3):
                fix_prompt = (
                    f"Please strictly convert the following content to a valid JSON object. "
                    f"If there is any error, please fix it. "
                    f"The original error was: {Error_Message}\n"
                    f"Content to fix:\n{response}"
                )
                fixed_response = chat_with_qwen(fix_prompt, temperature=0.1, max_tokens=max_tokens)
                try:
                    parsed_response = json.loads(fixed_response)
                    break
                except Exception as inner_e:
                    Error_Message = str(inner_e)
                    print(f"[ERROR] JSON correction failed: {Error_Message}")
                    continue
        segments = parsed_response.get('segments', []) if parsed_response else []
        suspicious_utterances = parsed_response.get('suspicious_utterances', []) if parsed_response else []
        all_indices = set(range(len(conversation)))
        covered = set()
        for seg in segments:
            if 'chunk_range' in seg and isinstance(seg['chunk_range'], list):
                covered.update(range(seg['chunk_range'][0], seg['chunk_range'][-1]+1))
        missing_indices = sorted(list(all_indices - covered))
        if missing_indices:
            print(f"[ERROR] Missing utterance indices in segmentation: {missing_indices}")
            prompt += f"\n\n[Note] The last output did not cover all utterance indices, missing: {missing_indices}. Please make sure to cover all utterance indices and avoid overlap."
        else:
            break
    event_relationships = parsed_response.get('event_relationships', []) if parsed_response else []
    # 检查 event_relationships 的合法性
    valid_chunk_ranges = [seg['chunk_range'] for seg in segments if 'chunk_range' in seg]
    valid_event_relationships = []
    for rel in event_relationships:
        src = rel.get('source_event', {}).get('chunk_range')
        tgt = rel.get('target_event', {}).get('chunk_range')
        if src in valid_chunk_ranges and tgt in valid_chunk_ranges:
            valid_event_relationships.append(rel)
        else:
            print(f"[WARNING] Invalid event_relationship: src={src}, tgt={tgt} not in segments chunk_range.")
    speaker_role = parsed_response.get('speaker_role', []) if parsed_response else []
    named_of_context = parsed_response.get('named_of_context', []) if parsed_response else []
    # 计算 missing_indices
    all_indices = set(range(len(conversation)))
    covered = set()
    for seg in segments:
        if 'chunk_range' in seg and isinstance(seg['chunk_range'], list):
            covered.update(range(seg['chunk_range'][0], seg['chunk_range'][-1]+1))
    missing_indices = sorted(list(all_indices - covered))
    invalid_suspicious_indices = check_suspicious_in_segments(segments, suspicious_utterances)
    overlap_indices = check_segment_overlap(segments)
    result = {
        'segments': segments,
        'speaker_role': speaker_role,
        'named_of_context': named_of_context,
        'event_relationships': valid_event_relationships,
        'missing_indices': missing_indices,
        'invalid_suspicious_indices': invalid_suspicious_indices,
        'overlap_indices': overlap_indices
    }
    return result

def analyze_conversation_with_threshold(
    conversation,
    max_input_token=12800,
    temperature=0.2,
    max_tokens=4096,
    max_retry=3,
    model_name="gpt-3.5-turbo",
    save_prompt_debug=False
):
    n = len(conversation)
    results_segments = []
    all_speaker_roles = []
    all_named_contexts = []
    all_event_relationships = []
    results_missing_indices = []
    results_invalid_suspicious_indices = []
    results_overlap_indices = []
    offset = 0
    print(f"Total utterances: {n}, max_input_token: {max_input_token}, model_name: {model_name}")
    while offset < n:
        enc = tiktoken.encoding_for_model(model_name)
        end = offset
        while end < n:
            test_chunk = conversation[offset:end+1]
            prompt = build_full_dialogue_segmentation_prompt(test_chunk, save_debug=False)
            token_count = len(enc.encode(prompt))
            if token_count > max_input_token:
                if end == offset:
                    break
                else:
                    end -= 1
                    break
            end += 1
        real_start = offset
        real_end = end - 1
        if real_end < real_start:
            real_end = real_start
        chunk_to_analyze = conversation[real_start:real_end+1]
        debug_path = None
        if save_prompt_debug:
            debug_path = f"temp/prompt_{real_start}_{real_end}.txt"
        prompt = build_full_dialogue_segmentation_prompt(chunk_to_analyze, save_debug=save_prompt_debug, debug_path=debug_path)
        # print(f"prompt =" f"\n{prompt}\n")
        result = analyze_conversation_with_one_in_all(
            chunk_to_analyze,
            temperature=temperature,
            max_tokens=max_tokens,
            max_retry=max_retry
        )
        if save_prompt_debug:
            save_json_debug(result, f"temp/result_{real_start}_{real_end}_raw.json")
        segments = result['segments']
        event_relationships = result.get('event_relationships', [])
        for seg in segments:
            adjust_indices_for_segment(seg, real_start)
        adjust_event_relationship_indices(event_relationships, real_start)
        if save_prompt_debug:
            save_json_debug(result, f"temp/result_{real_start}_{real_end}_raw_adjusted.json")
        # 判断是否为最后一段
        is_last_chunk = (real_end >= n - 1)
        # 处理分段结果，合并到总结果
        if len(segments) > 1 and not is_last_chunk:
            # 非最后一段，剔除最后一个 segment 作为 overlap
            overlap_segment = segments.pop(-1)
            overlap_start = overlap_segment['chunk_range'][0]
            overlap_end = overlap_segment['chunk_range'][-1]
            # 删除 event_relationships 中涉及 overlap 的关系
            event_relationships = [rel for rel in event_relationships if not (
                rel.get('source_event', {}).get('chunk_range') == overlap_segment['chunk_range'] or
                rel.get('target_event', {}).get('chunk_range') == overlap_segment['chunk_range']
            )]
            print(overlap_segment['chunk_range'])
            print("&&&&&")
            print()
            for seg in segments:
                if 'attention_items' in seg:
                    seg['attention_items'] = filter_attention_items(seg.get('attention_items', []), overlap_start, overlap_end)
                if 'suspicious_utterances' in seg:
                    seg['suspicious_utterances'] = filter_suspicious_utterances(seg.get('suspicious_utterances', []), overlap_start, overlap_end)
            if save_prompt_debug:
                save_json_debug({**result, 'segments': segments.copy()}, f"temp/result_{real_start}_{real_end}_removed_last.json")
            if save_prompt_debug:
                # 保存调整后的整个 result（包含调整后的 segments 和 event_relationships）
                adjusted_result = {
                    **result,
                    "segments": segments.copy(),
                    "event_relationships": event_relationships
                }
                save_json_debug(adjusted_result, f"temp/result_{real_start}_{real_end}_removed_last_adjusted.json")
            offset = overlap_start
        else:
            # 最后一段或只有一个 segment，全部保留
            offset = real_end + 1
        # 补全时间戳
        for seg in segments:
            chunk_range = seg.get("chunk_range", [])
            if not (isinstance(chunk_range, list) and len(chunk_range) == 2):
                raise ValueError(f"Invalid chunk_range format: {chunk_range}")
            start_idx, end_idx = chunk_range
            if not (0 <= start_idx <= end_idx < len(conversation)):
                raise ValueError(f"chunk_range {chunk_range} out of bounds for lines (count={len(conversation)})")
            seg['started_at'] = conversation[start_idx].get('start_time')
            seg['ended_at'] = conversation[end_idx].get('end_time')
        # 合并所有结果
        results_segments.extend(segments)
        all_speaker_roles.extend(result.get('speaker_role', []))
        all_named_contexts.extend(result.get('named_of_context', []))
        all_event_relationships.extend(event_relationships)
        results_missing_indices.extend(result.get('missing_indices', []))
        results_invalid_suspicious_indices.extend(result.get('invalid_suspicious_indices', []))
        results_overlap_indices.extend(result.get('overlap_indices', []))
    final_result = {
        'segments': results_segments,
        'speaker_role': all_speaker_roles,
        'named_of_context': all_named_contexts,
        'event_relationships': all_event_relationships,
        'missing_indices': sorted(list(set(results_missing_indices))),
        'invalid_suspicious_indices': results_invalid_suspicious_indices,
        'overlap_indices': sorted(list(set(results_overlap_indices)))}
    if save_prompt_debug:
        save_json_debug(final_result, "temp/result_final.json")
    return final_result

def analyze_conversation_summary(
    segments_summaries,
    max_input_token=12800,
    temperature=0.2,
    max_tokens=4096,
    max_retry=3,
    model_name="gpt-3.5-turbo",
    save_prompt_debug=False
):
    enc = tiktoken.encoding_for_model(model_name)
    final_chunk = []
    for seg in segments_summaries:
        test_chunk = final_chunk.copy()
        test_chunk.append(seg)
        prompt = CONVERSATION_SUMMARY_PROMPT.format(segments="\n".join(test_chunk))
        token_count = len(enc.encode(prompt))
        if token_count > max_input_token:
            break
        final_chunk = test_chunk

    prompt = CONVERSATION_SUMMARY_PROMPT.format(segments="\n".join(final_chunk))
    response = None
    parsed_response = None
    for retry in range(max_retry):
        response = chat_with_qwen(prompt, temperature=temperature, max_tokens=max_tokens)
        try:
            parsed_response = json.loads(response)
            break
        except Exception as e:
            Error_Message = str(e)
            print(f"[ERROR] JSON parsing failed: {Error_Message}")
            for _ in range(3):
                fix_prompt = (
                    f"Please strictly convert the following content to a valid JSON object. "
                    f"If there is any error, please fix it. "
                    f"The original error was: {Error_Message}\n"
                    f"Content to fix:\n{response}"
                )
                fixed_response = chat_with_qwen(fix_prompt, temperature=0.1, max_tokens=max_tokens)
                try:
                    parsed_response = json.loads(fixed_response)
                    break
                except Exception as inner_e:
                    Error_Message = str(inner_e)
                    print(f"[ERROR] JSON correction failed: {Error_Message}")
                    continue
        if parsed_response is not None:
            break
    if parsed_response is None:
        raise RuntimeError("Failed to parse JSON response after multiple retries.")
    if save_prompt_debug:
        save_json_debug(parsed_response, "temp/conversation_analysis.json")
    return parsed_response

if __name__ == "__main__":
    import os
    import json
    # 加载示例 transcript
    transcript_path = os.path.join(os.path.dirname(__file__), "..", "audio_transcript", "transcripts.json")
    with open(transcript_path, 'r', encoding='utf-8') as f:
        utterances_raw = json.load(f)
    # 调用 analyze_conversation_with_threshold，保存每段 prompt 到 temp 文件夹，便于 debug
    all_sentenceID= set()
    for i in utterances_raw:
        all_sentenceID.add(i["sentence_id"]-1)
    supposed = set(list(range(0,len(utterances_raw))))
    print("difference:", supposed - all_sentenceID)
    result = analyze_conversation_with_threshold(
        utterances_raw,
        max_input_token=12800,
        temperature=0.2,
        max_tokens=4096,
        max_retry=3,
        model_name="gpt-3.5-turbo",
        save_prompt_debug=True
    )
    # 调用 insert_current_chunk_to_segments，将原始 utterances 加入每个 segment
    result['segments'] = insert_current_chunk_to_segments(utterances_raw, result['segments'])
    # 保存最终结果到 temp 文件夹，便于主流程 debug
    save_json_debug(result, "temp/result_final_main.json")
    # print(json.dumps(result, ensure_ascii=False, indent=2))