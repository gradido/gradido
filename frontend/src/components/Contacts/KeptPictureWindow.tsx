// AI-GENERATED — not an architecture reference
/**
 * The member's own picture of a contact (AS-023), opened from the contact window: the cropper over
 * that window, titled "Dein Bild von …", with the line that only the member sees it. Where there is
 * a picture already -- the member's, the contact's own, or both -- the two stand above the frame,
 * each named for whose it is.
 *
 * Saving and taking away go to the server first (useKeptPictures): the wallet never shows a
 * picture that is not stored. As with the member's own picture, setting one says nothing -- the
 * circle changing is the answer -- and taking one away says so, since the picture is gone.
 */
import { useApolloClient } from '@vue/apollo-composable'
import { computed, defineComponent, type PropType, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppAvatar from '@/components/AppAvatar.vue'
import AvatarCropper from '@/components/Avatar/AvatarCropper.vue'
import type { ContactUser } from '@/components/Contacts/contactDisplay'
import {
  ensureKeptPictures,
  hasKeptPicture,
  KEPT_PICTURES_MAX_PER_MEMBER,
  keptPictureSource,
  removeKeptPicture,
  setKeptPicture,
} from '@/composables/useKeptPictures'
import { memberAvatarProps, memberOwnAvatarSource } from '@/composables/useMemberAvatars'
import { useAppToast } from '@/composables/useToast'
import classes from './KeptPictureWindow.module.scss'

/** What the server says where the member keeps pictures of as many people as they may. */
const FULL = 'KEPT_PICTURES_FULL'

export const KeptPictureWindow = defineComponent({
  name: 'KeptPictureWindow',
  props: {
    modelValue: { type: Boolean, default: false },
    /** The contact the picture is of. */
    member: { type: Object as PropType<ContactUser | null>, default: null },
    /** The name the window shows for them. */
    name: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const { client } = useApolloClient()
    const { toastSuccess, toastError } = useAppToast()

    const mine = computed(() => (props.member ? keptPictureSource(props.member) : null))
    const theirs = computed(() => (props.member ? memberOwnAvatarSource(props.member) : ''))
    const hasMine = computed(() => Boolean(props.member && hasKeptPicture(props.member)))
    const letters = computed(() => (props.member ? memberAvatarProps({ ...props.member }) : {}))

    // The retry where the layout's request failed; nothing once the pictures are here.
    watch(
      () => props.modelValue,
      (open) => {
        if (open) {
          ensureKeptPictures(client)
        }
      },
      { immediate: true },
    )

    const saved = async (cropped: { small: string; full: string }) => {
      if (!props.member) {
        return
      }
      try {
        await setKeptPicture(client, props.member, cropped)
      } catch (error) {
        toastError(
          String((error as Error)?.message ?? '').includes(FULL)
            ? t('keptPicture.full', { max: KEPT_PICTURES_MAX_PER_MEMBER })
            : t('keptPicture.failed'),
        )
      }
    }

    const removed = async () => {
      if (!props.member) {
        return
      }
      try {
        await removeKeptPicture(client, props.member)
        toastSuccess(t('keptPicture.removed', { name: props.name }))
      } catch {
        toastError(t('keptPicture.failed'))
      }
    }

    return () => (
      <AvatarCropper
        stacked
        modelValue={props.modelValue}
        hasAvatar={hasMine.value}
        title={t('keptPicture.title', { name: props.name })}
        note={t('keptPicture.private')}
        removeLabel={t('keptPicture.remove')}
        removeQuestion={
          theirs.value
            ? t('keptPicture.remove-question-theirs', { name: props.name })
            : t('keptPicture.remove-question-letters', { name: props.name })
        }
        onUpdate:modelValue={(open: boolean) => emit('update:modelValue', open)}
        onSaved={saved}
        onRemoved={removed}
      >
        {{
          pictures: () =>
            hasMine.value || theirs.value ? (
              <div class={['kept-picture-both', classes['kept-picture-both']]}>
                {hasMine.value ? (
                  <figure
                    class={['kept-picture-one', classes['kept-picture-one']]}
                    data-test='kept-picture-mine'
                  >
                    <AppAvatar size={72} color='#fff' {...letters.value} src={mine.value ?? ''} />
                    <figcaption>{t('keptPicture.mine')}</figcaption>
                  </figure>
                ) : null}
                {theirs.value ? (
                  <figure
                    class={['kept-picture-one', classes['kept-picture-one']]}
                    data-test='kept-picture-theirs'
                  >
                    <AppAvatar size={72} color='#fff' {...letters.value} src={theirs.value} />
                    <figcaption>{t('keptPicture.theirs', { name: props.name })}</figcaption>
                  </figure>
                ) : null}
              </div>
            ) : null,
        }}
      </AvatarCropper>
    )
  },
})
