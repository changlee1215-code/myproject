export const fetchRelatedQueries = (keyword: string): Promise<string[]> => {
  return new Promise((resolve) => {
    let timer: any = null;
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    const script = document.createElement('script');

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      try {
        delete (window as any)[callbackName];
      } catch {}
      try {
        if (script.parentNode) script.parentNode.removeChild(script);
      } catch {}
    };

    // 1.5초 안전 타임아웃 (네트워크 지연이나 애드블록 차단 시 즉시 빈 배열 반환하여 UI 멈춤 방지)
    timer = setTimeout(() => {
      cleanup();
      resolve([]);
    }, 1500);

    (window as any)[callbackName] = (data: any) => {
      cleanup();
      resolve(data[1] || []);
    };

    script.onerror = () => {
      cleanup();
      resolve([]);
    };

    script.src = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(keyword)}&jsonp=${callbackName}`;
    document.body.appendChild(script);
  });
};

