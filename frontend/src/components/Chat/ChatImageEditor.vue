<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The picture for the next message, turned, mirrored and cut before it goes (E-047; the mockup
       "Chat-Bilder bearbeiten"). The avatar's cropper is its model: the frame stands, the picture is
       moved under it and made larger with "Größe" -- here the frame is a rectangle in one of four
       shapes, and "Original" holds the whole picture.

       ⛔ A dialog STACKED on the contact window, as the large view (ChatImageView) and the file hint
       are: the window's focus trap pauses while this one is open, Esc closes this one only, and the
       focus goes back to the pencil that opened it. Dark in both modes, like the large view: a
       picture is judged on a dark ground. Full screen on a phone, a dialog at the desk. -->
  <BModal
    :model-value="modelValue"
    fullscreen="sm"
    centered
    no-header
    no-footer
    :autofocus="false"
    aria-modal="true"
    :aria-label="t('chatThread.imageEdit')"
    content-class="chat-image-editor-content"
    body-class="chat-image-editor-body"
    data-test="chat-image-editor"
    @update:model-value="onModel"
    @shown="onShown"
    @hidden="onHidden"
  >
    <div v-if="source" class="chat-image-editor">
      <div class="chat-image-editor-bar">
        <button
          type="button"
          class="chat-image-editor-cancel"
          data-test="chat-image-editor-cancel"
          @click="close"
        >
          {{ t('form.cancel') }}
        </button>
        <span class="chat-image-editor-title">{{ t('chatThread.imageEdit') }}</span>
        <button
          ref="doneButton"
          type="button"
          class="chat-image-editor-done"
          data-test="chat-image-editor-done"
          @click="done"
        >
          {{ t('chatThread.imageEditDone') }}
        </button>
      </div>

      <!-- The picture under the frame: a finger or the mouse moves it, the wheel makes it larger,
           and the arrow keys move it for whoever has the focus here. -->
      <div
        ref="stage"
        class="chat-image-editor-stage"
        :class="{ 'is-dragging': dragging }"
        tabindex="0"
        role="group"
        :aria-label="t('chatThread.imageStage')"
        data-test="chat-image-editor-stage"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @wheel.prevent="onWheel"
        @keydown="onStageKey"
      >
        <canvas
          ref="canvas"
          class="chat-image-editor-canvas"
          aria-hidden="true"
          data-test="chat-image-editor-canvas"
        />
        <div
          class="chat-image-editor-frame"
          :style="frameStyle"
          aria-hidden="true"
          data-test="chat-image-editor-frame"
        />
      </div>

      <div class="chat-image-editor-controls">
        <p class="chat-image-editor-readout" data-test="chat-image-editor-readout">
          {{ readout }}
        </p>
        <div class="chat-image-editor-shapes" role="group" :aria-label="t('chatThread.imageShape')">
          <button
            v-for="shape in SHAPES"
            :key="shape"
            type="button"
            class="chat-image-editor-shape"
            :aria-pressed="draft.shape === shape ? 'true' : 'false'"
            :data-test="`chat-image-editor-shape-${shape}`"
            @click="pickShape(shape)"
          >
            {{ shapeWords[shape] }}
          </button>
        </div>
        <label class="chat-image-editor-size">
          <span>{{ t('chatThread.imageZoom') }}</span>
          <input
            type="range"
            min="1"
            :max="CHAT_IMAGE_ZOOM_MAX"
            step="0.01"
            :value="draft.zoom"
            data-test="chat-image-editor-zoom"
            @input="onZoom"
          />
        </label>
        <div class="chat-image-editor-tools">
          <button
            type="button"
            class="chat-image-editor-tool"
            data-test="chat-image-editor-turn"
            @click="turn"
          >
            <i-bi-arrow-clockwise class="chat-image-editor-tool-icon" aria-hidden="true" />
            {{ t('chatThread.imageTurn') }}
          </button>
          <button
            type="button"
            class="chat-image-editor-tool"
            :aria-pressed="draft.mirrored ? 'true' : 'false'"
            data-test="chat-image-editor-mirror"
            @click="mirror"
          >
            <i-bi-symmetry-vertical class="chat-image-editor-tool-icon" aria-hidden="true" />
            {{ t('chatThread.imageMirror') }}
          </button>
        </div>
      </div>
    </div>
  </BModal>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { BModal } from 'bootstrap-vue-next'
import {
  CHAT_IMAGE_UNEDITED,
  CHAT_IMAGE_ZOOM_MAX,
  chatImageCut,
  chatImageCutSize,
  drawChatImageCut,
  mirrorChatImage,
  panChatImage,
  shapeChatImage,
  turnChatImage,
  zoomChatImage,
} from '@/utils/chatImageEdit'

const props = defineProps({
  /** Whether the editor is open (v-model). */
  modelValue: { type: Boolean, default: false },
  /** The picture as chosen: `{ image, width, height }` (utils/chatImage, openChatImage). */
  source: { type: Object, default: null },
  /** What was done to it so far -- the editor starts from here, and "Abbrechen" goes back to it. */
  edit: { type: Object, default: () => CHAT_IMAGE_UNEDITED },
})

const emit = defineEmits(['update:modelValue', 'done'])

const { t, n } = useI18n()

/** The four shapes, in the order the mockup shows them. */
const SHAPES = ['original', 'landscape', 'portrait', 'square']
/**
 * Each shape's word, every key written out: `no-unused-keys` sees only keys it can read, and a key
 * built from the shape's name would have to go on that rule's list of exceptions.
 */
const shapeWords = computed(() => ({
  original: t('chatThread.imageShapeOriginal'),
  landscape: t('chatThread.imageShapeLandscape'),
  portrait: t('chatThread.imageShapePortrait'),
  square: t('chatThread.imageShapeSquare'),
}))

/** The room the frame keeps from the stage's edges, in CSS pixels. */
const MARGIN = 18
/** How far one arrow key moves the picture: a twentieth of the frame's width. */
const KEY_STEP = 0.05
/** How much larger one "+" makes it. */
const KEY_ZOOM = 0.25
/** The quiet after the last move, before the stage is drawn again from the whole picture. */
const SETTLE_MS = 90
/**
 * The longer side of the copy drawn from while a finger moves. Redrawing a 12-megapixel photo on
 * every move stutters on a phone (Bernd measured it at the avatar's cropper, 25.08.2026); once the
 * finger rests, the stage is drawn from the whole picture again.
 */
const WORKING_SIDE = 1600

/** What the member is doing to the picture, until "Fertig" hands it back. */
const draft = shallowRef(CHAT_IMAGE_UNEDITED)

const stage = ref(null)
const canvas = ref(null)
const doneButton = ref(null)
/** The stage's size in CSS pixels, as measured once it is on the screen. */
const stageSize = ref({ width: 0, height: 0 })

/** Where the frame stands on the stage: as large as the room allows, in the cutout's shape. */
const frameRect = computed(() => {
  const size = stageSize.value
  if (!props.source || !size.width || !size.height) return { x: 0, y: 0, width: 0, height: 0 }
  const { aspect } = chatImageCut(props.source.width, props.source.height, draft.value)
  const roomWidth = Math.max(1, size.width - 2 * MARGIN)
  const roomHeight = Math.max(1, size.height - 2 * MARGIN)
  const width = Math.min(roomWidth, roomHeight * aspect)
  const height = width / aspect
  return { x: (size.width - width) / 2, y: (size.height - height) / 2, width, height }
})

const frameStyle = computed(() => ({
  left: `${frameRect.value.x}px`,
  top: `${frameRect.value.y}px`,
  width: `${frameRect.value.width}px`,
  height: `${frameRect.value.height}px`,
}))

/** CSS pixels on the stage per pixel of the turned picture. */
const scale = () => {
  if (!props.source) return 0
  const cut = chatImageCut(props.source.width, props.source.height, draft.value)
  return frameRect.value.width / cut.width
}

/** "Ausschnitt 2.480 × 1.653 Pixel": how much of the picture is kept. */
const readout = computed(() => {
  if (!props.source) return ''
  const size = chatImageCutSize(props.source.width, props.source.height, draft.value)
  return t('chatThread.imageCut', { width: n(size.width), height: n(size.height) })
})

/** The copy drawn from while a finger moves (see WORKING_SIDE), made when the editor opens. */
let working = null

const makeWorkingCopy = (source) => {
  const longest = Math.max(source.width, source.height)
  if (longest <= WORKING_SIDE) return null
  const shrink = WORKING_SIDE / longest
  const copy = document.createElement('canvas')
  copy.width = Math.max(1, Math.round(source.width * shrink))
  copy.height = Math.max(1, Math.round(source.height * shrink))
  const context = copy.getContext('2d')
  if (!context) return null
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(source.image, 0, 0, copy.width, copy.height)
  return copy
}

/**
 * Draws the stage: the picture with the draft, the cutout on the frame and the rest around it, at
 * the screen's own resolution (at most twice). The same drawing as the preview and the picture
 * sent (drawChatImageCut). `fast` draws from the working copy.
 */
const paint = (fast = false) => {
  const target = canvas.value
  const size = stageSize.value
  const source = props.source
  if (!target || !source || !size.width || !size.height) return
  const ratio = Math.min(2, window.devicePixelRatio || 1)
  const width = Math.round(size.width * ratio)
  const height = Math.round(size.height * ratio)
  if (target.width !== width) target.width = width
  if (target.height !== height) target.height = height
  const context = target.getContext('2d')
  if (!context) return
  context.clearRect(0, 0, width, height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = fast ? 'low' : 'high'
  const frame = frameRect.value
  drawChatImageCut(
    context,
    fast && working ? working : source.image,
    source.width,
    source.height,
    draft.value,
    {
      x: frame.x * ratio,
      y: frame.y * ratio,
      width: frame.width * ratio,
      height: frame.height * ratio,
    },
  )
}

let settleTimer = null
/**
 * Every change redraws at once from the working copy, and once things are quiet from the whole
 * picture -- what rests on the screen is always the real thing.
 */
const repaint = () => {
  paint(true)
  clearTimeout(settleTimer)
  settleTimer = setTimeout(() => paint(false), SETTLE_MS)
}
watch([draft, stageSize], repaint)

/** The stage measured, when the dialog is on the screen and whenever it changes size. */
let observer = null
const measure = () => {
  const box = stage.value
  if (!box) return
  const width = box.clientWidth
  const height = box.clientHeight
  if (width !== stageSize.value.width || height !== stageSize.value.height) {
    stageSize.value = { width, height }
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    draft.value = props.edit ?? CHAT_IMAGE_UNEDITED
    working = props.source ? makeWorkingCopy(props.source) : null
  },
  { immediate: true },
)

const onShown = async () => {
  await nextTick()
  measure()
  if (typeof ResizeObserver === 'function' && stage.value) {
    observer = new ResizeObserver(measure)
    observer.observe(stage.value)
  }
  paint(false)
  doneButton.value?.focus({ preventScroll: true })
}

const letGo = () => {
  observer?.disconnect()
  observer = null
  clearTimeout(settleTimer)
  working = null
}
const onHidden = letGo
onBeforeUnmount(letGo)

const close = () => emit('update:modelValue', false)

/** Esc, or a press beside the dialog: closed as "Abbrechen" closes it, the draft let go. */
const onModel = (value) => {
  if (!value) close()
}

/** "Fertig": what was done goes back to the bar, for the preview and for sending. */
const done = () => {
  emit('done', draft.value)
  close()
}

const pickShape = (shape) => {
  draft.value = shapeChatImage(draft.value, shape)
}
const onZoom = (event) => {
  draft.value = zoomChatImage(draft.value, event.target.value)
}
const turn = () => {
  draft.value = turnChatImage(draft.value)
}
const mirror = () => {
  draft.value = mirrorChatImage(draft.value)
}

/**
 * Moves the picture by (dx, dy) CSS pixels on the stage, as a finger would: the cutout goes the
 * other way, as far as the picture reaches.
 */
const movePicture = (from, dx, dy, by = scale()) => {
  if (!by || !props.source) return from
  return panChatImage(from, props.source.width, props.source.height, -dx / by, -dy / by)
}

const dragging = ref(false)
let drag = null

const onPointerDown = (event) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  event.currentTarget.setPointerCapture?.(event.pointerId)
  drag = { x: event.clientX, y: event.clientY, edit: draft.value, scale: scale() }
  dragging.value = true
}
const onPointerMove = (event) => {
  if (!drag) return
  draft.value = movePicture(drag.edit, event.clientX - drag.x, event.clientY - drag.y, drag.scale)
}
const onPointerUp = () => {
  drag = null
  dragging.value = false
}

/** The wheel makes the picture larger or smaller, as at the avatar's cropper. */
const onWheel = (event) => {
  draft.value = zoomChatImage(draft.value, draft.value.zoom - event.deltaY * 0.002)
}

/** The keyboard's way to what a finger does: the arrows move the picture, + and - size it. */
const onStageKey = (event) => {
  const step = frameRect.value.width * KEY_STEP
  const moves = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
  }
  if (moves[event.key]) {
    draft.value = movePicture(draft.value, ...moves[event.key])
  } else if (event.key === '+' || event.key === '=') {
    draft.value = zoomChatImage(draft.value, draft.value.zoom + KEY_ZOOM)
  } else if (event.key === '-') {
    draft.value = zoomChatImage(draft.value, draft.value.zoom - KEY_ZOOM)
  } else {
    return
  }
  event.preventDefault()
}
</script>

<style lang="scss">
/* Not scoped: the dialog's content and body are BModal's elements, which carry no scope of this
   file. As in ChatImageView, each rule names BModal's own class beside ours, and the content's goes
   higher still: dark mode sets `.dark-mode .modal-content` with `!important`. */
.modal .modal-content.chat-image-editor-content {
  border: 0;
  background-color: rgb(10 10 12) !important;
  color: #f1f0ec;
}

/* At the desk a dialog tall enough for a portrait; on a phone the sheet is the whole screen. */
@media (width >= 576px) {
  .modal .modal-content.chat-image-editor-content {
    height: min(46rem, calc(100dvh - 3.5rem));
  }
}

.modal .modal-body.chat-image-editor-body {
  display: flex;
  padding: 0;
  overflow: hidden;
}

.chat-image-editor {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.chat-image-editor-bar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 3.5rem;
  padding: 0 0.5rem;
}

.chat-image-editor-title {
  font-size: 1rem;
  font-weight: 600;
}

.chat-image-editor-cancel,
.chat-image-editor-done {
  min-height: 2.75rem;
  border: 0;
  font: inherit;
  cursor: pointer;
}

.chat-image-editor-cancel {
  padding: 0 0.75rem;
  border-radius: 0.6rem;
  background: transparent;
  color: #f1f0ec;
}

.chat-image-editor-done {
  padding: 0 1.1rem;
  border-radius: 2rem;
  background: #f1f0ec;
  color: #0a0a0c;
  font-weight: 700;
}

/* The stage: a finger moves the picture here, so the page must not scroll under it. */
.chat-image-editor-stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 12rem;
  overflow: hidden;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.chat-image-editor-stage.is-dragging {
  cursor: grabbing;
}

.chat-image-editor-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* The frame: what lies outside it is dimmed, thirds are marked inside it. */
.chat-image-editor-frame {
  position: absolute;
  box-sizing: border-box;
  border: 2px solid #f1f0ec;
  box-shadow: 0 0 0 100vmax rgb(10 10 12 / 62%);
  pointer-events: none;
  background:
    linear-gradient(
      to right,
      transparent 33.2%,
      rgb(241 240 236 / 35%) 33.2% 33.5%,
      transparent 33.5% 66.5%,
      rgb(241 240 236 / 35%) 66.5% 66.8%,
      transparent 66.8%
    ),
    linear-gradient(
      to bottom,
      transparent 33.2%,
      rgb(241 240 236 / 35%) 33.2% 33.5%,
      transparent 33.5% 66.5%,
      rgb(241 240 236 / 35%) 66.5% 66.8%,
      transparent 66.8%
    );
}

.chat-image-editor-controls {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 0.7rem;
  padding: 0.6rem 0.9rem calc(1rem + env(safe-area-inset-bottom, 0px));
}

.chat-image-editor-readout {
  margin: 0;
  color: #b9b8b2;
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.chat-image-editor-shapes {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
}

.chat-image-editor-shape {
  min-height: 2.25rem;
  padding: 0 0.85rem;
  border: 1px solid #5c5b57;
  border-radius: 2rem;
  background: transparent;
  color: #f1f0ec;
  font: inherit;
  font-size: 0.88rem;
  cursor: pointer;
}

.chat-image-editor-shape[aria-pressed='true'] {
  border-color: #f1f0ec;
  background: #f1f0ec;
  color: #0a0a0c;
  font-weight: 600;
}

/*
 * On a phone the four shapes stand in one row at 390 pixels in all ten languages -- in Russian and
 * Greek too, whose words are the longest (measured 29.09.2026: 354 of 361 pixels). Narrower still,
 * they wrap; at 320 pixels German keeps one row.
 */
@media (width < 576px) {
  .chat-image-editor-shapes {
    gap: 0.3rem;
  }

  .chat-image-editor-shape {
    padding: 0 0.45rem;
  }
}

.chat-image-editor-size {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  font-size: 0.88rem;
}

.chat-image-editor-size span {
  flex: 0 0 auto;
  color: #b9b8b2;
}

.chat-image-editor-size input {
  flex: 1 1 auto;
  accent-color: #c58d38;
}

.chat-image-editor-tools {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 0.5rem;
}

.chat-image-editor-tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  min-height: 3.5rem;
  padding: 0.3rem;
  border: 1px solid #2e2e33;
  border-radius: 0.8rem;
  background: #17171a;
  color: #f1f0ec;
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
}

.chat-image-editor-tool[aria-pressed='true'] {
  border-color: #c58d38;
  color: #f3d9a8;
}

.chat-image-editor-tool-icon {
  width: 1.35rem;
  height: 1.35rem;
}

/* The focus, on everything the keyboard reaches -- last, after the rules it adds to. */
.chat-image-editor-cancel:focus-visible,
.chat-image-editor-done:focus-visible,
.chat-image-editor-shape:focus-visible,
.chat-image-editor-tool:focus-visible,
.chat-image-editor-stage:focus-visible {
  outline: 2px solid #f1f0ec;
  outline-offset: 2px;
}
</style>
