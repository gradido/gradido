// AI-GENERATED — not an architecture reference

/**
 * The crop geometry behind the avatar cropper: where the source picture sits inside the
 * square frame, at which size, turned and mirrored how.
 *
 * ## Why this returns numbers instead of drawing
 *
 * The preview, the 512 rendition and the 128 rendition are three surfaces that must show
 * the same square. As long as only zoom and panning existed, two separate calculations
 * (CSS for the preview, canvas for the output) happened to agree. Turning and mirroring
 * can make them disagree SILENTLY -- nothing crashes, the screen shows one face and the
 * printed card another, and it is noticed at the paper, weeks later.
 *
 * So there is one calculation and three consumers. And it hands back numbers rather than
 * painting, for a second reason that is just as practical: the frontend tests run in
 * jsdom with `vitest-canvas-mock`, which records calls but paints no pixels. A drawing
 * function could not be checked here at all -- which is why `avatarImage.spec.js` already
 * works against a stand-in canvas. Arithmetic can be checked; painting is five lines with
 * no decision left in them (`applyCrop` below).
 */

/** The turns the rotate button steps through. */
export const ROTATIONS = [0, 90, 180, 270]

/**
 * One press of the rotate button: a quarter turn clockwise, four of them back to the
 * start. One button rather than two, because pressing three times IS the other direction
 * -- a second button would ask for a decision nobody has.
 */
export function nextRotation(rotation) {
  return (rotation + 90) % 360
}

/**
 * A quarter turn swaps what the frame sees: a landscape picture becomes a portrait one.
 * Everything downstream measures against these, not against the source dimensions.
 */
function effectiveSize(sourceWidth, sourceHeight, rotation) {
  const quarterTurn = rotation === 90 || rotation === 270
  return {
    effectiveWidth: quarterTurn ? sourceHeight : sourceWidth,
    effectiveHeight: quarterTurn ? sourceWidth : sourceHeight,
  }
}

/**
 * The smallest scale that still covers the frame completely -- the same rule as CSS
 * `object-fit: cover`, which is what makes a live viewfinder and this crop agree.
 *
 * Note it does not depend on the rotation: it is always `frame / shorter edge`, and a
 * quarter turn only swaps which edge is called width.
 */
function coverScale(effectiveWidth, effectiveHeight, frame) {
  return Math.max(frame / effectiveWidth, frame / effectiveHeight)
}

/**
 * Keeps the picture over the frame. Without this the frame shows white at an edge, which
 * would be encoded into the stored JPEG rather than merely looking wrong.
 */
function clamp(offset, displayedLength, frame) {
  return Math.min(0, Math.max(frame - displayedLength, offset))
}

/**
 * The offsets that put the picture in the middle of the frame. Used when a picture is
 * first loaded and after every turn -- past a quarter turn the previous position means a
 * place that no longer exists.
 */
export function centeredOffsets({ sourceWidth, sourceHeight, rotation = 0, zoom = 1, frame }) {
  const { effectiveWidth, effectiveHeight } = effectiveSize(sourceWidth, sourceHeight, rotation)
  const scale = coverScale(effectiveWidth, effectiveHeight, frame) * zoom
  return {
    offsetX: (frame - effectiveWidth * scale) / 2,
    offsetY: (frame - effectiveHeight * scale) / 2,
  }
}

/**
 * Where the horizontal offset has to move so that mirroring leaves the VISIBLE part where
 * it is. Without it the picture jumps sideways when someone only meant to flip it.
 */
export function mirroredOffsetX({
  sourceWidth,
  sourceHeight,
  rotation = 0,
  zoom = 1,
  offsetX = 0,
  frame,
}) {
  const { effectiveWidth, effectiveHeight } = effectiveSize(sourceWidth, sourceHeight, rotation)
  const scale = coverScale(effectiveWidth, effectiveHeight, frame) * zoom
  return frame - effectiveWidth * scale - offsetX
}

/**
 * The whole geometry for one output size.
 *
 * `steps` is the transform chain as data: each entry is `[name, ...numbers]`, already in
 * the coordinates of the requested `outputSize`. Expressing it as data rather than as
 * canvas calls is what makes the chain testable where no pixels can be painted.
 *
 * The order is deliberate: move to the picture's corner in the frame, turn into the
 * rotation, then mirror the SOURCE about its own axis. Mirroring last but innermost is
 * what keeps dragging the right way round -- mirroring the finished square instead would
 * send a finger movement the wrong way.
 *
 * @param {number} outputSize edge length of the target square; defaults to the frame, so
 *   the preview can ask for the geometry without repeating the number.
 */
export function avatarCrop({
  sourceWidth,
  sourceHeight,
  rotation = 0,
  mirrored = false,
  zoom = 1,
  offsetX = 0,
  offsetY = 0,
  frame,
  outputSize,
}) {
  const size = outputSize ?? frame
  const { effectiveWidth, effectiveHeight } = effectiveSize(sourceWidth, sourceHeight, rotation)
  const minScale = coverScale(effectiveWidth, effectiveHeight, frame)
  const scale = minScale * zoom

  const clampedX = clamp(offsetX, effectiveWidth * scale, frame)
  const clampedY = clamp(offsetY, effectiveHeight * scale, frame)

  const ratio = size / frame
  const drawWidth = sourceWidth * scale * ratio
  const drawHeight = sourceHeight * scale * ratio

  const steps = [['translate', clampedX * ratio, clampedY * ratio]]
  if (rotation === 90) {
    steps.push(['translate', drawHeight, 0], ['rotate', Math.PI / 2])
  } else if (rotation === 180) {
    steps.push(['translate', drawWidth, drawHeight], ['rotate', Math.PI])
  } else if (rotation === 270) {
    steps.push(['translate', 0, drawWidth], ['rotate', -Math.PI / 2])
  }
  if (mirrored) {
    steps.push(['translate', drawWidth, 0], ['scale', -1, 1])
  }

  return {
    effectiveWidth,
    effectiveHeight,
    minScale,
    scale,
    offsetX: clampedX,
    offsetY: clampedY,
    drawWidth,
    drawHeight,
    steps,
  }
}

/**
 * Puts a geometry onto a drawing surface. Deliberately dumb: it walks the chain and
 * draws, so every decision stays in `avatarCrop` where it can be measured.
 *
 * The white fill matters -- a picture that does not fill the square would otherwise be
 * encoded with transparent corners, and JPEG turns those black.
 *
 * @param {boolean} smooth high-quality downscaling. Wanted for the stored renditions;
 *   left off for the preview, which is repainted on every pointer move.
 */
export function applyCrop(context, image, geometry, outputSize, smooth = true) {
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, outputSize, outputSize)
  context.imageSmoothingQuality = smooth ? 'high' : 'low'
  context.save()
  for (const [name, a, b] of geometry.steps) {
    if (name === 'translate') {
      context.translate(a, b)
    } else if (name === 'rotate') {
      context.rotate(a)
    } else if (name === 'scale') {
      context.scale(a, b)
    }
  }
  context.drawImage(image, 0, 0, geometry.drawWidth, geometry.drawHeight)
  context.restore()
}
