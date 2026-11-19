// AI-GENERATED — not an architecture reference
import { BCol, BRow } from 'bootstrap-vue-next'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { AvatarButton } from '@/components/Avatar/AvatarButton'
import CONFIG from '@/config'
import { useWalletStore } from '@/store/useWalletStore'
import classes from './UserCard.module.scss'

export const UserCard = defineComponent({
  name: 'UserCard',
  props: {
    balance: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
  },
  setup(props, { expose }) {
    const { t, n } = useI18n()
    const store = useWalletStore()

    const username = computed(() => ({
      username: `${store.firstName} ${store.lastName}`,
      initials: `${store.firstName[0]}${store.lastName[0]}`,
    }))

    // What the spec reads of the card.
    expose({ username })

    return () => (
      <div class={['userdata-card', classes['userdata-card']]}>
        <div class='center-per-margin d-flex justify-content-center'>
          {/* The second way in. "Profile picture" is looked for in the settings by habit,
              and an avatar was already standing here -- same component, used twice. */}
          <AvatarButton
            class='vue3-avatar'
            name={username.value.username}
            initials={username.value.initials}
            color={'#fff'}
            size={90}
          />
        </div>

        <div class='justify-content-center mt-5 mb-5'>
          <BRow alignV='stretch'>
            <BCol cols='4'>
              <div class='text-center fw-bold'>{n(props.balance, 'decimal')}</div>
            </BCol>
            <BCol cols='4'>
              <div class='text-center fw-bold'>{props.transactionCount}</div>
            </BCol>
            <BCol cols='4'>
              <div class='text-center fw-bold'>{CONFIG.COMMUNITY_NAME}</div>
            </BCol>
          </BRow>
          <BRow>
            <BCol cols='4'>
              <div class='text-center'>{t('GDD')}</div>
            </BCol>
            <BCol cols='4'>
              <div class='text-center'>{t('navigation.transactions')}</div>
            </BCol>
            <BCol cols='4'>
              <div class='text-center'>{t('community.community')}</div>
            </BCol>
          </BRow>
        </div>
      </div>
    )
  },
})
