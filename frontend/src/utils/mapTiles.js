// AI-GENERATED — not an architecture reference
import { PMTiles, SharedPromiseCache } from 'pmtiles'

/**
 * The map's tile file, opened once per URL and kept for the session.
 *
 * An archive keeps the file's header and directories after reading them, so a later lookup
 * in the same region only asks for its tiles. The tiles themselves are not kept - pmtiles
 * caches none; the browser's HTTP cache may answer them. The place name of the crosshair
 * (utils/placeName) and the MapLibre map (utils/mapEngine/maplibre) read through the same
 * archive, so they share the header and the directories.
 */
const archives = new Map()

/**
 * pmtiles' shared cache, without the one thing it keeps that it must not.
 *
 * It shares a read that is still under way: a map opening cold asks for a whole view of
 * tiles at the same moment, and a lookup that finds the header or a directory being read waits
 * for that read instead of starting its own. A cache that keeps only answers
 * (ResolvedValueCache) read them once per tile - twelve cold tiles cost twelve reads of the
 * same leaf directory, 1.7 MB instead of 145 KB (measured on 15.09.2026). But pmtiles' cache
 * also keeps a read that FAILED as the answer, and every later lookup - the crosshair's name
 * and every tile of the map - would fail with it (measured on 15.09.2026). So a read that
 * fails is forgotten, and the next lookup asks again.
 *
 * A read that hangs is shared, not forgotten. The name lookup stops waiting for it after its
 * own time limit (utils/reverseGeocode); the map cancels the tiles it no longer needs, and a
 * directory read that nobody waits for any more is cancelled with them (trackSignal).
 */
class ForgetfulCache extends SharedPromiseCache {
  getHeader(source) {
    return this.forgetIfFailed(source.getKey(), () => super.getHeader(source))
  }

  getDirectory(source, offset, length, header, signal) {
    // The key pmtiles files a directory under (SharedPromiseCache.getDirectory, pmtiles 4.5).
    const key = `${source.getKey()}|${header.etag || ''}|${offset}|${length}`
    return this.forgetIfFailed(key, () =>
      super.getDirectory(source, offset, length, header, signal),
    )
  }

  /**
   * Starts the read and forgets its entry if it fails. The entry is taken the moment the read
   * starts - pmtiles files it before its first wait - and only that entry is dropped, so a
   * newer read filed under the same key by then is left alone.
   */
  forgetIfFailed(key, read) {
    const reading = read()
    const entry = this.cache.get(key)
    return reading.catch((error) => {
      if (this.cache.get(key) === entry) this.cache.delete(key)
      throw error
    })
  }
}

/**
 * The archive for this URL, opened on first use.
 *
 * @param {string} url the PMTiles file (CONFIG.MAP_TILES_URL)
 * @returns {PMTiles}
 */
export function archiveFor(url) {
  let archive = archives.get(url)
  if (!archive) {
    archive = new PMTiles(url, new ForgetfulCache())
    archives.set(url, archive)
  }
  return archive
}
