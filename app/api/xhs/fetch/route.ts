import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Handle short links and redirects
    let targetUrl = url;
    const isShortLink = url.includes('xhslink.com');
    
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      redirect: 'follow',
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error(`无法访问小红书 (HTTP ${response.status})`);
    }

    const html = await response.text();
    console.log(`Fetched HTML length: ${html.length}`);

    // Check for common blocking indicators
    if (html.includes('验证码') || html.includes('captcha') || html.includes('shield')) {
      console.warn('Captcha detected in XHS response');
      throw new Error('触发了小红书的人机验证，请稍后再试或配置 API Key 开启 AI 强力抓取。');
    }
    const stateRegex = /window\.__INITIAL_STATE__\s*=\s*({.*?});/s;
    // Pattern 2: window.__INITIAL_DATA__
    const dataRegex = /window\.__INITIAL_DATA__\s*=\s*({.*?});/s;
    // Pattern 3: <script id="initial-state">...</script>
    const scriptTagRegex = /<script id="initial-state">({.*?})<\/script>/s;
    // Pattern 4: <script>window.__INITIAL_STATE__=({.*?})<\/script>
    const scriptInlineRegex = /<script>window\.__INITIAL_STATE__=({.*?})<\/script>/s;
    
    let jsonData: any = null;
    const stateMatch = html.match(stateRegex);
    const dataMatch = html.match(dataRegex);
    const scriptMatch = html.match(scriptTagRegex);
    const scriptInlineMatch = html.match(scriptInlineRegex);

    try {
      if (stateMatch) {
        jsonData = JSON.parse(stateMatch[1].replace(/undefined/g, 'null'));
      } else if (dataMatch) {
        jsonData = JSON.parse(dataMatch[1].replace(/undefined/g, 'null'));
      } else if (scriptMatch) {
        jsonData = JSON.parse(scriptMatch[1].replace(/undefined/g, 'null'));
      } else if (scriptInlineMatch) {
        jsonData = JSON.parse(scriptInlineMatch[1].replace(/undefined/g, 'null'));
      }
    } catch (e) {
      console.error('JSON Parse Error:', e);
    }

    if (!jsonData) {
      // Fallback: Aggressive Meta Tag Extraction
      const title = html.match(/<meta property="og:title" content="(.*?)"/)?.[1] || 
                    html.match(/<title>(.*?)<\/title>/)?.[1] || '无标题';
      
      const content = html.match(/<meta name="description" content="(.*?)"/)?.[1] || 
                      html.match(/<meta property="og:description" content="(.*?)"/)?.[1] || '无法提取正文内容';
      
      const images: string[] = [];
      const imageMatches = html.matchAll(/<meta property="og:image" content="(.*?)"/g);
      for (const match of imageMatches) {
        if (match[1]) images.push(match[1]);
      }
      
      // If we still have nothing meaningful, it's likely a verification page
      if (title === '无标题' && content === '无法提取正文内容') {
        if (html.includes('验证码') || html.includes('captcha') || html.includes('shield')) {
          throw new Error('触发了小红书的人机验证，请稍后再试或直接粘贴笔记文案。');
        }
        throw new Error('无法解析笔记内容，页面结构可能已更改。');
      }

      return NextResponse.json({
        title: title.replace(/ - 小红书.*/, ''),
        content,
        images: images.length > 0 ? images : [],
        tags: content.match(/#[\w\u4e00-\u9fa5]+/g) || []
      });
    }

    // Parse the JSON structure
    // The structure can be deeply nested depending on the page version
    const note = jsonData.note?.noteDetailMap?.[jsonData.note?.currentNoteId]?.note || 
                 jsonData.noteData || 
                 jsonData.note?.note ||
                 {};
    
    const title = note.title || note.desc?.substring(0, 30) || '无标题';
    const content = note.desc || '无内容';
    const images = note.imageList?.map((img: any) => img.urlDefault || img.url || img.url_default) || [];
    const tags = note.tagList?.map((tag: any) => `#${tag.name}`) || content.match(/#[\w\u4e00-\u9fa5]+/g) || [];

    return NextResponse.json({
      title,
      content,
      images,
      tags
    });

  } catch (error: any) {
    console.error('XHS Fetch Error:', error);
    return NextResponse.json({ error: error.message || '抓取失败' }, { status: 500 });
  }
}
