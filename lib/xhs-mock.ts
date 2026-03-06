export interface XhsNote {
  title: string;
  content: string;
  images: string[];
  tags: string[];
}

export async function fetchXhsNote(url: string): Promise<XhsNote> {
  // Check if it's a manual JSON input
  if (url.startsWith('{') && url.endsWith('}')) {
    try {
      return JSON.parse(url) as XhsNote;
    } catch (e) {
      console.error('Manual JSON parse error:', e);
    }
  }

  try {
    const response = await fetch('/api/xhs/fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '抓取失败，请检查链接或稍后重试');
    }

    const data = await response.json();
    
    // Ensure we have some images for the UI
    if (!data.images || data.images.length === 0) {
      data.images = [
        `https://picsum.photos/seed/${encodeURIComponent(data.title || 'xhs')}1/800/1000`,
        `https://picsum.photos/seed/${encodeURIComponent(data.title || 'xhs')}2/800/1000`,
      ];
    }

    return data as XhsNote;
  } catch (e: any) {
    console.error('XHS Fetch Error:', e);
    if (e.message === 'Failed to fetch' || e.name === 'TypeError') {
      throw new Error('无法连接到后端抓取服务 (Failed to fetch)。请检查网络连接或尝试刷新页面。');
    }
    throw e;
  }
}
