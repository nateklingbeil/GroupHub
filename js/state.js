const STORAGE_KEY = "osrs-ironman-tracker:config";

const DEFAULTS = {
  groupId: "",
  period: "week",
  apiKey: "",
  verificationCode: "",
};

export function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* localStorage unavailable (private mode, etc.) — silently skip persistence */
  }
}

/** In-memory cache of the last successful fetch, so switching tabs doesn't refetch. */
export const cache = {
  group: null, // raw /groups/:id response
  gained: null, // raw /groups/:id/gained response
  players: null, // array of full player detail objects (one per member)
  lastUpdated: null, // Date
};
