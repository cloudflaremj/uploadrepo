export interface Env {
  AI: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 1. 处理跨域请求 (CORS)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      });
    }

    if (request.method !== "POST") {
      return new Response("只支持 POST 请求", { status: 405 });
    }

    try {
      const body: any = await request.json();
      // 获取前端传来的模型和对话历史，默认使用 Qwen 中文模型
      const model = body.model || "@cf/qwen/qwen2.5-7b-instruct-awq";
      const messages = body.messages || [];

      // 2. 调用 Cloudflare 原生 Workers AI 算力
      const aiResponse = await env.AI.run(model, {
        messages: messages,
        stream: true  // 开启流式输出
      });

      // 3. 将 AI 生成的数据流直接返回给前端
      return new Response(aiResponse, {
        headers: {
          "Content-Type": "text/event-stream",
          "Access-Control-Allow-Origin": "*"
        }
      });

    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }
  }
};
