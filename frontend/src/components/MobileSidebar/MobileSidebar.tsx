// AI-GENERATED — not an architecture reference
import { BCollapse, BImg } from 'bootstrap-vue-next'
import { lock, unlock } from 'tua-body-scroll-lock'
import { defineComponent, onUnmounted, watch } from 'vue'
import { Sidebar } from '@/components/Menu/Sidebar'
import './MobileSidebar.scss'

export const MobileSidebar = defineComponent({
  name: 'MobileSidebar',
  props: {
    /**
     * Open or shut, kept by the layout (v-model:open): the opener in the navbar has to say
     * which, and it is told the same value the drawer follows (see the note at Navbar's opener).
     */
    open: { type: Boolean, default: false },
  },
  emits: ['admin', 'logout', 'update:open'],
  setup(props, { emit }) {
    const closeMenu = () => {
      emit('update:open', false)
    }

    watch(
      () => props.open,
      (newVal) => {
        if (newVal) {
          lock()
        } else {
          unlock()
        }
      },
    )

    onUnmounted(() => {
      unlock()
    })

    return () => (
      <BCollapse
        id='sidebar-mobile'
        // What BCollapse does not declare goes on to its element, as it did from the template.
        {...{ 'sidebar-class': 'sidebar-radius', backdrop: true, 'bg-variant': 'white' }}
        {...{ 'no-header-close': '', 'skip-animation': '' }}
        horizontal
        modelValue={props.open}
        onUpdate:modelValue={(value: boolean) => emit('update:open', value)}
      >
        <div class='mobile-sidebar-wrapper py-2'>
          <BImg src='img/svg/lines.png' />
          <Sidebar
            shadow={false}
            onAdmin={() => emit('admin')}
            onCloseSidebar={closeMenu}
            onLogout={() => emit('logout')}
          />
        </div>
        <div class='simple-overlay' data-test='mobile-sidebar-overlay' onClick={closeMenu} />
      </BCollapse>
    )
  },
})
