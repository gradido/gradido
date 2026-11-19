// AI-GENERATED — not an architecture reference
import { computed, defineComponent, type PropType } from 'vue'
import classes from './SkeletonLoaderElement.module.scss'

export const SkeletonLoaderElement = defineComponent({
  name: 'SkeletonLoaderElement',
  props: {
    width: {
      type: [String, Number] as PropType<string | number>,
      default: '100%',
    },
    height: {
      type: [String, Number] as PropType<string | number>,
      default: '1rem',
    },
    disableAnimation: {
      type: Boolean,
      default: false,
    },
    fullRadius: {
      type: Boolean,
      default: false,
    },
    useGradidoRadius: {
      type: Boolean,
    },
  },
  setup(props) {
    const computedWidth = computed(() => {
      if (typeof props.width === 'number') {
        return `${props.width}px`
      }
      return props.width
    })

    const computedHeight = computed(() => {
      if (typeof props.height === 'number') {
        return `${props.height}px`
      }
      return props.height
    })

    const computedRadius = computed(() => {
      return props.fullRadius ? '100%' : props.useGradidoRadius ? '26px' : '0'
    })

    return () => (
      <div
        class={[
          'skeleton-loader my-2',
          classes['skeleton-loader'],
          { 'with-animation': !props.disableAnimation },
        ]}
        style={{
          width: computedWidth.value,
          height: computedHeight.value,
          borderRadius: computedRadius.value,
        }}
      />
    )
  },
})
