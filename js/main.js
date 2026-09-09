import { getGroupDetails, getGroupGained, getPlayerDetails, updateAllMembers, throttledMap, WomApiError } from "./api.js";
import { loadConfig, saveConfig, cache } from "./state.js";
import { buildMemberRows, buildBossTotals, groupSummary } from "./aggregate.js";
import { renderDashboard, renderMembers, renderBosses, renderStatusBanner } from "./render.js";

const config = loadConfig();

const el = {
  form: document.getElementById("controls-form"),
  groupIdInput: document.getElementById("group-id-input"),
  periodSelect: document.getElementById("period-select"),
  loadBtn: document.getElementById("load-btn"),
  refreshBtn: document.getElementById("refresh-btn"),
  copyLinkBtn: document.getElementById("copy-link-btn"),
  statusBanner: document.getElementById("status-banner"),
  groupSubtitle: document.getElementById("group-subtitle"),
  tabs: document.getElementById("tabs"),
  panels: {
    dashboard: document.getElementById("tab-dashboard"),
    members: document.getElementById("tab-members"),
    bosses: document.getElementById("tab-bosses"),
    setup: document.getElementById("tab-setup"),
  },
  dashboardContent: document.getElementById("dashboard-content"),
  membersContent: document.getElementById("members-content"),
  bossesContent: document.getElementById("bosses-content"),
  memberSearch: document.getElementById("member-search"),
  bossSearch: document.getElementById("boss-search"),
  apiKeyInput: document.getElementById("api-key-input"),
  verificationCodeInput: document.getElementById("verification-code-input"),
  saveAdvancedBtn: document.getElementById("save-advanced-btn"),
  syncAllBtn: document.getElementById("sync-all-btn"),
  syncStatus: document.getElementById("sync-status"),
};

const state = {
  memberRows: [],
  bossTotals: [],
  summary: null,
  loading: false,
  error: null,
  progress: null,
  activeTab: "dashboard",
  membersSearch: "",
  membersSort: { key: "gained", dir: "desc" },
  bossesSearch: "",
  bossesSort: { key: "total", dir: "desc" },
  expandedMemberId: null,
};

// ------------------------------------------------------------- Init fields

el.groupIdInput.value = config.groupId;
el.periodSelect.value = config.period;
el.apiKeyInput.value = config.apiKey;
el.verificationCodeInput.value = config.verificationCode;

// ------------------------------------------------------------------ Render

function renderStatus() {
  renderStatusBanner(el.statusBanner, {
    loading: state.loading,
    error: state.error,
    lastUpdated: cache.lastUpdated,
    progress: state.progress,
  });
}

function renderActiveTab() {
  if (state.activeTab === "dashboard") {
    el.dashboardContent.innerHTML = renderDashboard({
      group: cache.group,
      summary: state.summary,
      memberRows: state.memberRows,
      bossTotals: state.bossTotals,
      period: el.periodSelect.value,
    });
  } else if (state.activeTab === "members") {
    el.membersContent.innerHTML = renderMembers(state.memberRows, {
      search: state.membersSearch,
      sortKey: state.membersSort.key,
      sortDir: state.membersSort.dir,
      expandedId: state.expandedMemberId,
    });
  } else if (state.activeTab === "bosses") {
    el.bossesContent.innerHTML = renderBosses(state.bossTotals, {
      search: state.bossesSearch,
      sortKey: state.bossesSort.key,
      sortDir: state.bossesSort.dir,
    });
  }
}

function renderAll() {
  renderStatus();
  if (cache.group) {
    el.groupSubtitle.textContent = `${cache.group.name} — ${cache.group.memberCount} members`;
    el.refreshBtn.disabled = state.loading;
    el.copyLinkBtn.disabled = state.loading;
    el.syncAllBtn.disabled = state.loading;
    el.syncAllBtn.title = "";
  } else {
    el.groupSubtitle.textContent = state.loading ? "Loading…" : "No group loaded yet";
  }
  renderActiveTab();
}

// -------------------------------------------------------------- Data flow

async function loadFull(groupId) {
  state.loading = true;
  state.error = null;
  state.progress = null;
  renderAll();

  const apiKey = el.apiKeyInput.value.trim() || undefined;

  try {
    const group = await getGroupDetails(groupId, apiKey);
    const period = el.periodSelect.value;
    const gained = await getGroupGained(groupId, period, "overall", apiKey);

    const usernames = (group.memberships || []).map((m) => m.player.username);
    const players = await throttledMap(
      usernames,
      async (username) => {
        try {
          return await getPlayerDetails(username, apiKey);
        } catch {
          return null; // one bad lookup shouldn't fail the whole group
        }
      },
      {
        delayMs: 400,
        onProgress: (done, total) => {
          state.progress = { done, total };
          renderStatus();
        },
      }
    );

    cache.group = group;
    cache.gained = gained;
    cache.players = players.filter(Boolean);
    cache.lastUpdated = new Date();

    recompute();

    config.groupId = String(groupId);
    config.period = period;
    saveConfig(config);
  } catch (err) {
    state.error = err instanceof WomApiError ? err.message : "Something went wrong loading this group.";
  } finally {
    state.loading = false;
    state.progress = null;
    renderAll();
  }
}

async function refreshGainedOnly() {
  if (!cache.group) return;
  state.loading = true;
  state.error = null;
  renderAll();

  const apiKey = el.apiKeyInput.value.trim() || undefined;
  const period = el.periodSelect.value;

  try {
    cache.gained = await getGroupGained(cache.group.id, period, "overall", apiKey);
    recompute();
    config.period = period;
    saveConfig(config);
  } catch (err) {
    state.error = err instanceof WomApiError ? err.message : "Could not refresh XP-gained data.";
  } finally {
    state.loading = false;
    renderAll();
  }
}

function recompute() {
  state.memberRows = buildMemberRows(cache.group, cache.gained, cache.players);
  state.bossTotals = buildBossTotals(state.memberRows);
  state.summary = groupSummary(state.memberRows, state.bossTotals);
}

// ----------------------------------------------------------------- Events

el.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const groupId = el.groupIdInput.value.trim();
  if (!groupId) return;
  loadFull(groupId);
});

el.refreshBtn.addEventListener("click", () => {
  if (cache.group) loadFull(cache.group.id);
});

el.periodSelect.addEventListener("change", () => {
  if (cache.group) refreshGainedOnly();
});

el.tabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab-btn");
  if (!btn) return;
  state.activeTab = btn.dataset.tab;
  for (const b of el.tabs.querySelectorAll(".tab-btn")) b.classList.toggle("active", b === btn);
  for (const [name, panel] of Object.entries(el.panels)) panel.hidden = name !== state.activeTab;
  renderActiveTab();
});

el.memberSearch.addEventListener("input", () => {
  state.membersSearch = el.memberSearch.value;
  renderActiveTab();
});

el.bossSearch.addEventListener("input", () => {
  state.bossesSearch = el.bossSearch.value;
  renderActiveTab();
});

el.membersContent.addEventListener("click", (e) => {
  const sortHeader = e.target.closest("[data-sort]");
  if (sortHeader) {
    setSort(state.membersSort, sortHeader.dataset.sort);
    renderActiveTab();
    return;
  }
  const row = e.target.closest(".member-row");
  if (row) {
    const id = row.dataset.memberId;
    state.expandedMemberId = state.expandedMemberId === id ? null : id;
    renderActiveTab();
  }
});

el.bossesContent.addEventListener("click", (e) => {
  const sortHeader = e.target.closest("[data-sort]");
  if (sortHeader) {
    setSort(state.bossesSort, sortHeader.dataset.sort);
    renderActiveTab();
  }
});

function setSort(sortState, key) {
  if (sortState.key === key) {
    sortState.dir = sortState.dir === "asc" ? "desc" : "asc";
  } else {
    sortState.key = key;
    sortState.dir = key === "name" ? "asc" : "desc";
  }
}

el.copyLinkBtn.addEventListener("click", async () => {
  if (!cache.group) return;
  const url = new URL(location.href);
  url.search = "";
  url.searchParams.set("group", cache.group.id);
  url.searchParams.set("period", el.periodSelect.value);
  const shareUrl = url.toString();

  const original = el.copyLinkBtn.textContent;
  try {
    await navigator.clipboard.writeText(shareUrl);
    el.copyLinkBtn.textContent = "Copied!";
  } catch {
    window.prompt("Copy this link to share with your group:", shareUrl);
  }
  setTimeout(() => {
    el.copyLinkBtn.textContent = original;
  }, 1500);
});

el.saveAdvancedBtn.addEventListener("click", () => {
  config.apiKey = el.apiKeyInput.value.trim();
  config.verificationCode = el.verificationCodeInput.value.trim();
  saveConfig(config);
  el.syncStatus.textContent = "Saved.";
  setTimeout(() => {
    if (el.syncStatus.textContent === "Saved.") el.syncStatus.textContent = "";
  }, 2000);
});

el.syncAllBtn.addEventListener("click", async () => {
  if (!cache.group) return;
  const code = el.verificationCodeInput.value.trim();
  if (!code) {
    el.syncStatus.textContent = "Enter your group's verification code first.";
    return;
  }
  const apiKey = el.apiKeyInput.value.trim() || undefined;
  el.syncAllBtn.disabled = true;
  el.syncStatus.textContent = "Requesting update for all members…";
  try {
    await updateAllMembers(cache.group.id, code, apiKey);
    el.syncStatus.textContent = "Update queued! Give Wise Old Man a minute, then hit Refresh.";
  } catch (err) {
    el.syncStatus.textContent = err instanceof WomApiError ? err.message : "Could not queue updates.";
  } finally {
    el.syncAllBtn.disabled = false;
  }
});

// -------------------------------------------------------------- Autoload

// A shared link like ?group=12345&period=month lets teammates land straight
// on the group's data with nothing to type. It takes priority over whatever
// was previously saved in this browser, and gets saved as the new default
// once it loads successfully (see loadFull).
const urlParams = new URLSearchParams(location.search);
const urlGroupId = urlParams.get("group");
const urlPeriod = urlParams.get("period");

if (urlPeriod && ["day", "week", "month", "year"].includes(urlPeriod)) {
  el.periodSelect.value = urlPeriod;
}
if (urlGroupId) {
  el.groupIdInput.value = urlGroupId;
}

const initialGroupId = urlGroupId || config.groupId;
if (initialGroupId) {
  loadFull(initialGroupId);
} else {
  renderAll();
}
