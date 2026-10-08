// AI-GENERATED — not an architecture reference
import { reencodeImage } from 'shared-native'

/* MIGRATION TO decode every stored chat picture and encode its pixels again */

// Since this migration no chat picture is stored as it came: one a member of this community
// sends and one a message brings from another community are both decoded under hard limits and
// encoded again, so that what a conversation's members are handed was written by this server
// from pixels alone -- no EXIF, no comment, no bytes behind the end marker. The rows from before
// were only checked to begin and end as a JPEG, and their size was the sender's word. This
// brings them to the same state, as 0155 did for the avatars.
//
// Frozen copy of the rules as they were when this migration was written, so a later change in
// `shared` or `core` cannot change or break it. Only the decoder and encoder are imported
// (rust-image-ffi in shared-native): they cannot be rebuilt here.
const MAX_BYTES = 35 * 1024
const MAX_SIDE = 4096
const MAX_PIXELS = 500_000

// The steps a new chat picture is taken in at, the first that fits the bytes wins -- and three
// more below them, as in 0155. A new picture that does not fit at 45 is refused, and the member
// picks another; a picture that has been in a conversation for weeks is not to go over a few
// bytes, so here it is encoded coarser instead. A picture is never encoded above the quality it
// came in with, so one from the wallet comes out at its own quality and size in the first pass.
const QUALITY_STEPS = [85, 75, 65, 55, 45, 35, 25, 15]

// Not 500: a row carries up to 35 KB, and the rows of a batch are written back in ONE statement.
// 50 of them stay under 2 MB, well below the server's max_allowed_packet (16 MB by default).
const BATCH_SIZE = 50

type QueryFn = (query: string, values?: any[]) => Promise<Array<any>>

interface Row {
  id: number
  image_uuid: string
  message_uuid: string
  width: number
  height: number
  image: Buffer
}

/**
 * What became of a picture:
 *
 * - `encoded`: the picture, encoded again within the bounds, and the size the decoder found.
 * - `noPicture`: the decoder's verdict on the file -- it is not a JPEG, does not decode, or is
 *   wider, higher or larger than a chat picture may be. The server refuses the same file today.
 * - `failed`: no verdict on the file. The work itself went wrong -- no memory, the encoder, a
 *   panic in the decoder, an exception of the binding. That says nothing about the picture.
 */
type Reencoded =
  | { outcome: 'encoded'; data: Buffer; width: number; height: number }
  | { outcome: 'noPicture' }
  | { outcome: 'failed'; why: string }

/** The decoder's answers that are a verdict on the file; every other one is a failure of the work. */
const NO_PICTURE = ['RIMG_ERR_UNSUPPORTED', 'RIMG_ERR_DECODE', 'RIMG_ERR_LIMIT']

async function reencoded(image: Buffer): Promise<Reencoded> {
  // The quality the last pass encoded at; a step that is not below it would encode the same again.
  let encodedAt = Number.POSITIVE_INFINITY
  // ⛔ Caught here, for one picture: an exception must neither end the migration over one row
  // nor be read as "no picture", which takes a picture out of a conversation.
  try {
    for (const jpegQuality of QUALITY_STEPS) {
      if (jpegQuality >= encodedAt) {
        continue
      }
      const result = await reencodeImage(image, {
        maxOutputBytes: MAX_BYTES,
        maxWidth: MAX_SIDE,
        maxHeight: MAX_SIDE,
        maxPixels: MAX_PIXELS,
        jpegQuality,
      })
      if (result.success) {
        const { data, width, height } = result.value
        return { outcome: 'encoded', data, width, height }
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
  let lastId = 0
  let seen = 0
  let rewritten = 0
  const removed: string[] = []
  const leftAsItWas: string[] = []

  for (;;) {
    // By the primary key, so that a page is found without counting the ones before it.
    const rows: Row[] = await queryFn(
      `SELECT id, image_uuid, message_uuid, width, height, image
         FROM chat_message_images
        WHERE id > ?
        ORDER BY id ASC
        LIMIT ${BATCH_SIZE}`,
      [lastId],
    )
    if (rows.length === 0) {
      break
    }
    lastId = rows[rows.length - 1].id
    seen += rows.length

    // The pictures of a page at the same time: the work runs on the thread pool.
    const encoded = await Promise.all(
      rows.map(async (row) => ({ now: await reencoded(row.image), was: row })),
    )

    const toWrite: { id: number; image: Buffer; width: number; height: number }[] = []
    const toRemove: number[] = []
    for (const { now, was } of encoded) {
      if (now.outcome === 'failed') {
        // ⛔ Neither written nor removed, and the rest of the page goes on.
        leftAsItWas.push(`${was.image_uuid} (${now.why})`)
      } else if (now.outcome === 'noPicture') {
        // ⛔ The picture goes, its message stays: the row here is all that names the picture,
        // and a message without one is read as any message is. Nothing a browser could show is
        // lost by that for a file that does not decode; a picture with more pixels than a chat
        // picture may have never came from the wallet.
        toRemove.push(was.id)
        removed.push(`${was.image_uuid} (message ${was.message_uuid})`)
      } else if (
        !now.data.equals(was.image) ||
        now.width !== was.width ||
        now.height !== was.height
      ) {
        // The size as well: what was stored is what the sender said, and the bubble takes its
        // room from it. From here on it is what the decoder found.
        toWrite.push({ id: was.id, image: now.data, width: now.width, height: now.height })
      }
    }

    if (toWrite.length) {
      // ⛔ `image_uuid` and `created_at` stay as they are, and the statement names no other
      // column on purpose: the uuid is what the wallet fetches the picture by and what names it
      // on both servers.
      const cases = toWrite.map(() => 'WHEN ? THEN ?').join(' ')
      await queryFn(
        `UPDATE chat_message_images
            SET image = CASE id ${cases} END,
                width = CASE id ${cases} END,
                height = CASE id ${cases} END
          WHERE id IN (${toWrite.map(() => '?').join(', ')})`,
        [
          ...toWrite.flatMap((row) => [row.id, row.image]),
          ...toWrite.flatMap((row) => [row.id, row.width]),
          ...toWrite.flatMap((row) => [row.id, row.height]),
          ...toWrite.map((row) => row.id),
        ],
      )
      rewritten += toWrite.length
    }
    if (toRemove.length) {
      await queryFn(
        `DELETE FROM chat_message_images WHERE id IN (${toRemove.map(() => '?').join(', ')})`,
        toRemove,
      )
    }
    process.stdout.write(`Re-encoding chat pictures: ${seen}\r`)
  }

  process.stdout.write(
    `Re-encoded chat pictures: ${seen} seen, ${rewritten} rewritten, ${removed.length} removed, ${leftAsItWas.length} left as they were\n`,
  )
  if (leftAsItWas.length) {
    // ⛔ These are still the files that were sent, not pictures this server encoded: whoever runs
    // the migration has to look at them. The uuids and the reason, never a picture.
    process.stdout.write(
      `Chat pictures NOT re-encoded, the work failed: ${leftAsItWas.join(', ')}\n`,
    )
  }
  if (removed.length) {
    // The uuids, never a picture: whoever runs the migration can find the messages by them.
    process.stdout.write(
      `Chat pictures removed, no picture this server takes: ${removed.join(', ')}\n`,
    )
  }
}

export async function downgrade(_queryFn: QueryFn) {
  // Nothing to take back: the pictures as they came are gone, and the ones stored now are
  // pictures the code before this migration serves just as well.
}
