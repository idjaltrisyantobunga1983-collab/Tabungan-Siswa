/**
 * Client untuk berkomunikasi dengan Google Apps Script Web App
 */

export interface AppsScriptResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export async function pingAppsScript(url: string): Promise<AppsScriptResponse> {
  try {
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      return { success: false, error: 'URL Google Apps Script masih kosong' };
    }

    const testUrl = new URL(cleanUrl);
    testUrl.searchParams.set('action', 'ping');

    const res = await fetch(testUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      return {
        success: false,
        error: `Server merespon dengan status HTTP ${res.status}: ${res.statusText}`
      };
    }

    const json = await res.json();
    return json;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Gagal terhubung ke Apps Script: ${message}. Pastikan Web App di-deploy dengan akses 'Anyone' (Siapa Saja).`
    };
  }
}

export async function callAppsScriptGet<T>(url: string, action: string, params: Record<string, string> = {}): Promise<AppsScriptResponse<T>> {
  try {
    const endpoint = new URL(url.trim());
    endpoint.searchParams.set('action', action);
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        endpoint.searchParams.set(key, String(val));
      }
    });

    const res = await fetch(endpoint.toString());
    const json = await res.json();
    return json;
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Koneksi ke Apps Script gagal'
    };
  }
}

export async function callAppsScriptPost<T>(url: string, action: string, payload: Record<string, unknown>, actor = 'Petugas'): Promise<AppsScriptResponse<T>> {
  try {
    const endpoint = url.trim();
    const bodyData = {
      action,
      actor,
      ...payload
    };

    // Google Apps Script Web App menerima POST data text/plain untuk menghindari preflight CORS issue
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(bodyData)
    });

    const json = await res.json();
    return json;
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Kirim data ke Apps Script gagal'
    };
  }
}
