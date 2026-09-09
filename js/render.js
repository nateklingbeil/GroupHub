import { formatNumber, formatSigned, formatRelativeTime } from "./format.js";
import { bossName, PLAYER_TYPE_LABELS } from "./names.js";

function esc(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function typeLabel(type) {
  return PLAYER_TYPE_LABELS[type] || PLAYER_TYPE_LABELS.unknown;
}

function typeBadgeClass(type) {
  if (type === "ultimate") return "badge badge-ultimate";
  if (type === "hardcore") return "badge badge-hardcore";
  if (type === "ironman") return "badge badge-ironman";
  return "badge";
}

function bar(value, max) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return `<div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>`;
}

// ---------------------------------------------------------------- Dashboard

export function renderDashboard({ group, summary, memberRows, bossTotals, period }) {
  if (!group) {
    return emptyState(
      "No group loaded yet",
      "Enter your Wise Old Man Group ID above and click “Load Group” to get started."
    );
  }

  const topGainers = [...memberRows].sort((a, b) => b.xpGained - a.xpGained).slice(0, 5);
  const topKillers = [...memberRows].sort((a, b) => b.totalBossKills - a.totalBossKills).slice(0, 5);
  const topBosses = bossTotals.slice(0, 5);
  const maxGained = topGainers[0]?.xpGained || 1;
  const maxKills = topKillers[0]?.totalBossKills || 1;
  const maxBossTotal = topBosses[0]?.totalKills || 1;

  return `
    <div class="cards-grid">
      ${statCard("Group Members", formatNumber(summary.memberCount))}
      ${statCard("Total Group XP", formatNumber(summary.totalXp))}
      ${statCard(`XP Gained (${period})`, formatSigned(summary.totalXpGained), "accent")}
      ${statCard("Total Boss Kills", formatNumber(summary.totalBossKills), "accent")}
    </div>

    <div class="columns">
      <div class="panel">
        <h3>Top XP Gainers <span class="muted small">(${period})</span></h3>
        ${
          topGainers.length
            ? `<ul class="leaderboard">${topGainers
                .map(
                  (m) => `
              <li>
                <span class="lb-name">${esc(m.displayName)}</span>
                ${bar(m.xpGained, maxGained)}
                <span class="lb-value">${formatSigned(m.xpGained)}</span>
              </li>`
                )
                .join("")}</ul>`
            : `<p class="muted">No XP gains recorded for this period yet.</p>`
        }
      </div>

      <div class="panel">
        <h3>Top Boss Killers <span class="muted small">(all-time)</span></h3>
        ${
          topKillers.length && topKillers[0].totalBossKills > 0
            ? `<ul class="leaderboard">${topKillers
                .map(
                  (m) => `
              <li>
                <span class="lb-name">${esc(m.displayName)}</span>
                ${bar(m.totalBossKills, maxKills)}
                <span class="lb-value">${formatNumber(m.totalBossKills)}</span>
              </li>`
                )
                .join("")}</ul>`
            : `<p class="muted">No boss kills recorded yet.</p>`
        }
      </div>
    </div>

    <div class="panel">
      <h3>Most-Killed Bosses <span class="muted small">(group total)</span></h3>
      ${
        topBosses.length
          ? `<ul class="leaderboard">${topBosses
              .map(
                (b) => `
            <li>
              <span class="lb-name">${esc(bossName(b.key))}</span>
              ${bar(b.totalKills, maxBossTotal)}
              <span class="lb-value">${formatNumber(b.totalKills)}</span>
            </li>`
              )
              .join("")}</ul>`
          : `<p class="muted">No boss kills recorded yet.</p>`
      }
    </div>
  `;
}

function statCard(label, value, tone = "") {
  return `
    <div class="stat-card ${tone}">
      <div class="stat-value">${value}</div>
      <div class="stat-label">${esc(label)}</div>
    </div>
  `;
}

function emptyState(title, body) {
  return `
    <div class="empty-state">
      <h2>${esc(title)}</h2>
      <p class="muted">${esc(body)}</p>
    </div>
  `;
}

// ------------------------------------------------------------------ Members

const MEMBER_SORTERS = {
  name: (m) => m.displayName.toLowerCase(),
  xp: (m) => m.overallXp,
  gained: (m) => m.xpGained,
  kills: (m) => m.totalBossKills,
};

export function renderMembers(memberRows, { search, sortKey, sortDir, expandedId }) {
  if (!memberRows.length) {
    return emptyState("No members yet", "Load a group to see its member breakdown here.");
  }

  const term = search.trim().toLowerCase();
  let rows = memberRows.filter((m) => m.displayName.toLowerCase().includes(term));

  const sorter = MEMBER_SORTERS[sortKey] || MEMBER_SORTERS.gained;
  rows = rows.sort((a, b) => {
    const diff = sorter(a) < sorter(b) ? -1 : sorter(a) > sorter(b) ? 1 : 0;
    return sortDir === "asc" ? diff : -diff;
  });

  if (!rows.length) {
    return emptyState("No matches", `No members match “${search}”.`);
  }

  const arrow = (key) => (sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "");

  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th data-sort="name" class="sortable">Member${arrow("name")}</th>
            <th>Type</th>
            <th data-sort="xp" class="sortable num">Total XP${arrow("xp")}</th>
            <th data-sort="gained" class="sortable num">XP Gained${arrow("gained")}</th>
            <th data-sort="kills" class="sortable num">Boss KC${arrow("kills")}</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((m) => memberRowHtml(m, expandedId)).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function memberRowHtml(m, expandedId) {
  const expanded = expandedId === String(m.id);
  const detailRow = expanded
    ? `<tr class="detail-row"><td colspan="5">${bossBreakdownHtml(m)}</td></tr>`
    : "";
  return `
    <tr class="member-row ${expanded ? "expanded" : ""}" data-member-id="${m.id}">
      <td>
        <span class="expand-caret">${expanded ? "▾" : "▸"}</span>
        <strong>${esc(m.displayName)}</strong>
      </td>
      <td><span class="${typeBadgeClass(m.type)}">${esc(typeLabel(m.type))}</span></td>
      <td class="num">${formatNumber(m.overallXp)}</td>
      <td class="num ${m.xpGained > 0 ? "positive" : ""}">${formatSigned(m.xpGained)}</td>
      <td class="num">${formatNumber(m.totalBossKills)}</td>
    </tr>
    ${detailRow}
  `;
}

function bossBreakdownHtml(m) {
  if (!m.bossKills.length) {
    return `<p class="muted">No ranked boss kills recorded for ${esc(m.displayName)} yet.</p>`;
  }
  const max = m.bossKills[0].kills;
  return `
    <div class="boss-breakdown">
      ${m.bossKills
        .map(
          (b) => `
        <div class="boss-chip">
          <span class="boss-chip-name">${esc(bossName(b.key))}</span>
          ${bar(b.kills, max)}
          <span class="boss-chip-kc">${formatNumber(b.kills)}</span>
        </div>`
        )
        .join("")}
    </div>
  `;
}

// ------------------------------------------------------------------- Bosses

export function renderBosses(bossTotals, { search, sortKey, sortDir }) {
  if (!bossTotals.length) {
    return emptyState(
      "No boss kills yet",
      "Once members have ranked boss kills on Wise Old Man, group totals will show up here."
    );
  }

  const term = search.trim().toLowerCase();
  let rows = bossTotals.filter((b) => bossName(b.key).toLowerCase().includes(term));

  const sorters = {
    name: (b) => bossName(b.key).toLowerCase(),
    total: (b) => b.totalKills,
    killers: (b) => b.killerCount,
  };
  const sorter = sorters[sortKey] || sorters.total;
  rows = rows.sort((a, b) => {
    const diff = sorter(a) < sorter(b) ? -1 : sorter(a) > sorter(b) ? 1 : 0;
    return sortDir === "asc" ? diff : -diff;
  });

  if (!rows.length) {
    return emptyState("No matches", `No bosses match “${search}”.`);
  }

  const arrow = (key) => (sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "");

  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th data-sort="name" class="sortable">Boss${arrow("name")}</th>
            <th data-sort="total" class="sortable num">Group Total KC${arrow("total")}</th>
            <th>Top Killer</th>
            <th data-sort="killers" class="sortable num">Hunters${arrow("killers")}</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (b) => `
            <tr>
              <td><strong>${esc(bossName(b.key))}</strong></td>
              <td class="num">${formatNumber(b.totalKills)}</td>
              <td>${b.topKiller ? `${esc(b.topKiller.name)} <span class="muted">(${formatNumber(b.topKiller.kills)})</span>` : "—"}</td>
              <td class="num">${b.killerCount}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

// ----------------------------------------------------------------- Status

export function renderStatusBanner(el, { loading, error, lastUpdated, progress }) {
  if (loading) {
    el.hidden = false;
    el.className = "status-banner loading";
    el.textContent = progress
      ? `Loading member data… (${progress.done}/${progress.total})`
      : "Loading…";
    return;
  }
  if (error) {
    el.hidden = false;
    el.className = "status-banner error";
    el.textContent = error;
    return;
  }
  if (lastUpdated) {
    el.hidden = false;
    el.className = "status-banner ok";
    el.textContent = `Last updated ${formatRelativeTime(lastUpdated)}`;
    return;
  }
  el.hidden = true;
}
