const BASE = "https://images.unsplash.com/photo-";
const TAIL = "?auto=format&w=1200&q=80";

const IMG = {
  mountain: `${BASE}1506905925346-21bda4d32df4${TAIL}`,
  lake: `${BASE}1469474968028-56623f02e42e${TAIL}`,
  forest: `${BASE}1454496522488-7a8e488e8606${TAIL}`,
  culture: `${BASE}1448375240586-882707db888b${TAIL}`,
  desert: `${BASE}1473580044384-7ba9967e16a0${TAIL}`,
  vista: `${BASE}1464822759023-fed622ff2c3b${TAIL}`,
  rural: `${BASE}1502791451862-7bd8c1df43a7${TAIL}`,
};

const RULES = [
  {
    match:
      /mosque|masjid|tomb|shrine|mausoleum|fort|qila|palace|haveli|castle|museum|monument|memorial|culture|history|bazaar|market|bazar|shopping|mall|restaurant|cafe|food|kebab|biryani|tikka|nihari|chapli|paye|halwa|kitchen|dining|tasting/,
    img: IMG.culture,
  },
  {
    match:
      /lake|river|stream|attabad|saif|kachura|satpara|hanna|lulusar|mahodand|sheosar|waterfall|water|boat|sail/,
    img: IMG.lake,
  },
  {
    match: /sea|beach|coast|clifton|do darya|manora|sea view/,
    img: IMG.rural,
  },
  {
    match: /desert|sand|cholistan|sarfaranga|dune/,
    img: IMG.desert,
  },
  {
    match:
      /forest|meadow|garden|shalimar|park|tree|pine|orchard|valley/,
    img: IMG.forest,
  },
  {
    match:
      /village|saidpur|altit|karimabad|kalash|hamlet|home group/,
    img: IMG.rural,
  },
  {
    match:
      /mountain|peak|cone|nanga parbat|rakaposhi|k2|babusar|deosai|margalla|hill|hike|trek|trail|climb|ski|glacier|snow|pass|khunjerab|khyber|karakoram/,
    img: IMG.mountain,
  },
  {
    match: /viewpoint|view|sunrise|sunset|duikar|nest|panorama|vista/,
    img: IMG.vista,
  },
];

export function pickFallbackImage(name, type, tags = []) {
  const text = `${name ?? ""} ${type ?? ""} ${(tags || []).join(" ")}`.toLowerCase();
  for (const r of RULES) if (r.match.test(text)) return r.img;
  return IMG.vista;
}
