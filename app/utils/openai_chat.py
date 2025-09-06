from app.core.config import settings
import json
import tiktoken
import openai

# 统一从 config 读取 Azure/OpenAI 配置
AZURE_OPENAI_ENDPOINT = settings.AZURE_OPENAI_ENDPOINT
AZURE_OPENAI_API_KEY = settings.AZURE_OPENAI_API_KEY
AZURE_OPENAI_DEPLOYMENT = settings.AZURE_OPENAI_DEPLOYMENT
API_VERSION = settings.AZURE_OPENAI_API_VERSION

import app.utils.qianwen_chat as openai_chat

client = client = openai.AzureOpenAI(
    api_key=AZURE_OPENAI_API_KEY,
    api_version=API_VERSION,
    azure_endpoint=AZURE_OPENAI_ENDPOINT
)

LLM_TOTAL_INPUT_TOKENS = 0
LLM_TOTAL_OUTPUT_TOKENS = 0

# 统一统计token
def count_tokens(text, model=None):
    model = model or AZURE_OPENAI_DEPLOYMENT
    try:
        enc = tiktoken.encoding_for_model(model)
    except Exception:
        enc = tiktoken.get_encoding("cl100k_base")
    return len(enc.encode(text))

def chat_with_openai(prompt, temperature=0.7, max_tokens=16000,response_format={"type": "json_object"}, system_content="You are a dialogue analysis expert. You need to reply the answer always in JSON format"):
    global LLM_TOTAL_INPUT_TOKENS, LLM_TOTAL_OUTPUT_TOKENS
    response = client.chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT,
        messages=[
            {"role": "system", "content": system_content},
            {"role": "user", "content": prompt}
        ],
        temperature=temperature,
        max_tokens=max_tokens,
        response_format=response_format
    )
    response_text = response.choices[0].message.content
    input_tokens = count_tokens(prompt)
    output_tokens = count_tokens(response_text)
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
    prompt = """ How are you? """
    answer = chat_with_openai(prompt)
    print(answer)