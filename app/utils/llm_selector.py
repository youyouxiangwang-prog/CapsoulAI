# app/utils/llm_selector.py
import os
from app.utils.qianwen_chat import chat_with_qwen
from app.utils.openai_chat import chat_with_openai

def chat_with_llm(prompt: str, temperature: float = 0.7, max_tokens: int = 16000, system_content: str = "You are a helpful assistant.", response_format: dict = None):
    """
    A unified function to chat with an LLM, selected based on the LLM_MODEL environment variable.

    Args:
        prompt (str): The user's prompt.
        temperature (float): The temperature for sampling.
        max_tokens (int): The maximum number of tokens to generate.
        system_content (str): The system message to set the context for the assistant.
        response_format (dict): The response format to use (e.g., {"type": "json_object"}).

    Returns:
        str: The response from the selected LLM.
    """
    llm_model = os.getenv("LLM_MODEL", "QWEN").upper()

    if llm_model == "QWEN":
        # Qianwen's DashScope compatible API uses the openai library, so we can pass response_format
        # but it might not be supported for all models. Let's call it safely.
        # The original chat_with_qwen did not have response_format, so we don't pass it.
        return chat_with_qwen(
            prompt=prompt,
            temperature=temperature,
            max_tokens=max_tokens,
            system_content=system_content
        )
    elif llm_model == "CHATGPT":
        return chat_with_openai(
            prompt=prompt,
            temperature=temperature,
            max_tokens=max_tokens,
            system_content=system_content,
            response_format=response_format
        )
    else:
        raise ValueError(f"Unsupported LLM_MODEL: {llm_model}. Please use 'QWEN' or 'CHATGPT'.")

