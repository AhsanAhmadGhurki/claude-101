// `img` URLs are Unsplash stock fallbacks. The cards fetch the lead photo from
// each destination's Wikipedia article at runtime via `useWikipediaImage`, so
// users see authentic location photos. Stock images only show if Wikipedia
// fails or is offline.

export const CATEGORIES = [
  { value: "all", label: "All", icon: "mdi:earth" },
  { value: "mountains", label: "Mountains", icon: "mdi:mountain" },
  { value: "lakes", label: "Lakes", icon: "mdi:waves" },
  { value: "forests", label: "Forests", icon: "mdi:pine-tree" },
  { value: "deserts", label: "Deserts", icon: "mdi:weather-sunny" },
];

export const DESTINATIONS = [
  {
    id: "hunza",
    name: "Hunza Valley",
    region: "Northern Pakistan",
    wikipedia: "Karimabad, Hunza",
    img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
    tag: "Mountains",
    category: "mountains",
    short: "Glacier views and ancient forts in the Karakoram.",
  },
  {
    id: "skardu",
    name: "Skardu",
    region: "Gilgit-Baltistan",
    wikipedia: "Skardu",
    img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
    tag: "Lakes & Trekking",
    category: "lakes",
    short: "Gateway to K2 and turquoise high-altitude lakes.",
  },
  {
    id: "fairy-meadows",
    name: "Fairy Meadows",
    region: "Nanga Parbat",
    wikipedia: "Fairy Meadows",
    img: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=1200&q=80",
    tag: "Camping",
    category: "mountains",
    short: "Alpine meadow with the world's 9th highest peak.",
  },
  {
    id: "kalash",
    name: "Kalash Valley",
    region: "Chitral",
    wikipedia: "Kalasha Valleys",
    img: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    tag: "Culture",
    category: "forests",
    short: "Ancient indigenous culture in pine-cloaked valleys.",
  },
  {
    id: "cholistan",
    name: "Cholistan",
    region: "Punjab",
    wikipedia: "Cholistan Desert",
    img: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=1200&q=80",
    tag: "Desert",
    category: "deserts",
    short: "Rolling sand dunes and forgotten desert forts.",
  },
  {
    id: "attabad",
    name: "Attabad Lake",
    region: "Gojal Valley",
    wikipedia: "Attabad Lake",
    img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    tag: "Lakes",
    category: "lakes",
    short: "Surreal turquoise lake born from a 2010 landslide.",
  },
];
