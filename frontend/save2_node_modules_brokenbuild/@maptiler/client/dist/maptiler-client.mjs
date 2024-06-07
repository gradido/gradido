import QuickLRU from 'quick-lru';

function tryGettingFetch() {
  if (typeof self !== "undefined") {
    return fetch.bind(self);
  }
  if (typeof global !== "undefined" && global.fetch) {
    return global.fetch;
  }
  return null;
}
class ClientConfig {
  constructor() {
    /**
     * MapTiler Cloud API key
     */
    this._apiKey = "";
    /**
     * The fetch function. To be set if in Node < 18, otherwise
     * will be automatically resolved.
     */
    this._fetch = tryGettingFetch();
    /**
     * Number of tiles to keep in cache
     */
    this.tileCacheSize = 200;
  }
  /**
   * Set the MapTiler Cloud API key
   */
  set apiKey(k) {
    this._apiKey = k;
  }
  /**
   * Get the MapTiler Cloud API key
   */
  get apiKey() {
    return this._apiKey;
  }
  /**
   * Set a the custom fetch function to replace the default one
   */
  set fetch(f) {
    this._fetch = f;
  }
  /**
   * Get the fetch fucntion
   */
  get fetch() {
    return this._fetch;
  }
}
const config = new ClientConfig();

const LanguageGeocoding = {
  AUTO: "auto",
  ALBANIAN: "sq",
  ARABIC: "ar",
  ARMENIAN: "hy",
  AZERBAIJANI: "az",
  BELORUSSIAN: "be",
  BOSNIAN: "bs",
  BRETON: "br",
  BULGARIAN: "bg",
  CATALAN: "ca",
  CHINESE: "zh",
  CROATIAN: "hr",
  CZECH: "cs",
  DANISH: "da",
  DUTCH: "nl",
  ENGLISH: "en",
  ESPERANTO: "eo",
  ESTONIAN: "et",
  FINNISH: "fi",
  FRENCH: "fr",
  FRISIAN: "fy",
  GEORGIAN: "ka",
  GERMAN: "de",
  GREEK: "el",
  HEBREW: "he",
  HUNGARIAN: "hu",
  ICELANDIC: "is",
  IRISH: "ga",
  ITALIAN: "it",
  JAPANESE: "ja",
  KANNADA: "kn",
  KAZAKH: "kk",
  KOREAN: "ko",
  ROMAN_LATIN: "la",
  LATVIAN: "lv",
  LITHUANIAN: "lt",
  LUXEMBOURGISH: "lb",
  MACEDONIAN: "mk",
  MALTESE: "mt",
  NORWEGIAN: "no",
  POLISH: "pl",
  PORTUGUESE: "pt",
  ROMANIAN: "ro",
  ROMANSH: "rm",
  RUSSIAN: "ru",
  SCOTTISH_GAELIC: "gd",
  SERBIAN_CYRILLIC: "sr",
  SLOVAK: "sk",
  SLOVENE: "sl",
  SPANISH: "es",
  SWEDISH: "sv",
  THAI: "th",
  TURKISH: "tr",
  UKRAINIAN: "uk",
  WELSH: "cy"
};
const languageCodeSet = new Set(Object.values(LanguageGeocoding));
function getAutoLanguageGeocoding() {
  if (typeof navigator === "undefined") {
    return Intl.DateTimeFormat().resolvedOptions().locale.split("-")[0];
  }
  const canditatelangs = Array.from(
    new Set(navigator.languages.map((l) => l.split("-")[0]))
  ).filter((l) => languageCodeSet.has(l));
  return canditatelangs.length ? canditatelangs[0] : LanguageGeocoding.ENGLISH;
}

async function callFetch(resource, options = {}) {
  if (config.fetch === null) {
    throw new Error(
      "The fetch function was not found. If on NodeJS < 18 please specify the fetch function with config.fetch"
    );
  }
  if (new URL(resource).searchParams.get("key").trim() === "") {
    throw new Error(
      "The MapTiler Cloud API key is missing. Set it in `config.apiKey` or get one for free at https://maptiler.com"
    );
  }
  return config.fetch(resource, options);
}

const defaults = {
  maptilerApiURL: "https://api.maptiler.com/",
  mapStyle: "streets-v2"
};
Object.freeze(defaults);

class ServiceError extends Error {
  constructor(res, customMessage = "") {
    super(
      `Call to enpoint ${res.url} failed with the status code ${res.status}. ${customMessage}`
    );
    this.res = res;
  }
}

const customMessages$4 = {
  400: "Query too long / Invalid parameters",
  403: "Key is missing, invalid or restricted"
};
function addLanguageGeocodingOptions(searchParams, options) {
  const { language } = options;
  if (language == void 0) {
    return;
  }
  const languages = Array.from(
    new Set(
      (Array.isArray(language) ? language : [language]).map(
        (lang) => lang === LanguageGeocoding.AUTO ? getAutoLanguageGeocoding() : lang
      )
    )
  ).join(",");
  searchParams.set("language", languages);
}
function addCommonForwardAndReverseGeocodingOptions(searchParams, options) {
  const { apiKey, limit, types, excludeTypes } = options;
  searchParams.set("key", apiKey ?? config.apiKey);
  if (limit != void 0) {
    searchParams.set("limit", String(limit));
  }
  if (types != void 0) {
    searchParams.set("types", types.join(","));
  }
  if (excludeTypes != void 0) {
    searchParams.set("excludeTypes", String(excludeTypes));
  }
  addLanguageGeocodingOptions(searchParams, options);
}
function addForwardGeocodingOptions(searchParams, options) {
  addCommonForwardAndReverseGeocodingOptions(searchParams, options);
  const { bbox, proximity, country, fuzzyMatch, autocomplete } = options;
  if (bbox != void 0) {
    searchParams.set("bbox", bbox.join(","));
  }
  if (proximity != void 0) {
    searchParams.set(
      "proximity",
      proximity === "ip" ? proximity : proximity.join(",")
    );
  }
  if (country != void 0) {
    searchParams.set("country", country.join(","));
  }
  if (fuzzyMatch != void 0) {
    searchParams.set("fuzzyMatch", fuzzyMatch ? "true" : "false");
  }
  if (autocomplete != void 0) {
    searchParams.set("autocomplete", autocomplete ? "true" : "false");
  }
}
async function forward(query, options = {}) {
  if (typeof query !== "string" || query.trim().length === 0) {
    throw new Error("The query must be a non-empty string");
  }
  const endpoint = new URL(
    `geocoding/${encodeURIComponent(query)}.json`,
    defaults.maptilerApiURL
  );
  const { searchParams } = endpoint;
  addForwardGeocodingOptions(searchParams, options);
  const urlWithParams = endpoint.toString();
  const res = await callFetch(urlWithParams);
  if (!res.ok) {
    throw new ServiceError(res, customMessages$4[res.status] ?? "");
  }
  const obj = await res.json();
  return obj;
}
async function reverse(position, options = {}) {
  if (!Array.isArray(position) || position.length < 2) {
    throw new Error("The position must be an array of form [lng, lat].");
  }
  const endpoint = new URL(
    `geocoding/${position[0]},${position[1]}.json`,
    defaults.maptilerApiURL
  );
  addCommonForwardAndReverseGeocodingOptions(endpoint.searchParams, options);
  const urlWithParams = endpoint.toString();
  const res = await callFetch(urlWithParams);
  if (!res.ok) {
    throw new ServiceError(res, customMessages$4[res.status] ?? "");
  }
  const obj = await res.json();
  return obj;
}
async function byId(id, options = {}) {
  const endpoint = new URL(`geocoding/${id}.json`, defaults.maptilerApiURL);
  endpoint.searchParams.set("key", options.apiKey ?? config.apiKey);
  addLanguageGeocodingOptions(endpoint.searchParams, options);
  const urlWithParams = endpoint.toString();
  const res = await callFetch(urlWithParams);
  if (!res.ok) {
    throw new ServiceError(res, customMessages$4[res.status] ?? "");
  }
  const obj = await res.json();
  return obj;
}
async function batch$1(queries, options = {}) {
  if (!queries.length) {
    return [];
  }
  const joinedQuery = queries.map((query) => encodeURIComponent(query)).join(";");
  const endpoint = new URL(
    `geocoding/${joinedQuery}.json`,
    defaults.maptilerApiURL
  );
  const { searchParams } = endpoint;
  addForwardGeocodingOptions(searchParams, options);
  const urlWithParams = endpoint.toString();
  const res = await callFetch(urlWithParams);
  if (!res.ok) {
    throw new ServiceError(res, customMessages$4[res.status] ?? "");
  }
  const obj = await res.json();
  return queries.length === 1 ? [obj] : obj;
}
const geocoding = {
  forward,
  reverse,
  byId,
  batch: batch$1,
  language: LanguageGeocoding
};

const customMessages$3 = {
  403: "Key is missing, invalid or restricted"
};
async function info(options = {}) {
  const endpoint = new URL(`geolocation/ip.json`, defaults.maptilerApiURL);
  endpoint.searchParams.set("key", options.apiKey ?? config.apiKey);
  const urlWithParams = endpoint.toString();
  const res = await callFetch(urlWithParams);
  if (!res.ok) {
    throw new ServiceError(
      res,
      res.status in customMessages$3 ? customMessages$3[res.status] : ""
    );
  }
  const obj = await res.json();
  return obj;
}
const geolocation = {
  info
};

const customMessages$2 = {
  403: "Key is missing, invalid or restricted"
};
async function search(query, options = {}) {
  if (typeof query !== "string" || query.trim().length === 0) {
    throw new Error("The query must be a non-empty string");
  }
  const endpoint = new URL(
    `coordinates/search/${query}.json`,
    defaults.maptilerApiURL
  );
  endpoint.searchParams.set("key", options.apiKey ?? config.apiKey);
  if ("limit" in options) {
    endpoint.searchParams.set("limit", options.limit.toString());
  }
  if ("transformations" in options) {
    endpoint.searchParams.set(
      "transformations",
      options.transformations.toString()
    );
  }
  if ("exports" in options) {
    endpoint.searchParams.set("exports", options.exports.toString());
  }
  const urlWithParams = endpoint.toString();
  const res = await callFetch(urlWithParams);
  if (!res.ok) {
    throw new ServiceError(
      res,
      res.status in customMessages$2 ? customMessages$2[res.status] : ""
    );
  }
  const obj = await res.json();
  return obj;
}
async function transform(positions, options = {}) {
  const coordinatesStr = (Array.isArray(positions[0]) ? positions : [positions]).map((coord) => `${coord[0]},${coord[1]}`).join(";");
  const endpoint = new URL(
    `coordinates/transform/${coordinatesStr}.json`,
    defaults.maptilerApiURL
  );
  endpoint.searchParams.set("key", options.apiKey ?? config.apiKey);
  if ("sourceCrs" in options) {
    endpoint.searchParams.set("s_srs", options.sourceCrs.toString());
  }
  if ("targetCrs" in options) {
    endpoint.searchParams.set("t_srs", options.targetCrs.toString());
  }
  if ("operations" in options) {
    endpoint.searchParams.set(
      "ops",
      (Array.isArray(options.operations) ? options.operations : [options.operations]).join("|")
    );
  }
  const urlWithParams = endpoint.toString();
  const res = await callFetch(urlWithParams);
  if (!res.ok) {
    throw new ServiceError(
      res,
      res.status in customMessages$2 ? customMessages$2[res.status] : ""
    );
  }
  const obj = await res.json();
  return obj;
}
const coordinates = {
  search,
  transform
};

const customMessages$1 = {
  403: "Key is missing, invalid or restricted"
};
async function get(dataId, options = {}) {
  if (typeof dataId !== "string" || dataId.trim().length === 0) {
    throw new Error("The data ID must be a non-empty string");
  }
  const endpoint = new URL(
    `data/${encodeURIComponent(dataId)}/features.json`,
    defaults.maptilerApiURL
  );
  endpoint.searchParams.set("key", options.apiKey ?? config.apiKey);
  const urlWithParams = endpoint.toString();
  const res = await callFetch(urlWithParams);
  if (!res.ok) {
    throw new ServiceError(
      res,
      res.status in customMessages$1 ? customMessages$1[res.status] : ""
    );
  }
  const obj = await res.json();
  return obj;
}
const data = {
  get
};

function expandMapStyle(style) {
  const maptilerDomainRegex = /^maptiler:\/\/(.*)/;
  let match;
  const trimmed = style.trim();
  let expandedStyle;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    expandedStyle = trimmed;
  } else if ((match = maptilerDomainRegex.exec(trimmed)) !== null) {
    expandedStyle = `https://api.maptiler.com/maps/${match[1]}/style.json`;
  } else {
    expandedStyle = `https://api.maptiler.com/maps/${trimmed}/style.json`;
  }
  return expandedStyle;
}
class MapStyleVariant {
  constructor(name, variantType, id, referenceStyle, description, imageURL) {
    this.name = name;
    this.variantType = variantType;
    this.id = id;
    this.referenceStyle = referenceStyle;
    this.description = description;
    this.imageURL = imageURL;
  }
  /**
   * Get the human-friendly name
   * @returns
   */
  getName() {
    return this.name;
  }
  getFullName() {
    return `${this.referenceStyle.getName()} ${this.name}`;
  }
  /**
   * Get the variant type (eg. "DEFAULT", "DARK", "PASTEL", etc.)
   * @returns
   */
  getType() {
    return this.variantType;
  }
  /**
   * Get the MapTiler Cloud id
   * @returns
   */
  getId() {
    return this.id;
  }
  /**
   * Get the human-friendly description
   */
  getDescription() {
    return this.description;
  }
  /**
   * Get the reference style this variant belongs to
   * @returns
   */
  getReferenceStyle() {
    return this.referenceStyle;
  }
  /**
   * Check if a variant of a given type exists for _this_ variants
   * (eg. if this is a "DARK", then we can check if there is a "LIGHT" variant of it)
   * @param variantType
   * @returns
   */
  hasVariant(variantType) {
    return this.referenceStyle.hasVariant(variantType);
  }
  /**
   * Retrieve the variant of a given type. If not found, will return the "DEFAULT" variant.
   * (eg. _this_ "DARK" variant does not have any "PASTEL" variant, then the "DEFAULT" is returned)
   * @param variantType
   * @returns
   */
  getVariant(variantType) {
    return this.referenceStyle.getVariant(variantType);
  }
  /**
   * Get all the variants for _this_ variants, except _this_ current one
   * @returns
   */
  getVariants() {
    return this.referenceStyle.getVariants().filter((v) => v !== this);
  }
  /**
   * Get the image URL that represent _this_ variant
   * @returns
   */
  getImageURL() {
    return this.imageURL;
  }
  /**
   * Get the style as usable by MapLibre, a string (URL) or a plain style description (StyleSpecification)
   * @returns
   */
  getExpandedStyleURL() {
    return expandMapStyle(this.getId());
  }
}
class ReferenceMapStyle {
  constructor(name, id) {
    this.name = name;
    this.id = id;
    /**
     * Variants that belong to this reference style, key being the reference type
     */
    this.variants = {};
    /**
     * Variants that belong to this reference style, ordered by relevance
     */
    this.orderedVariants = [];
  }
  /**
   * Get the human-friendly name of this reference style
   * @returns
   */
  getName() {
    return this.name;
  }
  /**
   * Get the id of _this_ reference style
   * @returns
   */
  getId() {
    return this.id;
  }
  /**
   * Add a variant to _this_ reference style
   * @param v
   */
  addVariant(v) {
    this.variants[v.getType()] = v;
    this.orderedVariants.push(v);
  }
  /**
   * Check if a given variant type exists for this reference style
   * @param variantType
   * @returns
   */
  hasVariant(variantType) {
    return variantType in this.variants;
  }
  /**
   * Get a given variant. If the given type of variant does not exist for this reference style,
   * then the most relevant default variant is returned instead
   * @param variantType
   * @returns
   */
  getVariant(variantType) {
    return variantType in this.variants ? this.variants[variantType] : this.orderedVariants[0];
  }
  /**
   * Get the list of variants for this reference style
   * @returns
   */
  getVariants() {
    return Object.values(this.variants);
  }
  /**
   * Get the defualt variant for this reference style
   * @returns
   */
  getDefaultVariant() {
    return this.orderedVariants[0];
  }
}
const mapStylePresetList = [
  {
    referenceStyleID: "STREETS",
    name: "Streets",
    description: "",
    variants: [
      {
        id: "streets-v2",
        name: "Default",
        variantType: "DEFAULT",
        description: "",
        imageURL: ""
      },
      {
        id: "streets-v2-dark",
        name: "Dark",
        variantType: "DARK",
        description: "",
        imageURL: ""
      },
      {
        id: "streets-v2-light",
        name: "Light",
        variantType: "LIGHT",
        description: "",
        imageURL: ""
      },
      {
        id: "streets-v2-night",
        name: "Night",
        variantType: "NIGHT",
        description: "",
        imageURL: ""
      },
      {
        id: "streets-v2-pastel",
        name: "Pastel",
        variantType: "PASTEL",
        description: "",
        imageURL: ""
      }
    ]
  },
  {
    referenceStyleID: "OUTDOOR",
    name: "Outdoor",
    description: "",
    variants: [
      {
        id: "outdoor-v2",
        name: "Default",
        variantType: "DEFAULT",
        description: "",
        imageURL: ""
      },
      {
        id: "outdoor-v2-dark",
        name: "Dark",
        variantType: "DARK",
        description: "",
        imageURL: ""
      }
    ]
  },
  {
    referenceStyleID: "WINTER",
    name: "Winter",
    description: "",
    variants: [
      {
        id: "winter-v2",
        name: "Default",
        variantType: "DEFAULT",
        description: "",
        imageURL: ""
      },
      {
        id: "winter-v2-dark",
        name: "Dark",
        variantType: "DARK",
        description: "",
        imageURL: ""
      }
    ]
  },
  {
    referenceStyleID: "SATELLITE",
    name: "Satellite",
    description: "",
    variants: [
      {
        id: "satellite",
        name: "Default",
        variantType: "DEFAULT",
        description: "",
        imageURL: ""
      }
    ]
  },
  {
    referenceStyleID: "HYBRID",
    name: "Hybrid",
    description: "",
    variants: [
      {
        id: "hybrid",
        name: "Default",
        variantType: "DEFAULT",
        description: "",
        imageURL: ""
      }
    ]
  },
  {
    referenceStyleID: "BASIC",
    name: "Basic",
    description: "",
    variants: [
      {
        id: "basic-v2",
        name: "Default",
        variantType: "DEFAULT",
        description: "",
        imageURL: ""
      },
      {
        id: "basic-v2-dark",
        name: "Dark",
        variantType: "DARK",
        description: "",
        imageURL: ""
      },
      {
        id: "basic-v2-light",
        name: "Light",
        variantType: "LIGHT",
        description: "",
        imageURL: ""
      }
    ]
  },
  {
    referenceStyleID: "BRIGHT",
    name: "Bright",
    description: "",
    variants: [
      {
        id: "bright-v2",
        name: "Default",
        variantType: "DEFAULT",
        description: "",
        imageURL: ""
      },
      {
        id: "bright-v2-dark",
        name: "Dark",
        variantType: "DARK",
        description: "",
        imageURL: ""
      },
      {
        id: "bright-v2-light",
        name: "Light",
        variantType: "LIGHT",
        description: "",
        imageURL: ""
      },
      {
        id: "bright-v2-pastel",
        name: "Pastel",
        variantType: "PASTEL",
        description: "",
        imageURL: ""
      }
    ]
  },
  {
    referenceStyleID: "OPENSTREETMAP",
    name: "OpenStreetMap",
    description: "",
    variants: [
      {
        id: "openstreetmap",
        name: "Default",
        variantType: "DEFAULT",
        description: "",
        imageURL: ""
      }
    ]
  },
  {
    referenceStyleID: "TOPO",
    name: "Topo",
    description: "",
    variants: [
      {
        id: "topo-v2",
        name: "Default",
        variantType: "DEFAULT",
        description: "",
        imageURL: ""
      },
      {
        id: "topo-v2-dark",
        name: "Dark",
        variantType: "DARK",
        description: "",
        imageURL: ""
      },
      {
        id: "topo-v2-shiny",
        name: "Shiny",
        variantType: "SHINY",
        description: "",
        imageURL: ""
      },
      {
        id: "topo-v2-pastel",
        name: "Pastel",
        variantType: "PASTEL",
        description: "",
        imageURL: ""
      },
      {
        id: "topo-v2-topographique",
        name: "Topographique",
        variantType: "TOPOGRAPHIQUE",
        description: "",
        imageURL: ""
      }
    ]
  },
  {
    referenceStyleID: "VOYAGER",
    name: "Voyager",
    description: "",
    variants: [
      {
        id: "voyager-v2",
        name: "Default",
        variantType: "DEFAULT",
        description: "",
        imageURL: ""
      },
      {
        id: "voyager-v2-darkmatter",
        name: "Darkmatter",
        variantType: "DARK",
        description: "",
        imageURL: ""
      },
      {
        id: "voyager-v2-positron",
        name: "Positron",
        variantType: "LIGHT",
        description: "",
        imageURL: ""
      },
      {
        id: "voyager-v2-vintage",
        name: "Vintage",
        variantType: "VINTAGE",
        description: "",
        imageURL: ""
      }
    ]
  },
  {
    referenceStyleID: "TONER",
    name: "Toner",
    description: "",
    variants: [
      {
        id: "toner-v2",
        name: "Default",
        variantType: "DEFAULT",
        description: "",
        imageURL: ""
      },
      {
        id: "toner-v2-background",
        name: "Background",
        variantType: "BACKGROUND",
        description: "",
        imageURL: ""
      },
      {
        id: "toner-v2-lite",
        name: "Lite",
        variantType: "LITE",
        description: "",
        imageURL: ""
      },
      {
        id: "toner-v2-lines",
        name: "Lines",
        variantType: "LINES",
        description: "",
        imageURL: ""
      }
    ]
  },
  {
    referenceStyleID: "DATAVIZ",
    name: "Dataviz",
    description: "",
    variants: [
      {
        id: "dataviz",
        name: "Default",
        variantType: "DEFAULT",
        description: "",
        imageURL: ""
      },
      {
        id: "dataviz-dark",
        name: "Dark",
        variantType: "DARK",
        description: "",
        imageURL: ""
      },
      {
        id: "dataviz-light",
        name: "Light",
        variantType: "LIGHT",
        description: "",
        imageURL: ""
      }
    ]
  },
  {
    referenceStyleID: "BACKDROP",
    name: "Backdrop",
    description: "",
    variants: [
      {
        id: "backdrop",
        name: "Default",
        variantType: "DEFAULT",
        description: "",
        imageURL: ""
      },
      {
        id: "backdrop-dark",
        name: "Dark",
        variantType: "DARK",
        description: "",
        imageURL: ""
      },
      {
        id: "backdrop-light",
        name: "Light",
        variantType: "LIGHT",
        description: "",
        imageURL: ""
      }
    ]
  },
  {
    referenceStyleID: "OCEAN",
    name: "Ocean",
    description: "",
    variants: [
      {
        id: "ocean",
        name: "Default",
        variantType: "DEFAULT",
        description: "",
        imageURL: ""
      }
    ]
  }
];
function makeReferenceStyleProxy(referenceStyle) {
  return new Proxy(referenceStyle, {
    get(target, prop, receiver) {
      if (target.hasVariant(prop)) {
        return target.getVariant(prop);
      }
      if (prop.toString().toUpperCase() === prop) {
        return referenceStyle.getDefaultVariant();
      }
      return Reflect.get(target, prop, receiver);
    }
  });
}
function buildMapStyles() {
  const mapStyle = {};
  for (let i = 0; i < mapStylePresetList.length; i += 1) {
    const refStyleInfo = mapStylePresetList[i];
    const refStyle = makeReferenceStyleProxy(
      new ReferenceMapStyle(refStyleInfo.name, refStyleInfo.referenceStyleID)
    );
    for (let j = 0; j < refStyleInfo.variants.length; j += 1) {
      const variantInfo = refStyleInfo.variants[j];
      const variant = new MapStyleVariant(
        variantInfo.name,
        // name
        variantInfo.variantType,
        // variantType
        variantInfo.id,
        // id
        refStyle,
        // referenceStyle
        variantInfo.description,
        variantInfo.imageURL
        // imageURL
      );
      refStyle.addVariant(variant);
    }
    mapStyle[refStyleInfo.referenceStyleID] = refStyle;
  }
  return mapStyle;
}
function styleToStyle(style) {
  if (!style) {
    return MapStyle[mapStylePresetList[0].referenceStyleID].getDefaultVariant().getId();
  }
  if (typeof style === "string" || style instanceof String) {
    return style.trim().toLowerCase();
  }
  if (style instanceof MapStyleVariant) {
    return style.getId();
  }
  if (style instanceof ReferenceMapStyle) {
    return style.getDefaultVariant().getId();
  }
}
const MapStyle = buildMapStyles();

function extractLineStrings(geoJson) {
  const lineStrings = [];
  function extractFromGeometry(geometry) {
    if (geometry.type === "LineString" || geometry.type === "MultiLineString") {
      lineStrings.push(geometry);
    }
  }
  function extractFromFeature(feature) {
    if (feature.geometry) {
      extractFromGeometry(feature.geometry);
    }
  }
  function extractFromFeatureCollection(collection) {
    for (const feature of collection.features) {
      if (feature.type === "Feature") {
        extractFromFeature(feature);
      } else if (feature.type === "FeatureCollection") {
        extractFromFeatureCollection(feature);
      }
    }
  }
  if (geoJson.type === "Feature") {
    extractFromFeature(geoJson);
  } else if (geoJson.type === "FeatureCollection") {
    extractFromFeatureCollection(geoJson);
  } else {
    extractFromGeometry(geoJson);
  }
  return lineStrings;
}
function getSqSegDist(p, p1, p2) {
  let x = p1[0], y = p1[1], dx = p2[0] - x, dy = p2[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = p2[0];
      y = p2[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}
function simplifyDPStep(points, first, last, sqTolerance, simplified) {
  let maxSqDist = sqTolerance, index;
  for (let i = first + 1; i < last; i++) {
    const sqDist = getSqSegDist(points[i], points[first], points[last]);
    if (sqDist > maxSqDist) {
      index = i;
      maxSqDist = sqDist;
    }
  }
  if (maxSqDist > sqTolerance) {
    if (index - first > 1) {
      simplifyDPStep(points, first, index, sqTolerance, simplified);
    }
    simplified.push(points[index]);
    if (last - index > 1) {
      simplifyDPStep(points, index, last, sqTolerance, simplified);
    }
  }
}
function simplifyDouglasPeucker(points, sqTolerance) {
  const last = points.length - 1;
  const simplified = [points[0]];
  simplifyDPStep(points, 0, last, sqTolerance, simplified);
  simplified.push(points[last]);
  return simplified;
}
function simplify(points, tolerance) {
  if (points.length <= 2) {
    return points;
  }
  const sqTolerance = tolerance !== void 0 ? tolerance * tolerance : 1;
  const simplePoints = simplifyDouglasPeucker(points, sqTolerance);
  return simplePoints;
}
const misc = {
  extractLineStrings,
  simplify
};

function staticMapMarkerToString(marker, includeColor = true) {
  let str = `${marker[0]},${marker[1]}`;
  if (marker.length === 3 && includeColor) {
    str += `,${marker[2]}`;
  }
  return str;
}
function simplifyAndStringify(path, maxNbChar = 3e3) {
  let str = path.map((point) => point.join(",")).join("|");
  let tolerance = 5e-6;
  const toleranceStep = 1e-5;
  while (str.length > maxNbChar) {
    const simplerPath = misc.simplify(path, tolerance);
    str = simplerPath.map((point) => `${point[0]},${point[1]}`).join("|");
    tolerance += toleranceStep;
  }
  return str;
}
function centered(center, zoom, options = {}) {
  const style = styleToStyle(options.style);
  const scale = options.hiDPI ? "@2x" : "";
  const format = options.format ?? "png";
  let width = ~~(options.width ?? 1024);
  let height = ~~(options.height ?? 1024);
  if (options.hiDPI) {
    width = ~~(width / 2);
    height = ~~(height / 2);
  }
  const endpoint = new URL(
    `maps/${encodeURIComponent(style)}/static/${center[0]},${center[1]},${zoom}/${width}x${height}${scale}.${format}`,
    defaults.maptilerApiURL
  );
  if ("attribution" in options) {
    endpoint.searchParams.set("attribution", options.attribution.toString());
  }
  if ("markers" in options) {
    let markerStr = "";
    const hasIcon = "markerIcon" in options;
    if (hasIcon) {
      markerStr += `icon:${options.markerIcon}|`;
    }
    if (hasIcon && "markerAnchor" in options) {
      markerStr += `anchor:${options.markerAnchor}|`;
    }
    if (hasIcon && options.hiDPI) {
      markerStr += `scale:2|`;
    }
    const markerList = Array.isArray(options.markers[0]) ? options.markers : [options.markers];
    markerStr += markerList.map((m) => staticMapMarkerToString(m, !hasIcon)).join("|");
    endpoint.searchParams.set("markers", markerStr);
  }
  if ("path" in options) {
    let pathStr = "";
    pathStr += `fill:${options.pathFillColor ?? "none"}|`;
    if ("pathStrokeColor" in options) {
      pathStr += `stroke:${options.pathStrokeColor}|`;
    }
    if ("pathWidth" in options) {
      const pathWidth = options.pathWidth / (options.hiDPI ? 2 : 1);
      pathStr += `width:${pathWidth.toString()}|`;
    }
    pathStr += simplifyAndStringify(options.path);
    endpoint.searchParams.set("path", pathStr);
  }
  endpoint.searchParams.set("key", options.apiKey ?? config.apiKey);
  return endpoint.toString();
}
function bounded(boundingBox, options = {}) {
  const style = styleToStyle(options.style);
  const scale = options.hiDPI ? "@2x" : "";
  const format = options.format ?? "png";
  let width = ~~(options.width ?? 1024);
  let height = ~~(options.height ?? 1024);
  if (options.hiDPI) {
    width = ~~(width / 2);
    height = ~~(height / 2);
  }
  const endpoint = new URL(
    `maps/${encodeURIComponent(style)}/static/${boundingBox[0]},${boundingBox[1]},${boundingBox[2]},${boundingBox[3]}/${width}x${height}${scale}.${format}`,
    defaults.maptilerApiURL
  );
  if ("attribution" in options) {
    endpoint.searchParams.set("attribution", options.attribution.toString());
  }
  if ("padding" in options) {
    endpoint.searchParams.set("padding", options.padding.toString());
  }
  if ("markers" in options) {
    let markerStr = "";
    const hasIcon = "markerIcon" in options;
    if (hasIcon) {
      markerStr += `icon:${options.markerIcon}|`;
    }
    if (hasIcon && "markerAnchor" in options) {
      markerStr += `anchor:${options.markerAnchor}|`;
    }
    if (hasIcon && options.hiDPI) {
      markerStr += `scale:2|`;
    }
    const markerList = Array.isArray(options.markers[0]) ? options.markers : [options.markers];
    markerStr += markerList.map((m) => staticMapMarkerToString(m, !hasIcon)).join("|");
    endpoint.searchParams.set("markers", markerStr);
  }
  if ("path" in options) {
    let pathStr = "";
    pathStr += `fill:${options.pathFillColor ?? "none"}|`;
    if ("pathStrokeColor" in options) {
      pathStr += `stroke:${options.pathStrokeColor}|`;
    }
    if ("pathWidth" in options) {
      const pathWidth = options.pathWidth / (options.hiDPI ? 2 : 1);
      pathStr += `width:${pathWidth.toString()}|`;
    }
    pathStr += simplifyAndStringify(options.path);
    endpoint.searchParams.set("path", pathStr);
  }
  endpoint.searchParams.set("key", options.apiKey ?? config.apiKey);
  return endpoint.toString();
}
function automatic(options = {}) {
  if (!("markers" in options) && !("path" in options)) {
    throw new Error(
      "Automatic static maps require markers and/or path to be created."
    );
  }
  const style = styleToStyle(options.style);
  const scale = options.hiDPI ? "@2x" : "";
  const format = options.format ?? "png";
  let width = ~~(options.width ?? 1024);
  let height = ~~(options.height ?? 1024);
  if (options.hiDPI) {
    width = ~~(width / 2);
    height = ~~(height / 2);
  }
  const endpoint = new URL(
    `maps/${encodeURIComponent(
      style
    )}/static/auto/${width}x${height}${scale}.${format}`,
    defaults.maptilerApiURL
  );
  if ("attribution" in options) {
    endpoint.searchParams.set("attribution", options.attribution.toString());
  }
  if ("padding" in options) {
    endpoint.searchParams.set("padding", options.padding.toString());
  }
  if ("markers" in options) {
    let markerStr = "";
    const hasIcon = "markerIcon" in options;
    if (hasIcon) {
      markerStr += `icon:${options.markerIcon}|`;
    }
    if (hasIcon && "markerAnchor" in options) {
      markerStr += `anchor:${options.markerAnchor}|`;
    }
    if (hasIcon && options.hiDPI) {
      markerStr += `scale:2|`;
    }
    const markerList = Array.isArray(options.markers[0]) ? options.markers : [options.markers];
    markerStr += markerList.map((m) => staticMapMarkerToString(m, !hasIcon)).join("|");
    endpoint.searchParams.set("markers", markerStr);
  }
  if ("path" in options) {
    let pathStr = "";
    pathStr += `fill:${options.pathFillColor ?? "none"}|`;
    if ("pathStrokeColor" in options) {
      pathStr += `stroke:${options.pathStrokeColor}|`;
    }
    if ("pathWidth" in options) {
      const pathWidth = options.pathWidth / (options.hiDPI ? 2 : 1);
      pathStr += `width:${pathWidth.toString()}|`;
    }
    pathStr += simplifyAndStringify(options.path);
    endpoint.searchParams.set("path", pathStr);
  }
  endpoint.searchParams.set("key", options.apiKey ?? config.apiKey);
  return endpoint.toString();
}
const staticMaps = {
  centered,
  bounded,
  automatic
};

const EARTH_RADIUS = 63710088e-1;
const EARTH_CIRCUMFERENCE = 2 * Math.PI * EARTH_RADIUS;
function longitudeToMercatorX(lng) {
  return (180 + lng) / 360;
}
function latitudeToMercatorY(lat) {
  return (180 - 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))) / 360;
}
function wgs84ToMercator(position) {
  const wrappedPos = wrapWgs84(position);
  return [
    longitudeToMercatorX(wrappedPos[0]),
    latitudeToMercatorY(wrappedPos[1])
  ];
}
function mercatorXToLongitude(x) {
  return x * 360 - 180;
}
function mercatorYToLatitude(y) {
  const y2 = 180 - y * 360;
  return 360 / Math.PI * Math.atan(Math.exp(y2 * Math.PI / 180)) - 90;
}
function mercatorToWgs84(position) {
  return [mercatorXToLongitude(position[0]), mercatorYToLatitude(position[1])];
}
function haversineDistanceWgs84(from, to) {
  const rad = Math.PI / 180;
  const lat1 = from[1] * rad;
  const lat2 = to[1] * rad;
  const a = Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos((to[0] - from[0]) * rad);
  const maxMeters = EARTH_RADIUS * Math.acos(Math.min(a, 1));
  return maxMeters;
}
function haversineCumulatedDistanceWgs84(positions) {
  const cumulatedDistance = Array(positions.length);
  cumulatedDistance[0] = 0;
  const l = cumulatedDistance.length;
  for (let i = 1; i < l; i++) {
    cumulatedDistance[i] = haversineDistanceWgs84(positions[i - 1], positions[i]) + cumulatedDistance[i - 1];
  }
  return cumulatedDistance;
}
function wrapWgs84(position) {
  const lng = position[0];
  const lat = position[1];
  const d = 360;
  const w = ((lng + 180) % d + d) % d - 180;
  const wrapLong = w === -180 ? 180 : w;
  return [wrapLong, lat];
}
function circumferenceAtLatitude(latitude) {
  return EARTH_CIRCUMFERENCE * Math.cos(latitude * Math.PI / 180);
}
function mercatorToTileIndex(position, zoom, strict = true) {
  const numberOfTilePerAxis = 2 ** zoom;
  const fIndex = [
    position[0] * numberOfTilePerAxis,
    position[1] * numberOfTilePerAxis
  ];
  return strict ? [~~fIndex[0], ~~fIndex[1]] : fIndex;
}
function wgs84ToTileIndex(position, zoom, strict = true) {
  const merc = wgs84ToMercator(position);
  return mercatorToTileIndex(merc, zoom, strict);
}
function toRadians(degrees) {
  return degrees * Math.PI / 180;
}
function toDegrees(radians) {
  return radians * 180 / Math.PI;
}
function haversineIntermediateWgs84(pos1, pos2, ratio) {
  const d = haversineDistanceWgs84(pos1, pos2);
  const \u03BB1 = toRadians(pos1[0]);
  const \u03C61 = toRadians(pos1[1]);
  const \u03BB2 = toRadians(pos2[0]);
  const \u03C62 = toRadians(pos2[1]);
  const \u03B4 = d / EARTH_RADIUS;
  const a = Math.sin((1 - ratio) * \u03B4) / Math.sin(\u03B4);
  const b = Math.sin(ratio * \u03B4) / Math.sin(\u03B4);
  const x = a * Math.cos(\u03C61) * Math.cos(\u03BB1) + b * Math.cos(\u03C62) * Math.cos(\u03BB2);
  const y = a * Math.cos(\u03C61) * Math.sin(\u03BB1) + b * Math.cos(\u03C62) * Math.sin(\u03BB2);
  const z = a * Math.sin(\u03C61) + b * Math.sin(\u03C62);
  const \u03C63 = Math.atan2(z, Math.sqrt(x * x + y * y));
  const \u03BB3 = Math.atan2(y, x);
  return [toDegrees(\u03BB3), toDegrees(\u03C63)];
}
const math = {
  EARTH_RADIUS,
  EARTH_CIRCUMFERENCE,
  longitudeToMercatorX,
  latitudeToMercatorY,
  wgs84ToMercator,
  mercatorXToLongitude,
  mercatorYToLatitude,
  mercatorToWgs84,
  haversineDistanceWgs84,
  wrapWgs84,
  circumferenceAtLatitude,
  mercatorToTileIndex,
  wgs84ToTileIndex,
  toRadians,
  toDegrees,
  haversineIntermediateWgs84,
  haversineCumulatedDistanceWgs84
};

let tileCache = null;
function getTileCache() {
  if (!tileCache) {
    tileCache = new QuickLRU({ maxSize: config.tileCacheSize });
  }
  return tileCache;
}
async function bufferToPixelDataBrowser(buff) {
  const blob = new Blob([buff]);
  const imageBitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;
  ctx.drawImage(imageBitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return {
    pixels: imageData.data,
    width: canvas.width,
    height: canvas.height,
    components: imageData.data.length / (canvas.width * canvas.height)
  };
}
function getBufferToPixelDataParser() {
  if (config.bufferToPixelData) {
    return config.bufferToPixelData;
  }
  if (typeof window !== "undefined") {
    return bufferToPixelDataBrowser;
  }
  throw new Error(
    "An image file buffer to pixel data parser is necessary. Specify it in `config.bufferToPixelData`"
  );
}

const terrainTileJsonURL = "tiles/terrain-rgb-v2/tiles.json";
let terrainTileJson = null;
const customMessages = {
  403: "Key is missing, invalid or restricted"
};
async function fetchTerrainTileJson(apiKey) {
  const endpoint = new URL(terrainTileJsonURL, defaults.maptilerApiURL);
  endpoint.searchParams.set("key", apiKey);
  const urlWithParams = endpoint.toString();
  const res = await callFetch(urlWithParams);
  if (res.ok) {
    terrainTileJson = await res.json();
    return terrainTileJson;
  } else {
    if (!res.ok) {
      throw new ServiceError(res, customMessages[res.status] ?? "");
    }
  }
}
async function at(position, options = {}) {
  const apiKey = options.apiKey ?? config.apiKey;
  if (!terrainTileJson) {
    await fetchTerrainTileJson(apiKey);
  }
  const maxZoom = terrainTileJson.maxzoom;
  let zoom = ~~(options.zoom ?? maxZoom);
  if (zoom > maxZoom || zoom < 0) {
    zoom = maxZoom;
  }
  const tileIndex = math.wgs84ToTileIndex(position, zoom, false);
  const tileX = ~~tileIndex[0];
  const tileY = ~~tileIndex[1];
  if (!terrainTileJson.tiles.length) {
    throw new Error("Terrain tileJSON tile list is empty.");
  }
  const tileID = `terrain_${zoom.toString()}_${tileX.toString()}_${tileY.toString()}`;
  let tilePixelData;
  const cache = getTileCache();
  if (cache.has(tileID)) {
    tilePixelData = cache.get(tileID);
  } else {
    const tileURL = terrainTileJson.tiles[0].replace("{x}", tileX.toString()).replace("{y}", tileY.toString()).replace("{z}", zoom.toString());
    const tileRes = await callFetch(tileURL);
    if (!tileRes.ok) {
      throw new ServiceError(tileRes, customMessages[tileRes.status] ?? "");
    }
    const tileBuff = await tileRes.arrayBuffer();
    const tileParser = getBufferToPixelDataParser();
    tilePixelData = await tileParser(tileBuff);
    cache.set(tileID, tilePixelData);
  }
  const pixelX = ~~(tilePixelData.width * (tileIndex[0] % 1));
  const pixelY = ~~(tilePixelData.height * (tileIndex[1] % 1));
  const pixelDataIndex = (pixelY * tilePixelData.width + pixelX) * tilePixelData.components;
  const R = tilePixelData.pixels[pixelDataIndex];
  const G = tilePixelData.pixels[pixelDataIndex + 1];
  const B = tilePixelData.pixels[pixelDataIndex + 2];
  const elevation2 = -1e4 + (R * 256 * 256 + G * 256 + B) * 0.1;
  return [position[0], position[1], elevation2];
}
async function batch(positions, options = {}) {
  const apiKey = options.apiKey ?? config.apiKey;
  if (!terrainTileJson) {
    await fetchTerrainTileJson(apiKey);
  }
  const tileParser = getBufferToPixelDataParser();
  const tileURLSchema = terrainTileJson.tiles[0];
  const cache = getTileCache();
  const maxZoom = terrainTileJson.maxzoom;
  let zoom = ~~(options.zoom ?? maxZoom);
  if (zoom > maxZoom || zoom < 0) {
    zoom = maxZoom;
  }
  const tileIndicesFloats = positions.map(
    (position) => math.wgs84ToTileIndex(position, zoom, false)
  );
  const tileIndicesInteger = tileIndicesFloats.map((index) => [
    ~~index[0],
    ~~index[1]
  ]);
  const tileIDs = tileIndicesInteger.map(
    (index) => `terrain_${zoom.toString()}_${index[0].toString()}_${index[1].toString()}`
  );
  const uniqueTilesToFetch = Array.from(
    new Set(tileIDs.filter((tileID) => !cache.has(tileID)))
  ).map((tileID) => tileID.split("_").slice(1));
  const tileURLs = uniqueTilesToFetch.map(
    (zxy) => tileURLSchema.replace("{x}", zxy[1].toString()).replace("{y}", zxy[2].toString()).replace("{z}", zxy[0].toString())
  );
  const promisesFetchTiles = tileURLs.map((url) => callFetch(url));
  const resTiles = await Promise.allSettled(promisesFetchTiles);
  const fulfilledRes = resTiles.map(
    (el) => el.status === "fulfilled" ? el.value : null
  ).filter((res) => res);
  const fulfilledRButNotOkRes = fulfilledRes.filter((res) => !res.ok);
  if (fulfilledRes.length !== promisesFetchTiles.length) {
    throw new Error("Some tiles could not be fetched.");
  }
  if (fulfilledRButNotOkRes.length) {
    throw new ServiceError(
      fulfilledRButNotOkRes[0],
      customMessages[fulfilledRButNotOkRes[0].status] ?? ""
    );
  }
  const tileArrayBuffers = await Promise.all(
    fulfilledRes.map((res) => res.arrayBuffer())
  );
  if (!tileArrayBuffers.every((buff) => buff.byteLength > 0)) {
    throw new Error("Some tiles are not available.");
  }
  const tilePixelDatas = await Promise.all(
    tileArrayBuffers.map((buff) => tileParser(buff))
  );
  tilePixelDatas.forEach((tilePixelData, i) => {
    const zxy = uniqueTilesToFetch[i];
    const tileID = `terrain_${zxy[0].toString()}_${zxy[1].toString()}_${zxy[2].toString()}`;
    cache.set(tileID, tilePixelData);
  });
  const elevatedPositions = positions.map((position, i) => {
    const tileID = tileIDs[i];
    const tileIndexFloat = tileIndicesFloats[i];
    const tilePixelData = cache.get(tileID);
    const pixelX = Math.min(
      Math.round(tilePixelData.width * (tileIndexFloat[0] % 1)),
      tilePixelData.width - 1
    );
    const pixelY = Math.min(
      Math.round(tilePixelData.height * (tileIndexFloat[1] % 1)),
      tilePixelData.height - 1
    );
    const pixelDataIndex = (pixelY * tilePixelData.width + pixelX) * tilePixelData.components;
    const R = tilePixelData.pixels[pixelDataIndex];
    const G = tilePixelData.pixels[pixelDataIndex + 1];
    const B = tilePixelData.pixels[pixelDataIndex + 2];
    const elevation2 = -1e4 + (R * 256 * 256 + G * 256 + B) * 0.1;
    return [position[0], position[1], ~~(elevation2 * 1e3) / 1e3];
  });
  if (options.smoothingKernelSize) {
    const kernelSize = ~~(options.smoothingKernelSize / 2) * 2 + 1;
    const elevations = elevatedPositions.map((pos) => pos[2]);
    const kernelSpan = ~~(kernelSize / 2);
    for (let i = kernelSpan; i < elevations.length - kernelSpan - 1; i += 1) {
      let sum = 0;
      for (let j = 0; j < kernelSize; j += 1) {
        const elev = elevations[i - kernelSpan + j];
        sum += elev;
      }
      sum /= kernelSize;
      elevatedPositions[i][2] = sum;
    }
  }
  return elevatedPositions;
}
async function fromLineString(ls, options = {}) {
  if (ls.type !== "LineString") {
    throw new Error("The provided object is not a GeoJSON LineString");
  }
  const clone = structuredClone(ls);
  const elevatedPositions = await batch(clone.coordinates, options);
  clone.coordinates = elevatedPositions;
  return clone;
}
async function fromMultiLineString(ls, options = {}) {
  if (ls.type !== "MultiLineString") {
    throw new Error("The provided object is not a GeoJSON MultiLineString");
  }
  const clone = structuredClone(ls);
  const multiLengths = clone.coordinates.map((poss) => poss.length);
  const flattenPositions = clone.coordinates.flat();
  const flattenPositionsElevated = await batch(flattenPositions, options);
  const result = [];
  let index = 0;
  for (const length of multiLengths) {
    result.push(flattenPositionsElevated.slice(index, index + length));
    index += length;
  }
  clone.coordinates = result;
  return clone;
}
const elevation = {
  at,
  batch,
  fromLineString,
  fromMultiLineString
};

export { ClientConfig, LanguageGeocoding, MapStyle, MapStyleVariant, ReferenceMapStyle, ServiceError, bufferToPixelDataBrowser, circumferenceAtLatitude, config, coordinates, data, elevation, expandMapStyle, geocoding, geolocation, getAutoLanguageGeocoding, getBufferToPixelDataParser, getTileCache, mapStylePresetList, math, misc, staticMaps, styleToStyle };
//# sourceMappingURL=maptiler-client.mjs.map
