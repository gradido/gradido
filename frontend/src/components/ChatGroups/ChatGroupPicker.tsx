// AI-GENERATED — not an architecture reference
import { computed, defineComponent, type PropType, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppAvatar } from '@/components/AppAvatar'
import { chatGroupAvatar, chatGroupMeta } from '@/components/ChatGroups/chatGroupDisplay'
import {
  type Contact,
  type ContactUser,
  contactDisplay,
} from '@/components/Contacts/contactDisplay'
import { LIST_AVATAR_SIZE, SMALL_FACE_SIZE } from '@/constants'
import { chatMemberKey } from '@/utils/chatMemberKey'
import classes from './ChatGroupPicker.module.scss'

/** What the picker reads of one of `chatGroupsQuery`. */
type PickerGroup = { groupUuid: string; title: string; [field: string]: unknown }

/** A class in both spellings: the plain name, which the specs read, and the module's, which carries the rule. */
const cls = (name: string) => [name, classes[name]]

/**
 * The member's own contacts to choose from, for a new group or to take into one (P5, E-049: only
 * one's own contacts; the server checks it too). Search, a box a contact, the chosen ones as small
 * faces over the list.
 *
 * `contacts` is the contact list the page holds (contactListQuery); `excluded` the members already
 * in the group (their `user`s). `modelValue` is what is chosen: the contacts' `user`s, in the order
 * they were ticked. People are compared by the pair, without regard to case, as the server
 * compares them (chatMemberKey).
 */
export const ChatGroupPicker = defineComponent({
  name: 'ChatGroupPicker',
  props: {
    contacts: { type: Array as PropType<Contact[]>, required: true },
    excluded: { type: Array as PropType<ContactUser[]>, default: () => [] },
    modelValue: { type: Array as PropType<ContactUser[]>, required: true },
    /**
     * The member's groups (chatGroupsQuery), where a message may go into one of them as well -- the
     * dialog that forwards one (E-059). A list of their own over the contacts; chosen by their uuids
     * (`chosenGroups`). None for the members of a group.
     */
    groups: { type: Array as PropType<PickerGroup[]>, default: () => [] },
    chosenGroups: { type: Array as PropType<string[]>, default: () => [] },
    /** How many may be chosen together, groups and contacts (E-059 F3: five); 0 for no limit. */
    max: { type: Number, default: 0 },
    /** What the label over the search says, and the field, where it is not the group's members. */
    label: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    /** What stands where there are no contacts at all, where it is not about taking them in. */
    noContactsText: { type: String, default: '' },
  },
  emits: ['update:modelValue', 'update:chosenGroups'],
  setup(props, { emit }) {
    const { t, d } = useI18n()
    const searchId = `${useId()}-search`
    const search = ref('')

    const needle = computed(() => search.value.trim().toLowerCase())

    const keyOf = (user: ContactUser) => chatMemberKey(user)

    /** Every contact that may be offered, drawn by the helper every list uses. */
    const offered = computed(() => {
      const excluded = new Set(props.excluded.map(keyOf))
      return props.contacts
        .map((contact) => ({
          ...contactDisplay(contact),
          id: keyOf(contact.user),
          // E-050 F2: another community's members come with P6.
          later: contact.homeCommunity === false,
        }))
        .filter((row) => !excluded.has(row.id))
    })
    type Row = (typeof offered.value)[number]

    const rows = computed(() =>
      offered.value.filter(
        (row) =>
          !needle.value ||
          `${row.alias} ${row.contact.user.gradidoID}`.toLowerCase().includes(needle.value),
      ),
    )

    const chosenKeys = computed(() => new Set(props.modelValue.map((user) => keyOf(user))))

    /** The chosen ones as rows, in the order they were ticked. */
    const chosen = computed(() =>
      props.modelValue
        .map((user) => offered.value.find((row) => row.id === keyOf(user)))
        .filter((row): row is Row => Boolean(row)),
    )

    const isChosen = (row: Row) => chosenKeys.value.has(row.id)

    const groupKeyOf = (uuid: string) => String(uuid).toLowerCase()
    const chosenGroupKeys = computed(() => new Set(props.chosenGroups.map(groupKeyOf)))

    /** As many as may be chosen together are chosen: the others wait. */
    const full = computed(
      () => props.max > 0 && props.modelValue.length + props.chosenGroups.length >= props.max,
    )
    const waits = (row: Row) => full.value && !isChosen(row)

    /** The groups, drawn as their rows on the page draw them, narrowed by the search as well. */
    const offeredGroups = computed(() =>
      props.groups.map((group) => {
        const chosen = chosenGroupKeys.value.has(groupKeyOf(group.groupUuid))
        return {
          uuid: group.groupUuid,
          title: group.title,
          avatar: chatGroupAvatar(group),
          sub: chatGroupMeta(group, { t, d }),
          chosen,
          waits: full.value && !chosen,
        }
      }),
    )
    type GroupRow = (typeof offeredGroups.value)[number]
    const groupRows = computed(() =>
      offeredGroups.value.filter(
        (row) => !needle.value || row.title.toLowerCase().includes(needle.value),
      ),
    )
    /** The chosen groups as rows, in the order they were ticked. */
    const chosenGroupRows = computed(() =>
      props.chosenGroups
        .map((uuid) => offeredGroups.value.find((row) => groupKeyOf(row.uuid) === groupKeyOf(uuid)))
        .filter((row): row is GroupRow => Boolean(row)),
    )

    const toggle = (row: Row, checked: boolean) => {
      if (row.later || (checked && waits(row))) {
        return
      }
      const others = props.modelValue.filter((user) => keyOf(user) !== row.id)
      emit('update:modelValue', checked ? [...others, row.contact.user] : others)
    }

    const toggleGroup = (row: GroupRow, checked: boolean) => {
      if (checked && row.waits) {
        return
      }
      const others = props.chosenGroups.filter((uuid) => groupKeyOf(uuid) !== groupKeyOf(row.uuid))
      emit('update:chosenGroups', checked ? [...others, row.uuid] : others)
    }

    return () => (
      <div class='chat-group-picker' data-test='chat-group-picker'>
        <label class='form-label' for={searchId}>
          {props.label || t('chatGroup.pickFrom')}
        </label>
        <input
          id={searchId}
          v-model={search.value}
          type='search'
          class='form-control'
          placeholder={props.placeholder || t('chatGroup.pickSearch')}
          autocomplete='off'
          data-test='chat-group-picker-search'
        />

        {/* Who is chosen, as small faces with their names: what the list below has ticked, at a
            glance, however far it is scrolled. Unticking in the list takes somebody out. */}
        {chosen.value.length || chosenGroupRows.value.length ? (
          <ul
            class={cls('chat-group-picker-chips')}
            aria-label={t('chatGroup.pickChosen')}
            data-test='chat-group-picker-chips'
          >
            {chosenGroupRows.value.map((row) => (
              <li key={row.uuid} class={cls('chat-group-picker-chip')}>
                <AppAvatar size={SMALL_FACE_SIZE} color='#fff' {...row.avatar} />
                <span>{row.title}</span>
              </li>
            ))}
            {chosen.value.map((row) => (
              <li key={row.key} class={cls('chat-group-picker-chip')}>
                <AppAvatar size={SMALL_FACE_SIZE} color='#fff' {...row.avatar} />
                <span>{row.alias}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {/* As many as may be chosen together are chosen (`max`): the others wait, greyed, and this
            says why. */}
        {full.value ? (
          <p class={cls('chat-group-picker-none')} data-test='chat-group-picker-full'>
            {t('chatGroup.pickMax', { max: props.max })}
          </p>
        ) : null}

        {/* The member's groups, where a message may go into one as well (E-059, forwarding): a list
            of their own over the contacts, as on the page. The group's square and its line, as its
            row there shows them. */}
        {props.groups.length ? (
          <>
            <p class={cls('chat-group-picker-head')} data-test='chat-group-picker-groups-head'>
              {t('chatGroup.pickGroups')}
            </p>
            {groupRows.value.length === 0 ? (
              <p class={cls('chat-group-picker-none')} data-test='chat-group-picker-groups-none'>
                {t('chatGroup.pickNoGroupMatch')}
              </p>
            ) : (
              <ul class={cls('chat-group-picker-list')} data-test='chat-group-picker-groups'>
                {groupRows.value.map((row) => (
                  <li key={row.uuid}>
                    <label
                      class={[cls('chat-group-pick'), row.waits ? cls('is-off') : '']}
                      data-test={`chat-group-pick-group-${row.uuid}`}
                    >
                      <input
                        type='checkbox'
                        class={cls('chat-group-pick-box')}
                        checked={row.chosen}
                        disabled={row.waits}
                        onChange={(event: Event) =>
                          toggleGroup(row, (event.target as HTMLInputElement).checked)
                        }
                      />
                      <AppAvatar size={LIST_AVATAR_SIZE} color='#fff' {...row.avatar} />
                      <span class={cls('chat-group-pick-words')}>
                        <span class={cls('chat-group-pick-name')}>{row.title}</span>
                        <span class={cls('chat-group-pick-sub')}>{row.sub}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <p class={cls('chat-group-picker-head')} data-test='chat-group-picker-contacts-head'>
              {t('chatGroup.pickContacts')}
            </p>
          </>
        ) : null}

        {rows.value.length === 0 ? (
          <p class={cls('chat-group-picker-none')} data-test='chat-group-picker-none'>
            {props.contacts.length === 0
              ? props.noContactsText || t('chatGroup.pickNoContacts')
              : t('chatGroup.pickNoMatch')}
          </p>
        ) : (
          /* One row a contact: the box, the face, the name, where they belong. The whole row is the
             box's label, so a tap anywhere on it ticks it. ⛔ The face is not zoomable here: a
             zoomable face is a button of its own and would swallow the tap meant for the box -- and
             only for members with a picture (contactDisplay's default).

             A contact of another community stands greyed with the reason (E-050 F2): groups across
             the border come later (P6). */
          <ul class={cls('chat-group-picker-list')} data-test='chat-group-picker-list'>
            {rows.value.map((row) => (
              <li key={row.key}>
                <label
                  class={[cls('chat-group-pick'), row.later || waits(row) ? cls('is-off') : '']}
                  data-test={`chat-group-pick-${row.contact.user.gradidoID}`}
                >
                  <input
                    type='checkbox'
                    class={cls('chat-group-pick-box')}
                    checked={isChosen(row)}
                    disabled={row.later || waits(row)}
                    onChange={(event: Event) =>
                      toggle(row, (event.target as HTMLInputElement).checked)
                    }
                  />
                  <AppAvatar size={LIST_AVATAR_SIZE} color='#fff' {...row.avatar} />
                  <span class={cls('chat-group-pick-words')}>
                    <span class={cls('chat-group-pick-name')}>{row.alias}</span>
                    <span class={cls('chat-group-pick-sub')}>
                      {row.later
                        ? t('chatGroup.pickLater', {
                            community: row.contact.user.communityName ?? '',
                          })
                        : (row.contact.user.communityName ?? '')}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  },
})
