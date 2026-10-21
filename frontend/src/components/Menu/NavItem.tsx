// AI-GENERATED — not an architecture reference
import { BNavItem } from 'bootstrap-vue-next'
import { defineComponent, type PropType } from 'vue'
import { RouterLink, type RouterLinkProps, useLink } from 'vue-router'

// RouterLink's own runtime props, taken over as they are. Its types do not list `props`, so
// they are named here as RouterLinkProps describes them.
const routerLinkProps = (
  RouterLink as unknown as {
    props: {
      to: { type: PropType<RouterLinkProps['to']>; required: true }
      replace: PropType<RouterLinkProps['replace']>
      custom: PropType<RouterLinkProps['custom']>
      activeClass: PropType<RouterLinkProps['activeClass']>
      exactActiveClass: PropType<RouterLinkProps['exactActiveClass']>
      ariaCurrentValue: PropType<RouterLinkProps['ariaCurrentValue']>
    }
  }
).props

export const NavItem = defineComponent({
  name: 'NavItem',
  props: {
    ...routerLinkProps,
  },
  setup(props, { slots }) {
    const { isActive } = useLink(props)

    return () => (
      <li class={['nav-item', { active: isActive.value }]}>
        {isActive.value ? (
          <span class='nav-link active' aria-current='page'>
            {slots.default?.()}
          </span>
        ) : (
          <BNavItem {...props} class='auth-navbar'>
            {slots.default?.()}
          </BNavItem>
        )}
      </li>
    )
  },
})
