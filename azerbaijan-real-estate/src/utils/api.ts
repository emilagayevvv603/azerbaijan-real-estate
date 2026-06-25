/**
 * Utility to dynamically resolve the API URL.
 * When running in the AI Studio preview or local dev server, it uses relative paths.
 * When running on Netlify or any other external hosting, it automatically routes to the stable Cloud Run backend.
 */
export const getApiUrl = (path: string): string => {
  const isLocalOrPreview =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".run.app") ||
    window.location.hostname.endsWith(".onrender.com");

  if (isLocalOrPreview) {
    return path;
  }

  // Fallback to the stable Shared App URL on Cloud Run or Render
  const apiBase = import.meta.env.VITE_API_URL || "https://azerbaijan-real-estate.onrender.com";
  const base = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  return `${base}${cleanPath}`;
};

/**
 * Installs a global window.fetch interceptor.
 * If the application is running on an external domain (like Netlify) and a request to
 * our backend API fails, it will automatically and transparently retry the request against
 * the alternative backend environment (swapping between the shared App URL and development App URL).
 */
export const setupGlobalFetchInterceptor = () => {
  if (typeof window === "undefined" || (window as any).__fetch_interceptor_installed) {
    return;
  }

  const originalFetch = window.fetch;
  const DEV_BASE = "https://ais-dev-52snpcld7mooxo6as2n3qe-978387105799.europe-west2.run.app";
  const PRE_BASE = "https://azerbaijan-real-estate.onrender.com";

  const customFetch = async function (this: any, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const isLocalOrPreview =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.endsWith(".run.app") ||
      window.location.hostname.endsWith(".onrender.com");

    // On local/preview, proceed with normal behavior (relative paths or standard routing)
    if (isLocalOrPreview) {
      return originalFetch.call(this, input, init);
    }

    let urlString = "";
    if (typeof input === "string") {
      urlString = input;
    } else if (input instanceof URL) {
      urlString = input.toString();
    } else {
      urlString = input.url;
    }

    // Rewrite relative API calls if they happen to bypass getApiUrl
    if (urlString.startsWith("/api/")) {
      urlString = `${PRE_BASE}${urlString}`;
    }

    // Intercept our custom Cloud Run backend endpoints
    if (urlString.includes(".run.app/api/")) {
      try {
        const response = await originalFetch.call(this, urlString, init);
        // If the request succeeds or has client errors (4xx), return it directly.
        // We only fail-over/fallback on server errors (5xx) or complete network connectivity failures.
        if (response.ok || response.status < 500) {
          return response;
        }
        throw new Error(`Primary backend returned server error status: ${response.status}`);
      } catch (err) {
        console.warn("Primary backend call failed or was unreachable, executing fallback strategy...", err);
        
        // Swap between PRE and DEV bases dynamically
        const fallbackUrl = urlString.includes(PRE_BASE)
          ? urlString.replace(PRE_BASE, DEV_BASE)
          : urlString.replace(DEV_BASE, PRE_BASE);

        console.log(`Retrying fetch call against fallback environment: ${fallbackUrl}`);
        try {
          const fallbackRes = await originalFetch.call(this, fallbackUrl, init);
          return fallbackRes;
        } catch (fallbackErr) {
          console.error("Fallback environment fetch call also failed:", fallbackErr);
          throw fallbackErr;
        }
      }
    }

    // Fallback to normal behavior for external non-API domains
    return originalFetch.call(this, input, init);
  };

  try {
    (window as any).fetch = customFetch;
    (window as any).__fetch_interceptor_installed = true;
    console.log("Global MyDom dynamic backend fail-over and interceptor installed successfully via assignment.");
  } catch (e) {
    console.warn("Direct window.fetch assignment failed, attempting Object.defineProperty...", e);
    try {
      Object.defineProperty(window, "fetch", {
        value: customFetch,
        writable: true,
        configurable: true,
      });
      (window as any).__fetch_interceptor_installed = true;
      console.log("Global MyDom dynamic backend fail-over and interceptor installed successfully via Object.defineProperty.");
    } catch (defineError) {
      console.error("Could not install global window.fetch interceptor (read-only environment). Fetch requests will rely on normal getApiUrl resolution.", defineError);
    }
  }
};
