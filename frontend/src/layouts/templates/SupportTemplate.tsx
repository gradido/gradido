// AI-GENERATED — not an architecture reference
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { ContributionInfo } from '@/components/Template/RightSide/ContributionInfo'
import { VariantIcon } from '@/components/VariantIcon'
import { useWalletStore } from '@/store/useWalletStore'
import { SUPPORT_TICKET_SIGNS as SIGNS } from '@/utils/supportTicketStatus'

export const SupportTemplate = defineComponent({
  name: 'SupportTemplate',
  setup() {
    const { t } = useI18n()
    const store = useWalletStore()

    return () => (
      <ContributionInfo
        v-slots={{
          write: () => (
            <div class='text-dark'>
              <h3>{t('support.info.write.title')}</h3>
              {t('support.info.write.text')}
              <div class='my-3'>
                <b>{t('support.info.write.answer')}</b>
              </div>
            </div>
          ),
          'my-requests': () => (
            <div class='text-dark'>
              <h4 class='alert-heading'>{t('support.myRequests')}</h4>
              <p>{t('support.info.myRequests')}</p>
              <ul>
                <li>
                  <VariantIcon icon={SIGNS.OPEN.icon} variant={SIGNS.OPEN.variant} />{' '}
                  {t('support.legend.open')}
                </li>
                <li>
                  <VariantIcon icon={SIGNS.IN_PROGRESS.icon} variant={SIGNS.IN_PROGRESS.variant} />{' '}
                  {t('support.legend.inProgress')}
                </li>
                <li>
                  <VariantIcon icon={SIGNS.CLOSED.icon} variant={SIGNS.CLOSED.variant} />{' '}
                  {t('support.legend.closed')}
                </li>
                <li>
                  <VariantIcon icon={SIGNS.DELETED.icon} variant={SIGNS.DELETED.variant} />{' '}
                  {t('support.legend.deleted')}
                </li>
              </ul>
            </div>
          ),
          information: () => (
            <div class='text-dark'>
              <h4 class='alert-heading'>{t('info')}</h4>
              {/* with new requests switched off (K5) without the way to "Schreiben" */}
              {store.supportTicketsActive === false ? (
                <p>{t('support.info.informationOff')}</p>
              ) : (
                <p>{t('support.info.information')}</p>
              )}
            </div>
          ),
        }}
      />
    )
  },
})
