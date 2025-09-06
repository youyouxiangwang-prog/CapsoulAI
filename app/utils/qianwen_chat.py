import os
from openai import OpenAI  # Use 'from openai import OpenAI'

# You can keep API_KEY and API_BASE definitions
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "sk-21f7d4d3dc644f4cb200fa8e692eac1a")
API_BASE = "https://dashscope.aliyuncs.com/compatible-mode/v1"
MODEL = "qwen-max"

# Correct way to instantiate the client:
# Pass the API key and base URL directly to the constructor
client = OpenAI(
    api_key=DASHSCOPE_API_KEY,
    base_url=API_BASE,
)

LLM_TOTAL_INPUT_TOKENS = 0
LLM_TOTAL_OUTPUT_TOKENS = 0

def chat_with_qwen(prompt, temperature=0.7, max_tokens=8192, system_content="You are a dialogue analysis expert. You need to reply the answer always in JSON format"):
    global LLM_TOTAL_INPUT_TOKENS, LLM_TOTAL_OUTPUT_TOKENS
    response = client.chat.completions.create(  # Use the 'client' object
        model=MODEL,
        messages=[
            {"role": "system", "content": system_content},
            {"role": "user", "content": prompt}
        ],
        temperature=temperature,
        max_tokens=max_tokens
    )
    response_text = response.choices[0].message.content
    usage = getattr(response, "usage", {})
    input_tokens = getattr(usage, "prompt_tokens", 0)
    output_tokens = getattr(usage, "completion_tokens", 0)
    LLM_TOTAL_INPUT_TOKENS += input_tokens
    LLM_TOTAL_OUTPUT_TOKENS += output_tokens
    return response_text

def get_llm_token_stats():
    global LLM_TOTAL_INPUT_TOKENS, LLM_TOTAL_OUTPUT_TOKENS
    return {
        'input': LLM_TOTAL_INPUT_TOKENS,
        'output': LLM_TOTAL_OUTPUT_TOKENS
    }

def reset_llm_token_stats():
    global LLM_TOTAL_INPUT_TOKENS, LLM_TOTAL_OUTPUT_TOKENS
    LLM_TOTAL_INPUT_TOKENS = 0
    LLM_TOTAL_OUTPUT_TOKENS = 0

if __name__ == "__main__":
    prompt = "How are you?"
    answer = chat_with_qwen(prompt)
    print(answer)