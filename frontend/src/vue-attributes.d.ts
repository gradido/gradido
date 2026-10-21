// AI-GENERATED — not an architecture reference
import type { HTMLAttributes, ImgHTMLAttributes, InputHTMLAttributes } from 'vue'

// What a component hands on to the element it renders without declaring it (attribute
// fallthrough). A template may pass any attribute; in TSX a component's types list only its
// props. The attributes and native listeners this interface hands on that way are named here,
// and only those: an attribute that is not in the list is no prop and no HTML attribute either.
declare module 'vue' {
  interface ComponentCustomProps {
    title?: HTMLAttributes['title']
    maxlength?: InputHTMLAttributes['maxlength']
    alt?: ImgHTMLAttributes['alt']
    onClick?: HTMLAttributes['onClick']
    onSubmit?: HTMLAttributes['onSubmit']
    onReset?: HTMLAttributes['onReset']
    onKeydown?: HTMLAttributes['onKeydown']
    onChange?: HTMLAttributes['onChange']
    onFocus?: HTMLAttributes['onFocus']
    onInput?: HTMLAttributes['onInput']
  }
}
