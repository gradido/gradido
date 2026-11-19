// AI-GENERATED — not an architecture reference
import type { HTMLAttributes, ImgHTMLAttributes, InputHTMLAttributes } from 'vue'

// What a component hands on to the element it renders without declaring it (attribute
// fallthrough). A template may pass any attribute; in TSX a component's types list only its
// props. The attributes and native listeners this interface hands on that way are named here,
// and only those: an attribute that is not in the list is no prop and no HTML attribute either.
declare module 'vue' {
  interface ComponentCustomProps {
    // A number too: Vue writes it as the attribute's text, and a row's `id` is its number.
    id?: HTMLAttributes['id'] | number
    title?: HTMLAttributes['title']
    maxlength?: InputHTMLAttributes['maxlength']
    alt?: ImgHTMLAttributes['alt']
    inert?: HTMLAttributes['inert']
    role?: HTMLAttributes['role']
    onClick?: HTMLAttributes['onClick']
    onSubmit?: HTMLAttributes['onSubmit']
    onReset?: HTMLAttributes['onReset']
    onKeydown?: HTMLAttributes['onKeydown']
    onChange?: HTMLAttributes['onChange']
    onFocus?: HTMLAttributes['onFocus']
    onBlur?: HTMLAttributes['onBlur']
    onInput?: HTMLAttributes['onInput']
    onMouseover?: HTMLAttributes['onMouseover']
    inputmode?: InputHTMLAttributes['inputmode']
    // What a form sets on ValidatedInput and LabeledInput for the field inside: neither
    // declares them, both hand them on (`textarea` and `maxRows` are LabeledInput's props,
    // reached through ValidatedInput's attributes).
    placeholder?: InputHTMLAttributes['placeholder'] | number
    type?: InputHTMLAttributes['type']
    step?: InputHTMLAttributes['step']
    readonly?: InputHTMLAttributes['readonly']
    autocomplete?: InputHTMLAttributes['autocomplete']
    trim?: string
    'no-flip'?: boolean
    textarea?: string
    maxRows?: number | string
    // The send form locks its community switch with it; the switch declares no such prop.
    disabled?: InputHTMLAttributes['disabled']
    // `v-html` on a component: the text becomes the content of the element it renders.
    innerHTML?: HTMLAttributes['innerHTML']
  }
}
