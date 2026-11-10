// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { BButton, BCol, BContainer, BRow, type ButtonVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { authenticateHumhubAutoLogin } from '@/graphql/mutations'
import { useWalletStore } from '@/store/useWalletStore'

/** The tile that leads into the community's HumHub circles, signed in by the wallet. */
export const CardCircles = defineComponent({
  name: 'CardCircles',
  setup() {
    const { t } = useI18n()
    const store = useWalletStore()

    const enableButton = ref(false)
    const humhubUri = ref('')

    const humhubAllowed = computed(() => store.humhubAllowed)

    const {
      onDone,
      mutate: mutateHumhubAutoLogin,
      onError,
      called,
    } = useMutation(authenticateHumhubAutoLogin)

    onDone(({ data }) => {
      if (data) {
        humhubUri.value = data.authenticateHumhubAutoLogin
        enableButton.value = true
      }
    })

    onError(() => {
      enableButton.value = true
      humhubUri.value = ''
      store.setHumhubAllowed(false)
    })

    onMounted(() => {
      if (!called.value) {
        mutateHumhubAutoLogin()
      }
    })

    return () => (
      // py-3, not p-3. Overview puts this tile straight into a BRow, which reaches 12px past
      // each side and gives it back as the padding of whatever stands in it. p-3 turned that
      // 12px into 16px, so the tile stood 4px inside the cards above it on every width.
      <div class='mb-3 py-3 card-circles'>
        <BContainer class='bg-white app-box-shadow gradido-border-radius p-4 mt--3'>
          <div class='h3'>{t('card-circles.headline')}</div>
          <div class='my-3 small'>
            {t('card-circles.text')
              .split('\n')
              .map((line, lineNumber) => (
                <span key={lineNumber}>
                  {line} <br />
                </span>
              ))}
          </div>
          <BRow class='my-1'>
            <BCol cols='12'>
              <div class='text-lg-end'>
                {humhubAllowed.value ? (
                  <BButton
                    href={humhubUri.value}
                    variant={'gradido' as ButtonVariant}
                    disabled={enableButton.value === false}
                    target='_blank'
                  >
                    {t('card-circles.allowed.button')}
                  </BButton>
                ) : (
                  <RouterLink to='/settings/communities'>
                    <BButton variant={'gradido' as ButtonVariant}>
                      {t('card-circles.not-allowed.button')}
                    </BButton>
                  </RouterLink>
                )}
              </div>
            </BCol>
          </BRow>
        </BContainer>
      </div>
    )
  },
})
