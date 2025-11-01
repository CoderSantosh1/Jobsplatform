import { useEffect } from "react";

/* Add inside your HomeClient component */
useEffect(() => {
  const selector = 'ins.adsbygoogle[data-ad-client="ca-pub-6447497690677792"]';
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return;

  const tryPush = () => {
    try {
      const width = el.getBoundingClientRect().width;
      if (width && width > 0) {
        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
        (window as any).adsbygoogle.push({});
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  };

  // Attempt immediately
  if (tryPush()) return;

  // Fallback: wait until visible
  let observer: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          if (tryPush() && observer) {
            observer.disconnect();
            observer = null;
          }
          break;
        }
      }
    });
    observer.observe(el);
  } else {
    // Fallback polling if ResizeObserver not supported
    let tries = 0;
    const interval = setInterval(() => {
      tries++;
      if (tryPush() || tries >= 50) {
        clearInterval(interval);
      }
    }, 100);
  }

  return () => {
    if (observer) observer.disconnect();
  };
}, []);
