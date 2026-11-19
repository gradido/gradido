// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { computed, defineComponent, type PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppAvatar } from '@/components/AppAvatar'
import { AvatarCropper } from '@/components/Avatar/AvatarCropper'
import { useAppToast } from '@/composables/useToast'
import { removeUserAvatar, setUserAvatar } from '@/graphql/mutations'
import { useWalletStore } from '@/store/useWalletStore'
import IBiCameraFill from '~icons/bi/camera-fill'
import classes from './AvatarButton.module.scss'

export const AvatarButton = defineComponent({
  name: 'AvatarButton',
  props: {
    size: {
      type: Number,
      default: 61,
    },
    name: {
      type: String,
      default: '',
    },
    initials: {
      type: String,
      default: '',
    },
    // What the circle's colour hashes, handed straight to AppAvatar -- see its prop of the
    // same name. The navbar passes the real initials here and letters from the user name, so
    // a new user name leaves the colour alone. null, not '', means not given.
    colorSeed: {
      type: String as PropType<string | null>,
      default: null,
    },
    color: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const store = useWalletStore()
    const toast = useAppToast()
    const { t } = useI18n()
    const isCropperOpen = ref(false)

    const avatar = computed(() => store.avatar)
    const avatarSource = computed(() =>
      avatar.value ? `data:image/jpeg;base64,${avatar.value}` : '',
    )

    const { mutate: mutateSet } = useMutation(setUserAvatar)
    const { mutate: mutateRemove } = useMutation(removeUserAvatar)

    async function onSaved({ small, full }: { small: string; full: string }) {
      try {
        await mutateSet({ avatarSmall: small, avatarFull: full })
        // Only the small rendition goes into the store: that is what every avatar on screen
        // is drawn from. The full one is stored on the server and fetched when it is
        // actually wanted, which is the printed card and the member's own look at it.
        //
        // Written to the store only after the server accepted it, so the wallet never shows
        // a picture that is not stored.
        store.setAvatar(small)
        // No confirmation here, deliberately: the toast covered the very picture it was
        // announcing, and the avatar changing IS the confirmation. (Bernd, 25.08.2026.)
        // Removing keeps its own message -- there the picture is gone, so something has to
        // say why -- and every error message stays: those carry what cannot be seen.
      } catch (error) {
        toast.toastError((error as Error).message)
      }
    }

    async function onRemoved() {
      try {
        await mutateRemove()
        store.setAvatar(null)
        toast.toastSuccess(t('avatar.removed'))
      } catch (error) {
        toast.toastError((error as Error).message)
      }
    }

    return () => (
      <div class={classes.avatarButton}>
        <button
          type='button'
          class='avatar-button'
          style={{ width: `${props.size}px`, height: `${props.size}px` }}
          title={avatar.value ? t('avatar.change') : t('avatar.set')}
          onClick={() => {
            isCropperOpen.value = true
          }}
        >
          <AppAvatar
            size={props.size}
            name={props.name}
            initials={props.initials}
            colorSeed={props.colorSeed}
            color={props.color}
            src={avatarSource.value}
            quiet={!avatar.value}
          />
          <span class='avatar-overlay'>
            <IBiCameraFill />
          </span>
          <span class={['avatar-badge', { 'is-quiet': !avatar.value }]}>
            <IBiCameraFill />
          </span>
        </button>

        <AvatarCropper
          modelValue={isCropperOpen.value}
          onUpdate:modelValue={(open: boolean) => {
            isCropperOpen.value = open
          }}
          hasAvatar={Boolean(avatar.value)}
          onSaved={onSaved}
          onRemoved={onRemoved}
        />
      </div>
    )
  },
})
