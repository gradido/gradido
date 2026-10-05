// AI-GENERATED — not an architecture reference
import { reencodeImage } from 'shared-native'

/* MIGRATION TO decode every stored avatar and encode its pixels again */

// Since this migration, setUserAvatar stores no picture as it came: both renditions are decoded
// under hard limits and encoded again, so that what other members and other communities are
// handed was written by this server from pixels alone -- no EXIF, no comment, no bytes behind
// the end marker. The rows from before were only checked to begin and end as a JPEG. This
// brings them to the same state.
//
// Frozen copy of the rules as they were when this migration was written, so a later change in
// `shared` or `core` cannot change or break it. Only the decoder and encoder are imported
// (rust-image-ffi in shared-native): they cannot be rebuilt here.
const SMALL = { column: 'avatar_small', maxBytes: 10 * 1024, maxSide: 128 }
const FULL = { column: 'avatar_full', maxBytes: 60 * 1024, maxSide: 512 }

// The steps setUserAvatar takes, the first that fits the bytes wins -- and three more below
// them. A new picture that does not fit at 45 is refused, and the member picks another; a
// member who set their picture long ago is not to lose it over a few bytes, so here it is
// encoded coarser instead. A picture is never encoded above the quality it came in with, so
// one from the wallet comes out at its own quality and size in the first pass.
const QUALITY_STEPS = [85, 75, 65, 55, 45, 35, 25, 15]

// Not 500: a row carries up to 70 KB, and the rows of a batch are written back in ONE statement.
// 50 of them stay under 4 MB, well below the server's max_allowed_packet (16 MB by default).
const BATCH_SIZE = 50

type QueryFn = (query: string, values?: any[]) => Promise<Array<any>>
type Rendition = typeof SMALL

/**
 * What became of a rendition:
 *
 * - `encoded`: the picture, encoded again within the rendition's bounds.
 * - `noPicture`: the decoder's verdict on the file -- it is not a JPEG, does not decode, or has
 *   more pixels than the rendition may have. setUserAvatar refuses the same file today.
 * - `failed`: no verdict on the file. The work itself went wrong -- no memory, the encoder, a
 *   panic in the decoder, an exception of the binding. That says nothing about the picture.
 */
type Reencoded =
  | { outcome: 'encoded'; data: Buffer }
  | { outcome: 'noPicture' }
  | { outcome: 'failed'; why: string }

/** The decoder's answers that are a verdict on the file; every other one is a failure of the work. */
const NO_PICTURE = ['RIMG_ERR_UNSUPPORTED', 'RIMG_ERR_DECODE', 'RIMG_ERR_LIMIT']

async function reencoded(image: Buffer, { maxBytes, maxSide }: Rendition): Promise<Reencoded> {
  // The quality the last pass encoded at; a step that is not below it would encode the same again.
  let encodedAt = Number.POSITIVE_INFINITY
  // ⛔ Caught here, for one picture: an exception must neither end the migration over one row
  // nor be read as "no picture", which takes a member's picture away.
  try {
    for (const jpegQuality of QUALITY_STEPS) {
      if (jpegQuality >= encodedAt) {
        continue
      }
      const result = await reencodeImage(image, {
        maxOutputBytes: maxBytes,
        maxWidth: maxSide,
        maxHeight: maxSide,
        maxPixels: maxSide * maxSide,
        jpegQuality,
      })
      if (result.success) {
        return { outcome: 'encoded', data: result.value.data }
      }
      const { name } = result.error
      // Only a picture over the byte bound gets better at a lower quality.
      if (name !== 'RIMG_ERR_BUFFER_TOO_SMALL') {
        return NO_PICTURE.includes(name)
          ? { outcome: 'noPicture' }
          : { outcome: 'failed', why: name }
      }
      // 0 is a quality nobody could read from the picture; the step was used as it is then.
      encodedAt = Math.min(jpegQuality, result.error.inputJpegQuality || jpegQuality)
    }
  } catch (error) {
    // The name of the error, never its message: nothing of a picture goes into the log.
    return { outcome: 'failed', why: error instanceof Error ? error.name : 'exception' }
  }
  // Too many bytes even at the lowest step: a picture, and one this migration could not bring
  // within the bounds. It stays as it is rather than being taken away.
  return { outcome: 'failed', why: 'RIMG_ERR_BUFFER_TOO_SMALL' }
}

export async function upgrade(queryFn: QueryFn) {
  let lastUserId = 0
  let seen = 0
  let rewritten = 0
  const removed: number[] = []
  const leftAsItWas: string[] = []

  for (;;) {
    // By the primary key, so that a page is found without counting the ones before it.
    const rows: { user_id: number; avatar_small: Buffer; avatar_full: Buffer }[] = await queryFn(
      `SELECT user_id, avatar_small, avatar_full
         FROM user_avatars
        WHERE user_id > ?
        ORDER BY user_id ASC
        LIMIT ${BATCH_SIZE}`,
      [lastUserId],
    )
    if (rows.length === 0) {
      break
    }
    lastUserId = rows[rows.length - 1].user_id
    seen += rows.length

    // The pictures of a page at the same time: the work runs on the thread pool.
    const encoded = await Promise.all(
      rows.map(async (row) => ({
        userId: row.user_id,
        small: await reencoded(row.avatar_small, SMALL),
        full: await reencoded(row.avatar_full, FULL),
        was: row,
      })),
    )

    const toWrite: { userId: number; small: Buffer; full: Buffer }[] = []
    const toRemove: number[] = []
    for (const { userId, small, full, was } of encoded) {
      // ⛔ Asked first: where the work failed on either rendition, BOTH stay as they are. The
      // row is neither written nor removed, and the rest of the page goes on.
      const failure = small.outcome === 'failed' ? small : full.outcome === 'failed' ? full : null
      if (failure) {
        leftAsItWas.push(`${userId} (${failure.why})`)
        continue
      }
      // ⛔ The two renditions belong together: where one of them is no picture this server
      // would take today, the member has no picture -- as after removeUserAvatar. Nothing a
      // browser could show is lost by that for a file that does not decode; a picture with
      // more pixels than a rendition may have never came from the wallet.
      if (small.outcome !== 'encoded' || full.outcome !== 'encoded') {
        toRemove.push(userId)
      } else if (!small.data.equals(was.avatar_small) || !full.data.equals(was.avatar_full)) {
        toWrite.push({ userId, small: small.data, full: full.data })
      }
    }

    if (toWrite.length) {
      // ⛔ `updated_at` stays as it is, and the statement names no other column on purpose:
      // the date is what tells every wallet and every other community that a member has a NEW
      // picture. These are the same pixels; moving the date would make all of them fetch
      // every picture of the community again.
      await queryFn(
        `UPDATE user_avatars
            SET avatar_small = CASE user_id ${toWrite.map(() => 'WHEN ? THEN ?').join(' ')} END,
                avatar_full = CASE user_id ${toWrite.map(() => 'WHEN ? THEN ?').join(' ')} END
          WHERE user_id IN (${toWrite.map(() => '?').join(', ')})`,
        [
          ...toWrite.flatMap((row) => [row.userId, row.small]),
          ...toWrite.flatMap((row) => [row.userId, row.full]),
          ...toWrite.map((row) => row.userId),
        ],
      )
      rewritten += toWrite.length
    }
    if (toRemove.length) {
      await queryFn(
        `DELETE FROM user_avatars WHERE user_id IN (${toRemove.map(() => '?').join(', ')})`,
        toRemove,
      )
      removed.push(...toRemove)
    }
    process.stdout.write(`Re-encoding avatars: ${seen}\r`)
  }

  process.stdout.write(
    `Re-encoded avatars: ${seen} seen, ${rewritten} rewritten, ${removed.length} removed, ${leftAsItWas.length} left as they were\n`,
  )
  if (leftAsItWas.length) {
    // ⛔ These are still the files members sent, not pictures this server encoded: whoever runs
    // the migration has to look at them. The ids and the reason, never a picture.
    process.stdout.write(`Avatars NOT re-encoded, the work failed: ${leftAsItWas.join(', ')}\n`)
  }
  if (removed.length) {
    // The ids, never a picture: whoever runs the migration can tell these members.
    process.stdout.write(`Avatars removed, no picture this server takes: ${removed.join(', ')}\n`)
  }
}

export async function downgrade(_queryFn: QueryFn) {
  // Nothing to take back: the pictures as they came are gone, and the ones stored now are
  // pictures the code before this migration serves just as well.
}
