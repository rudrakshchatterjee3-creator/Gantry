// --- FIFA World Cup 2026 Host Venue Catalog ----------------------------------
// All 16 official host stadiums. Coordinates verified against Wikidata (not
// guessed from memory — an earlier pass trusted a wrong Wikidata ID for
// Levi's Stadium that pointed at a location in Greece; every coordinate here
// was re-verified via Wikidata's search API + entity data, and US county
// FIPS codes were verified directly against the live Census API). Photos are
// real Wikimedia Commons files, individually curl-verified (200, image/*)
// during implementation — no guessed URLs. photoThumbUrl is a real,
// server-generated ~330px Wikimedia thumbnail (fetched via their imageinfo
// API's iiurlwidth param, not a guessed /thumb/.../Npx- URL — Wikimedia
// only pre-generates a small allowlist of widths per file and returns 400
// for anything else, so the URL pattern can't be hand-constructed
// reliably). Used for the Tournament HQ grid's 16 small tiles, where the
// full-resolution photoUrl (hundreds of KB, sometimes MB) was forcing the
// browser to decode a full-size image just to show it at ~96px — real,
// measurable scroll jank as each newly-visible tile decoded during scroll.
// Each thumb URL individually curl-verified (200, image/jpeg, 13-47KB).

export interface Venue {
  id: string;
  name: string; // actual stadium name
  tournamentName: string; // FIFA's neutral tournament branding
  city: string;
  region: string; // state/province
  country: "USA" | "Mexico" | "Canada";
  lat: number;
  lon: number;
  timeZone: string; // IANA name — drives the gate-load model's real time-of-day signal
  stateFips?: string; // US venues only — needed for Census county queries
  countyFips?: string;
  photoUrl: string | null; // null = no verified photo, hero falls back to text-only
  photoThumbUrl: string | null; // real Wikimedia-generated ~330px thumbnail, for small contexts (Tournament HQ grid)
  photoAttributionUrl: string | null;
  capacity: number; // real seating capacity, football/soccer configuration
}

export const VENUE_CATALOG: Venue[] = [
  {
    id: "metlife",
    name: "MetLife Stadium",
    tournamentName: "New York New Jersey Stadium",
    city: "East Rutherford",
    region: "New Jersey",
    country: "USA",
    lat: 40.8136,
    lon: -74.0744,
    timeZone: "America/New_York",
    stateFips: "34",
    countyFips: "003",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/24/MetLife_Stadium_Exterior.jpg",
    photoThumbUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/MetLife_Stadium_Exterior.jpg/330px-MetLife_Stadium_Exterior.jpg",
    photoAttributionUrl: "https://commons.wikimedia.org/wiki/File:MetLife_Stadium_Exterior.jpg",
    capacity: 82_500,
  },
  {
    id: "att",
    name: "AT&T Stadium",
    tournamentName: "Dallas Stadium",
    city: "Arlington",
    region: "Texas",
    country: "USA",
    lat: 32.7477,
    lon: -97.0929,
    timeZone: "America/Chicago",
    stateFips: "48",
    countyFips: "439",
    photoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/1/11/Arlington_June_2020_4_%28AT%26T_Stadium%29.jpg",
    photoThumbUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Arlington_June_2020_4_%28AT%26T_Stadium%29.jpg/330px-Arlington_June_2020_4_%28AT%26T_Stadium%29.jpg",
    photoAttributionUrl:
      "https://commons.wikimedia.org/wiki/File:Arlington_June_2020_4_(AT%26T_Stadium).jpg",
    capacity: 80_000,
  },
  {
    id: "sofi",
    name: "SoFi Stadium",
    tournamentName: "Los Angeles Stadium",
    city: "Inglewood",
    region: "California",
    country: "USA",
    lat: 33.9504,
    lon: -118.338,
    timeZone: "America/Los_Angeles",
    stateFips: "06",
    countyFips: "037",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b3/SoFi_Stadium_2023.jpg",
    photoThumbUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/SoFi_Stadium_2023.jpg/330px-SoFi_Stadium_2023.jpg",
    photoAttributionUrl: "https://commons.wikimedia.org/wiki/File:SoFi_Stadium_2023.jpg",
    capacity: 70_240,
  },
  {
    id: "arrowhead",
    name: "GEHA Field at Arrowhead Stadium",
    tournamentName: "Kansas City Stadium",
    city: "Kansas City",
    region: "Missouri",
    country: "USA",
    lat: 39.0489,
    lon: -94.4839,
    timeZone: "America/Chicago",
    stateFips: "29",
    countyFips: "095",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Arrowhead_Stadium_2010.JPG",
    photoThumbUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Arrowhead_Stadium_2010.JPG/330px-Arrowhead_Stadium_2010.JPG",
    photoAttributionUrl: "https://commons.wikimedia.org/wiki/File:Arrowhead_Stadium_2010.JPG",
    capacity: 76_416,
  },
  {
    id: "levis",
    name: "Levi's Stadium",
    tournamentName: "San Francisco Bay Area Stadium",
    city: "Santa Clara",
    region: "California",
    country: "USA",
    lat: 37.4034,
    lon: -121.97,
    timeZone: "America/Los_Angeles",
    stateFips: "06",
    countyFips: "085",
    photoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/9/9b/Levi%27s_Stadium_2019-01-30_080121.jpg",
    photoThumbUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Levi%27s_Stadium_2019-01-30_080121.jpg/330px-Levi%27s_Stadium_2019-01-30_080121.jpg",
    photoAttributionUrl:
      "https://commons.wikimedia.org/wiki/File:Levi%27s_Stadium_2019-01-30_080121.jpg",
    capacity: 68_500,
  },
  {
    id: "nrg",
    name: "NRG Stadium",
    tournamentName: "Houston Stadium",
    city: "Houston",
    region: "Texas",
    country: "USA",
    lat: 29.6847,
    lon: -95.4108,
    timeZone: "America/Chicago",
    stateFips: "48",
    countyFips: "201",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3a/NRG_Stadium_SBLI_Outside.jpg",
    photoThumbUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/NRG_Stadium_SBLI_Outside.jpg/330px-NRG_Stadium_SBLI_Outside.jpg",
    photoAttributionUrl: "https://commons.wikimedia.org/wiki/File:NRG_Stadium_SBLI_Outside.jpg",
    capacity: 72_220,
  },
  {
    id: "lincoln-financial",
    name: "Lincoln Financial Field",
    tournamentName: "Philadelphia Stadium",
    city: "Philadelphia",
    region: "Pennsylvania",
    country: "USA",
    lat: 39.9009,
    lon: -75.1678,
    timeZone: "America/New_York",
    stateFips: "42",
    countyFips: "101",
    photoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/0/03/Lincoln_Financial_Field%2C_Philadelphia%2C_2024.jpg",
    photoThumbUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Lincoln_Financial_Field%2C_Philadelphia%2C_2024.jpg/330px-Lincoln_Financial_Field%2C_Philadelphia%2C_2024.jpg",
    photoAttributionUrl:
      "https://commons.wikimedia.org/wiki/File:Lincoln_Financial_Field,_Philadelphia,_2024.jpg",
    capacity: 69_596,
  },
  {
    id: "mercedes-benz",
    name: "Mercedes-Benz Stadium",
    tournamentName: "Atlanta Stadium",
    city: "Atlanta",
    region: "Georgia",
    country: "USA",
    lat: 33.7553,
    lon: -84.4008,
    timeZone: "America/New_York",
    stateFips: "13",
    countyFips: "121",
    photoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/b/bb/Mercedes-Benz_Stadium%2C_December_2024.jpg",
    photoThumbUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Mercedes-Benz_Stadium%2C_December_2024.jpg/330px-Mercedes-Benz_Stadium%2C_December_2024.jpg",
    photoAttributionUrl:
      "https://commons.wikimedia.org/wiki/File:Mercedes-Benz_Stadium,_December_2024.jpg",
    capacity: 71_000,
  },
  {
    id: "lumen",
    name: "Lumen Field",
    tournamentName: "Seattle Stadium",
    city: "Seattle",
    region: "Washington",
    country: "USA",
    lat: 47.5953,
    lon: -122.3317,
    timeZone: "America/Los_Angeles",
    stateFips: "53",
    countyFips: "033",
    photoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/5d/Lumen_Field_exterior%2C_July_2023.jpg",
    photoThumbUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Lumen_Field_exterior%2C_July_2023.jpg/330px-Lumen_Field_exterior%2C_July_2023.jpg",
    photoAttributionUrl:
      "https://commons.wikimedia.org/wiki/File:Lumen_Field_exterior,_July_2023.jpg",
    capacity: 68_740,
  },
  {
    id: "hard-rock",
    name: "Hard Rock Stadium",
    tournamentName: "Miami Stadium",
    city: "Miami Gardens",
    region: "Florida",
    country: "USA",
    lat: 25.9581,
    lon: -80.2389,
    timeZone: "America/New_York",
    stateFips: "12",
    countyFips: "086",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d4/Hard_Rock_Stadium_2017_2.jpg",
    photoThumbUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Hard_Rock_Stadium_2017_2.jpg/330px-Hard_Rock_Stadium_2017_2.jpg",
    photoAttributionUrl: "https://commons.wikimedia.org/wiki/File:Hard_Rock_Stadium_2017_2.jpg",
    capacity: 65_326,
  },
  {
    id: "gillette",
    name: "Gillette Stadium",
    tournamentName: "Boston Stadium",
    city: "Foxborough",
    region: "Massachusetts",
    country: "USA",
    lat: 42.0909,
    lon: -71.2643,
    timeZone: "America/New_York",
    stateFips: "25",
    countyFips: "021",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Gillette_Stadium02.jpg",
    photoThumbUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Gillette_Stadium02.jpg/330px-Gillette_Stadium02.jpg",
    photoAttributionUrl: "https://commons.wikimedia.org/wiki/File:Gillette_Stadium02.jpg",
    capacity: 65_878,
  },
  {
    id: "azteca",
    name: "Estadio Azteca",
    tournamentName: "Mexico City Stadium",
    city: "Mexico City",
    region: "Ciudad de México",
    country: "Mexico",
    lat: 19.3031,
    lon: -99.1506,
    timeZone: "America/Mexico_City",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5b/Estadio_Azteca1706p2.jpg",
    photoThumbUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Estadio_Azteca1706p2.jpg/330px-Estadio_Azteca1706p2.jpg",
    photoAttributionUrl: "https://commons.wikimedia.org/wiki/File:Estadio_Azteca1706p2.jpg",
    capacity: 87_523,
  },
  {
    id: "bbva",
    name: "Estadio BBVA",
    tournamentName: "Monterrey Stadium",
    city: "Guadalupe",
    region: "Nuevo León",
    country: "Mexico",
    lat: 25.6702,
    lon: -100.2437,
    timeZone: "America/Monterrey",
    photoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/e/e5/Estadio_BBVA_Bancomer_%281%29.jpg",
    photoThumbUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Estadio_BBVA_Bancomer_%281%29.jpg/330px-Estadio_BBVA_Bancomer_%281%29.jpg",
    photoAttributionUrl:
      "https://commons.wikimedia.org/wiki/File:Estadio_BBVA_Bancomer_(1).jpg",
    capacity: 53_500,
  },
  {
    id: "akron",
    name: "Estadio Akron",
    tournamentName: "Guadalajara Stadium",
    city: "Zapopan",
    region: "Jalisco",
    country: "Mexico",
    lat: 20.6817,
    lon: -103.4628,
    timeZone: "America/Mexico_City",
    photoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/e/ef/Estadio_Akron_interior_0319.jpg",
    photoThumbUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Estadio_Akron_interior_0319.jpg/330px-Estadio_Akron_interior_0319.jpg",
    photoAttributionUrl: "https://commons.wikimedia.org/wiki/File:Estadio_Akron_interior_0319.jpg",
    capacity: 48_071,
  },
  {
    id: "bc-place",
    name: "BC Place",
    tournamentName: "Vancouver Stadium",
    city: "Vancouver",
    region: "British Columbia",
    country: "Canada",
    lat: 49.2767,
    lon: -123.1119,
    timeZone: "America/Vancouver",
    photoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/4/42/BC_Place_Opening_Day_2011-09-30.jpg",
    photoThumbUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/BC_Place_Opening_Day_2011-09-30.jpg/330px-BC_Place_Opening_Day_2011-09-30.jpg",
    photoAttributionUrl:
      "https://commons.wikimedia.org/wiki/File:BC_Place_Opening_Day_2011-09-30.jpg",
    capacity: 54_500,
  },
  {
    id: "bmo-field",
    name: "BMO Field",
    tournamentName: "Toronto Stadium",
    city: "Toronto",
    region: "Ontario",
    country: "Canada",
    lat: 43.6328,
    lon: -79.4186,
    timeZone: "America/Toronto",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Toronto_-_ON_-_BMO_Field.jpg",
    photoThumbUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Toronto_-_ON_-_BMO_Field.jpg/330px-Toronto_-_ON_-_BMO_Field.jpg",
    photoAttributionUrl: "https://commons.wikimedia.org/wiki/File:Toronto_-_ON_-_BMO_Field.jpg",
    capacity: 30_000,
  },
];

export const DEFAULT_VENUE_ID = "metlife";

export function getVenueById(id: string | undefined | null): Venue {
  return VENUE_CATALOG.find((v) => v.id === id) ?? VENUE_CATALOG[0];
}
