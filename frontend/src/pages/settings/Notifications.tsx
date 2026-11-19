// AI-GENERATED — not an architecture reference
import { BCol, BRow } from 'bootstrap-vue-next'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { SettingsSection } from '@/components/UserSettings/SettingsSection'
import { UserNewsletter } from '@/components/UserSettings/UserNewsletter'
import { UserSettingsSwitch } from '@/components/UserSettings/UserSettingsSwitch'
import { useWalletStore } from '@/store/useWalletStore'

export const Notifications = defineComponent({
  name: 'Notifications',
  setup() {
    const { t } = useI18n()
    const store = useWalletStore()
    // Computed, not a ref taken once: the switch beside this line writes to the store, and a
    // snapshot would leave the sentence below it saying the opposite of the switch until the
    // next reload. (It was a snapshot on the old page too.)
    const newsletterState = computed(() => store.newsletterState)
    // On unless the member switched it off: null is "not known yet" (a store from before the
    // field), and the column's default is on.
    const transfersInChat = computed(() => (store.transfersInChat as boolean | null) !== false)

    return () => (
      <SettingsSection title={t('settings.menu.notifications')}>
        <BRow class='mb-5'>
          <BCol cols='12' md='6' lg='6'>
            {t('settings.newsletter.newsletter')}
            <div class='small'>
              {newsletterState.value
                ? t('settings.newsletter.newsletterTrue')
                : t('settings.newsletter.newsletterFalse')}
            </div>
          </BCol>
          <BCol cols='12' md='6' lg='6' class='text-end'>
            <UserNewsletter />
          </BCol>
        </BRow>
        {/* Transfers in the conversations and the mail about one received: one switch (Bernd,
            28.09.2026: "Ein Schalter, dass Transaktionen auch Chatnachrichten und E-Mails
            auslösen", on by default). A shop with many bookings switches it off. It saves on the
            spot, as the switches on the visibility page do. */}
        <BRow class='mb-5' data-test='settings-transfers-in-chat'>
          <BCol cols='12' md='6' lg='6'>
            {t('settings.transfersInChat.title')}
            <div class='small' data-test='settings-transfers-in-chat-state'>
              {transfersInChat.value
                ? t('settings.transfersInChat.on')
                : t('settings.transfersInChat.off')}
            </div>
          </BCol>
          <BCol cols='12' md='6' lg='6' class='text-end'>
            <UserSettingsSwitch
              initialValue={transfersInChat.value}
              attrName='transfersInChat'
              enabledText={t('settings.transfersInChat.on')}
              disabledText={t('settings.transfersInChat.off')}
              label={t('settings.transfersInChat.title')}
            />
          </BCol>
        </BRow>
      </SettingsSection>
    )
  },
})
