// AI-GENERATED — not an architecture reference
import { BButton, BCol, BContainer, BRow } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import CONFIG from '@/config'

export const RegisterCommunity = defineComponent({
  name: 'RegisterCommunity',
  setup() {
    const { t } = useI18n()

    return () => (
      <div id='register-community'>
        {/* Header */}
        <div class='p-3'>
          <BContainer>
            <div class='text-center mb-7 header'>
              <BRow class='justify-content-center'>
                <BCol xl='5' lg='6' md='8' class='px-2'>
                  <h1>{CONFIG.COMMUNITY_NAME}</h1>
                  <p class='text-lead'>{CONFIG.COMMUNITY_DESCRIPTION}</p>
                  <p class='text-lead community-location'>{CONFIG.COMMUNITY_URL}</p>
                </BCol>
              </BRow>
              <BRow>
                <BCol class='text-center'>
                  <RouterLink to='/register'>
                    <BButton variant='outline-secondary'>
                      {t('community.continue-to-registration')}
                    </BButton>
                  </RouterLink>
                </BCol>
              </BRow>

              <hr />
              <BRow>
                <BCol class='text-center'>
                  <RouterLink to='/select-community'>
                    <BButton variant='outline-secondary'>
                      {t('community.choose-another-community')}
                    </BButton>
                  </RouterLink>
                </BCol>
              </BRow>
              <hr />
              <BRow>
                <BCol class='text-center'>
                  <RouterLink to='/login'>
                    <BButton variant='outline-secondary'>{t('back')}</BButton>
                  </RouterLink>
                </BCol>
              </BRow>
            </div>
          </BContainer>
        </div>
      </div>
    )
  },
})
