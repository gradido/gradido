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
        <img v-if="imageSrc" ref="image" class="avatar-source" :src="imageSrc" alt="" />
        <div v-if="imageSrc" class="avatar-mask"></div>
        <div v-else class="avatar-placeholder">
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
          :disabled="!imageSrc"
          @input="redraw"
        />
      </div>

      <div class="avatar-actions">
        <BButton variant="outline-success" @click="fileInput.click()">
          {{ $t('avatar.choose-image') }}
        </BButton>
        <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileChosen" />
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

// The preview is 280 CSS pixels; the stored squares are AVATAR_FULL_SIZE and
// AVATAR_SMALL_SIZE, both drawn from this same frame.
//
// The stylesheet takes its size from here rather than repeating the number. The crop
// geometry is computed against FRAME, so a stylesheet that said something else would not
// look wrong -- it would quietly crop a different square than the member sees.
const FRAME = 280
const framePx = `${FRAME}px`

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
const image = ref(null)
const fileInput = ref(null)

const imageSrc = ref('')
const loadError = ref('')
const zoom = ref(1)
const measure = ref('')
const cropped = ref(null)
const confirmRemove = ref(false)

let naturalWidth = 0
let naturalHeight = 0
let minScale = 1
let offsetX = 0
let offsetY = 0
let sourceBytes = 0
let redrawTimer = null

function reset() {
  // The debounced encode outlives the picture otherwise: close the modal within the 90 ms
  // and it fires with the img element already gone, throwing inside a timer callback
  // where nothing catches it.
  clearTimeout(redrawTimer)
  imageSrc.value = ''
  loadError.value = ''
  zoom.value = 1
  previousZoom = 1
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
  imageSrc.value = ''
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
    naturalWidth = probe.naturalWidth
    naturalHeight = probe.naturalHeight
    minScale = Math.max(FRAME / naturalWidth, FRAME / naturalHeight)
    zoom.value = 1
    // The offsets below are centered for zoom 1, so previousZoom has to say 1 as well.
    // It outlives the picture -- AvatarButton keeps this component mounted -- so whatever
    // the slider stood at for the previous picture would otherwise become redraw's factor
    // and pull these fresh offsets off center, in the stored JPEG as much as the preview.
    previousZoom = 1
    offsetX = (FRAME - naturalWidth * minScale) / 2
    offsetY = (FRAME - naturalHeight * minScale) / 2
    loadError.value = ''
    imageSrc.value = dataUrl
    // Not redraw() straight away: imageSrc was just set, and the img element it renders
    // does not exist until Vue flushes the DOM on the next tick. applyTransform() would
    // find image.value null and return without sizing anything, so the picture painted at
    // its full size in the corner of the frame -- reading as a blank surface whenever that
    // corner happened to be sky or a light wall -- until the member moved the zoom slider
    // and triggered a redraw that found the element.
    nextTick(redraw)
  }
  probe.src = dataUrl
}

function clampOffsets() {
  const scale = minScale * zoom.value
  offsetX = Math.min(0, Math.max(FRAME - naturalWidth * scale, offsetX))
  offsetY = Math.min(0, Math.max(FRAME - naturalHeight * scale, offsetY))
}

function applyTransform() {
  // Returning quietly is right -- the element is legitimately gone after a reset -- but it
  // is also how a picture can end up unsized without anything looking wrong. Every caller
  // has to be sure the element exists by the time it asks; see nextTick in loadImage.
  if (!image.value) {
    return
  }
  const scale = minScale * zoom.value
  image.value.style.width = `${naturalWidth * scale}px`
  image.value.style.height = `${naturalHeight * scale}px`
  image.value.style.left = `${offsetX}px`
  image.value.style.top = `${offsetY}px`
}

let previousZoom = 1
function redraw() {
  if (!imageSrc.value) {
    return
  }
  const factor = zoom.value / previousZoom
  if (factor !== 1) {
    offsetX = FRAME / 2 - (FRAME / 2 - offsetX) * factor
    offsetY = FRAME / 2 - (FRAME / 2 - offsetY) * factor
    previousZoom = zoom.value
  }
  clampOffsets()
  applyTransform()
  clearTimeout(redrawTimer)
  redrawTimer = setTimeout(encode, 90)
}

const isDragging = ref(false)
let startX = 0
let startY = 0
let startOffsetX = 0
let startOffsetY = 0

function onPointerDown(event) {
  if (!imageSrc.value) {
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
  clampOffsets()
  applyTransform()
  clearTimeout(redrawTimer)
  redrawTimer = setTimeout(encode, 90)
}

function onPointerUp() {
  isDragging.value = false
}

function onWheel(event) {
  if (!imageSrc.value) {
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
  const context = canvas.getContext('2d')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, outputSize, outputSize)
  context.imageSmoothingQuality = 'high'

  const ratio = outputSize / FRAME
  const scale = minScale * zoom.value
  context.drawImage(
    image.value,
    offsetX * ratio,
    offsetY * ratio,
    naturalWidth * scale * ratio,
    naturalHeight * scale * ratio,
  )
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
  if (!image.value) {
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

.avatar-source {
  position: absolute;
  transform-origin: 0 0;
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
