import { Type } from "@google/genai";
import { XhsNote } from "./xhs-mock";

export interface GenerationSettings {
  includeImages: boolean;
  variants: number;
  styles: string[];
  creativityLevel: number;
  goal: string;
}

export interface Variant {
  style: string;
  text: string;
  images: string[];
  tags: string[];
}

// Custom fetch-based caller to ensure proxy/baseUrl is respected and bypass SDK environment magic
async function callGeminiApi(
  model: string,
  contents: any,
  apiKey: string,
  baseUrl?: string,
  config?: any
) {
  const endpoint = baseUrl || "https://generativelanguage.googleapis.com";
  const cleanBaseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
  
  // Use v1 for better compatibility with proxies
  const apiVersion = "v1"; 
  
  // If it's an sk- key, it's likely an OpenAI-compatible proxy that expects Bearer token
  const isSkKey = apiKey.startsWith('sk-');
  const targetUrl = isSkKey 
    ? `${cleanBaseUrl}/${apiVersion}/models/${model}:generateContent`
    : `${cleanBaseUrl}/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;
  
  console.log(`[Gemini API Fetch] Calling via proxy: ${targetUrl}`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (isSkKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 95000); // 95s timeout (proxy is 90s)

    // Send request through our own Next.js API route to bypass CORS
    const response = await fetch('/api/gemini/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: targetUrl,
        headers,
        body: {
          contents: Array.isArray(contents) ? contents : (typeof contents === 'string' ? [{ parts: [{ text: contents }] }] : [contents]),
          generationConfig: config || {},
          tools: config?.tools || undefined,
          toolConfig: config?.toolConfig || undefined,
        }
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[Gemini API Fetch] Error ${response.status}:`, errorData);
      
      // Handle common proxy errors
      if (response.status === 404) {
        throw new Error(`API 路径未找到 (404)。请检查 Base URL 是否正确（通常不需要包含 /v1）。当前尝试：${targetUrl}`);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error(`身份验证失败 (401/403)。请检查 API Key 是否正确，或中转站额度是否充足。`);
      }
      if (response.status === 524) {
        throw new Error(`中转站响应超时 (524 Timeout)。这通常是因为中转站服务器负载过高或无法及时连接到 Google 官方接口。建议稍后重试，或更换更稳定的中转站。`);
      }
      if (response.status >= 500) {
        throw new Error(`中转站服务器错误 (${response.status})。可能是中转站暂时不可用，请稍后重试。`);
      }
      
      throw new Error(errorData.error?.message || errorData.error || `API 请求失败 (HTTP ${response.status})`);
    }

    const data = await response.json();
    
    // Mock the SDK response structure for compatibility
    return {
      text: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
      candidates: data.candidates,
      functionCalls: data.candidates?.[0]?.content?.parts?.[0]?.functionCall ? [data.candidates?.[0]?.content?.parts?.[0]?.functionCall] : undefined,
      groundingMetadata: data.candidates?.[0]?.groundingMetadata,
    };
  } catch (e: any) {
    console.error(`[Gemini API Fetch] Network Error:`, e);
    if (e.name === 'AbortError') {
      throw new Error(`请求超时 (Timeout)。中转站 (${cleanBaseUrl}) 响应时间过长，请检查中转站状态或更换其他节点。`);
    }
    if (e.message === 'Failed to fetch' || e.name === 'TypeError') {
      throw new Error(`网络请求失败 (Failed to fetch)。可能原因：\n1. 中转站地址 (${cleanBaseUrl}) 无法访问\n2. 你的网络环境限制了对该地址的访问\n\n建议：尝试更换中转站地址或检查网络代理。`);
    }
    throw e;
  }
}

export async function extractNoteFromUrl(url: string, apiKey: string, baseUrl?: string): Promise<XhsNote> {
  const prompt = `
    请分析以下小红书链接：${url}
    
    你的任务是提取该笔记的真实内容。如果无法直接访问，请通过搜索该链接的标题或内容来获取信息。
    
    请返回以下 JSON 格式：
    {
      "title": "笔记的真实标题",
      "content": "笔记的完整正文内容",
      "tags": ["#标签1", "#标签2"],
      "images": ["图片URL1", "图片URL2"]
    }
    
    注意：如果抓取不到图片，请根据内容描述提供3个高质量的 picsum.photos 链接。
  `;

  try {
    const response = await callGeminiApi(
      "gemini-3-flash-preview",
      prompt,
      apiKey,
      baseUrl,
      {
        responseMimeType: "application/json",
      }
    );

    const data = JSON.parse(response.text || "{}");
    
    // Ensure images are present for preview
    if (!data.images || data.images.length === 0) {
      data.images = [
        `https://picsum.photos/seed/${encodeURIComponent(data.title || 'xhs')}1/800/1000`,
        `https://picsum.photos/seed/${encodeURIComponent(data.title || 'xhs')}2/800/1000`,
      ];
    }
    
    return data as XhsNote;
  } catch (error: any) {
    console.error("Advanced extraction failed, trying simple search:", error);
    
    try {
      const simpleResponse = await callGeminiApi(
        "gemini-3-flash-preview",
        `请告诉我这个小红书链接的内容是什么：${url}。请以 JSON 格式返回 title, content, tags, images。`,
        apiKey,
        baseUrl,
        {
          responseMimeType: "application/json",
        }
      );
      return JSON.parse(simpleResponse.text || "{}") as XhsNote;
    } catch (finalError) {
      throw new Error("抓取失败。中转站可能无法直接访问外部链接。请检查中转站的网络连通性。");
    }
  }
}

async function deduplicateImage(url: string, variantIndex: number = 0): Promise<string> {
  if (typeof window === 'undefined') return url;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(url);
          return;
        }

        // 1. Mirroring (Horizontal Flip) - Very effective for XHS de-duplication
        // We can alternate mirroring based on variant index to create more differences
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (variantIndex % 2 === 0) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        
        // 2. Slight zoom/crop (1% to 3%) to change pixel alignment, varying by variant
        const zoom = 0.01 + (variantIndex * 0.005);
        const sw = img.width * (1 - zoom);
        const sh = img.height * (1 - zoom);
        
        // Slightly shift the crop center based on variant
        const offsetX = (variantIndex % 3) * 0.002 * img.width;
        const offsetY = (variantIndex % 2) * 0.002 * img.height;
        
        const sx = ((img.width - sw) / 2) + offsetX;
        const sy = ((img.height - sh) / 2) + offsetY;
        
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

        // 3. Add a tiny invisible watermark/noise by slightly adjusting a corner pixel
        // This ensures MD5 is different even if visual change is minimal
        const imageData = ctx.getImageData(0, 0, 1, 1);
        imageData.data[0] = (imageData.data[0] + 1 + variantIndex) % 255;
        ctx.putImageData(imageData, 0, 0);

        // Vary JPEG quality slightly to further change file hash
        const quality = 0.92 - (variantIndex * 0.01);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (e) {
        console.warn("Image de-duplication failed (likely CORS), using original:", e);
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    // Add a cache buster to help with some CORS issues
    img.src = url.includes('?') ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
  });
}

export async function generateVariants(
  originalNote: { title: string; content: string; tags: string[]; images: string[] },
  settings: GenerationSettings,
  apiKey: string,
  baseUrl?: string
): Promise<Variant[]> {
  const variants: Variant[] = [];
  
  for (let i = 0; i < settings.variants; i++) {
    const style = settings.styles[i % settings.styles.length] || "亲和交流";
    
    // 1. Generate Text
    const creativityDesc = settings.creativityLevel < 0.3 
      ? "保守：高度还原原笔记逻辑，仅微调词汇和表达，保持核心结构不变。" 
      : settings.creativityLevel > 0.7 
        ? "激进：仅保留主题，完全由 AI 重新发散创作，原创度最高，结构可以大幅调整。" 
        : "平衡：保留核心观点，重构表达方式，在原创与还原之间取得平衡。";

    const goalDesc = settings.goal === 'sales' 
      ? "创作目标：种草带货。侧重产品优点、使用感受，引导购买欲望。" 
      : settings.goal === 'info' 
        ? "创作目标：知识干货。侧重逻辑条理、分点说明，提供实用价值。" 
        : "创作目标：引流涨粉。侧重钩子设置、引导评论和关注，制造话题感。";

    const textPrompt = `
      你是一个专业的小红书博主。请根据以下原笔记内容，复刻并创作一个新的版本。
      风格要求：${style}
      ${creativityDesc}
      ${goalDesc}
      
      原笔记标题：${originalNote.title}
      原笔记内容：${originalNote.content}
      原笔记标签：${originalNote.tags.join(' ')}
      
      要求：
      1. 保持小红书的排版风格（多用emoji，分段清晰）。
      2. 语气要符合“${style}”的设定。
      3. 包含一个吸引人的标题。
      4. 包含5-8个相关的热门标签。
      5. 严格遵守小红书安全规范，避免违规词（如：最、第一、绝对、赚钱、加微信等）。
      6. 请以JSON格式返回，包含 "title", "content", "tags" 三个字段。
    `;

    // Add a small delay to avoid overwhelming the proxy
    if (i > 0) await new Promise(resolve => setTimeout(resolve, 500));

    const textResponse = await callGeminiApi(
      "gemini-3-flash-preview",
      textPrompt,
      apiKey,
      baseUrl,
      {
        responseMimeType: "application/json",
      }
    );

    let textData;
    try {
      textData = JSON.parse(textResponse.text || "{}");
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", textResponse.text);
      textData = {
        title: "复刻笔记",
        content: textResponse.text || "生成内容失败",
        tags: ["#AI生成"]
      };
    }
    
    // 2. Process Original Images (De-duplication)
    let processedImages: string[] = [];
    if (settings.includeImages && originalNote.images.length > 0) {
      console.log(`[Image De-duplication] Processing ${originalNote.images.length} original images for variant ${i + 1}...`);
      processedImages = await Promise.all(
        originalNote.images.map(img => deduplicateImage(img, i))
      );
    }

    variants.push({
      style,
      text: `${textData.title}\n\n${textData.content}`,
      images: processedImages,
      tags: textData.tags || []
    });
  }

  return variants;
}
