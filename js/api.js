// Thin client around the public Wise Old Man API (v2).
// Docs: https://docs.wiseoldman.net/

const BASE_URL = "https://api.wiseoldman.net/v2";

export class WomApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "WomApiError";
    this.status = status;
  }
}

function headers(apiKey) {
  const h = { "Content-Type": "application/json" };
  if (apiKey) h["x-api-key"] = apiKey;
  return h;
}

async function request(path, { apiKey, method = "GET", body, extraHeaders } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { ...headers(apiKey), ...(extraHeaders || {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new WomApiError(
      "Could not reach the Wise Old Man API. Check your internet connection.",
      0
    );
  }

  if (!res.ok) {
    let message = `Wise Old Man API error (${res.status})`;
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {
      /* ignore parse failure, use default message */
    }
    if (res.status === 404) message = "Group or player not found on Wise Old Man.";
    if (res.status === 429) message = "Rate limited by Wise Old Man. Wait a moment and try again.";
    throw new WomApiError(message, res.status);
  }

  return res.json();
}

/** GET /groups/:id — group info + membership list */
export function getGroupDetails(groupId, apiKey) {
  return request(`/groups/${encodeURIComponent(groupId)}`, { apiKey });
}

/** GET /groups/:id/gained?period=&metric= — XP (or other metric) gained per member */
export function getGroupGained(groupId, period, metric = "overall", apiKey) {
  const params = new URLSearchParams({ period, metric });
  return request(`/groups/${encodeURIComponent(groupId)}/gained?${params}`, { apiKey });
}

/** GET /players/username/:username — full player details incl. latest snapshot */
export function getPlayerDetails(username, apiKey) {
  return request(`/players/username/${encodeURIComponent(username)}`, { apiKey });
}

/** POST /groups/:id/update-all — asks WOM to queue an update for every member.
 *  Requires the group's verification code (kept local to the browser only). */
export function updateAllMembers(groupId, verificationCode, apiKey) {
  return request(`/groups/${encodeURIComponent(groupId)}/update-all`, {
    apiKey,
    method: "POST",
    extraHeaders: { "x-verification-code": verificationCode },
  });
}

/**
 * Run async jobs with a concurrency of 1 and a delay between each, to stay
 * comfortably under WOM's public rate limit. Calls onProgress(done, total)
 * after each job so the UI can show a progress indicator.
 */
export async function throttledMap(items, fn, { delayMs = 400, onProgress } = {}) {
  const results = [];
  for (let i = 0; i < items.length; i++) {
    results.push(await fn(items[i], i));
    onProgress?.(i + 1, items.length);
    if (i < items.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return results;
}
