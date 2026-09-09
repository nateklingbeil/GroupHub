// Turns raw Wise Old Man responses into the shapes the UI renders.

/** Builds a lookup of username -> XP gained for the selected period. */
function gainedByUsername(gainedResponse) {
  const map = new Map();
  for (const entry of gainedResponse || []) {
    const username = entry.player?.username;
    if (username) map.set(username, entry.data?.gained ?? 0);
  }
  return map;
}

/**
 * Combines group membership, gained-XP, and per-player snapshots into one
 * row per member, plus group-wide boss totals.
 */
export function buildMemberRows(group, gainedResponse, players) {
  const gainedMap = gainedByUsername(gainedResponse);
  const playerByUsername = new Map(players.map((p) => [p.username, p]));

  const rows = (group.memberships || []).map((membership) => {
    const base = membership.player;
    const full = playerByUsername.get(base.username) || base;
    const snapshot = full.latestSnapshot?.data;
    const bosses = snapshot?.bosses || {};

    const bossKills = Object.entries(bosses)
      .map(([key, val]) => ({ key, kills: val?.kills > 0 ? val.kills : 0 }))
      .filter((b) => b.kills > 0)
      .sort((a, b) => b.kills - a.kills);

    const totalBossKills = bossKills.reduce((sum, b) => sum + b.kills, 0);
    const overallXp = snapshot?.skills?.overall?.experience ?? full.exp ?? 0;

    return {
      id: full.id ?? base.id,
      username: full.username ?? base.username,
      displayName: full.displayName ?? base.displayName ?? base.username,
      role: membership.role,
      type: full.type || base.type || "unknown",
      build: full.build || base.build || "main",
      overallXp,
      xpGained: gainedMap.get(base.username) ?? 0,
      totalBossKills,
      bossKills, // sorted, non-zero only
      ehb: full.ehb ?? 0,
      updatedAt: full.updatedAt || base.updatedAt || null,
    };
  });

  return rows;
}

/** Aggregates per-boss kill totals across the whole group. */
export function buildBossTotals(memberRows) {
  const totals = new Map(); // bossKey -> { key, totalKills, topKiller: {name, kills}, killerCount }

  for (const member of memberRows) {
    for (const { key, kills } of member.bossKills) {
      if (!totals.has(key)) {
        totals.set(key, { key, totalKills: 0, topKiller: null, killerCount: 0 });
      }
      const entry = totals.get(key);
      entry.totalKills += kills;
      entry.killerCount += 1;
      if (!entry.topKiller || kills > entry.topKiller.kills) {
        entry.topKiller = { name: member.displayName, kills };
      }
    }
  }

  return [...totals.values()].sort((a, b) => b.totalKills - a.totalKills);
}

export function groupSummary(memberRows, bossTotals) {
  return {
    memberCount: memberRows.length,
    totalXp: memberRows.reduce((s, m) => s + m.overallXp, 0),
    totalXpGained: memberRows.reduce((s, m) => s + m.xpGained, 0),
    totalBossKills: bossTotals.reduce((s, b) => s + b.totalKills, 0),
    bossesTracked: bossTotals.length,
    topXpGainer: [...memberRows].sort((a, b) => b.xpGained - a.xpGained)[0] || null,
    topBossKiller: [...memberRows].sort((a, b) => b.totalBossKills - a.totalBossKills)[0] || null,
  };
}
