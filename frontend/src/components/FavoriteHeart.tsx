// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { BButton, BModal } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType, ref, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { isFavorite, markFavorite } from '@/composables/useFavorites'
import { useAppToast } from '@/composables/useToast'
import { addFavorite, removeFavorite } from '@/graphql/contacts.graphql'
import { memberAlias } from '@/utils/gradidoAddress'
import IMdiHeart from '~icons/mdi/heart'
import IMdiHeartOutline from '~icons/mdi/heart-outline'
import classes from './FavoriteHeart.module.scss'

/**
 * The heart, wherever a member is named: booking rows, the last-bookings column, the
 * contact lists, the contact window. One component, so these places cannot come to behave
 * differently -- and a heart only, never with a word beside it: the contact window, the one
 * place that had the word, puts the heart behind the name like every list (Bernd, 24.09.2026).
 *
 * Its name says what a tap does and to WHOM (Bernd, 09.10.2026): in a list every heart is
 * otherwise called the same, and a screen reader reads a column of "add to favourites". The same
 * words are its tooltip -- the heart is the one mark without a word, so a mouse gets them too.
 *
 * ★ It sits exactly where the name is a link -- the same condition (a gradidoID on the
 * counterparty) decides both, and a creation row, which has no counterparty, gets
 * neither. The CALLER holds that condition, this component only assumes a member.
 *
 * `stop` and `prevent` on the wrapper's click: the booking row toggles its details on a click
 * anywhere in it, and a heart that also unfolded the row would be two actions on one tap.
 */
export const FavoriteHeart = defineComponent({
  name: 'FavoriteHeart',
  props: {
    /** { communityUuid, gradidoID, alias } -- the counterparty as the booking carries it. */
    member: {
      type: Object as PropType<{
        communityUuid?: string | null
        gradidoID: string
        alias?: string | null
      }>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n()
    const { toastError } = useAppToast()
    const { mutate: mutateAdd } = useMutation(addFavorite)
    const { mutate: mutateRemove } = useMutation(removeFavorite)

    const favorite = computed(() => isFavorite(props.member))
    const name = computed(() => memberAlias(props.member.alias, props.member.gradidoID))
    const confirming = ref(false)
    const busy = ref(false)

    const ref_ = () => ({
      communityUuid: props.member.communityUuid ?? null,
      gradidoID: props.member.gradidoID,
    })

    // Applied on this device first, confirmed by the server after; put back if it fails.
    const add = async () => {
      busy.value = true
      markFavorite(props.member, true)
      try {
        await mutateAdd({ ref: ref_() })
      } catch (error) {
        markFavorite(props.member, false)
        toastError((error as Error).message)
      } finally {
        busy.value = false
      }
    }

    const toggle = () => {
      if (busy.value) {
        return
      }
      if (favorite.value) {
        confirming.value = true
      } else {
        add()
      }
    }

    const remove = async () => {
      busy.value = true
      markFavorite(props.member, false)
      try {
        await mutateRemove({ ref: ref_() })
      } catch (error) {
        markFavorite(props.member, true)
        toastError((error as Error).message)
      } finally {
        busy.value = false
      }
    }

    return () => {
      const label = favorite.value
        ? t('contacts.heart.remove', { name: name.value })
        : t('contacts.heart.add', { name: name.value })
      return (
        <span
          class={['favorite-heart d-inline-flex align-items-center', classes['favorite-heart']]}
          onClick={withModifiers(() => {
            // nothing of its own: the click only ends here (see above)
          }, ['stop', 'prevent'])}
        >
          <BButton
            variant='link'
            class={['favorite-heart-button p-0 border-0', { 'is-favorite': favorite.value }]}
            aria-label={label}
            title={label}
            aria-pressed={favorite.value ? 'true' : 'false'}
            disabled={busy.value}
            data-test='favorite-heart'
            onClick={toggle}
          >
            {favorite.value ? (
              <IMdiHeart class='favorite-heart-icon' aria-hidden='true' />
            ) : (
              <IMdiHeartOutline class='favorite-heart-icon' aria-hidden='true' />
            )}
          </BButton>

          {/* The question is asked in ONE direction only (KF-003). Giving the heart by mistake
              costs nothing; taking it away by mistake loses a friend from the list, and a phone
              in a pocket taps -- so removing asks, adding does not. */}
          {/* `lazy`: without it every closed dialog is rendered and teleported to the body --
              one per heart, a page of bookings' worth of hidden dialogs. */}
          <BModal
            modelValue={confirming.value}
            onUpdate:modelValue={(open: boolean) => {
              confirming.value = open
            }}
            lazy
            centered
            noHeader
            cancelTitle={t('form.cancel')}
            okTitle={t('contacts.remove.confirm')}
            okVariant='danger'
            data-test='favorite-remove-dialog'
            onOk={remove}
          >
            <p class='h5 mb-2' data-test='favorite-remove-title'>
              {t('contacts.remove.title', { name: name.value })}
            </p>
            <p class='mb-0 text-muted'>{t('contacts.remove.body', { name: name.value })}</p>
          </BModal>
        </span>
      )
    }
  },
})
