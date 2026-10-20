// AI-GENERATED — not an architecture reference
import { defineComponent, ref } from 'vue'
import IBiCheck from '~icons/bi/check'
import IBiPersonFill from '~icons/bi/person-fill'
import IBiXCircle from '~icons/bi/x-circle'
import classes from './VariantIcon.module.css'

export const VariantIcon = defineComponent({
  name: 'VariantIcon',
  props: {
    icon: { type: String, default: '' },
    variant: { type: String, default: 'success' },
  },
  setup(props) {
    // ⚠️ The closing parenthesis is missing, as it always was; a browser closes the function
    // itself, so the icon still shows in the variant's colour.
    const color = ref(`var(--bs-${props.variant}`)

    // What `v-bind('color')` in a scoped style did: the colour as a CSS variable on the icon,
    // read by its class.
    const style = () => ({ '--icon-variant-color': color.value })

    return () => (
      <>
        {props.icon === 'check' ? <IBiCheck class={classes.iconVariant} style={style()} /> : null}
        {props.icon === 'x-circle' ? (
          <IBiXCircle class={classes.iconVariant} style={style()} />
        ) : null}
        {props.icon === 'person-fill' ? (
          <IBiPersonFill class={classes.iconVariant} style={style()} />
        ) : null}
      </>
    )
  },
})
