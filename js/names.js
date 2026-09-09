// Friendly display names for Wise Old Man metric keys.
// The app never hard-codes the *list* of bosses/skills it will show — that list is
// always read from whatever keys Wise Old Man actually returns for a player. This
// map only prettifies the ones we recognize; anything unmapped falls back to
// auto title-casing so new bosses WOM adds later still render sensibly.

export const BOSS_NAMES = {
  abyssal_sire: "Abyssal Sire",
  alchemical_hydra: "Alchemical Hydra",
  amoxliatl: "Amoxliatl",
  araxxor: "Araxxor",
  artio: "Artio",
  barrows_chests: "Barrows Chests",
  bryophyta: "Bryophyta",
  callisto: "Callisto",
  calvarion: "Calvar'ion",
  cerberus: "Cerberus",
  chambers_of_xeric: "Chambers of Xeric",
  chambers_of_xeric_challenge_mode: "Chambers of Xeric (CM)",
  chaos_elemental: "Chaos Elemental",
  chaos_fanatic: "Chaos Fanatic",
  commander_zilyana: "Commander Zilyana",
  corporeal_beast: "Corporeal Beast",
  crazy_archaeologist: "Crazy Archaeologist",
  dagannoth_prime: "Dagannoth Prime",
  dagannoth_rex: "Dagannoth Rex",
  dagannoth_supreme: "Dagannoth Supreme",
  deranged_archaeologist: "Deranged Archaeologist",
  duke_sucellus: "Duke Sucellus",
  general_graardor: "General Graardor",
  giant_mole: "Giant Mole",
  grotesque_guardians: "Grotesque Guardians",
  hespori: "Hespori",
  the_hueycoatl: "The Hueycoatl",
  kalphite_queen: "Kalphite Queen",
  king_black_dragon: "King Black Dragon",
  kraken: "Kraken",
  kreearra: "Kree'Arra",
  kril_tsutsaroth: "K'ril Tsutsaroth",
  lunar_chests: "Lunar Chests",
  mimic: "Mimic",
  nex: "Nex",
  nightmare: "The Nightmare",
  phosanis_nightmare: "Phosani's Nightmare",
  obor: "Obor",
  phantom_muspah: "Phantom Muspah",
  royal_titans: "The Royal Titans",
  sarachnis: "Sarachnis",
  scorpia: "Scorpia",
  scurrius: "Scurrius",
  skotizo: "Skotizo",
  sol_heredit: "Sol Heredit",
  spindel: "Spindel",
  tempoross: "Tempoross",
  the_gauntlet: "The Gauntlet",
  the_corrupted_gauntlet: "The Corrupted Gauntlet",
  the_leviathan: "The Leviathan",
  the_whisperer: "The Whisperer",
  theatre_of_blood: "Theatre of Blood",
  theatre_of_blood_hard_mode: "Theatre of Blood (HM)",
  thermonuclear_smoke_devil: "Thermonuclear Smoke Devil",
  tombs_of_amascut: "Tombs of Amascut",
  tombs_of_amascut_expert: "Tombs of Amascut (Expert)",
  tzkal_zuk: "TzKal-Zuk",
  tztok_jad: "TzTok-Jad",
  vardorvis: "Vardorvis",
  venenatis: "Venenatis",
  vetion: "Vet'ion",
  vorkath: "Vorkath",
  wintertodt: "Wintertodt",
  yama: "Yama",
  zalcano: "Zalcano",
  zulrah: "Zulrah",
};

export const SKILL_NAMES = {
  overall: "Overall",
  hitpoints: "Hitpoints",
  runecrafting: "Runecrafting",
};

export function titleCase(key) {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function bossName(key) {
  return BOSS_NAMES[key] || titleCase(key);
}

export function skillName(key) {
  return SKILL_NAMES[key] || titleCase(key);
}

export const PLAYER_TYPE_LABELS = {
  regular: "Regular",
  ironman: "Ironman",
  hardcore: "Hardcore Ironman",
  ultimate: "Ultimate Ironman",
  unknown: "Unknown",
};
