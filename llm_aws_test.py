import boto3
import json

# 确保你的 AWS 凭证和区域已配置好。
# Cohere 模型在 us-east-1, us-west-2, ap-northeast-1 等区域都可用。
region_name = "us-east-1"

# 创建 Bedrock Runtime 客户端
client = boto3.client(
    service_name="bedrock-runtime",
    region_name=region_name
)

# 定义要调用的模型 ID
# 使用 Cohere Command 模型
model_id = "cohere.command-text-v14"

# 构建请求的主体 (body)
# Cohere 模型的格式使用 "prompt" 字段
body = json.dumps({
    "prompt": "请给我写一个关于人工智能的五言绝句。",
    "max_tokens": 200,
    "temperature": 0.5,
    "p": 0.9,
    "k": 0
})

try:
    # 调用模型
    response = client.invoke_model(
        body=body,
        modelId=model_id,
        accept="application/json",
        contentType="application/json"
    )

    # 读取并解析响应
    response_body = json.loads(response.get("body").read())

    # 从响应中提取生成的文本
    # Cohere 模型的输出在 "generations" 列表的第一个元素的 "text" 字段里
    generated_text = response_body.get("generations")[0].get("text")

    print("模型响应:")
    print(generated_text)

except Exception as e:
    print(f"调用 API 时发生错误: {e}")