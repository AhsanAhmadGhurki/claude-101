const RULES = [
  { match: /mosque|masjid/, icon: "mdi:mosque" },
  { match: /tomb|shrine|mausoleum/, icon: "mdi:bank" },
  { match: /fort|qila|citadel|hisar|palace|haveli/, icon: "mdi:castle" },
  { match: /museum|gallery/, icon: "mdi:image-frame" },
  { match: /park|garden|shalimar|meadow/, icon: "mdi:flower-tulip-outline" },
  { match: /bazaar|market|shopping|mall|bazar/, icon: "mdi:storefront-outline" },
  { match: /food|restaurant|cafe|dinner|lunch|breakfast|kebab|biryani|tikka|kitchen|tasting|cuisine|nihari|paye|halwa|trout|karahi|chapli/, icon: "mdi:silverware-fork-knife" },
  { match: /lake|river|stream|attabad|saif|kachura|satpara|hanna/, icon: "mdi:waves" },
  { match: /waterfall/, icon: "mdi:waterfall" },
  { match: /glacier|snow/, icon: "mdi:snowflake" },
  { match: /desert/, icon: "mdi:weather-sunny" },
  { match: /beach|sea|coast|clifton|sea view|do darya|manora/, icon: "mdi:beach" },
  { match: /bridge|hussaini/, icon: "mdi:bridge" },
  { match: /cone|peak|nanga parbat|rakaposhi|k2|babusar|deosai|margalla/, icon: "mdi:image-filter-hdr" },
  { match: /viewpoint|view|sunset|sunrise|duikar|nest/, icon: "mdi:binoculars" },
  { match: /hike|trek|trail/, icon: "mdi:hiking" },
  { match: /village|saidpur|altit|karimabad|kalash/, icon: "mdi:home-group" },
  { match: /pass|highway|karakoram|babusar|khunjerab|khyber/, icon: "mdi:road-variant" },
  { match: /boat|sail/, icon: "mdi:sail-boat" },
  { match: /jeep|drive|road trip|car/, icon: "mdi:car-traction-control" },
  { match: /camp|stargazing|tent/, icon: "mdi:tent" },
  { match: /ceremony|festival|wagah|flag/, icon: "mdi:flag-outline" },
  { match: /clock tower|tower|minar/, icon: "mdi:tower" },
  { match: /ski/, icon: "mdi:ski" },
  { match: /cathedral|church/, icon: "mdi:church" },
  { match: /monument|memorial/, icon: "mdi:bank-outline" },
];

export function pickCategoryIcon(name, type, tags = []) {
  const text = `${name ?? ""} ${type ?? ""} ${(tags || []).join(" ")}`.toLowerCase();
  for (const r of RULES) if (r.match.test(text)) return r.icon;
  return "mdi:map-marker-radius";
}
