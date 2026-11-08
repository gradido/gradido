// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import {
  BButton,
  BCard,
  BCol,
  BForm,
  BImg,
  BLink,
  BRow,
  BSpinner,
  type ButtonVariant,
} from 'bootstrap-vue-next'
import {
  computed,
  defineComponent,
  onMounted,
  type PropType,
  reactive,
  ref,
  watch,
  withModifiers,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { type AnyObjectSchema, object } from 'yup'
import CommunitySwitch from '@/components/CommunitySwitch.vue'
import EmojiPicker from '@/components/Inputs/EmojiPicker.vue'
import ValidatedInput from '@/components/Inputs/ValidatedInput.vue'
import { useAmountInText } from '@/composables/useAmountInText'
import { useLinkDraft } from '@/composables/useLinkDraft'
import { useAppToast } from '@/composables/useToast'
import CONFIG from '@/config'
import { user } from '@/graphql/queries'
import { offersEmojiPicker } from '@/utils/emojiChoice'
import { memberAlias, sameHost, splitRecipient } from '@/utils/gradidoAddress'
import { SEND_TYPES, type SendType } from '@/utils/sendTypes'
import {
  amount as amountSchemaUpTo,
  identifier as identifierSchema,
  memo as memoSchema,
  message as messageSchema,
  subject as subjectSchema,
} from '@/validationSchemas'
import IMdiEmailFastOutline from '~icons/mdi/email-fast-outline'
import IMdiLinkVariant from '~icons/mdi/link-variant'
import classes from './TransactionForm.module.scss'
import { type TransactionPicture, TransactionPictureField } from './TransactionPictureField'

/** A community as the switch lists them (CommunitySwitch, reachableCommunities). */
export type Community = {
  uuid: string
  name: string
  url?: string
  /** The server's word: not the member's own. The placeholder before the list has come has none. */
  foreign?: boolean
}

/**
 * What the form hands over when "Jetzt prüfen" (or "E-Mail senden") is pressed: its fields as
 * the validation schema cast them, the tab, and the recipient's name where the address named
 * them.
 */
export type TransactionEntries = {
  identifier: string
  amount: number
  subject: string
  memo: string
  targetCommunity: Community
  selected: SendType
  userName: string
}

/** The fields, as they stand in the form. The amount is text while it is typed. */
type FormFields = {
  balance: number
  identifier: string
  amount: number | string
  subject: string
  memo: string
  selected: SendType
  targetCommunity: Community
}

export const TransactionForm = defineComponent({
  name: 'TransactionForm',
  // `transactionData` is bound as a whole onto this form, and it holds more than the form
  // declares: without this the recipient's user name would land on the form as an attribute.
  inheritAttrs: false,
  props: {
    balance: { type: Number, default: 0 },
    identifier: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    subject: { type: String, default: '' },
    memo: { type: String, default: '' },
    selected: { type: String as PropType<SendType>, default: SEND_TYPES.send },
    targetCommunity: {
      type: Object as PropType<Community>,
      default: () => ({ uuid: '', name: CONFIG.COMMUNITY_NAME }),
    },
    /**
     * The picture to go with a transfer, or null (v-model:picture): `{ motif }` or `{ photo }`.
     * Held by the page, beside the form's fields -- the form is taken down between the steps,
     * and "Zurück" finds the picture where it was.
     */
    picture: { type: Object as PropType<TransactionPicture | null>, default: null },
    /**
     * The page is asking the server about the recipient ("Jetzt prüfen", pages/Send.tsx), with
     * what stands in the fields at this moment, and its answer takes this form down. So nothing
     * can be changed until it is in (`inert`, as the map of the matching page holds still while
     * it is saved): a word corrected or a tab chosen now would be dropped without a sound.
     */
    checking: { type: Boolean, default: false },
  },
  emits: [
    'send-email',
    'set-transaction',
    'set-send-type',
    'update:picture',
    // "Zurück": the member leaves the form; where to is the page's to say.
    'back',
  ],
  setup(props, { emit, expose }) {
    const { t } = useI18n()

    /**
     * The id the message's field carries -- LabeledInput makes it of the field's name --, by
     * which the smiley finds it (EmojiPicker). The spec holds it against the field as it is
     * rendered.
     */
    const MEMO_FIELD_ID = 'memo-input-field'
    /** Whether the smiley stands at the message: asked once, when the form is made. */
    const emojiOffered = offersEmojiPicker()

    // ⛔ Without the picture: `form` is what the validation schema casts and what goes on to the
    // page as the transfer's fields -- and a cast lets a field it does not know pass. The picture
    // stays the page's, in a shallowRef beside those fields; a decoded photo made reactive here
    // would be walked through, property by property. And without `checking`, which is no field.
    const entityDataToForm = computed(() => {
      const { picture: _picture, checking: _checking, ...fields } = props
      return fields
    })
    const form: FormFields = reactive({ ...entityDataToForm.value })

    /**
     * A link duplicated from the member's own list (TransactionLink.vue, ZE-030): its amount and
     * its memo stand in the fields as if they had been typed -- the amount the way this field
     * takes it and the wallet's language writes it ("12,5"). The row opens this form on its link
     * tab (`?art`), and from here on it is the way of every link: the check, then
     * `createTransactionLink`.
     *
     * Handed over once (useLinkDraft). The form is taken down between the steps; when it stands
     * again, the fields hold what the page holds.
     *
     * Into the fields, not into what the page hands in as their first values (`props`): the page
     * learns of them as of anything typed, when "Jetzt prüfen" is pressed.
     */
    const duplicated = useLinkDraft().takeLink()
    if (duplicated) {
      form.amount = useAmountInText()(duplicated.amount)
      form.memo = duplicated.memo
    }
    const disableSmartValidState = ref(false)
    const communities = ref<Community[]>([])
    const autoCommunityIdentifier = ref('')

    const route = useRoute()

    /**
     * ⭐ The form brings itself into view where the address asks for it (`#send-form`).
     *
     * The router scrolls to the hash of an address, but only to an element that stands already
     * (routes/router.js) -- and on the first page of a visit this one does not yet: the hand-over
     * from the admin interface starts the wallet on the form (measured in the built wallet,
     * 13.10.2026: the page stayed at its top, the form 650 px down). So the form does it itself
     * once it stands, as the contribution list does for its own anchor.
     */
    const formRoot = ref<HTMLDivElement | null>(null)
    const showFormWhereAsked = () => {
      const form = formRoot.value
      if (route.hash !== '#send-form' || !form?.scrollIntoView) {
        return
      }
      // Up to 450 px the navbar stays at the top of the window, over whatever scrolls under it
      // (Menu/Navbar.vue). There the form is brought to the navbar's lower edge, not to the
      // window's: the switch between sending, link and e-mail stood under it (measured in the
      // built wallet). Its height is read, not written down a second time -- it grows with the
      // tools in it.
      const bar = document.querySelector('.navbar-element')
      const stays = bar && getComputedStyle(bar).position === 'fixed'
      form.style.scrollMarginTop = stays ? `${Math.ceil(bar.getBoundingClientRect().bottom)}px` : ''
      form.scrollIntoView({ block: 'start' })
    }
    onMounted(showFormWhereAsked)
    const { toastError } = useAppToast()

    /**
     * The mode a link asks for, or null when it asks for none.
     *
     * ⛔ Only the three the buttons above can produce. An unknown word must not put this form
     * into a state no button can reach.
     *
     * `link` used to be left out on purpose, as a flow nobody offered. The page for showing
     * Gradido to somebody offers it now: its second door says "send a thank-you" and leads here,
     * onto the link, cheque and QR tab, until the thank-you greeting has a form of its own.
     */
    const sendTypeFromQuery = (): SendType | null => {
      const art = route.query.art
      if (art === SEND_TYPES.email) {
        return SEND_TYPES.email
      }
      if (art === SEND_TYPES.send) {
        return SEND_TYPES.send
      }
      if (art === SEND_TYPES.link) {
        return SEND_TYPES.link
      }
      return null
    }

    // A link may name the send type it wants (?art=…), so a button elsewhere can land
    // straight in e-mail mode — the matching profile's two buttons do exactly this, and
    // since KF-010 the contact window's two do as well. The route still carries only the
    // recipient; this is the "how".
    const radioSelected = ref<SendType>(sendTypeFromQuery() ?? props.selected)
    const userName = ref('')

    const userIdentifier = computed(() => {
      // Each is one word of the address (routes.js), never a list of them.
      const identifier = route.params.userIdentifier as string | undefined
      const communityIdentifier = route.params.communityIdentifier as string | undefined
      if (identifier && communityIdentifier) {
        return { identifier, communityIdentifier }
      }
      return null
    })

    const stateClasses = (sendType: SendType) => {
      if (radioSelected.value === sendType) {
        return 'router-link-active router-link-exact-active'
      }
      return ''
    }

    const setSendType = (sendType: SendType) => {
      radioSelected.value = sendType
      emit('set-send-type', sendType)
    }

    const setCommunities = (returnedCommunities: Community[]) => {
      communities.value = returnedCommunities
    }

    /**
     * The community somebody named in the recipient field, or undefined.
     *
     * The url is compared by host, not literally: what is stored is the federation endpoint
     * (`https://ki-playground.gradido.net/api/`), what is typed is the printed line
     * (`ki-playground.gradido.net`). Two shapes of the same thing, which is why the url
     * branch has been in this comparison for a long time without ever matching anything.
     */
    const findCommunity = (communityIdentifier: string) =>
      communities.value.find(
        (community) =>
          community.uuid === communityIdentifier ||
          community.name === communityIdentifier ||
          sameHost(community.url ?? '', communityIdentifier),
      )

    // One check for both send types. It used to stand twice, word for word, and two copies
    // of a rule are two rules as soon as one of them learns something.
    const communityIsReachable = (value: string | undefined) => {
      const parts = splitRecipient(value ?? '')
      // Nobody named a community, so the switch above decides which one it is.
      if (!parts?.community) {
        return true
      }
      return findCommunity(parts.community) !== undefined
    }

    const identifierWithCommunity = identifierSchema.test(
      'community-is-reachable',
      'form.validation.identifier.communityIsReachable',
      communityIsReachable,
    )

    // One of three shapes, so the fields a tab has are read off the schema (`fields.amount`).
    const validationSchema = computed((): AnyObjectSchema => {
      // The rule itself stands in validationSchemas.js: the thank-you greeting asks the same.
      const amountSchema = amountSchemaUpTo(props.balance)
      if (!userIdentifier.value && radioSelected.value === SEND_TYPES.send) {
        return object({
          memo: memoSchema,
          amount: amountSchema,
          identifier: identifierWithCommunity,
        }) as AnyObjectSchema
      }
      if (radioSelected.value === SEND_TYPES.email) {
        return object({
          // no amount travels with this one, so it gets the roomier message bounds
          memo: messageSchema,
          subject: subjectSchema,
          identifier: identifierWithCommunity,
        }) as AnyObjectSchema
      }
      // don't need identifier schema if it is a transaction link or identifier was set via url
      return object({
        memo: memoSchema,
        amount: amountSchema,
      }) as AnyObjectSchema
    })
    const formIsInvalid = computed(() => !validationSchema.value.isValidSync(form))

    /** What a field hands up: its value and its name (ValidatedInput), the switch its community. */
    const updateField = (newValue: unknown, name?: string) => {
      if (typeof name === 'string' && name.length) {
        const fields: Record<string, unknown> = form
        fields[name] = newValue
      }
    }

    const isFormDisabled = computed(
      () => (props.balance <= 0 && radioSelected.value === SEND_TYPES.send) || false,
    )
    const isCommunitiesEmpty = computed(() => communities.value.length === 0)

    /**
     * The recipient's community is another one than the member's own: a picture does not travel
     * there yet, and a sentence stands in the field's place.
     *
     * Read off `form.targetCommunity`, which all three ways end in -- the switch above, an
     * address in the recipient field (the watcher below), and the address of the page
     * (CommunitySwitch). `foreign` is the server's word (reachableCommunities); the placeholder
     * that stands there before the list has come carries none, and is the member's own community.
     */
    const recipientIsForeign = computed(() => form.targetCommunity?.foreign === true)

    const { result: userResult, error: userError } = useQuery(
      user,
      // Without an address there are no variables; the query does not run then (`enabled`).
      () => userIdentifier.value ?? undefined,
      () => ({ enabled: !!userIdentifier.value }),
    )

    watch(
      () => userResult.value?.user,
      (user) => {
        const asked = userIdentifier.value
        if (user && asked) {
          // The recipient as the wallet names them (NU-018); the real name is not delivered
          // to other members any more.
          userName.value = memberAlias(user.alias, user.gradidoID)
          form.identifier = asked.identifier
        }
      },
      { immediate: true },
    )

    watch(userError, (error) => {
      if (error) {
        toastError(error.message)
      }
    })

    /**
     * ⛔ Watched, not read once at open. Reading it once works only when the form is BUILT by
     * the navigation -- true for the map's profile window, which starts on another route, and
     * false for the contact window in the column beside this very page: there the route record
     * does not change, so the component is patched and setup never runs again. The e-mail
     * button did nothing at all from the one place it was built for.
     *
     * ⛔ And the source is the whole NAVIGATION, not `route.query.art` alone. `?art` is a
     * command ("open in this mode"), not a state, and a member who taps a second contact with
     * the same button sends the same command: watching the value, that is no change and the
     * form stayed in whatever mode they had picked by hand in between.
     *
     * ⚠️ What this still cannot do: the SAME contact tapped twice with the same button is an
     * identical location, which the router refuses as a duplicate navigation -- nothing fires
     * anywhere. Carrying the mode as a route param instead of a query would answer that too,
     * and it is the shape to reach for the day /send takes a third piece of context.
     *
     * A navigation that names no mode leaves the choice alone, so an ordinary link to /send
     * cannot undo what somebody has just picked with the radio buttons.
     */
    watch(
      () => route.fullPath,
      () => {
        const asked = sendTypeFromQuery()
        if (asked) {
          radioSelected.value = asked
        }
      },
    )

    // if identifier contain valid community identifier of a reachable community:
    // set it as target community and change community-switch to show only current value, instead of select
    watch(
      () => form.identifier,
      (value) => {
        autoCommunityIdentifier.value = ''
        const parts = splitRecipient(value)
        if (parts?.community) {
          const com = findCommunity(parts.community)
          if (com) {
            form.targetCommunity = com
            autoCommunityIdentifier.value = com.uuid
          }
        }
      },
    )

    const onSubmit = () => {
      const transformedForm = validationSchema.value.cast(form)
      // Both ways carry a recipient, so both need the address taken apart into the pair the
      // mutations expect: the bare user name, and the community it belongs to. This used to
      // sit in the else branch alone, which is why a recipient written with a community never
      // reached anybody by e-mail -- the whole string went out as the user name.
      // Without a community as well: the field has forgiven a space around the address (a paste,
      // the suggestion of a phone's keyboard), and past this point it would count as somebody
      // else.
      const parts = splitRecipient(transformedForm.identifier)
      if (parts) {
        transformedForm.identifier = parts.user
      }
      if (parts?.community) {
        transformedForm.targetCommunity = findCommunity(parts.community)
      }
      // The name belongs to the address that named the recipient. The form stays when that
      // address is left (the menu's "Senden"), and the name would go on to the check view, above
      // somebody else typed into the field: for a member of another community nothing asks about
      // that one.
      const recipientName = userIdentifier.value ? userName.value : ''
      const entries: TransactionEntries = {
        ...transformedForm,
        selected: radioSelected.value,
        userName: recipientName,
      }
      if (radioSelected.value === SEND_TYPES.email) {
        emit('send-email', entries)
      } else {
        emit('set-transaction', entries)
      }
    }

    expose({
      radioSelected,
      form,
      setCommunities,
      formIsInvalid,
      autoCommunityIdentifier,
      userName,
      validationSchema,
    })

    // `block` is no prop of BButton: it lands on the button as the empty attribute it was.
    const block = { block: '' } as object
    const onlyOn = (...types: SendType[]) => types.includes(radioSelected.value)

    return () => (
      <div id='send-form' ref={formRoot} class={['transaction-form', classes.transactionForm]}>
        {/* `id="send-form"` above: where a link into the wallet lands that names a recipient and
            wants the form in view. The arrow behind a member's name in the admin interface opens
            /send/<community>/<member>#send-form in a window 760 px high, where the form begins
            below the fold (showFormWhereAsked). The admin interface writes the word down as well
            (admin/src/components/MemberWalletLink.tsx): the two apps share no code. */}
        <BRow>
          <BCol cols='12'>
            <BCard class='app-box-shadow gradido-border-radius' bodyClass='p-4'>
              <BForm
                role='form'
                inert={props.checking}
                onSubmit={withModifiers(onSubmit, ['prevent'])}
              >
                <div
                  class={[
                    'nav-send-btn-wrapper',
                    classes.navSendBtnWrapper,
                    'bg-209 rounded-26 d-flex bd-highlight mx-xl-6 mx-lg-5 shadow justify-content-between',
                  ]}
                  style='margin-bottom: 20px'
                >
                  <BButton
                    class={['nav-send__btn', stateClasses(SEND_TYPES.send)]}
                    {...block}
                    variant='link'
                    onClick={() => setSendType('send')}
                  >
                    <BImg src='/img/svg/gdd_coin_sw.svg' height='20' class='svg-icon' />{' '}
                    {t('send_gdd')}
                  </BButton>
                  <BButton
                    class={['nav-send__btn', stateClasses(SEND_TYPES.link)]}
                    {...block}
                    variant='link'
                    onClick={() => setSendType('link')}
                  >
                    <IMdiLinkVariant height='20' class='svg-icon' /> {t('send_per_link')}
                  </BButton>
                  <BButton
                    class={['nav-send__btn', stateClasses(SEND_TYPES.email)]}
                    {...block}
                    variant='link'
                    onClick={() => setSendType('email')}
                  >
                    <IMdiEmailFastOutline height='20' class='svg-icon' /> {t('send_email')}
                  </BButton>
                </div>
                {/* The thank-you greeting has a way of its own (ZE-017, F1): on top of this tab a
                    field leads there. The form below stays what it is.
                    ⛔ The motif as an <img>, never inlined: the motifs share the ids of their
                    gradients. The words beside it say what it is, so the picture says nothing. */}
                {onlyOn(SEND_TYPES.link) ? (
                  <div
                    class={['greeting-entry mt-4', classes.greetingEntry]}
                    data-test='send-greeting-entry'
                  >
                    <img
                      class={['greeting-entry-motif', classes.greetingEntryMotif]}
                      src='/img/thank-you-greeting/morning-light.svg'
                      alt=''
                      width='360'
                      height='250'
                    />
                    <div class={['greeting-entry-text', classes.greetingEntryText]}>
                      <div class={['greeting-entry-title', classes.greetingEntryTitle]}>
                        {t('thank-you-greeting.name')}
                      </div>
                      <div class={['greeting-entry-lead small', classes.greetingEntryLead]}>
                        {t('thank-you-greeting.entry.text')}
                      </div>
                      <BLink
                        class={['greeting-entry-link', classes.greetingEntryLink]}
                        to='/thank-you-greeting'
                        data-test='send-greeting-link'
                      >
                        {t('thank-you-greeting.entry.write')}
                      </BLink>
                    </div>
                  </div>
                ) : null}
                {onlyOn(SEND_TYPES.link) ? (
                  <div class='mt-4 mb-4'>
                    <h2 class='alert-heading'>{t('gdd_per_link.header')}</h2>
                    <div>{t('gdd_per_link.choose-amount')}</div>
                  </div>
                ) : null}
                <BRow class='mb-4'>
                  <BCol>
                    <BRow>
                      {onlyOn(SEND_TYPES.send, SEND_TYPES.email) ? (
                        <BCol class='mb-4' cols='12'>
                          <BRow>
                            <BCol>{t('form.recipientCommunity')}</BCol>
                          </BRow>
                          <BRow>
                            <BCol class='fw-bold'>
                              <CommunitySwitch
                                disabled={isFormDisabled.value}
                                modelValue={form.targetCommunity}
                                communityIdentifier={autoCommunityIdentifier.value}
                                onUpdate:modelValue={(community: Community) =>
                                  updateField(community, 'targetCommunity')
                                }
                                onCommunitiesLoaded={setCommunities}
                              />
                            </BCol>
                          </BRow>
                        </BCol>
                      ) : null}
                      {onlyOn(SEND_TYPES.send, SEND_TYPES.email) ? (
                        <BCol cols='12'>
                          {!userIdentifier.value ? (
                            <div>
                              {validationSchema.value.fields.identifier ? (
                                <ValidatedInput
                                  id='identifier'
                                  modelValue={form.identifier}
                                  name='identifier'
                                  label={t('form.recipient')}
                                  placeholder={t('form.identifier')}
                                  rules={validationSchema.value.fields.identifier}
                                  disabled={isFormDisabled.value || isCommunitiesEmpty.value}
                                  disableSmartValidState={disableSmartValidState.value}
                                  onUpdate:modelValue={updateField}
                                />
                              ) : null}
                            </div>
                          ) : (
                            <div class='mb-4'>
                              <BRow class='mb-4'>
                                <BCol>{t('form.recipient')}</BCol>
                              </BRow>
                              <BRow class='mb-4'>
                                <BCol class='fw-bold'>{userName.value}</BCol>
                              </BRow>
                            </div>
                          )}
                        </BCol>
                      ) : null}
                      {onlyOn(SEND_TYPES.send, SEND_TYPES.link) ? (
                        <BCol cols='12' lg='6'>
                          {validationSchema.value.fields.amount ? (
                            <ValidatedInput
                              id='amount'
                              modelValue={form.amount}
                              name='amount'
                              label={t('form.amount')}
                              placeholder='0.01'
                              rules={validationSchema.value.fields.amount}
                              disabled={isFormDisabled.value}
                              disableSmartValidState={disableSmartValidState.value}
                              onUpdate:modelValue={updateField}
                            />
                          ) : null}
                        </BCol>
                      ) : null}
                      {onlyOn(SEND_TYPES.email) ? (
                        <BCol cols='12'>
                          {validationSchema.value.fields.subject ? (
                            <ValidatedInput
                              id='subject'
                              modelValue={form.subject}
                              name='subject'
                              label={t('form.subject')}
                              placeholder={t('form.subject')}
                              rules={validationSchema.value.fields.subject}
                              textarea='false'
                              disableSmartValidState={disableSmartValidState.value}
                              onUpdate:modelValue={updateField}
                            />
                          ) : null}
                        </BCol>
                      ) : null}
                    </BRow>
                  </BCol>
                </BRow>

                <BRow>
                  <BCol>
                    {/* The message and its smiley (Bernd, 10.10.2026): the wallet's own small
                        choice of emoji, in all three forms of the page -- a transfer, a link, a
                        letter. The smiley stands at the end of the label's line, and the choice
                        hangs over the page from what wraps the field. At a computer only
                        (`offersEmojiPicker`), and not at a field that takes no words. */}
                    <div class={['memo-with-emoji', classes.memoWithEmoji]}>
                      {validationSchema.value.fields.memo ? (
                        <ValidatedInput
                          id='memo'
                          modelValue={form.memo}
                          name='memo'
                          label={t('form.message')}
                          placeholder={t('form.message')}
                          rules={validationSchema.value.fields.memo}
                          textarea='true'
                          maxRows={14}
                          disabled={isFormDisabled.value}
                          disableSmartValidState={disableSmartValidState.value}
                          onUpdate:modelValue={updateField}
                        />
                      ) : null}
                      {emojiOffered &&
                      validationSchema.value.fields.memo &&
                      !isFormDisabled.value ? (
                        <EmojiPicker fieldId={MEMO_FIELD_ID} corner />
                      ) : null}
                    </div>
                  </BCol>
                </BRow>
                {/* "Bild dazu" (ZE-016): with a transfer to a member, and only there -- a link
                    has the thank-you greeting, a letter has the chat. The picture lives in the
                    memory of the page, beside the form's own fields: it never goes through
                    `form`, which is cast by the validation schema on its way out. */}
                {onlyOn(SEND_TYPES.send) && !isFormDisabled.value ? (
                  <TransactionPictureField
                    picture={props.picture}
                    foreign={recipientIsForeign.value}
                    onUpdate:picture={(picture: TransactionPicture | null) =>
                      emit('update:picture', picture)
                    }
                  />
                ) : null}
                {isFormDisabled.value ? (
                  <div class='text-danger mt-5'>{t('form.no_gdd_available')}</div>
                ) : null}
                {/* "Zurück" leaves the page, to where the member came from (E-043): the page
                    knows the way (pages/Send.tsx `leave`). It stands on all three tabs, and with
                    nothing to send as well -- whoever came from a conversation with an empty
                    account is not to be left without a way out. */}
                <BRow class='test-buttons mt-3'>
                  <BCol cols='12' md='6' lg='6'>
                    <BButton
                      {...block}
                      type='button'
                      variant='secondary'
                      class='mb-3 mb-md-0 mb-lg-0'
                      data-test='send-form-back'
                      onClick={() => emit('back')}
                    >
                      {t('back')}
                    </BButton>
                  </BCol>
                  {!isFormDisabled.value ? (
                    <BCol
                      cols='12'
                      md='6'
                      lg='6'
                      class='text-lg-end'
                      onMouseover={() => {
                        disableSmartValidState.value = true
                      }}
                    >
                      <BButton
                        {...block}
                        type='submit'
                        // `gradido` is the wallet's own variant (.btn-gradido, gradido.css)
                        variant={'gradido' as ButtonVariant}
                        disabled={formIsInvalid.value || props.checking}
                      >
                        {/* The one sign of the question under way: on a slow line it takes a
                            while. */}
                        {props.checking ? (
                          <BSpinner small class='me-2' data-test='checking-recipient' />
                        ) : null}{' '}
                        {radioSelected.value === SEND_TYPES.email
                          ? t('form.sendEmail')
                          : t('form.check_now')}
                      </BButton>
                    </BCol>
                  ) : null}
                </BRow>
              </BForm>
            </BCard>
          </BCol>
        </BRow>
      </div>
    )
  },
})
