// AI-GENERATED — not an architecture reference
import { BModal } from 'bootstrap-vue-next'
import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  type PropType,
  ref,
  shallowRef,
  watch,
  withModifiers,
} from 'vue'
import { useI18n } from 'vue-i18n'
import {
  CHAT_IMAGE_CATCH_STEPS,
  CHAT_IMAGE_UNEDITED,
  CHAT_IMAGE_ZOOM_MAX,
  caughtFramedSliderSteps,
  chatImageCut,
  chatImageCutSize,
  chatImageZoomMin,
  drawChatImageCut,
  framedSliderOfZoom,
  framedSliderRange,
  mirrorChatImage,
  panChatImage,
  shapeChatImage,
  turnChatImage,
  zoomChatImage,
  zoomChatImageInFrame,
  zoomOfFramedSlider,
  zoomStoppingAtFrameFill,
} from '@/utils/chatImageEdit'
import { chatImageFile, saveChatImageFile } from '@/utils/chatImageSave'
import IBiArrowClockwise from '~icons/bi/arrow-clockwise'
import IBiSymmetryVertical from '~icons/bi/symmetry-vertical'
import IMdiTrayArrowDown from '~icons/mdi/tray-arrow-down'
import './ChatImageEditor.scss'

/** The picture as chosen (utils/chatImage, openChatImage). */
type ChatImageSource = { image: CanvasImageSource; width: number; height: number }

/**
 * What was done to a picture (utils/chatImageEdit): the chat's edit, or one with a frame of its
 * own (framedChatImageEdit) -- the frame's width to its height, and the frame's ground.
 */
type ChatImageEdit = {
  turn: number
  mirrored: boolean
  shape: string
  zoom: number
  panX: number
  panY: number
  frame?: number | null
  ground?: string
}

/**
 * The edit as utils/chatImageEdit documents its parameter: `typeof CHAT_IMAGE_UNEDITED`, which
 * TypeScript reads off the frozen constant as its literal values (`turn: 0`, `zoom: 1`). The
 * functions take every edit; the narrowing is only that reading.
 */
const documented = (edit: ChatImageEdit) => edit as unknown as typeof CHAT_IMAGE_UNEDITED

/** The four shapes, in the order the mockup shows them. */
const SHAPES = ['original', 'landscape', 'portrait', 'square'] as const

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

type Shape = (typeof SHAPES)[number]

export const ChatImageEditor = defineComponent({
  name: 'ChatImageEditor',
  props: {
    /** Whether the editor is open (v-model). */
    modelValue: { type: Boolean, default: false },
    /** The picture as chosen: `{ image, width, height }` (utils/chatImage, openChatImage). */
    source: { type: Object as PropType<ChatImageSource | null>, default: null },
    /**
     * What was done to it so far -- the editor starts from here, and "Abbrechen" goes back to it.
     * An edit with a frame of its own (framedChatImageEdit) makes this the editor of a fixed frame.
     */
    edit: { type: Object as PropType<ChatImageEdit>, default: () => CHAT_IMAGE_UNEDITED },
  },
  emits: ['update:modelValue', 'done'],
  setup(props, { emit }) {
    const { t, n } = useI18n()

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

    /** What the member is doing to the picture, until "Fertig" hands it back. */
    const draft = shallowRef<ChatImageEdit>(CHAT_IMAGE_UNEDITED)

    /**
     * Whether the picture is cut under a frame of its own: a fixed shape instead of the four to choose
     * from, on the frame's ground (utils/chatImageEdit). The edit says so, and keeps saying so through
     * every turn, mirror, size and move.
     */
    const framed = computed(() => draft.value.frame != null)

    /** The smallest size under a frame of its own: the whole picture in the frame. 1 in the chat. */
    const zoomMin = computed(() =>
      props.source ? chatImageZoomMin(props.source.width, props.source.height, draft.value) : 1,
    )

    /**
     * The slider "Größe". In the chat it runs over the size itself, from 1 to CHAT_IMAGE_ZOOM_MAX in
     * hundredths. Under a frame of its own it counts steps from "fills the frame" (framedSliderRange):
     * to the right larger, to the left smaller, down to the whole picture.
     */
    const slider = computed(() => {
      if (!framed.value) {
        return { min: 1, max: CHAT_IMAGE_ZOOM_MAX, step: 0.01, value: draft.value.zoom }
      }
      return {
        ...framedSliderRange(zoomMin.value),
        step: 1,
        value: framedSliderOfZoom(draft.value.zoom, zoomMin.value),
      }
    })

    const stage = ref<HTMLDivElement | null>(null)
    const canvas = ref<HTMLCanvasElement | null>(null)
    const doneButton = ref<HTMLButtonElement | null>(null)
    /** The stage's size in CSS pixels, as measured once it is on the screen. */
    const stageSize = ref({ width: 0, height: 0 })

    /** Where the frame stands on the stage: as large as the room allows, in the cutout's shape. */
    const frameRect = computed(() => {
      const size = stageSize.value
      if (!props.source || !size.width || !size.height) {
        return { x: 0, y: 0, width: 0, height: 0 }
      }
      const { aspect } = chatImageCut(
        props.source.width,
        props.source.height,
        documented(draft.value),
      )
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
      if (!props.source) {
        return 0
      }
      const cut = chatImageCut(props.source.width, props.source.height, documented(draft.value))
      return frameRect.value.width / cut.width
    }

    /** "Ausschnitt 2.480 × 1.653 Pixel": how much of the picture is kept. */
    const readout = computed(() => {
      if (!props.source) {
        return ''
      }
      const size = chatImageCutSize(props.source.width, props.source.height, draft.value)
      return t('chatThread.imageCut', { width: n(size.width), height: n(size.height) })
    })

    /** The copy drawn from while a finger moves (see WORKING_SIDE), made when the editor opens. */
    let working: HTMLCanvasElement | null = null

    const makeWorkingCopy = (source: ChatImageSource) => {
      const longest = Math.max(source.width, source.height)
      if (longest <= WORKING_SIDE) {
        return null
      }
      const shrink = WORKING_SIDE / longest
      const copy = document.createElement('canvas')
      copy.width = Math.max(1, Math.round(source.width * shrink))
      copy.height = Math.max(1, Math.round(source.height * shrink))
      const context = copy.getContext('2d')
      if (!context) {
        return null
      }
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
      const surface = canvas.value
      const size = stageSize.value
      const source = props.source
      if (!surface || !source || !size.width || !size.height) {
        return
      }
      const ratio = Math.min(2, window.devicePixelRatio || 1)
      const width = Math.round(size.width * ratio)
      const height = Math.round(size.height * ratio)
      if (surface.width !== width) {
        surface.width = width
      }
      if (surface.height !== height) {
        surface.height = height
      }
      const context = surface.getContext('2d')
      if (!context) {
        return
      }
      context.clearRect(0, 0, width, height)
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = fast ? 'low' : 'high'
      const frame = frameRect.value
      const target = {
        x: frame.x * ratio,
        y: frame.y * ratio,
        width: frame.width * ratio,
        height: frame.height * ratio,
      }
      // Under a frame of its own the frame stands on its ground: where the picture, made smaller,
      // does not fill it, the member sees the colour the file will have there (drawChatImage).
      if (framed.value) {
        context.fillStyle = draft.value.ground as string
        context.fillRect(target.x, target.y, target.width, target.height)
      }
      drawChatImageCut(
        context,
        fast && working ? working : source.image,
        source.width,
        source.height,
        documented(draft.value),
        target,
      )
    }

    let settleTimer: ReturnType<typeof setTimeout> | undefined
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
    let observer: ResizeObserver | null = null
    const measure = () => {
      const box = stage.value
      if (!box) {
        return
      }
      const width = box.clientWidth
      const height = box.clientHeight
      if (width !== stageSize.value.width || height !== stageSize.value.height) {
        stageSize.value = { width, height }
      }
    }

    watch(
      () => props.modelValue,
      (open) => {
        if (!open) {
          return
        }
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
    const onModel = (value: boolean) => {
      if (!value) {
        close()
      }
    }

    /** "Fertig": what was done goes back to the bar, for the preview and for sending. */
    const done = () => {
      emit('done', draft.value)
      close()
    }

    const pickShape = (shape: Shape) => {
      draft.value = shapeChatImage(draft.value, shape)
    }

    /** The picture at another size: in the chat from 1, under a frame of its own from the whole picture. */
    const sized = (zoom: number): ChatImageEdit =>
      framed.value && props.source
        ? zoomChatImageInFrame(draft.value, props.source.width, props.source.height, zoom)
        : zoomChatImage(draft.value, zoom)

    /**
     * The size a key or the wheel asks for. Under a frame of its own a step that would pass "fills the
     * frame" stops there.
     */
    const stepped = (zoom: number) =>
      sized(framed.value ? zoomStoppingAtFrameFill(draft.value.zoom, zoom) : zoom)

    /**
     * Under a frame of its own: whether the hand on the slider has been further from "fills the frame"
     * than the catch reaches since it took the slider -- only then is it caught there
     * (caughtFramedSliderSteps). Taking the slider is a press on it, and every key.
     */
    let sliderCameFromOutside = false
    const onSliderGrip = () => {
      sliderCameFromOutside = framed.value && Math.abs(slider.value.value) > CHAT_IMAGE_CATCH_STEPS
    }

    const onZoom = (event: Event) => {
      const asking = (event.target as HTMLInputElement).value
      if (!framed.value) {
        draft.value = zoomChatImage(draft.value, asking)
        return
      }
      const asked = Number(asking)
      const steps = Number.isFinite(asked) ? asked : 0
      if (Math.abs(steps) > CHAT_IMAGE_CATCH_STEPS) {
        sliderCameFromOutside = true
      }
      draft.value = sized(
        zoomOfFramedSlider(caughtFramedSliderSteps(steps, sliderCameFromOutside), zoomMin.value),
      )
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
    const movePicture = (
      from: ChatImageEdit,
      dx: number,
      dy: number,
      by = scale(),
    ): ChatImageEdit => {
      if (!by || !props.source) {
        return from
      }
      return panChatImage(from, props.source.width, props.source.height, -dx / by, -dy / by)
    }

    const dragging = ref(false)
    let drag: { x: number; y: number; edit: ChatImageEdit; scale: number } | null = null

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return
      }
      ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
      drag = { x: event.clientX, y: event.clientY, edit: draft.value, scale: scale() }
      dragging.value = true
    }
    const onPointerMove = (event: PointerEvent) => {
      if (!drag) {
        return
      }
      draft.value = movePicture(
        drag.edit,
        event.clientX - drag.x,
        event.clientY - drag.y,
        drag.scale,
      )
    }
    const onPointerUp = () => {
      drag = null
      dragging.value = false
    }

    /** The wheel makes the picture larger or smaller, as at the avatar's cropper. */
    const onWheel = (event: WheelEvent) => {
      draft.value = stepped(draft.value.zoom - event.deltaY * 0.002)
    }
    /** `@wheel.prevent`: the page does not scroll under the wheel. */
    const onWheelPrevented = withModifiers(
      (event: Event) => onWheel(event as WheelEvent),
      ['prevent'],
    )

    /** "Sichern" at work: the file is being made or handed over. */
    const saving = ref(false)
    /** How the last "Sichern" went (utils/chatImageSave), or 'failed'; null after any change. */
    const saveResult = ref<string | null>(null)
    /**
     * The file made for "Sichern", kept only where the share sheet asked for a second tap -- that tap
     * hands it over at once, without making it again.
     */
    let fileToSave: File | null = null

    /*
     * The words and the file kept for a second tap belong to the picture as the screen shows it: a
     * change lets them go, and so do another picture and every opening and closing. A new picture
     * opens with the same untouched edit, which is no change of `draft` (coderabbit, PR #4010).
     */
    watch([draft, () => props.source, () => props.modelValue], () => {
      fileToSave = null
      saveResult.value = null
    })

    const saveWords = computed(() => {
      if (saveResult.value === 'downloaded') {
        return t('chatThread.imageSaved')
      }
      if (saveResult.value === 'failed') {
        return t('chatThread.imageSaveFailed')
      }
      return ''
    })

    /**
     * The picture as it is now, in full quality, to this device (utils/chatImageSave). One at a time:
     * the button waits (`disabled`) while it saves. A change while the file is being made leaves that
     * file behind, as it shows the picture as it was (coderabbit, PR #4010).
     */
    const save = async () => {
      if (!props.source) {
        return
      }
      const source = props.source
      const edit = draft.value
      /** Whether the screen still shows the picture this file is made of. */
      const unchanged = () => props.source === source && draft.value === edit
      saving.value = true
      try {
        const file = fileToSave ?? (await chatImageFile(source, edit))
        if (!unchanged()) {
          return
        }
        const outcome = await saveChatImageFile(file)
        if (!unchanged()) {
          return
        }
        saveResult.value = outcome
        fileToSave = outcome === 'again' ? file : null
      } catch {
        if (unchanged()) {
          saveResult.value = 'failed'
        }
        fileToSave = null
      } finally {
        saving.value = false
      }
    }

    /** The keyboard's way to what a finger does: the arrows move the picture, + and - size it. */
    const onStageKey = (event: KeyboardEvent) => {
      const step = frameRect.value.width * KEY_STEP
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      }
      if (moves[event.key]) {
        draft.value = movePicture(draft.value, ...moves[event.key])
      } else if (event.key === '+' || event.key === '=') {
        draft.value = stepped(draft.value.zoom + KEY_ZOOM)
      } else if (event.key === '-') {
        draft.value = stepped(draft.value.zoom - KEY_ZOOM)
      } else {
        return
      }
      event.preventDefault()
    }

    return () => (
      // The picture for the next message, turned, mirrored and cut before it goes (E-047; the mockup
      // "Chat-Bilder bearbeiten"). The avatar's cropper is its model: the frame stands, the picture is
      // moved under it and made larger with "Größe" -- here the frame is a rectangle in one of four
      // shapes, and "Original" holds the whole picture.
      //
      // The same editor cuts a picture for a place of a FIXED shape -- the card of a thank-you
      // greeting (ZE-024) --, told so by the edit it is handed: one with a frame of its own
      // (framedChatImageEdit). Then there is no choice of shapes, no "Sichern" and no readout, and
      // "Größe" also makes the picture SMALLER than the frame, down to where the whole of it stands
      // in the frame, on the frame's ground. ⛔ With an edit of the chat's, nothing here differs from
      // what it was: every such difference hangs on `framed`.
      //
      // ⛔ A dialog STACKED on the contact window, as the large view (ChatImageView) and the file hint
      // are: the window's focus trap pauses while this one is open, Esc closes this one only, and the
      // focus goes back to the pencil that opened it. Dark in both modes, like the large view: a
      // picture is judged on a dark ground. Full screen on a phone, a dialog at the desk.
      <BModal
        modelValue={props.modelValue}
        fullscreen='sm'
        centered
        no-header
        no-footer
        autofocus={false}
        aria-modal='true'
        aria-label={t('chatThread.imageEdit')}
        content-class='chat-image-editor-content'
        body-class='chat-image-editor-body'
        data-test='chat-image-editor'
        onUpdate:modelValue={onModel}
        onShown={onShown}
        onHidden={onHidden}
      >
        {props.source ? (
          <div class='chat-image-editor'>
            <div class='chat-image-editor-bar'>
              <button
                type='button'
                class='chat-image-editor-cancel'
                data-test='chat-image-editor-cancel'
                onClick={close}
              >
                {t('form.cancel')}
              </button>
              <span class='chat-image-editor-title'>{t('chatThread.imageEdit')}</span>
              <button
                ref={doneButton}
                type='button'
                class='chat-image-editor-done'
                data-test='chat-image-editor-done'
                onClick={done}
              >
                {t('chatThread.imageEditDone')}
              </button>
            </div>

            {/* The picture under the frame: a finger or the mouse moves it, the wheel makes it larger,
                and the arrow keys move it for whoever has the focus here. */}
            <div
              ref={stage}
              class={['chat-image-editor-stage', { 'is-dragging': dragging.value }]}
              tabindex='0'
              role='group'
              aria-label={t('chatThread.imageStage')}
              data-test='chat-image-editor-stage'
              onPointerdown={onPointerDown}
              onPointermove={onPointerMove}
              onPointerup={onPointerUp}
              onPointercancel={onPointerUp}
              onWheel={onWheelPrevented}
              onKeydown={onStageKey}
            >
              <canvas
                ref={canvas}
                class='chat-image-editor-canvas'
                aria-hidden='true'
                data-test='chat-image-editor-canvas'
              />
              <div
                class='chat-image-editor-frame'
                style={frameStyle.value}
                aria-hidden='true'
                data-test='chat-image-editor-frame'
              />
            </div>

            <div class='chat-image-editor-controls'>
              {/* The cutout's size, and in its place how "Sichern" went while there is something to say:
                  saved as a download, or not at all (after the share sheet the sheet was the answer).
                  One line for both, so the stage keeps its size and the picture stays under the finger;
                  the status is always in the page, so a screen reader hears it when it speaks. */}
              {!framed.value ? (
                <div class='chat-image-editor-lines'>
                  <p
                    class={['chat-image-editor-readout', { 'is-quiet': !!saveWords.value }]}
                    data-test='chat-image-editor-readout'
                  >
                    {readout.value}
                  </p>
                  <p
                    class='chat-image-editor-saved'
                    role='status'
                    data-test='chat-image-editor-saved'
                  >
                    {saveWords.value}
                  </p>
                </div>
              ) : null}
              {!framed.value ? (
                <div
                  class='chat-image-editor-shapes'
                  role='group'
                  aria-label={t('chatThread.imageShape')}
                >
                  {SHAPES.map((shape) => (
                    <button
                      key={shape}
                      type='button'
                      class='chat-image-editor-shape'
                      aria-pressed={draft.value.shape === shape ? 'true' : 'false'}
                      data-test={`chat-image-editor-shape-${shape}`}
                      onClick={() => pickShape(shape)}
                    >
                      {shapeWords.value[shape]}
                    </button>
                  ))}
                </div>
              ) : null}
              <label class='chat-image-editor-size'>
                <span>{t('chatThread.imageZoom')}</span>
                {/* Under a frame of its own the slider counts steps from "fills the frame", and catches
                    there (see `slider`); `value` stands last, after the ends it is held within. */}
                <input
                  type='range'
                  min={slider.value.min}
                  max={slider.value.max}
                  step={slider.value.step}
                  value={slider.value.value}
                  data-test='chat-image-editor-zoom'
                  onPointerdown={onSliderGrip}
                  onKeydown={onSliderGrip}
                  onInput={onZoom}
                />
              </label>
              <div class='chat-image-editor-tools'>
                <button
                  type='button'
                  class='chat-image-editor-tool'
                  data-test='chat-image-editor-turn'
                  onClick={turn}
                >
                  <IBiArrowClockwise class='chat-image-editor-tool-icon' aria-hidden='true' />
                  {t('chatThread.imageTurn')}
                </button>
                <button
                  type='button'
                  class='chat-image-editor-tool'
                  aria-pressed={draft.value.mirrored ? 'true' : 'false'}
                  data-test='chat-image-editor-mirror'
                  onClick={mirror}
                >
                  <IBiSymmetryVertical class='chat-image-editor-tool-icon' aria-hidden='true' />
                  {t('chatThread.imageMirror')}
                </button>
                {/* "Sichern" (E-047, point 5): the edited picture in full quality on this device. */}
                {!framed.value ? (
                  <button
                    type='button'
                    class='chat-image-editor-tool'
                    disabled={saving.value}
                    data-test='chat-image-editor-save'
                    onClick={save}
                  >
                    <IMdiTrayArrowDown class='chat-image-editor-tool-icon' aria-hidden='true' />
                    {saveResult.value === 'again'
                      ? t('chatThread.imageSaveAgain')
                      : t('chatThread.imageSave')}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </BModal>
    )
  },
})
