import maplibregl__default, { LineLayerSpecification, FillLayerSpecification, StyleSpecification, ControlPosition, MapOptions as MapOptions$1, StyleSwapOptions, StyleOptions, LayerSpecification, SourceSpecification, CustomLayerInterface, FilterSpecification, StyleSetterOptions, RequestTransformFunction, Map as Map$1, GestureOptions, LogoControlOptions as LogoControlOptions$1, IControl } from 'maplibre-gl';
export * from 'maplibre-gl';
import { FetchFunction, ReferenceMapStyle, MapStyleVariant } from '@maptiler/client';
export { AutomaticStaticMapOptions, BoundedStaticMapOptions, BufferToPixelDataFunction, ByIdGeocodingOptions, CenteredStaticMapOptions, CommonForwardAndReverseGeocodingOptions, CoordinateExport, CoordinateGrid, CoordinateId, CoordinateSearch, CoordinateSearchResult, CoordinateTransformResult, CoordinateTransformation, Coordinates, CoordinatesSearchOptions, CoordinatesTransformOptions, DefaultTransformation, ElevationAtOptions, ElevationBatchOptions, FeatureHierarchy, FetchFunction, GeocodingFeature, GeocodingOptions, GeocodingSearchResult, GeolocationInfoOptions, GeolocationResult, GetDataOptions, LanguageGeocoding, LanguageGeocodingOptions, LanguageGeocodingString, MapStyle, MapStylePreset, MapStyleType, MapStyleVariant, PixelData, ReferenceMapStyle, ReverseGeocodingOptions, ServiceError, StaticMapBaseOptions, StaticMapMarker, TileJSON, XYZ, bufferToPixelDataBrowser, circumferenceAtLatitude, coordinates, data, elevation, expandMapStyle, geocoding, geolocation, getAutoLanguageGeocoding, getBufferToPixelDataParser, getTileCache, mapStylePresetList, math, misc, staticMaps, styleToStyle } from '@maptiler/client';
import EventEmitter from 'events';
import { FeatureCollection } from 'geojson';

/**
 * Languages. Note that not all the languages of this list are available but the compatibility list may be expanded in the future.
 */
declare const Language: {
    /**
     * The visitor language mode concatenates the prefered language from the user settings and the "default name".
     * Note: The "default name" is equivalent to OSM's `{name}`, which can be the most recognized names a global
     * scale or the local name.
     * This mode is helpful in the context where a user needs to access both the local names and the names in their
     * own language, for instance when traveling abroad, where signs likely to be only available in the local language.
     */
    readonly VISITOR: "visitor";
    /**
     * The visitor language mode concatenates English and the "default name".
     * Note: The "default name" is equivalent to OSM's `{name}`, which can be the most recognized names a global
     * scale or the local name.
     * This mode is helpful in the context where a user needs to access both the local names and the names in their
     * own language, for instance when traveling abroad, where signs likely to be only available in the local language.
     */
    readonly VISITOR_ENGLISH: "visitor_en";
    /**
     * Language as the style is designed. Not that this is the default state and one
     * the language has been changed to another than `STYLE`, then it cannot be set back to `STYLE`.
     */
    readonly STYLE: "style";
    /**
     * AUTO mode uses the language of the browser
     */
    readonly AUTO: "auto";
    /**
     * STYLE is a custom flag to keep the language of the map as defined into the style.
     * If STYLE is set in the constructor, then further modification of the language
     * with `.setLanguage()` is not possible.
     */
    readonly STYLE_LOCK: "style_lock";
    /**
     * Default fallback languages that uses latin charaters
     */
    readonly LATIN: "name:latin";
    /**
     * Default fallback languages that uses non-latin charaters
     */
    readonly NON_LATIN: "name:nonlatin";
    /**
     * Labels are in their local language, when available
     */
    readonly LOCAL: "name";
    /**
     * International name
     */
    readonly INTERNATIONAL: "name_int";
    readonly ALBANIAN: "name:sq";
    readonly AMHARIC: "name:am";
    readonly ARABIC: "name:ar";
    readonly ARMENIAN: "name:hy";
    readonly AZERBAIJANI: "name:az";
    readonly BASQUE: "name:eu";
    readonly BELORUSSIAN: "name:be";
    readonly BENGALI: "name:bn";
    readonly BOSNIAN: "name:bs";
    readonly BRETON: "name:br";
    readonly BULGARIAN: "name:bg";
    readonly CATALAN: "name:ca";
    readonly CHINESE: "name:zh";
    readonly TRADITIONAL_CHINESE: "name:zh-Hant";
    readonly SIMPLIFIED_CHINESE: "name:zh-Hans";
    readonly CORSICAN: "name:co";
    readonly CROATIAN: "name:hr";
    readonly CZECH: "name:cs";
    readonly DANISH: "name:da";
    readonly DUTCH: "name:nl";
    readonly ENGLISH: "name:en";
    readonly ESPERANTO: "name:eo";
    readonly ESTONIAN: "name:et";
    readonly FINNISH: "name:fi";
    readonly FRENCH: "name:fr";
    readonly FRISIAN: "name:fy";
    readonly GEORGIAN: "name:ka";
    readonly GERMAN: "name:de";
    readonly GREEK: "name:el";
    readonly HEBREW: "name:he";
    readonly HINDI: "name:hi";
    readonly HUNGARIAN: "name:hu";
    readonly ICELANDIC: "name:is";
    readonly INDONESIAN: "name:id";
    readonly IRISH: "name:ga";
    readonly ITALIAN: "name:it";
    readonly JAPANESE: "name:ja";
    readonly JAPANESE_HIRAGANA: "name:ja-Hira";
    readonly JAPANESE_KANA: "name:ja_kana";
    readonly JAPANESE_LATIN: "name:ja_rm";
    readonly JAPANESE_2018: "name:ja-Latn";
    readonly KANNADA: "name:kn";
    readonly KAZAKH: "name:kk";
    readonly KOREAN: "name:ko";
    readonly KOREAN_LATIN: "name:ko-Latn";
    readonly KURDISH: "name:ku";
    readonly ROMAN_LATIN: "name:la";
    readonly LATVIAN: "name:lv";
    readonly LITHUANIAN: "name:lt";
    readonly LUXEMBOURGISH: "name:lb";
    readonly MACEDONIAN: "name:mk";
    readonly MALAYALAM: "name:ml";
    readonly MALTESE: "name:mt";
    readonly NORWEGIAN: "name:no";
    readonly OCCITAN: "name:oc";
    readonly PERSIAN: "name:fa";
    readonly POLISH: "name:pl";
    readonly PORTUGUESE: "name:pt";
    readonly PUNJABI: "name:pa";
    readonly WESTERN_PUNJABI: "name:pnb";
    readonly ROMANIAN: "name:ro";
    readonly ROMANSH: "name:rm";
    readonly RUSSIAN: "name:ru";
    readonly SCOTTISH_GAELIC: "name:gd";
    readonly SERBIAN_CYRILLIC: "name:sr";
    readonly SERBIAN_LATIN: "name:sr-Latn";
    readonly SLOVAK: "name:sk";
    readonly SLOVENE: "name:sl";
    readonly SPANISH: "name:es";
    readonly SWEDISH: "name:sv";
    readonly TAMIL: "name:ta";
    readonly TELUGU: "name:te";
    readonly THAI: "name:th";
    readonly TURKISH: "name:tr";
    readonly UKRAINIAN: "name:uk";
    readonly URDU: "name:ur";
    readonly VIETNAMIAN_LATIN: "name:vi";
    readonly WELSH: "name:cy";
};
declare function isLanguageSupported(lang: string): boolean;
/**
 * Type representing the key of the Language object
 */
type LanguageKey = keyof typeof Language;
type Values<T> = T[keyof T];
/**
 * Built-in languages values as strings
 */
type LanguageString = Values<typeof Language>;
declare function getBrowserLanguage(): LanguageString;

type Unit = "imperial" | "metric" | "nautical";

/**
 * Configuration class for the SDK
 */
declare class SdkConfig extends EventEmitter {
    /**
     * The primary language. By default, the language of the web browser is used.
     */
    primaryLanguage: LanguageString;
    /**
     * The secondary language, to overwrite the default language defined in the map style.
     * This settings is highly dependant on the style compatibility and may not work in most cases.
     */
    secondaryLanguage?: LanguageString;
    /**
     * Setting on whether of not the SDK runs with a session logic.
     * A "session" is started at the initialization of the SDK and finished when the browser
     * page is being refreshed.
     * When `session` is enabled (default: true), the extra URL param `mtsid` is added to queries
     * on the MapTiler Cloud API. This allows MapTiler to enable "session based billing".
     */
    session: boolean;
    /**
     * Enables client-side caching of requests for tiles and fonts.
     * The cached requests persist multiple browser sessions and will be reused when possible.
     * Works only for requests to the MapTiler Cloud API when sessions are enabled.
     */
    caching: boolean;
    /**
     * Unit to be used
     */
    private _unit;
    /**
     * MapTiler Cloud API key
     */
    private _apiKey;
    constructor();
    /**
     * Set the unit system
     */
    set unit(u: Unit);
    /**
     * Get the unit system
     */
    get unit(): Unit;
    /**
     * Set the MapTiler Cloud API key
     */
    set apiKey(k: string);
    /**
     * Get the MapTiler Cloud API key
     */
    get apiKey(): string;
    /**
     * Set a the custom fetch function to replace the default one
     */
    set fetch(f: FetchFunction);
    /**
     * Get the fetch fucntion
     */
    get fetch(): FetchFunction | null;
}
declare const config$1: SdkConfig;

/**
 * This is an extension adds support for adding a minimap to one of the map's control containers.
 */

interface ParentRect {
    lineLayout: LineLayerSpecification["layout"];
    linePaint: LineLayerSpecification["paint"];
    fillPaint: FillLayerSpecification["paint"];
}
interface MinimapOptionsInput {
    /**
     * Style of the map. Can be:
     * - a full style URL (possibly with API key)
     * - a shorthand with only the MapTIler style name (eg. `"streets-v2"`)
     * - a longer form with the prefix `"maptiler://"` (eg. `"maptiler://streets-v2"`)
     */
    style?: ReferenceMapStyle | MapStyleVariant | StyleSpecification | string;
    /**
     * Set the zoom difference between the parent and the minimap
     * If the parent is zoomed to 10 and the minimap is zoomed to 8, the zoomAdjust should be 2
     * Default: -4
     */
    zoomAdjust?: number;
    /** Set a zoom of the minimap and don't allow any future changes */
    lockZoom?: number;
    /** Adjust the pitch only if the user requests */
    pitchAdjust?: boolean;
    /** Set CSS properties of the container using object key-values */
    containerStyle?: Record<string, string>;
    /** Set the position of the minimap at either "top-left", "top-right", "bottom-left", or "bottom-right" */
    position?: ControlPosition;
    /** Set the parentRect fill and/or line options */
    parentRect?: ParentRect;
}
interface MinimapOptions extends MapOptions {
    zoomAdjust: number;
    pitchAdjust: boolean;
    containerStyle: Record<string, string>;
    parentRect?: ParentRect;
}

type LoadWithTerrainEvent = {
    type: "loadWithTerrain";
    target: Map;
    terrain: {
        source: string;
        exaggeration: number;
    };
};
declare const GeolocationType: {
    POINT: "POINT";
    COUNTRY: "COUNTRY";
};
/**
 * Options to provide to the `Map` constructor
 */
type MapOptions = Omit<MapOptions$1, "style" | "maplibreLogo"> & {
    /**
     * Style of the map. Can be:
     * - a full style URL (possibly with API key)
     * - a shorthand with only the MapTIler style name (eg. `"streets-v2"`)
     * - a longer form with the prefix `"maptiler://"` (eg. `"maptiler://streets-v2"`)
     */
    style?: ReferenceMapStyle | MapStyleVariant | StyleSpecification | string;
    /**
     * Define the language of the map. This can be done directly with a language ISO code (eg. "en")
     * or with a built-in shorthand (eg. Language.ENGLISH).
     * Note that this is equivalent to setting the `config.primaryLanguage` and will overwrite it.
     */
    language?: LanguageString;
    /**
     * Define the MapTiler Cloud API key to be used. This is strictly equivalent to setting
     * `config.apiKey` and will overwrite it.
     */
    apiKey?: string;
    /**
     * Shows or hides the MapTiler logo in the bottom left corner.
     *
     * For paid plans:
     * - `true` shows MapTiler logo
     * - `false` hodes MapTiler logo
     * - default: `false` (hide)
     *
     * For free plans: MapTiler logo always shows, regardless of the value.
     */
    maptilerLogo?: boolean;
    /**
     * Attribution text to show in an {@link AttributionControl}.
     */
    customAttribution?: string | Array<string>;
    /**
     * Enables 3D terrain if `true`. (default: `false`)
     */
    terrain?: boolean;
    /**
     * Exaggeration factor of the terrain. (default: `1`, no exaggeration)
     */
    terrainExaggeration?: number;
    /**
     * Show the navigation control. (default: `true`, will hide if `false`)
     */
    navigationControl?: boolean | ControlPosition;
    /**
     * Show the terrain control. (default: `false`, will show if `true`)
     */
    terrainControl?: boolean | ControlPosition;
    /**
     * Show the geolocate control. (default: `true`, will hide if `false`)
     */
    geolocateControl?: boolean | ControlPosition;
    /**
     * Show the scale control. (default: `false`, will show if `true`)
     */
    scaleControl?: boolean | ControlPosition;
    /**
     * Show the full screen control. (default: `false`, will show if `true`)
     */
    fullscreenControl?: boolean | ControlPosition;
    /**
     * Display a minimap in a user defined corner of the map. (default: `bottom-left` corner)
     * If set to true, the map will assume it is a minimap and forego the attribution control.
     */
    minimap?: boolean | ControlPosition | MinimapOptionsInput;
    /**
     * attributionControl
     */
    forceNoAttributionControl?: boolean;
    /**
     * Method to position the map at a given geolocation. Only if:
     * - `hash` is `false`
     * - `center` is not provided
     *
     * If the value is `true` of `"POINT"` (given by `GeolocationType.POINT`) then the positionning uses the MapTiler Cloud
     * Geolocation to find the non-GPS location point.
     * The zoom level can be provided in the `Map` constructor with the `zoom` option or will be `13` if not provided.
     *
     * If the value is `"COUNTRY"` (given by `GeolocationType.COUNTRY`) then the map is centered around the bounding box of the country.
     * In this case, the `zoom` option will be ignored.
     *
     * If the value is `false`, no geolocation is performed and the map centering and zooming depends on other options or on
     * the built-in defaults.
     *
     * If this option is non-false and the options `center` is also provided, then `center` prevails.
     *
     * Default: `false`
     */
    geolocate?: (typeof GeolocationType)[keyof typeof GeolocationType] | boolean;
};
/**
 * The Map class can be instanciated to display a map in a `<div>`
 */
declare class Map extends maplibregl__default.Map {
    private isTerrainEnabled;
    private terrainExaggeration;
    private primaryLanguage;
    private terrainGrowing;
    private terrainFlattening;
    private minimap?;
    private forceLanguageUpdate;
    private languageAlwaysBeenStyle;
    private isReady;
    constructor(options: MapOptions);
    /**
     * Awaits for _this_ Map instance to be "loaded" and returns a Promise to the Map.
     * If _this_ Map instance is already loaded, the Promise is resolved directly,
     * otherwise, it is resolved as a result of the "load" event.
     * @returns
     */
    onLoadAsync(): Promise<Map>;
    /**
     * Awaits for _this_ Map instance to be "ready" and returns a Promise to the Map.
     * If _this_ Map instance is already ready, the Promise is resolved directly,
     * otherwise, it is resolved as a result of the "ready" event.
     * A map instance is "ready" when all the controls that can be managed by the contructor are
     * dealt with. This happens after the "load" event, due to the asynchronous nature
     * of some built-in controls.
     */
    onReadyAsync(): Promise<Map>;
    /**
     * Awaits for _this_ Map instance to be "loaded" as well as with terrain being non-null for the first time
     * and returns a Promise to the Map.
     * If _this_ Map instance is already loaded with terrain, the Promise is resolved directly,
     * otherwise, it is resolved as a result of the "loadWithTerrain" event.
     * @returns
     */
    onLoadWithTerrainAsync(): Promise<Map>;
    /**
     * Update the style of the map.
     * Can be:
     * - a full style URL (possibly with API key)
     * - a shorthand with only the MapTIler style name (eg. `"streets-v2"`)
     * - a longer form with the prefix `"maptiler://"` (eg. `"maptiler://streets-v2"`)
     */
    setStyle(style: null | ReferenceMapStyle | MapStyleVariant | StyleSpecification | string, options?: StyleSwapOptions & StyleOptions): this;
    /**
     * Adds a [MapLibre style layer](https://maplibre.org/maplibre-style-spec/layers)
     * to the map's style.
     *
     * A layer defines how data from a specified source will be styled. Read more about layer types
     * and available paint and layout properties in the [MapLibre Style Specification](https://maplibre.org/maplibre-style-spec/layers).
     *
     * @param layer - The layer to add,
     * conforming to either the MapLibre Style Specification's [layer definition](https://maplibre.org/maplibre-style-spec/layers) or,
     * less commonly, the {@link CustomLayerInterface} specification.
     * The MapLibre Style Specification's layer definition is appropriate for most layers.
     *
     * @param beforeId - The ID of an existing layer to insert the new layer before,
     * resulting in the new layer appearing visually beneath the existing layer.
     * If this argument is not specified, the layer will be appended to the end of the layers array
     * and appear visually above all other layers.
     *
     * @returns `this`
     */
    addLayer(layer: (LayerSpecification & {
        source?: string | SourceSpecification;
    }) | CustomLayerInterface, beforeId?: string): this;
    /**
     * Moves a layer to a different z-position.
     *
     * @param id - The ID of the layer to move.
     * @param beforeId - The ID of an existing layer to insert the new layer before. When viewing the map, the `id` layer will appear beneath the `beforeId` layer. If `beforeId` is omitted, the layer will be appended to the end of the layers array and appear above all other layers on the map.
     * @returns `this`
     *
     * @example
     * Move a layer with ID 'polygon' before the layer with ID 'country-label'. The `polygon` layer will appear beneath the `country-label` layer on the map.
     * ```ts
     * map.moveLayer('polygon', 'country-label');
     * ```
     */
    moveLayer(id: string, beforeId?: string): this;
    /**
     * Removes the layer with the given ID from the map's style.
     *
     * An {@link ErrorEvent} will be fired if the image parameter is invald.
     *
     * @param id - The ID of the layer to remove
     * @returns `this`
     *
     * @example
     * If a layer with ID 'state-data' exists, remove it.
     * ```ts
     * if (map.getLayer('state-data')) map.removeLayer('state-data');
     * ```
     */
    removeLayer(id: string): this;
    /**
     * Sets the zoom extent for the specified style layer. The zoom extent includes the
     * [minimum zoom level](https://maplibre.org/maplibre-style-spec/layers/#minzoom)
     * and [maximum zoom level](https://maplibre.org/maplibre-style-spec/layers/#maxzoom))
     * at which the layer will be rendered.
     *
     * Note: For style layers using vector sources, style layers cannot be rendered at zoom levels lower than the
     * minimum zoom level of the _source layer_ because the data does not exist at those zoom levels. If the minimum
     * zoom level of the source layer is higher than the minimum zoom level defined in the style layer, the style
     * layer will not be rendered at all zoom levels in the zoom range.
     */
    setLayerZoomRange(layerId: string, minzoom: number, maxzoom: number): this;
    /**
     * Sets the filter for the specified style layer.
     *
     * Filters control which features a style layer renders from its source.
     * Any feature for which the filter expression evaluates to `true` will be
     * rendered on the map. Those that are false will be hidden.
     *
     * Use `setFilter` to show a subset of your source data.
     *
     * To clear the filter, pass `null` or `undefined` as the second parameter.
     */
    setFilter(layerId: string, filter?: FilterSpecification | null, options?: StyleSetterOptions): this;
    /**
     * Sets the value of a paint property in the specified style layer.
     *
     * @param layerId - The ID of the layer to set the paint property in.
     * @param name - The name of the paint property to set.
     * @param value - The value of the paint property to set.
     * Must be of a type appropriate for the property, as defined in the [MapLibre Style Specification](https://maplibre.org/maplibre-style-spec/).
     * @param options - Options object.
     * @returns `this`
     * @example
     * ```ts
     * map.setPaintProperty('my-layer', 'fill-color', '#faafee');
     * ```
     */
    setPaintProperty(layerId: string, name: string, value: any, options?: StyleSetterOptions): this;
    /**
     * Sets the value of a layout property in the specified style layer.
     * Layout properties define how the layer is styled.
     * Layout properties for layers of the same type are documented together.
     * Layers of different types have different layout properties.
     * See the [MapLibre Style Specification](https://maplibre.org/maplibre-style-spec/) for the complete list of layout properties.
     * @param layerId - The ID of the layer to set the layout property in.
     * @param name - The name of the layout property to set.
     * @param value - The value of the layout property to set.
     * Must be of a type appropriate for the property, as defined in the [MapLibre Style Specification](https://maplibre.org/maplibre-style-spec/).
     * @param options - Options object.
     * @returns `this`
     */
    setLayoutProperty(layerId: string, name: string, value: any, options?: StyleSetterOptions): this;
    /**
     * Sets the value of the style's glyphs property.
     *
     * @param glyphsUrl - Glyph URL to set. Must conform to the [MapLibre Style Specification](https://maplibre.org/maplibre-style-spec/glyphs/).
     * @param options - Options object.
     * @returns `this`
     * @example
     * ```ts
     * map.setGlyphs('https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf');
     * ```
     */
    setGlyphs(glyphsUrl: string | null, options?: StyleSetterOptions): this;
    private getStyleLanguage;
    /**
     * Define the primary language of the map. Note that not all the languages shorthands provided are available.
     */
    setLanguage(language: LanguageString | string): void;
    /**
     * Define the primary language of the map. Note that not all the languages shorthands provided are available.
     */
    private setPrimaryLanguage;
    /**
     * Get the primary language
     * @returns
     */
    getPrimaryLanguage(): LanguageString;
    /**
     * Get the exaggeration factor applied to the terrain
     * @returns
     */
    getTerrainExaggeration(): number;
    /**
     * Know if terrian is enabled or not
     * @returns
     */
    hasTerrain(): boolean;
    private growTerrain;
    /**
     * Enables the 3D terrain visualization
     */
    enableTerrain(exaggeration?: number): void;
    /**
     * Disable the 3D terrain visualization
     */
    disableTerrain(): void;
    /**
     * Sets the 3D terrain exageration factor.
     * If the terrain was not enabled prior to the call of this method,
     * the method `.enableTerrain()` will be called.
     * If `animate` is `true`, the terrain transformation will be animated in the span of 1 second.
     * If `animate` is `false`, no animated transition to the newly defined exaggeration.
     */
    setTerrainExaggeration(exaggeration: number, animate?: boolean): void;
    /**
     * Perform an action when the style is ready. It could be at the moment of calling this method
     * or later.
     */
    private onStyleReady;
    fitToIpBounds(): Promise<void>;
    centerOnIpPoint(zoom: number | undefined): Promise<void>;
    getCameraHash(): string;
    /**
     * Get the SDK config object.
     * This is convenient to dispatch the SDK configuration to externally built layers
     * that do not directly have access to the SDK configuration but do have access to a Map instance.
     */
    getSdkConfig(): SdkConfig;
    /**
     * Get the MapTiler session ID. Convenient to dispatch to externaly built component
     * that do not directly have access to the SDK configuration but do have access to a Map instance.
     * @returns
     */
    getMaptilerSessionId(): string;
    /**
     *  Updates the requestManager's transform request with a new function.
     *
     * @param transformRequest A callback run before the Map makes a request for an external URL. The callback can be used to modify the url, set headers, or set the credentials property for cross-origin requests.
     *    Expected to return an object with a `url` property and optionally `headers` and `credentials` properties
     *
     * @returns {Map} `this`
     *
     *  @example
     *  map.setTransformRequest((url: string, resourceType: string) => {});
     */
    setTransformRequest(transformRequest: RequestTransformFunction): this;
}

/**
 * This is an extension of MapLibre Marker to make it fully type compatible with the SDK
 */

declare class Marker extends maplibregl__default.Marker {
    addTo(map: Map | Map$1): this;
}

/**
 * This is an extension of MapLibre Popup to make it fully type compatible with the SDK
 */

declare class Popup extends maplibregl__default.Popup {
    addTo(map: Map | Map$1): this;
}

/**
 * This is an extension of MapLibre Style to make it fully type compatible with the SDK
 */

declare class Style extends maplibregl__default.Style {
    constructor(map: Map, options?: StyleOptions);
}

/**
 * This is an extension of MapLibre CanvasSource to make it fully type compatible with the SDK
 */

declare class CanvasSource extends maplibregl__default.CanvasSource {
    onAdd(map: Map | Map$1): void;
}

/**
 * This is an extension of MapLibre GeoJSONSource to make it fully type compatible with the SDK
 */

declare class GeoJSONSource extends maplibregl__default.GeoJSONSource {
    onAdd(map: Map | Map$1): void;
}

/**
 * This is an extension of MapLibre ImageSource to make it fully type compatible with the SDK
 */

declare class ImageSource extends maplibregl__default.ImageSource {
    onAdd(map: Map | Map$1): void;
}

/**
 * This is an extension of MapLibre RasterTileSource to make it fully type compatible with the SDK
 */

declare class RasterTileSource extends maplibregl__default.RasterTileSource {
    onAdd(map: Map | Map$1): void;
}

/**
 * This is an extension of MapLibre RasterDEMTileSource to make it fully type compatible with the SDK
 */

declare class RasterDEMTileSource extends maplibregl__default.RasterDEMTileSource {
    onAdd(map: Map | Map$1): void;
}

/**
 * This is an extension of MapLibre VectorTileSource to make it fully type compatible with the SDK
 */

declare class VectorTileSource extends maplibregl__default.VectorTileSource {
    onAdd(map: Map | Map$1): void;
}

/**
 * This is an extension of MapLibre VideoSource to make it fully type compatible with the SDK
 */

declare class VideoSource extends maplibregl__default.VideoSource {
    onAdd(map: Map | Map$1): void;
}

/**
 * This is an extension of MapLibre NavigationControl to make it fully type compatible with the SDK
 */

declare class NavigationControl extends maplibregl__default.NavigationControl {
    onAdd(map: Map | Map$1): HTMLElement;
}

/**
 * This is an extension of MapLibre GeolocateControl to make it fully type compatible with the SDK
 */

declare class GeolocateControl extends maplibregl__default.GeolocateControl {
    onAdd(map: Map | Map$1): HTMLElement;
}

/**
 * This is an extension of MapLibre AttributionControl to make it fully type compatible with the SDK
 */

declare class AttributionControl extends maplibregl__default.AttributionControl {
    onAdd(map: Map | Map$1): HTMLElement;
}

/**
 * This is an extension of MapLibre LogoControl to make it fully type compatible with the SDK
 */

declare class LogoControl extends maplibregl__default.LogoControl {
    onAdd(map: Map | Map$1): HTMLElement;
}

/**
 * This is an extension of MapLibre ScaleControl to make it fully type compatible with the SDK
 */

declare class ScaleControl extends maplibregl__default.ScaleControl {
    onAdd(map: Map | Map$1): HTMLElement;
}

/**
 * This is an extension of MapLibre FullscreenControl to make it fully type compatible with the SDK
 */

declare class FullscreenControl extends maplibregl__default.FullscreenControl {
    onAdd(map: Map | Map$1): HTMLElement;
}

/**
 * This is an extension of MapLibre TerrainControl to make it fully type compatible with the SDK
 */

declare class TerrainControl extends maplibregl__default.TerrainControl {
    onAdd(map: Map | Map$1): HTMLElement;
}

/**
 * This is an extension of MapLibre BoxZoomHandler to make it fully type compatible with the SDK
 */

declare class BoxZoomHandler extends maplibregl__default.BoxZoomHandler {
    constructor(map: Map | Map$1, options: {
        clickTolerance: number;
    });
}

/**
 * This is an extension of MapLibre BoxZoomHandler to make it fully type compatible with the SDK
 */

declare class ScrollZoomHandler extends maplibregl__default.ScrollZoomHandler {
    constructor(map: Map | Map$1, triggerRenderFrame: () => void);
}

/**
 * This is an extension of MapLibre BoxZoomHandler to make it fully type compatible with the SDK
 */

declare class CooperativeGesturesHandler extends maplibregl__default.CooperativeGesturesHandler {
    constructor(map: Map | Map$1, options: GestureOptions);
}

/**
 * This is an extension of MapLibre BoxZoomHandler to make it fully type compatible with the SDK
 */

declare class KeyboardHandler extends maplibregl__default.KeyboardHandler {
    constructor(map: Map | Map$1);
}

/**
 * This is an extension of MapLibre BoxZoomHandler to make it fully type compatible with the SDK
 */

declare class TwoFingersTouchPitchHandler extends maplibregl__default.TwoFingersTouchPitchHandler {
    constructor(map: Map | Map$1);
}

/**
 * This is an extension of MapLibre BoxZoomHandler to make it fully type compatible with the SDK
 */

declare class MapWheelEvent extends maplibregl__default.MapWheelEvent {
    constructor(type: string, map: Map | Map$1, originalEvent: WheelEvent);
}

/**
 * This is an extension of MapLibre BoxZoomHandler to make it fully type compatible with the SDK
 */

declare class MapTouchEvent extends maplibregl__default.MapTouchEvent {
    constructor(type: string, map: Map | Map$1, originalEvent: TouchEvent);
}

/**
 * This is an extension of MapLibre BoxZoomHandler to make it fully type compatible with the SDK
 */

declare class MapMouseEvent extends maplibregl__default.MapMouseEvent {
    constructor(type: string, map: Map | Map$1, originalEvent: MouseEvent, data?: any);
}

/**
 * The MaptilerGeolocateControl is an extension of the original GeolocateControl
 * with a few changes. In this version, the active mode persists as long as the
 * location is still centered. This means it's robust to rotation, pitch and zoom.
 *
 */
declare class MaptilerGeolocateControl extends GeolocateControl {
    private lastUpdatedCenter;
    /**
     * Update the camera location to center on the current position
     *
     * @param {Position} position the Geolocation API Position
     * @private
     */
    _updateCamera: (position: GeolocationPosition) => void;
    _setupUI: (supported: boolean) => void;
    _updateCircleRadius(): void;
    _onZoom: () => void;
}

type LogoControlOptions = LogoControlOptions$1 & {
    logoURL?: string;
    linkURL?: string;
};
/**
 * This LogoControl extends the MapLibre LogoControl but instead can use any image URL and
 * any link URL. By default this is using MapTiler logo and URL.
 */
declare class MaptilerLogoControl extends LogoControl {
    _compact: boolean;
    private logoURL;
    private linkURL;
    constructor(options?: LogoControlOptions);
    onAdd(map: Map): HTMLElement;
}

/**
 * A `MaptilerTerrainControl` control adds a button to turn terrain on and off
 * by triggering the terrain logic that is already deployed in the Map object.
 */
declare class MaptilerTerrainControl implements IControl {
    _map: Map;
    _container: HTMLElement;
    _terrainButton: HTMLButtonElement;
    constructor();
    onAdd(map: Map): HTMLElement;
    onRemove(): void;
    _toggleTerrain(): void;
    _updateTerrainIcon(): void;
}

type HTMLButtonElementPlus = HTMLButtonElement & {
    clickFunction: (e?: Event) => unknown;
};
declare class MaptilerNavigationControl extends NavigationControl {
    constructor();
    /**
     * Overloading: the button now stores its click callback so that we can later on delete it and replace it
     */
    _createButton(className: string, fn: (e?: Event) => unknown): HTMLButtonElementPlus;
    /**
     * Overloading: Limit how flat the compass icon can get
     */
    _rotateCompassArrow: () => void;
}

interface Link {
    href: string | null;
}
interface XMLProperties {
    links?: Link[];
}
interface PlacemarkProperties {
    name?: string;
    address?: string;
    styleUrl?: string;
    description?: string;
    styleHash?: string;
    styleMapHash?: Record<string, string | null>;
    timespan?: {
        begin: string;
        end: string;
    };
    timestamp?: string;
    stroke?: string;
    "stroke-opacity"?: number;
    "stroke-width"?: number;
    fill?: string;
    "fill-opacity"?: number;
    visibility?: string;
    icon?: string;
    coordTimes?: (string | null)[] | (string | null)[][];
}
/**
 * create a function that converts a string to XML
 * https://developer.mozilla.org/en-US/docs/Web/API/DOMParser
 */
declare function str2xml(str: string): Document;
/**
 * Check one of the top level child node is of a given type ("gpx", "kml").
 * The check is not case sensitive.
 * @param doc
 * @param nodeName
 * @returns
 */
declare function hasChildNodeWithName(doc: Document, nodeName: string): boolean;
/**
 * create a function that converts a XML to a string
 * https://developer.mozilla.org/en-US/docs/Web/API/XMLSerializer
 */
declare function xml2str(node: Node): string;
/**
 * Given a XML document using the GPX spec, return GeoJSON
 */
declare function gpx(doc: string | Document): GeoJSON.FeatureCollection;
/**
 * Given a XML document using the KML spec, return GeoJSON
 */
declare function kml(doc: string | Document, xml2string?: (node: Node) => string): GeoJSON.FeatureCollection;
declare function gpxOrKml(doc: string | Document): GeoJSON.FeatureCollection | null;

type RgbaColor = [number, number, number] | [number, number, number, number];
type ColorStop = {
    /**
     * The "value" at which this ColorStop should be applied.
     */
    value: number;
    /**
     * RGB[A] - Array of 3-4 numbers. 0-255 per channel.
     */
    color: RgbaColor;
};
/**
 * A RGBA color as per the array definition
 */
type ArrayColor = [number, number, number, number];
/**
 * A color ramp stop as per array definition
 */
type ArrayColorRampStop = [
    /**
     * Real world value in a real world unit
     */
    number,
    /**
     * Color RGBA
     */
    ArrayColor
];
/**
 * A color ramp as per array definition
 */
type ArrayColorRamp = Array<ArrayColorRampStop>;
type ColorRampOptions = {
    /**
     * The value the colorramp starts
     */
    min?: number;
    /**
     * The value the colorramp ends
     */
    max?: number;
    /**
     * Some color stops to copy from
     */
    stops?: Array<ColorStop>;
};
declare class ColorRamp extends Array<ColorStop> {
    /**
     * Converts a array-definition color ramp definition into a usable ColorRamp instance.
     * Note: units are not converted and may need to to be converted beforehand (eg. kelvin to centigrade)
     * @param cr
     * @returns
     */
    static fromArrayDefinition(cr: ArrayColorRamp): ColorRamp;
    private min;
    private max;
    constructor(options?: ColorRampOptions);
    setStops(stops: Array<ColorStop>, options?: {
        clone?: boolean;
    }): ColorRamp;
    scale(min: number, max: number, options?: {
        clone?: boolean;
    }): ColorRamp;
    at(pos: number): ColorStop;
    clone(): ColorRamp;
    getRawColorStops(): Array<ColorStop>;
    reverse(options?: {
        clone?: boolean;
    }): ColorRamp;
    getBounds(): {
        min: number;
        max: number;
    };
    getColor(value: number, options?: {
        smooth?: boolean;
    }): RgbaColor;
    /**
     * Get the color as an hexadecimal string
     */
    getColorHex(value: number, options?: {
        smooth?: boolean;
        withAlpha?: boolean;
    }): string;
    /**
     * Get the color of the color ramp at a relative position in [0, 1]
     */
    getColorRelative(value: number, options?: {
        smooth?: boolean;
    }): RgbaColor;
    getCanvasStrip(options?: {
        horizontal?: boolean;
        size?: number;
        smooth?: boolean;
    }): HTMLCanvasElement;
    /**
     * Apply a non-linear ressampling. This will create a new instance of ColorRamp with the same bounds.
     */
    resample(method: "ease-in-square" | "ease-out-square" | "ease-in-sqrt" | "ease-out-sqrt" | "ease-in-exp" | "ease-out-exp", samples?: number): ColorRamp;
    /**
     * Makes a clone of this color ramp that is fully transparant at the begining of their range
     */
    transparentStart(): ColorRamp;
    /**
     * Check if this color ramp has a transparent start
     */
    hasTransparentStart(): boolean;
}
/**
 * This is a collection of built-in color ramps. They are all defined in the range [0, 1]
 * but can be scaled or reversed to fit specific usages.
 */
declare const ColorRampCollection: {
    /**
     * A fully transparent [0, 0, 0, 0] colorramp to hide data.
     * Defined in interval [0, 1], without unit.
     */
    NULL: ColorRamp;
    GRAY: ColorRamp;
    /**
     * Classic jet color ramp.
     * Defined in interval [0, 1], without unit.
     */
    JET: ColorRamp;
    /**
     * Classic HSV color ramp (hue, saturation, value).
     * Defined in interval [0, 1], without unit.
     */
    HSV: ColorRamp;
    /**
     * Classic hot color ramp.
     * Defined in interval [0, 1], without unit.
     */
    HOT: ColorRamp;
    /**
     * Classic spring color ramp.
     * Defined in interval [0, 1], without unit.
     */
    SPRING: ColorRamp;
    /**
     * Classic summer color ramp.
     * Defined in interval [0, 1], without unit.
     */
    SUMMER: ColorRamp;
    /**
     * Classic autommn color ramp.
     * Defined in interval [0, 1], without unit.
     */
    AUTOMN: ColorRamp;
    /**
     * Classic winter color ramp.
     * Defined in interval [0, 1], without unit.
     */
    WINTER: ColorRamp;
    /**
     * Classic bone color ramp.
     * Defined in interval [0, 1], without unit.
     */
    BONE: ColorRamp;
    /**
     * Classic copper color ramp.
     * Defined in interval [0, 1], without unit.
     */
    COPPER: ColorRamp;
    /**
     * Classic greys color ramp.
     * Defined in interval [0, 1], without unit.
     */
    GREYS: ColorRamp;
    /**
     * Classic yignbu color ramp (blue to light yellow).
     * Defined in interval [0, 1], without unit.
     */
    YIGNBU: ColorRamp;
    /**
     * Classic greens color ramp.
     * Defined in interval [0, 1], without unit.
     */
    GREENS: ColorRamp;
    /**
     * Classic yiorrd color ramp (red to light yellow).
     * Defined in interval [0, 1], without unit.
     */
    YIORRD: ColorRamp;
    /**
     * Classic blue-red color ramp.
     * Defined in interval [0, 1], without unit.
     */
    BLUERED: ColorRamp;
    /**
     * Classic rdbu color ramp.
     * Defined in interval [0, 1], without unit.
     */
    RDBU: ColorRamp;
    /**
     * Classic picnic color ramp.
     * Defined in interval [0, 1], without unit.
     */
    PICNIC: ColorRamp;
    /**
     * Classic rainbow color ramp.
     * Defined in interval [0, 1], without unit.
     */
    RAINBOW: ColorRamp;
    /**
     * Classic Portland color ramp.
     * Defined in interval [0, 1], without unit.
     */
    PORTLAND: ColorRamp;
    /**
     * Classic blackbody color ramp.
     * Defined in interval [0, 1], without unit.
     */
    BLACKBODY: ColorRamp;
    /**
     * Classic earth color ramp.
     * Defined in interval [0, 1], without unit.
     */
    EARTH: ColorRamp;
    /**
     * Classic electric color ramp.
     * Defined in interval [0, 1], without unit.
     */
    ELECTRIC: ColorRamp;
    /**
     * Classic viridis color ramp.
     * Defined in interval [0, 1], without unit.
     */
    VIRIDIS: ColorRamp;
    /**
     * Classic inferno color ramp.
     * Defined in interval [0, 1], without unit.
     */
    INFERNO: ColorRamp;
    /**
     * Classic magma color ramp.
     * Defined in interval [0, 1], without unit.
     */
    MAGMA: ColorRamp;
    /**
     * Classic plasma color ramp.
     * Defined in interval [0, 1], without unit.
     */
    PLASMA: ColorRamp;
    /**
     * Classic warm color ramp.
     * Defined in interval [0, 1], without unit.
     */
    WARM: ColorRamp;
    /**
     * Classic cool color ramp.
     * Defined in interval [0, 1], without unit.
     */
    COOL: ColorRamp;
    /**
     * Classic rainboz soft color ramp.
     * Defined in interval [0, 1], without unit.
     */
    RAINBOW_SOFT: ColorRamp;
    /**
     * Classic bathymetry color ramp.
     * Defined in interval [0, 1], without unit.
     */
    BATHYMETRY: ColorRamp;
    /**
     * Classic cdom color ramp.
     * Defined in interval [0, 1], without unit.
     */
    CDOM: ColorRamp;
    /**
     * Classic chlorophyll color ramp.
     * Defined in interval [0, 1], without unit.
     */
    CHLOROPHYLL: ColorRamp;
    /**
     * Classic density color ramp.
     * Defined in interval [0, 1], without unit.
     */
    DENSITY: ColorRamp;
    /**
     * Classic freesurface blue color ramp.
     * Defined in interval [0, 1], without unit.
     */
    FREESURFACE_BLUE: ColorRamp;
    /**
     * Classic freesurface red color ramp.
     * Defined in interval [0, 1], without unit.
     */
    FREESURFACE_RED: ColorRamp;
    /**
     * Classic oxygen color ramp.
     * Defined in interval [0, 1], without unit.
     */
    OXYGEN: ColorRamp;
    /**
     * Classic par color ramp.
     * Defined in interval [0, 1], without unit.
     */
    PAR: ColorRamp;
    /**
     * Classic phase color ramp.
     * Defined in interval [0, 1], without unit.
     */
    PHASE: ColorRamp;
    /**
     * Classic salinity color ramp.
     * Defined in interval [0, 1], without unit.
     */
    SALINITY: ColorRamp;
    /**
     * Classic temperature color ramp.
     * Defined in interval [0, 1], without unit.
     */
    TEMPERATURE: ColorRamp;
    /**
     * Classic turbidity color ramp.
     * Defined in interval [0, 1], without unit.
     */
    TURBIDITY: ColorRamp;
    /**
     * Classic velocity blue color ramp.
     * Defined in interval [0, 1], without unit.
     */
    VELOCITY_BLUE: ColorRamp;
    /**
     * Classic velocity green color ramp.
     * Defined in interval [0, 1], without unit.
     */
    VELOCITY_GREEN: ColorRamp;
    /**
     * Classic cube helix color ramp.
     * Defined in interval [0, 1], without unit.
     */
    CUBEHELIX: ColorRamp;
    /**
     * The cividis color ramp is color blind friendly.
     * Read more here https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0199239
     * Defined in interval [0, 1], without unit.
     */
    CIVIDIS: ColorRamp;
    /**
     * Classic turbo color ramp.
     * This is a luminance-constant alternative to the jet, making it more
     * clor-blind friendly.
     * Defined in interval [0, 1], without unit.
     */
    TURBO: ColorRamp;
    /**
     * The rocket color ramp is perceptually uniform, which makes it more
     * color bliend friendly than the classic magma color ramp.
     * Defined in interval [0, 1], without unit.
     */
    ROCKET: ColorRamp;
    /**
     * The mako color ramp is perceptually uniform and can be seen as
     * a color blind friendly alternative to bathymetry or yignbu.
     * Defined in interval [0, 1], without unit.
     */
    MAKO: ColorRamp;
};

/**
 * Array of string values that depend on zoom level
 */
type ZoomStringValues = Array<{
    /**
     * Zoom level
     */
    zoom: number;
    /**
     * Value for the given zoom level
     */
    value: string;
}>;
/**
 *
 * Array of number values that depend on zoom level
 */
type ZoomNumberValues = Array<{
    /**
     * Zoom level
     */
    zoom: number;
    /**
     * Value for the given zoom level
     */
    value: number;
}>;
type PropertyValues = Array<{
    /**
     * Value of the property (input)
     */
    propertyValue: number;
    /**
     * Value to associate it with (output)
     */
    value: number;
}>;
type CommonShapeLayerOptions = {
    /**
     * ID to give to the layer.
     * If not provided, an auto-generated ID of the for "maptiler-layer-xxxxxx" will be auto-generated,
     * with "xxxxxx" being a random string.
     */
    layerId?: string;
    /**
     * ID to give to the geojson source.
     * If not provided, an auto-generated ID of the for "maptiler-source-xxxxxx" will be auto-generated,
     * with "xxxxxx" being a random string.
     */
    sourceId?: string;
    /**
     * A geojson Feature collection or a URL to a geojson or the UUID of a MapTiler Cloud dataset.
     */
    data: FeatureCollection | string;
    /**
     * The ID of an existing layer to insert the new layer before, resulting in the new layer appearing
     * visually beneath the existing layer. If this argument is not specified, the layer will be appended
     * to the end of the layers array and appear visually above all other layers.
     */
    beforeId?: string;
    /**
     * Zoom level at which it starts to show.
     * Default: `0`
     */
    minzoom?: number;
    /**
     * Zoom level after which it no longer show.
     * Default: `22`
     */
    maxzoom?: number;
    /**
     * Whether or not to add an outline.
     * Default: `false`
     */
    outline?: boolean;
    /**
     * Color of the outline. This is can be a constant color string or a definition based on zoom levels.
     * Applies only if `.outline` is `true`.
     * Default: `white`
     */
    outlineColor?: string | ZoomStringValues;
    /**
     * Width of the outline (relative to screen-space). This is can be a constant width or a definition based on zoom levels.
     * Applies only if `.outline` is `true`.
     * Default: `1`
     */
    outlineWidth?: number | ZoomNumberValues;
    /**
     * Opacity of the outline. This is can be a constant opacity in [0, 1] or a definition based on zoom levels
     * Applies only if `.outline` is `true`.
     * Default: `1`
     */
    outlineOpacity?: number | ZoomNumberValues;
};
type PolylineLayerOptions = CommonShapeLayerOptions & {
    /**
     * Color of the line (or polyline). This is can be a constant color string or a definition based on zoom levels.
     * Default: a color randomly pick from a list
     */
    lineColor?: string | ZoomStringValues;
    /**
     * Width of the line (relative to screen-space). This is can be a constant width or a definition based on zoom levels
     * Default: `3`
     */
    lineWidth?: number | ZoomNumberValues;
    /**
     * Opacity of the line. This is can be a constant opacity in [0, 1] or a definition based on zoom levels.
     * Default: `1`
     */
    lineOpacity?: number | ZoomNumberValues;
    /**
     * How blury the line is, with `0` being no blur and `10` and beyond being quite blurry.
     * Default: `0`
     */
    lineBlur?: number | ZoomNumberValues;
    /**
     * Draws a line casing outside of a line's actual path. Value indicates the width of the inner gap.
     * Default: `0`
     */
    lineGapWidth?: number | ZoomNumberValues;
    /**
     * Sequence of line and void to create a dash pattern. The unit is the line width so that
     * a dash array value of `[3, 1]` will create a segment worth 3 times the width of the line,
     * followed by a spacing worth 1 time the line width, and then repeat.
     *
     * Alternatively, this property can be a string made of underscore and whitespace characters
     * such as `"___ _ "` and internaly this will be translated into [3, 1, 1, 1]. Note that
     * this way of describing dash arrays with a string only works for integer values.
     *
     * Dash arrays can contain more than 2 element to create more complex patters. For instance
     * a dash array value of [3, 2, 1, 2] will create the following sequence:
     * - a segment worth 3 times the width
     * - a spacing worth 2 times the width
     * - a segment worth 1 times the width
     * - a spacing worth 2 times the width
     * - repeat
     *
     * Default: no dash pattern
     */
    lineDashArray?: Array<number> | string;
    /**
     * The display of line endings for both the line and the outline (if `.outline` is `true`)
     * - "butt": A cap with a squared-off end which is drawn to the exact endpoint of the line.
     * - "round": A cap with a rounded end which is drawn beyond the endpoint of the line at a radius of one-half of the line's width and centered on the endpoint of the line.
     * - "square": A cap with a squared-off end which is drawn beyond the endpoint of the line at a distance of one-half of the line's width.
     * Default: "round"
     */
    lineCap?: "butt" | "round" | "square";
    /**
     * The display of lines when joining for both the line and the outline (if `.outline` is `true`)
     * - "bevel": A join with a squared-off end which is drawn beyond the endpoint of the line at a distance of one-half of the line's width.
     * - "round": A join with a rounded end which is drawn beyond the endpoint of the line at a radius of one-half of the line's width and centered on the endpoint of the line.
     * - "miter": A join with a sharp, angled corner which is drawn with the outer sides beyond the endpoint of the path until they meet.
     * Default: "round"
     */
    lineJoin?: "bevel" | "round" | "miter";
    /**
     * How blury the outline is, with `0` being no blur and `10` and beyond being quite blurry.
     * Applies only if `.outline` is `true`.
     * Default: `0`
     */
    outlineBlur?: number | ZoomNumberValues;
};
type PolygonLayerOptions = CommonShapeLayerOptions & {
    /**
     * Color of the polygon. This is can be a constant color string or a definition based on zoom levels.
     * Default: a color randomly pick from a list
     */
    fillColor?: string | ZoomStringValues;
    /**
     * Opacity of the polygon. This is can be a constant opacity in [0, 1] or a definition based on zoom levels
     * Default: `1`
     */
    fillOpacity?: ZoomNumberValues;
    /**
     * Position of the outline with regard to the polygon edge (when `.outline` is `true`)
     * Default: `"center"`
     */
    outlinePosition: "center" | "inside" | "outside";
    /**
     * Sequence of line and void to create a dash pattern. The unit is the line width so that
     * a dash array value of `[3, 1]` will create a segment worth 3 times the width of the line,
     * followed by a spacing worth 1 time the line width, and then repeat.
     *
     * Alternatively, this property can be a string made of underscore and whitespace characters
     * such as `"___ _ "` and internaly this will be translated into [3, 1, 1, 1]. Note that
     * this way of describing dash arrays with a string only works for integer values.
     *
     * Dash arrays can contain more than 2 element to create more complex patters. For instance
     * a dash array value of [3, 2, 1, 2] will create the following sequence:
     * - a segment worth 3 times the width
     * - a spacing worth 2 times the width
     * - a segment worth 1 times the width
     * - a spacing worth 2 times the width
     * - repeat
     *
     * Default: no dash pattern
     */
    outlineDashArray?: Array<number> | string;
    /**
     * The display of line endings for both the line and the outline (if `.outline` is `true`)
     * - "butt": A cap with a squared-off end which is drawn to the exact endpoint of the line.
     * - "round": A cap with a rounded end which is drawn beyond the endpoint of the line at a radius of one-half of the line's width and centered on the endpoint of the line.
     * - "square": A cap with a squared-off end which is drawn beyond the endpoint of the line at a distance of one-half of the line's width.
     * Default: "round"
     */
    outlineCap?: "butt" | "round" | "square";
    /**
     * The display of lines when joining for both the line and the outline (if `.outline` is `true`)
     * - "bevel": A join with a squared-off end which is drawn beyond the endpoint of the line at a distance of one-half of the line's width.
     * - "round": A join with a rounded end which is drawn beyond the endpoint of the line at a radius of one-half of the line's width and centered on the endpoint of the line.
     * - "miter": A join with a sharp, angled corner which is drawn with the outer sides beyond the endpoint of the path until they meet.
     * Default: "round"
     */
    outlineJoin?: "bevel" | "round" | "miter";
    /**
     * The pattern is an image URL to be put as a repeated background pattern of the polygon.
     * Default: `null` (no pattern, `fillColor` will be used)
     */
    pattern?: string | null;
    /**
     * How blury the outline is, with `0` being no blur and `10` and beyond being quite blurry.
     * Applies only if `.outline` is `true`.
     * Default: `0`
     */
    outlineBlur?: number | ZoomNumberValues;
};
type PointLayerOptions = CommonShapeLayerOptions & {
    /**
     * Can be a unique point color as a string (CSS color such as "#FF0000" or "red").
     * Alternatively, the color can be a ColorRamp with a range.
     * In case of `.cluster` being `true`, the range of the ColorRamp will be addressed with the number of elements in
     * the cluster. If `.cluster` is `false`, the color will be addressed using the value of the `.property`.
     * If no `.property` is given but `.pointColor` is a ColorRamp, the chosen color is the one at the lower bound of the ColorRamp.
     * Default: a color randomly pick from a list
     */
    pointColor?: string | ColorRamp;
    /**
     * Radius of the points. Can be a fixed size or a value dependant on the zoom.
     * If `.pointRadius` is not provided, the radius will depend on the size of each cluster (if `.cluster` is `true`)
     * or on the value of each point (if `.property` is provided and `.pointColor` is a ColorRamp).
     * The radius will be between `.minPointRadius` and `.maxPointRadius`
     */
    pointRadius?: number | ZoomNumberValues;
    /**
     * The minimum point radius posible.
     * Default: `10`
     */
    minPointRadius?: number;
    /**
     * The maximum point radius posible.
     * Default: `40`
     */
    maxPointRadius?: number;
    /**
     * The point property to observe and apply the radius and color upon.
     * This is ignored if `.cluster` is `true` as the observed value will be fiorced to being the number
     * of elements in each cluster.
     *
     * Default: none
     */
    property?: string;
    /**
     * Opacity of the point or icon. This is can be a constant opacity in [0, 1] or a definition based on zoom levels.
     * Alternatively, if not provided but the `.pointColor` is a ColorRamp, the opacity will be extracted from tha alpha
     * component if present.
     * Default: `1`
     */
    pointOpacity?: number | ZoomNumberValues;
    /**
     * If `true`, the points will keep their circular shape align with the wiewport.
     * If `false`, the points will be like flatten on the map. This difference shows
     * when the map is tilted.
     * Default: `true`
     */
    alignOnViewport?: boolean;
    /**
     * Whether the points should cluster
     */
    cluster?: boolean;
    /**
     * Shows a label with the numerical value id `true`.
     * If `.cluster` is `true`, the value will be the numebr of elements in the cluster.
     *
     *
     * Default: `true` if `cluster` or `dataDrivenStyleProperty` are used, `false` otherwise.
     */
    showLabel?: boolean;
    /**
     * text color used for the number elements in each cluster.
     * Applicable only when `cluster` is `true`.
     * Default: `#000000` (black)
     */
    labelColor?: string;
    /**
     * text size used for the number elements in each cluster.
     * Applicable only when `cluster` is `true`.
     * Default: `12`
     */
    labelSize?: number;
    /**
     * Only if `.cluster` is `false`.
     * If the radius is driven by a property, then it will also scale by zoomming if `.zoomCompensation` is `true`.
     * If `false`, the radius will not adapt according to the zoom level.
     * Default: `true`
     */
    zoomCompensation?: boolean;
};
type HeatmapLayerOptions = {
    /**
     * ID to give to the layer.
     * If not provided, an auto-generated ID of the for "maptiler-layer-xxxxxx" will be auto-generated,
     * with "xxxxxx" being a random string.
     */
    layerId?: string;
    /**
     * ID to give to the geojson source.
     * If not provided, an auto-generated ID of the for "maptiler-source-xxxxxx" will be auto-generated,
     * with "xxxxxx" being a random string.
     */
    sourceId?: string;
    /**
     * A geojson Feature collection or a URL to a geojson or the UUID of a MapTiler Cloud dataset.
     */
    data: FeatureCollection | string;
    /**
     * The ID of an existing layer to insert the new layer before, resulting in the new layer appearing
     * visually beneath the existing layer. If this argument is not specified, the layer will be appended
     * to the end of the layers array and appear visually above all other layers.
     */
    beforeId?: string;
    /**
     * Zoom level at which it starts to show.
     * Default: `0`
     */
    minzoom?: number;
    /**
     * Zoom level after which it no longer show.
     * Default: `22`
     */
    maxzoom?: number;
    /**
     * The ColorRamp instance to use for visualization. The color ramp is expected to be defined in the
     * range `[0, 1]` or else will be forced to this range.
     * Default: `ColorRampCollection.TURBO`
     */
    colorRamp?: ColorRamp;
    /**
     * Use a property to apply a weight to each data point. Using a property requires also using
     * the options `.propertyValueWeight` or otherwise will be ignored.
     * Default: none, the points will all have a weight of `1`.
     */
    property?: string;
    /**
     * The weight to give to each data point. If of type `PropertyValueWeights`, then the options `.property`
     * must also be provided. If used a number, all data points will be weighted by the same number (which is of little interest)
     */
    weight?: PropertyValues | number;
    /**
     * The radius (in screenspace) can be:
     * - a fixed number that will be constant across zoom level
     * - of type `ZoomNumberValues` to be ramped accoding to zoom level (`.zoomCompensation` will then be ignored)
     * - of type `PropertyValues` to be driven by the value of a property.
     *   If so, the option `.property` must be provided and will still be resized according to zoom level,
     *   unless the option `.zoomCompensation` is set to `false`.
     *
     * Default:
     */
    radius?: number | ZoomNumberValues | PropertyValues;
    /**
     * The opacity can be a fixed value or zoom-driven.
     * Default: fades-in 0.25z after minzoom and fade-out 0.25z before maxzoom
     */
    opacity?: number | ZoomNumberValues;
    /**
     * The intensity is zoom-dependent. By default, the intensity is going to be scaled by zoom to preserve
     * a natural aspect or the data distribution.
     */
    intensity?: number | ZoomNumberValues;
    /**
     * If the radius is driven by a property, then it will also scale by zoomming if `.zoomCompensation` is `true`.
     * If `false`, the radius will not adapt according to the zoom level.
     * Default: `true`
     */
    zoomCompensation?: boolean;
};
/**
 * Add a polyline to the map from various sources and with builtin styling.
 * Compatible sources:
 * - gpx content as string
 * - gpx file from URL
 * - kml content from string
 * - kml from url
 * - geojson from url
 * - geojson content as string
 * - geojson content as JS object
 * - uuid of a MapTiler Cloud dataset
 *
 * The method also gives the possibility to add an outline layer (if `options.outline` is `true`)
 * and if so , the returned property `polylineOutlineLayerId` will be a string. As a result, two layers
 * would be added.
 *
 * The default styling creates a line layer of constant width of 3px, the color will be randomly picked
 * from a curated list of colors and the opacity will be 1.
 * If the outline is enabled, the outline width is of 1px at all zoom levels, the color is white and
 * the opacity is 1.
 *
 * Those style properties can be changed and ramped according to zoom level using an easier syntax.
 *
 */
declare function addPolyline(
/**
 * Map instance to add a polyline layer to
 */
map: Map, 
/**
 * Options related to adding a polyline layer
 */
options: PolylineLayerOptions, 
/**
 * When the polyline data is loaded from a distant source, these options are propagated to the call of `fetch`
 */
fetchOptions?: RequestInit): Promise<{
    polylineLayerId: string;
    polylineOutlineLayerId: string;
    polylineSourceId: string;
}>;
/**
 * Add a polygon with styling options.
 */
declare function addPolygon(map: Map, options: PolygonLayerOptions): {
    /**
     * ID of the fill layer
     */
    polygonLayerId: string;
    /**
     * ID of the outline layer (will be `""` if no outline)
     */
    polygonOutlineLayerId: string;
    /**
     * ID of the source that contains the data
     */
    polygonSourceId: string;
};
/**
 * Add a point layer from a GeoJSON source (or an existing sourceId) with many styling options
 */
declare function addPoint(
/**
 * The Map instance to add a point layer to
 */
map: Map, options: PointLayerOptions): {
    /**
     * ID of the unclustered point layer
     */
    pointLayerId: string;
    /**
     * ID of the clustered point layer (empty if `cluster` options id `false`)
     */
    clusterLayerId: string;
    /**
     * ID of the layer that shows the count of elements in each cluster (empty if `cluster` options id `false`)
     */
    labelLayerId: string;
    /**
     * ID of the data source
     */
    pointSourceId: string;
};
/**
 * Add a polyline witgh optional outline from a GeoJSON object
 */
declare function addHeatmap(
/**
 * Map instance to add a heatmap layer to
 */
map: Map, options: HeatmapLayerOptions): {
    /**
     * ID of the heatmap layer
     */
    heatmapLayerId: string;
    /**
     * ID of the data source
     */
    heatmapSourceId: string;
};

/**
 * Helpers are a set of functions to facilitate the creation of sources and layers
 */
declare const helpers: {
    addPolyline: typeof addPolyline;
    addPolygon: typeof addPolygon;
    addPoint: typeof addPoint;
    addHeatmap: typeof addHeatmap;
};

declare const setRTLTextPlugin: typeof maplibregl__default.setRTLTextPlugin;
declare const getRTLTextPluginStatus: typeof maplibregl__default.getRTLTextPluginStatus;
declare const prewarm: typeof maplibregl__default.prewarm;
declare const clearPrewarmedResources: typeof maplibregl__default.clearPrewarmedResources;
declare const addProtocol: typeof maplibregl__default.addProtocol;
declare const removeProtocol: typeof maplibregl__default.removeProtocol;
declare const Hash: typeof maplibregl__default.Hash;
declare const Point: typeof maplibregl__default.Point;
declare const config: maplibregl__default.Config;
declare const EdgeInsets: typeof maplibregl__default.EdgeInsets;
declare const DragRotateHandler: typeof maplibregl__default.DragRotateHandler;
declare const DragPanHandler: typeof maplibregl__default.DragPanHandler;
declare const TwoFingersTouchZoomRotateHandler: typeof maplibregl__default.TwoFingersTouchZoomRotateHandler;
declare const DoubleClickZoomHandler: typeof maplibregl__default.DoubleClickZoomHandler;
declare const TwoFingersTouchZoomHandler: typeof maplibregl__default.TwoFingersTouchZoomHandler;
declare const TwoFingersTouchRotateHandler: typeof maplibregl__default.TwoFingersTouchRotateHandler;
declare const getWorkerCount: typeof maplibregl__default.getWorkerCount;
declare const setWorkerCount: typeof maplibregl__default.setWorkerCount;
declare const getMaxParallelImageRequests: typeof maplibregl__default.getMaxParallelImageRequests;
declare const setMaxParallelImageRequests: typeof maplibregl__default.setMaxParallelImageRequests;
declare const getWorkerUrl: typeof maplibregl__default.getWorkerUrl;
declare const setWorkerUrl: typeof maplibregl__default.setWorkerUrl;
declare const addSourceType: (name: string, SourceType: maplibregl__default.SourceClass) => Promise<void>;
declare const importScriptInWorkers: typeof maplibregl__default.importScriptInWorkers;
/**
 * Get the version of MapTiler SDK
 */
declare function getVersion(): string;
/**
 * Get the version of MapLibre GL JS
 */
declare function getMapLibreVersion(): string;

declare const NavigationControlMLGL: typeof maplibregl__default.NavigationControl;
type NavigationControlMLGL = InstanceType<typeof NavigationControlMLGL>;
declare const GeolocateControlMLGL: typeof maplibregl__default.GeolocateControl;
type GeolocateControlMLGL = InstanceType<typeof GeolocateControlMLGL>;
declare const AttributionControlMLGL: typeof maplibregl__default.AttributionControl;
type AttributionControlMLGL = InstanceType<typeof AttributionControlMLGL>;
declare const LogoControlMLGL: typeof maplibregl__default.LogoControl;
type LogoControlMLGL = InstanceType<typeof LogoControlMLGL>;
declare const ScaleControlMLGL: typeof maplibregl__default.ScaleControl;
type ScaleControlMLGL = InstanceType<typeof ScaleControlMLGL>;
declare const FullscreenControlMLGL: typeof maplibregl__default.FullscreenControl;
type FullscreenControlMLGL = InstanceType<typeof FullscreenControlMLGL>;
declare const TerrainControlMLGL: typeof maplibregl__default.TerrainControl;
type TerrainControlMLGL = InstanceType<typeof TerrainControlMLGL>;
declare const MarkerMLGL: typeof maplibregl__default.Marker;
type MarkerMLGL = InstanceType<typeof MarkerMLGL>;
declare const PopupMLGL: typeof maplibregl__default.Popup;
type PopupMLGL = InstanceType<typeof PopupMLGL>;
declare const StyleMLGL: typeof maplibregl__default.Style;
type StyleMLGL = InstanceType<typeof StyleMLGL>;
declare const LngLat: typeof maplibregl__default.LngLat;
type LngLat = InstanceType<typeof LngLat>;
declare const LngLatBounds: typeof maplibregl__default.LngLatBounds;
type LngLatBounds = InstanceType<typeof LngLatBounds>;
declare const MercatorCoordinate: typeof maplibregl__default.MercatorCoordinate;
type MercatorCoordinate = InstanceType<typeof MercatorCoordinate>;
declare const Evented: typeof maplibregl__default.Evented;
type Evented = InstanceType<typeof Evented>;
declare const AJAXError: typeof maplibregl__default.AJAXError;
type AJAXError = InstanceType<typeof AJAXError>;
declare const CanvasSourceMLGL: typeof maplibregl__default.CanvasSource;
type CanvasSourceMLGL = InstanceType<typeof CanvasSourceMLGL>;
declare const GeoJSONSourceMLGL: typeof maplibregl__default.GeoJSONSource;
type GeoJSONSourceMLGL = InstanceType<typeof GeoJSONSourceMLGL>;
declare const ImageSourceMLGL: typeof maplibregl__default.ImageSource;
type ImageSourceMLGL = InstanceType<typeof ImageSourceMLGL>;
declare const RasterDEMTileSourceMLGL: typeof maplibregl__default.RasterDEMTileSource;
type RasterDEMTileSourceMLGL = InstanceType<typeof RasterDEMTileSourceMLGL>;
declare const RasterTileSourceMLGL: typeof maplibregl__default.RasterTileSource;
type RasterTileSourceMLGL = InstanceType<typeof RasterTileSourceMLGL>;
declare const VectorTileSourceMLGL: typeof maplibregl__default.VectorTileSource;
type VectorTileSourceMLGL = InstanceType<typeof VectorTileSourceMLGL>;
declare const VideoSourceMLGL: typeof maplibregl__default.VideoSource;
type VideoSourceMLGL = InstanceType<typeof VideoSourceMLGL>;
declare const MapMLGL: typeof maplibregl__default.Map;
type MapMLGL = InstanceType<typeof MapMLGL>;
declare const BoxZoomHandlerMLGL: typeof maplibregl__default.BoxZoomHandler;
type BoxZoomHandlerMLGL = InstanceType<typeof BoxZoomHandlerMLGL>;
declare const ScrollZoomHandlerMLGL: typeof maplibregl__default.ScrollZoomHandler;
type ScrollZoomHandlerMLGL = InstanceType<typeof ScrollZoomHandlerMLGL>;
declare const CooperativeGesturesHandlerMLGL: typeof maplibregl__default.CooperativeGesturesHandler;
type CooperativeGesturesHandlerMLGL = InstanceType<typeof CooperativeGesturesHandlerMLGL>;
declare const KeyboardHandlerMLGL: typeof maplibregl__default.KeyboardHandler;
type KeyboardHandlerMLGL = InstanceType<typeof KeyboardHandlerMLGL>;
declare const TwoFingersTouchPitchHandlerMLGL: typeof maplibregl__default.TwoFingersTouchPitchHandler;
type TwoFingersTouchPitchHandlerMLGL = InstanceType<typeof TwoFingersTouchPitchHandlerMLGL>;
declare const MapWheelEventMLGL: typeof maplibregl__default.MapWheelEvent;
type MapWheelEventMLGL = InstanceType<typeof MapWheelEventMLGL>;
declare const MapTouchEventMLGL: typeof maplibregl__default.MapTouchEvent;
type MapTouchEventMLGL = InstanceType<typeof MapTouchEventMLGL>;
declare const MapMouseEventMLGL: typeof maplibregl__default.MapMouseEvent;
type MapMouseEventMLGL = InstanceType<typeof MapMouseEventMLGL>;

export { AJAXError, ArrayColor, ArrayColorRamp, ArrayColorRampStop, AttributionControl, AttributionControlMLGL, BoxZoomHandler, BoxZoomHandlerMLGL, CanvasSource, CanvasSourceMLGL, ColorRamp, ColorRampCollection, ColorRampOptions, ColorStop, CommonShapeLayerOptions, CooperativeGesturesHandler, CooperativeGesturesHandlerMLGL, DoubleClickZoomHandler, DragPanHandler, DragRotateHandler, EdgeInsets, Evented, FullscreenControl, FullscreenControlMLGL, GeoJSONSource, GeoJSONSourceMLGL, GeolocateControl, GeolocateControlMLGL, GeolocationType, Hash, HeatmapLayerOptions, ImageSource, ImageSourceMLGL, KeyboardHandler, KeyboardHandlerMLGL, Language, LanguageKey, LanguageString, Link, LngLat, LngLatBounds, LoadWithTerrainEvent, LogoControl, LogoControlMLGL, Map, MapMLGL, MapMouseEvent, MapMouseEventMLGL, MapOptions, MapTouchEvent, MapTouchEventMLGL, MapWheelEvent, MapWheelEventMLGL, MaptilerGeolocateControl, MaptilerLogoControl, MaptilerNavigationControl, MaptilerTerrainControl, Marker, MarkerMLGL, MercatorCoordinate, MinimapOptions, MinimapOptionsInput, NavigationControl, NavigationControlMLGL, ParentRect, PlacemarkProperties, Point, PointLayerOptions, PolygonLayerOptions, PolylineLayerOptions, Popup, PopupMLGL, PropertyValues, RasterDEMTileSource, RasterDEMTileSourceMLGL, RasterTileSource, RasterTileSourceMLGL, RgbaColor, ScaleControl, ScaleControlMLGL, ScrollZoomHandler, ScrollZoomHandlerMLGL, SdkConfig, Style, StyleMLGL, TerrainControl, TerrainControlMLGL, TwoFingersTouchPitchHandler, TwoFingersTouchPitchHandlerMLGL, TwoFingersTouchRotateHandler, TwoFingersTouchZoomHandler, TwoFingersTouchZoomRotateHandler, Unit, VectorTileSource, VectorTileSourceMLGL, VideoSource, VideoSourceMLGL, XMLProperties, ZoomNumberValues, ZoomStringValues, addProtocol, addSourceType, clearPrewarmedResources, config$1 as config, config as configMLGL, getBrowserLanguage, getMapLibreVersion, getMaxParallelImageRequests, getRTLTextPluginStatus, getVersion, getWorkerCount, getWorkerUrl, gpx, gpxOrKml, hasChildNodeWithName, helpers, importScriptInWorkers, isLanguageSupported, kml, prewarm, removeProtocol, setMaxParallelImageRequests, setRTLTextPlugin, setWorkerCount, setWorkerUrl, str2xml, xml2str };
