// AI-GENERATED — not an architecture reference
import { PMTiles, ResolvedValueCache } from 'pmtiles'

/**
 * The map's tile file, opened once per URL and kept for the session.
 *
 * An archive keeps the file's header and directories after reading them, so a later lookup
 * in the same region only asks for its tiles. The tiles themselves are not kept - pmtiles
 * caches none; the browser's HTTP cache may answer them. The map (B1) is meant to read
 * through the same archive and share the header and directories with the lookups.
 *
 * It keeps only reads that came back (ResolvedValueCache). pmtiles' default cache keeps a
 * failed or a hanging read of the header or a directory as the answer, and the archive then
 * refuses or waits on every later lookup (measured, 15.09.2026). The price: two lookups at
 * the same moment do not share a read that is still under way.
 */
const archives = new Map()

/**
 * The archive for this URL, opened on first use.
 *
 * @param {string} url the PMTiles file (CONFIG.MAP_TILES_URL)
 * @returns {PMTiles}
 */
export function archiveFor(url) {
  let archive = archives.get(url)
  if (!archive) {
    archive = new PMTiles(url, new ResolvedValueCache())
    archives.set(url, archive)
  }
  return archive
}
