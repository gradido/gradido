// AI-GENERATED — not an architecture reference
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { fileLinkLabel } from '@/utils/chatFileLink'
import IMdiFileDocumentOutline from '~icons/mdi/file-document-outline'
import IMdiOpenInNew from '~icons/mdi/open-in-new'
import classes from './ChatFileCard.module.scss'

/** A class by its name and in the module's spelling: the stylesheet's rules hang on the latter. */
const c = (name: string) => [name, classes[name]]

/**
 * A link to files on SwissTransfer, Dropbox, Google Drive, OneDrive or WeTransfer, shown in the
 * thread as a card in place of the address (E-042, E-044): Gradido stores no files, the message
 * carries the link, and the card says what it is. ChatMessageText puts it where the link stood;
 * `fileLinkService` decides which links get one, and names the service.
 *
 * ⛔ It shows only what the link itself says. Nothing is fetched from the service before somebody
 * taps it -- no preview, no file names, no expiry date: any request would tell a third party that
 * the message was opened (Notiz 23.09. §5), and the page behind the link knows all of that anyway.
 */
export const ChatFileCard = defineComponent({
  name: 'ChatFileCard',
  props: {
    /** A link `fileLinkService` names a service for, as the message carries it: key and all. */
    href: { type: String, required: true },
    /** The service, as `fileLinkService` names it: a brand, the same in every language. */
    service: { type: String, required: true },
  },
  setup(props) {
    const { t } = useI18n()

    /** The destination the card names: host and path, without `https://`, `www.`, query or `#`. */
    const where = computed(() => fileLinkLabel(props.href))

    return () => (
      <a
        class={c('chat-file-card')}
        href={props.href}
        target='_blank'
        rel='noopener noreferrer'
        data-test='chat-file-card'
      >
        {/* One link, the whole card: a tap opens the service's page for the files in a tab of its
            own, and no address of the thread goes with it. It names where it leads -- "File on
            Dropbox" over the address itself -- so a card never stands for a destination it does not
            show. (Inside the link, not above it: a comment beside the root would make two roots in
            development.) */}
        <span class={c('chat-file-card-icon')} aria-hidden='true'>
          <IMdiFileDocumentOutline />
        </span>
        <span class={c('chat-file-card-text')}>
          <span class={c('chat-file-card-title')}>
            {t('chatThread.fileCard', { service: props.service })}
          </span>
          <span class={c('chat-file-card-where')} data-test='chat-file-card-where'>
            {where.value}
          </span>
        </span>
        <IMdiOpenInNew class={c('chat-file-card-go')} aria-hidden='true' />
      </a>
    )
  },
})
