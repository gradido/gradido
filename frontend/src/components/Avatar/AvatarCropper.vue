<!-- AI-GENERATED — not an architecture reference -->
<template>
  <AppModal v-model="isOpen" :title="hasAvatar ? $t('avatar.change') : $t('avatar.set')">
    <div v-if="!confirmRemove">
      <div
        ref="frame"
        class="avatar-frame"
        :class="{ 'is-dragging': isDragging }"
        :style="{ '--frame-size': framePx }"
        @dragover.prevent
        @drop.prevent="onDrop"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @wheel.prevent="onWheel"
      >
        <!-- The preview is drawn, not positioned with CSS. Same function as both stored
             renditions, so the three cannot disagree about which square was chosen. -->
        <canvas
          v-show="hasPicture"
          ref="preview"
          class="avatar-preview"
          :width="previewSize"
          :height="previewSize"
        ></canvas>
        <div v-if="hasPicture" class="avatar-mask"></div>
        <div v-if="!hasPicture" class="avatar-placeholder">
          <IBiImage class="avatar-placeholder-icon" />
          <div>{{ $t('avatar.pick-hint') }}</div>
        </div>
        <div v-if="loadError" class="avatar-error">{{ loadError }}</div>
      </div>

      <div class="avatar-zoom">
        <span>{{ $t('avatar.size') }}</span>
        <input
          v-model.number="zoom"
          type="range"
          min="1"
          max="4"
          step="0.01"
          :disabled="!hasPicture"
          @input="redraw(true)"
        />
      </div>

      <!-- Labels, not buttons that click a hidden input. A file field styled away with
           `hidden` (display:none) cannot be opened from script in an embedded frame or on
           some phone browsers -- the press does nothing at all, with no error. It is also
           out of the tab order, so the keyboard cannot reach it either. `visually-hidden`
           keeps the field focusable and lets the label do the opening, without script. -->
      <div class="avatar-actions">
        <input
          id="avatar-source-file"
          type="file"
          accept="image/*"
          class="visually-hidden"
          @change="onFileChosen"
        />
        <label class="btn btn-outline-success" for="avatar-source-file">
          {{ $t('avatar.choose-image') }}
        </label>

        <!-- `capture` is a hint on the field: the operating system opens its camera app,
             which brings its own front/back switch -- so one button covers both the selfie
             and being photographed by someone else. No camera API, no permission prompt
             from us; on a desktop the hint is ignored, so the whole control is hidden there
             (it would open the very same file dialog as its neighbour).
             ⛔ Field and label are hidden TOGETHER, by one wrapper. Hiding only the label
             leaves the field focusable: a keyboard user then lands on a tab stop with
             nothing visible on it. Two rules that must agree can stop agreeing; one element
             cannot. `display: contents` lets the label take part in the row as if the
             wrapper were not there. -->
        <span class="avatar-camera">
          <input
            id="avatar-source-camera"
            type="file"
            accept="image/*"
            capture="user"
            class="visually-hidden"
            @change="onFileChosen"
          />
          <label class="btn btn-outline-success" for="avatar-source-camera">
            {{ $t('avatar.take-photo') }}
          </label>
        </span>
      </div>

      <!-- A second row, and deliberately no heading over either of them: where the
           picture comes from above, what to do with it below. It appears only once there
           is a picture, so the empty state stays as quiet as it was. -->
      <div v-if="hasPicture" class="avatar-actions">
        <BButton variant="outline-secondary" @click="onRotate">
          <IBiArrowClockwise class="avatar-action-icon" />
          {{ $t('avatar.rotate') }}
        </BButton>
        <BButton
          :variant="mirrored ? 'secondary' : 'outline-secondary'"
          :aria-pressed="mirrored"
          @click="onMirror"
        >
          <IBiSymmetryVertical class="avatar-action-icon" />
          {{ $t('avatar.mirror') }}
        </BButton>
      </div>

      <div class="avatar-measure">{{ measure }}</div>
    </div>

    <div v-else class="avatar-remove-question">
      <p>{{ $t('avatar.remove-question') }}</p>
    </div>

    <template #footer>
      <template v-if="confirmRemove">
        <BButton @click="confirmRemove = false">{{ $t('form.cancel') }}</BButton>
        <BButton variant="danger" @click="onRemove">{{ $t('avatar.remove-confirm') }}</BButton>
      </template>
      <template v-else>
        <!-- Remove sits apart from the button the member actually came to press. -->
        <BButton v-if="hasAvatar" variant="outline-danger" @click="confirmRemove = true">
          {{ $t('avatar.remove') }}
        </BButton>
        <BButton @click="isOpen = false">{{ $t('form.cancel') }}</BButton>
        <BButton variant="success" :disabled="!cropped" @click="onSave">
          {{ $t('avatar.apply') }}
        </BButton>
      </template>
    </template>
  </AppModal>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/AppModal.vue'
import {
  AVATAR_FULL_SIZE,
  AVATAR_FULL_TARGET_BYTES,
  AVATAR_SMALL_SIZE,
  AVATAR_SMALL_TARGET_BYTES,
  AVATAR_SOURCE_MAX_BYTES,
  AVATAR_SOURCE_MAX_MB,
  encodeUnderTarget,
  isHeicFileName,
} from '@/utils/avatarImage'
import {
  applyCrop,
  avatarCrop,
  centeredOffsets,
  mirroredOffsetX,
  nextRotation,
} from '@/utils/avatarGeometry'

// The preview is 280 CSS pixels; the stored squares are AVATAR_FULL_SIZE and
// AVATAR_SMALL_SIZE, both drawn from this same frame.
//
// The stylesheet takes its size from here rather than repeating the number. The crop
// geometry is computed against FRAME, so a stylesheet that said something else would not
// look wrong -- it would quietly crop a different square than the member sees.
const FRAME = 280
const framePx = `${FRAME}px`

/**
 * The preview canvas measures FRAME in CSS but has to hold device pixels, or it is drawn
 * at half resolution on a retina screen -- the <img> it replaced was rendered at the
 * screen's own resolution, so anything less is a step backwards. Capped at 2: beyond that
 * the extra pixels cost more than they show.
 */
const previewSize = FRAME * Math.min(2, Math.round(window.devicePixelRatio || 1))

/**
 * The shorter edge a downscaled stand-in is built to. At zoom 1 it matches the preview
 * exactly; zoomed in it goes soft, which is why it is only used while a finger is moving.
 */
const WORKING_EDGE = previewSize

const props = defineProps({
  modelValue: Boolean,
  hasAvatar: Boolean,
})
const emits = defineEmits(['update:modelValue', 'saved', 'removed'])

const { t } = useI18n()

const isOpen = ref(props.modelValue)
watch(
  () => props.modelValue,
  (open) => {
    isOpen.value = open
    if (open) {
      reset()
    }
  },
)
watch(isOpen, (open) => emits('update:modelValue', open))

const frame = ref(null)
const preview = ref(null)

// The source lives outside the reactive state on purpose: it is a decoded bitmap that
// nothing renders directly, and making it reactive would have Vue walk it on every draw.
let sourceImage = null
/**
 * A small stand-in used only while dragging. Redrawing a 12-megapixel photo into the
 * preview on every pointer move stutters on a phone (measured by Bernd, 25.08.2026); the
 * stored renditions keep coming from the original, so nothing is lost.
 */
let workingImage = null

const hasPicture = ref(false)
// Turn and mirror. They sit here rather than in the geometry call so that the two buttons
// added next have somewhere to write; until then they never leave 0 and false, which is
// exactly what the old code did.
const rotation = ref(0)
const mirrored = ref(false)
const loadError = ref('')
const zoom = ref(1)
const measure = ref('')
const cropped = ref(null)
const confirmRemove = ref(false)

let naturalWidth = 0
let naturalHeight = 0
let offsetX = 0
let offsetY = 0
let sourceBytes = 0
let redrawTimer = null

function reset() {
  // The debounced encode outlives the picture otherwise: close the modal within the 90 ms
  // and it fires with the img element already gone, throwing inside a timer callback
  // where nothing catches it.
  clearTimeout(redrawTimer)
  sourceImage = null
  workingImage = null
  hasPicture.value = false
  loadError.value = ''
  zoom.value = 1
  previousZoom = 1
  rotation.value = 0
  mirrored.value = false
  measure.value = ''
  cropped.value = null
  confirmRemove.value = false
  sourceBytes = 0
}

/**
 * Puts the cropper into its error state. One place, because there are three ways in --
 * a file too large, a format the browser cannot open, and a dropped non-image -- and
 * each of them has to forget the SAME four things. Left to the call sites, the readout
 * of the previous picture survives next to an error about a new one.
 */
function showError(message) {
  clearTimeout(redrawTimer)
  sourceImage = null
  workingImage = null
  hasPicture.value = false
  cropped.value = null
  measure.value = ''
  sourceBytes = 0
  loadError.value = message
}

function readFile(file) {
  if (!file) {
    return
  }
  // Before readAsDataURL, not after: that call pulls the whole file into memory and the
  // decode costs several times its size again. A camera original straight off a phone is
  // the ordinary way to reach this, and on a phone it is also where it hurts.
  if (file.size > AVATAR_SOURCE_MAX_BYTES) {
    showError(t('avatar.error-too-large', { limit: AVATAR_SOURCE_MAX_MB }))
    return
  }
  sourceBytes = file.size
  const reader = new FileReader()
  reader.onload = () => loadImage(reader.result, file.name)
  reader.readAsDataURL(file)
}

function onFileChosen(event) {
  readFile(event.target.files[0])
}

function onDrop(event) {
  const file = event.dataTransfer.files[0]
  if (file?.type.startsWith('image/')) {
    readFile(file)
    return
  }
  // Same reason as the HEIC branch below: dropping a PDF used to do nothing at all --
  // no picture, no word, and no way for the member to tell whether the drop even landed.
  showError(t('avatar.error-format'))
}

function loadImage(dataUrl, fileName) {
  const probe = new Image()
  // Without this branch, choosing a HEIC on a desktop does nothing at all: no error, no
  // picture, and no way for the member to know why. iOS converts on pick, desktop
  // browsers cannot decode the format.
  probe.onerror = () => {
    showError(isHeicFileName(fileName) ? t('avatar.error-heic') : t('avatar.error-format'))
  }
  probe.onload = () => {
    sourceImage = probe
    naturalWidth = probe.naturalWidth
    naturalHeight = probe.naturalHeight
    workingImage = makeWorkingCopy(probe, naturalWidth, naturalHeight)
    zoom.value = 1
    // The offsets below are centered for zoom 1, so previousZoom has to say 1 as well.
    // It outlives the picture -- AvatarButton keeps this component mounted -- so whatever
    // the slider stood at for the previous picture would otherwise become redraw's factor
    // and pull these fresh offsets off center, in the stored JPEG as much as the preview.
    previousZoom = 1
    // ⛔ And the same reasoning for turn and mirror, which is the easier one to forget:
    // reset() only runs when the modal OPENS. Choose a second picture without closing, and
    // it would inherit the first one's rotation.
    rotation.value = 0
    mirrored.value = false
    recenter()
    loadError.value = ''
    hasPicture.value = true
    // The canvas is v-show, not v-if -- it exists before the first picture, so there is
    // nothing to wait for. (An element rendered by v-if would not be there yet.)
    nextTick(redraw)
  }
  probe.src = dataUrl
}

/**
 * The one place that asks for geometry. Every surface goes through it with its own output
 * size, which is what keeps the preview and the two stored renditions on the same square.
 */
function geometryFor(outputSize) {
  return avatarCrop({
    sourceWidth: naturalWidth,
    sourceHeight: naturalHeight,
    rotation: rotation.value,
    mirrored: mirrored.value,
    zoom: zoom.value,
    offsetX,
    offsetY,
    frame: FRAME,
    outputSize,
  })
}

function recenter() {
  const centred = centeredOffsets({
    sourceWidth: naturalWidth,
    sourceHeight: naturalHeight,
    rotation: rotation.value,
    zoom: zoom.value,
    frame: FRAME,
  })
  offsetX = centred.offsetX
  offsetY = centred.offsetY
}

/**
 * Builds the dragging stand-in. Drawn straight into its target size, like every other
 * canvas here -- painting the photo full size first is the shape that returns a black
 * image on iOS.
 *
 * Returns null when the source is already small enough to draw cheaply.
 */
function makeWorkingCopy(image, width, height) {
  const shorter = Math.min(width, height)
  if (shorter <= WORKING_EDGE) {
    return null
  }
  const scale = WORKING_EDGE / shorter
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const context = canvas.getContext('2d')
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas
}

/**
 * @param {boolean} fast draw from the stand-in. The geometry is untouched by this: the
 *   stand-in keeps the source's proportions and applyCrop is told the destination size
 *   outright, so a smaller picture lands in exactly the same square.
 */
function paintPreview(fast = false) {
  if (!sourceImage || !preview.value) {
    return
  }
  const drawFrom = fast && workingImage ? workingImage : sourceImage
  const geometry = geometryFor(previewSize)
  // Reading the clamped values back keeps the panning limits in one place -- the geometry
  // decides how far the picture may go, not the pointer handler.
  offsetX = geometry.offsetX
  offsetY = geometry.offsetY
  // No high-quality downscaling here: this repaints on every pointer move, and the frame
  // is 280 pixels. The stored renditions get it.
  applyCrop(preview.value.getContext('2d'), drawFrom, geometry, previewSize, false)
}

let previousZoom = 1

/**
 * @param {boolean} moving true while a finger or the slider is still travelling. Then the
 *   preview is drawn from the stand-in; once things go quiet the same timer that encodes
 *   also repaints it sharply, so what rests on screen is always the real thing.
 */
function redraw(moving = false) {
  if (!sourceImage) {
    return
  }
  const factor = zoom.value / previousZoom
  if (factor !== 1) {
    offsetX = FRAME / 2 - (FRAME / 2 - offsetX) * factor
    offsetY = FRAME / 2 - (FRAME / 2 - offsetY) * factor
    previousZoom = zoom.value
  }
  paintPreview(moving)
  clearTimeout(redrawTimer)
  redrawTimer = setTimeout(settle, 90)
}

function settle() {
  paintPreview()
  encode()
}

const isDragging = ref(false)
let startX = 0
let startY = 0
let startOffsetX = 0
let startOffsetY = 0

function onPointerDown(event) {
  if (!sourceImage) {
    return
  }
  isDragging.value = true
  frame.value.setPointerCapture(event.pointerId)
  startX = event.clientX
  startY = event.clientY
  startOffsetX = offsetX
  startOffsetY = offsetY
}

function onPointerMove(event) {
  if (!isDragging.value) {
    return
  }
  offsetX = startOffsetX + (event.clientX - startX)
  offsetY = startOffsetY + (event.clientY - startY)
  paintPreview(true)
  clearTimeout(redrawTimer)
  redrawTimer = setTimeout(settle, 90)
}

function onPointerUp() {
  isDragging.value = false
}

function onWheel(event) {
  if (!sourceImage) {
    return
  }
  zoom.value = Math.min(4, Math.max(1, zoom.value - event.deltaY * 0.002))
  redraw()
}

/**
 * Draws the visible square at the given output size.
 *
 * Drawing straight into the target size is what keeps this working on iOS, where canvas
 * area and total memory are capped far below a desktop. The common shape of resizing
 * libraries -- paint the photo at full size first, then scale down -- runs into that cap
 * and returns a black image without complaining. That is also why the small rendition is
 * drawn from the source rather than derived from the full one: the same trap, and the
 * source is right here anyway.
 */
function drawSquare(outputSize) {
  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize
  applyCrop(canvas.getContext('2d'), sourceImage, geometryFor(outputSize), outputSize)
  return canvas
}

/**
 * Both renditions from one crop, each stepped down in quality until it fits its own
 * budget. The member never sets a quality or picks a size; they set a picture, and both
 * sizes are guaranteed regardless of how detailed their photo is.
 *
 * One crop, two encodes -- so the two can never disagree about which square the member
 * chose.
 */
function encode() {
  // Belt to the clearTimeout in reset(): a timer can also be in flight when the picture is
  // swapped, and drawImage(null) throws where no caller is listening.
  if (!sourceImage) {
    return
  }
  const full = encodeUnderTarget(drawSquare(AVATAR_FULL_SIZE), AVATAR_FULL_TARGET_BYTES)
  const small = encodeUnderTarget(drawSquare(AVATAR_SMALL_SIZE), AVATAR_SMALL_TARGET_BYTES)

  cropped.value = { small: small.base64, full: full.base64 }
  // The sum, because that is what the upload actually costs the member.
  measure.value = t('avatar.measure', {
    source: Math.round(sourceBytes / 1024),
    result: Math.round((full.bytes + small.bytes) / 1024),
  })
}

/**
 * One button, a quarter turn clockwise, four presses back to the start -- pressing three
 * times IS the other direction, so a second button would ask for a decision nobody has.
 *
 * Size and position go back to the middle: past a quarter turn width and height have
 * swapped, and the old position means a place that no longer exists. It costs nothing in
 * practice, because turning is almost always the first thing done and framing the second.
 */
function onRotate() {
  rotation.value = nextRotation(rotation.value)
  zoom.value = 1
  previousZoom = 1
  recenter()
  redraw()
}

/**
 * Flipping leaves the visible part where it is -- without moving the offset with it, the
 * picture jumps sideways when somebody only meant to turn it over.
 *
 * ⚠️ Whether a phone stores a selfie mirrored is the phone's business, and it differs.
 * This is how a member overrules it either way, for their own face.
 */
function onMirror() {
  offsetX = mirroredOffsetX({
    sourceWidth: naturalWidth,
    sourceHeight: naturalHeight,
    rotation: rotation.value,
    zoom: zoom.value,
    offsetX,
    frame: FRAME,
  })
  mirrored.value = !mirrored.value
  redraw()
}

function onSave() {
  emits('saved', cropped.value)
  isOpen.value = false
}

function onRemove() {
  emits('removed')
  isOpen.value = false
}
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks and a double slash is not a
   comment to it -- the build fails with "Invalid empty selector". */
.avatar-frame {
  position: relative;
  width: var(--frame-size);
  height: var(--frame-size);
  margin: 0 auto 12px;
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface-muted, #f2f4f6);
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.avatar-frame.is-dragging {
  cursor: grabbing;
}

/* Sized by the element, not by its attributes: the canvas is FRAME pixels wide in its own
   coordinates, and the stylesheet must not stretch it to something else -- the crop is
   computed against FRAME, so a different display size would quietly show a different
   square than it stores. */
.avatar-preview {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.avatar-mask {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: rgb(0 0 0 / 45%);
  mask: radial-gradient(circle at 50% 50%, transparent 0 138px, #000 139px);
}

.avatar-placeholder,
.avatar-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  text-align: center;
  font-size: 14px;
  color: var(--text-muted, #6c757d);
}

.avatar-error {
  background: var(--surface-muted, #f2f4f6);
}

.avatar-placeholder-icon {
  font-size: 30px;
}

.avatar-zoom {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text-muted, #6c757d);
}

.avatar-zoom input {
  flex: 1;
  accent-color: #047006;
}

.avatar-actions {
  display: flex;
  gap: 9px;
  flex-wrap: wrap;
  margin-top: 10px;
}

/* The visible label carries the focus ring of the field it belongs to -- without this,
   a keyboard user tabs onto something invisible. */
.avatar-actions .visually-hidden:focus-visible + .btn {
  outline: 2px solid #047006;
  outline-offset: 2px;
}

/* Only where a camera app exists. `capture` is silently ignored on a desktop, where this
   would open the same dialog as "choose image" and be a second button for one thing. A
   touch laptop shows it, and there the hint may well work.

   The wrapper carries this, so the field goes with the label -- see the template. */
.avatar-camera {
  display: none;
}

@media (pointer: coarse) {
  .avatar-camera {
    display: contents;
  }
}

.avatar-action-icon {
  margin-right: 0.35rem;
  vertical-align: -0.1em;
}

.avatar-measure {
  margin-top: 10px;
  font-size: 13px;
  text-align: center;
  color: var(--text-muted, #6c757d);
  font-variant-numeric: tabular-nums;
}

.avatar-remove-question {
  text-align: center;
}
</style>
