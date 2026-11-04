// AI-GENERATED — not an architecture reference
import { useMutation, useQuery } from '@vue/apollo-composable'
import { BButton, BFormCheckbox, BFormGroup, BFormInput, BModal } from 'bootstrap-vue-next'
import { computed, defineComponent, reactive, ref, watch, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIsAdmin } from '@/composables/useIsAdmin'
import { useAppToast } from '@/composables/useToast'
import {
  chatVideoServers as chatVideoServersQuery,
  checkChatVideoServersNow,
  createChatVideoServer,
  deleteChatVideoServer,
  updateChatVideoServer,
} from '@/graphql/chatVideoServers.graphql'
import classes from './ChatSettings.module.css'

type ServerCheck = {
  ok: boolean
  reason: string | null
  checkedAt: string
  latencyMs: number | null
  picks: number
}

type ChatVideoServer = {
  id: number
  baseUrl: string
  host: string
  operator: string | null
  roomPrefix: string | null
  note: string | null
  active: boolean
  check: ServerCheck | null
}

type ServerValues = {
  baseUrl: string
  operator: string | null
  roomPrefix: string | null
  note: string | null
}

// The columns of chat_video_servers: the fields cannot take more, and the server refuses more.
const MAX_LENGTH = { baseUrl: 255, operator: 120, prefix: 40, note: 255 }

export const ChatSettings = defineComponent({
  name: 'ChatSettings',
  setup() {
    const { t, locale } = useI18n()
    const { toastSuccess, toastError } = useAppToast()
    const isAdmin = useIsAdmin()

    // The page shows what the pool of the running server holds, as it answers: after every change
    // and after "check now" it asks again. No timer of its own.
    const { result, error, refetch } = useQuery(chatVideoServersQuery, null, {
      fetchPolicy: 'network-only',
      enabled: isAdmin,
    })
    const servers = computed<ChatVideoServer[]>(() => result.value?.chatVideoServers ?? [])
    // "Nothing there" is only said once the server has answered, not while it is being asked.
    const loaded = computed(() => result.value !== undefined && result.value !== null)

    watch(error, () => {
      if (error.value) {
        toastError(error.value.message)
      }
    })

    // The server answers with a code; the sentence is built here, in the admin's language. Literal
    // keys per case, so the i18n lint can see every one of them.
    function reasonText(reason: string | null) {
      switch (reason) {
        case 'UNREACHABLE':
          return t('chatAdmin.reason.UNREACHABLE')
        case 'NOT_JITSI':
          return t('chatAdmin.reason.NOT_JITSI')
        case 'LOGIN_REQUIRED':
          return t('chatAdmin.reason.LOGIN_REQUIRED')
        case 'NO_ANONYMOUS':
          return t('chatAdmin.reason.NO_ANONYMOUS')
        case 'NO_BOSH':
          return t('chatAdmin.reason.NO_BOSH')
        default:
          return reason ?? ''
      }
    }

    function invalidText(reason: string) {
      switch (reason) {
        case 'NOT_HTTPS':
          return t('chatAdmin.errors.invalid.NOT_HTTPS')
        case 'NOT_A_BASE_ADDRESS':
          return t('chatAdmin.errors.invalid.NOT_A_BASE_ADDRESS')
        case 'BAD_PREFIX':
          return t('chatAdmin.errors.invalid.BAD_PREFIX')
        case 'TOO_LONG':
          return t('chatAdmin.errors.invalid.TOO_LONG')
        default:
          return t('chatAdmin.errors.invalid.other', { reason })
      }
    }

    // What went wrong, in words where the server named it; its message where it did not.
    function errorText(e: unknown) {
      const message = (e as { message?: string } | null)?.message ?? String(e)
      const invalid = message.match(/CHAT_VIDEO_SERVER_INVALID: ([A-Z_]+)/)
      if (invalid) {
        return invalidText(invalid[1])
      }
      if (message.includes('CHAT_VIDEO_SERVER_DUPLICATE')) {
        return t('chatAdmin.errors.duplicate')
      }
      if (message.includes('CHAT_VIDEO_SERVER_NOT_FOUND')) {
        return t('chatAdmin.errors.notFound')
      }
      return message
    }

    // A refusal leaves the list as it may no longer be: another tab may have changed it.
    async function failed(e: unknown) {
      toastError(errorText(e))
      await refetch()
    }

    // Operator, prefix and note in one line, joined here rather than in the markup: between
    // elements on lines of their own no space is kept, and the separators came out uneven.
    function detailsOf(server: ChatVideoServer) {
      return [
        server.operator || t('chatAdmin.servers.noOperator'),
        server.roomPrefix ? t('chatAdmin.servers.prefix', { prefix: server.roomPrefix }) : null,
        server.note,
      ]
        .filter(Boolean)
        .join(' · ')
    }

    function stateText(server: ChatVideoServer) {
      const check = server.check
      if (!check) {
        return t('chatAdmin.state.unchecked')
      }
      return check.ok
        ? t('chatAdmin.state.ok', { ms: check.latencyMs ?? '–' })
        : t('chatAdmin.state.failed', { reason: reasonText(check.reason) })
    }

    function stateClass(server: ChatVideoServer) {
      if (!server.check) {
        return 'text-secondary'
      }
      return server.check.ok ? 'text-success' : 'text-danger'
    }

    // How long ago, in the admin's language: Intl knows all ten of them (date-fns' locales in
    // useDateLocale only five). At least a second ago -- the server's clock may run a little ahead.
    function checkedWhen(check: ServerCheck) {
      const seconds = Math.min(
        -1,
        Math.round((new Date(check.checkedAt).getTime() - Date.now()) / 1000),
      )
      const format = new Intl.RelativeTimeFormat(locale.value, { numeric: 'always' })
      if (seconds > -60) {
        return format.format(seconds, 'second')
      }
      if (seconds > -3600) {
        return format.format(Math.round(seconds / 60), 'minute')
      }
      if (seconds > -86400) {
        return format.format(Math.round(seconds / 3600), 'hour')
      }
      return format.format(Math.round(seconds / 86400), 'day')
    }

    // The input as the server takes it: what the page shows, trimmed; empty is none. Without a tick
    // where none is given: the server then keeps the tick the row has.
    function inputOf(values: ServerValues, active?: boolean) {
      const orNone = (value: string | null) => (value ?? '').trim() || null
      const input = {
        baseUrl: values.baseUrl.trim(),
        operator: orNone(values.operator),
        roomPrefix: orNone(values.roomPrefix),
        note: orNone(values.note),
      }
      return active === undefined ? input : { ...input, active }
    }

    // --- add a server ---
    const emptyForm = () => ({ baseUrl: '', operator: '', roomPrefix: '', note: '', active: true })
    const form = reactive(emptyForm())
    const creating = ref(false)
    const { mutate: createMutation } = useMutation(createChatVideoServer)

    async function create() {
      creating.value = true
      try {
        await createMutation({ input: inputOf(form, form.active) })
        toastSuccess(t('chatAdmin.created'))
        Object.assign(form, emptyForm())
        await refetch()
      } catch (e) {
        await failed(e)
      } finally {
        creating.value = false
      }
    }

    // --- edit a server in its row ---
    const editingId = ref<number | null>(null)
    const edit = reactive(emptyForm())
    const saving = ref(false)
    const { mutate: updateMutation } = useMutation(updateChatVideoServer)

    function startEdit(server: ChatVideoServer) {
      editingId.value = server.id
      Object.assign(edit, {
        baseUrl: server.baseUrl,
        operator: server.operator ?? '',
        roomPrefix: server.roomPrefix ?? '',
        note: server.note ?? '',
      })
    }

    function cancelEdit() {
      editingId.value = null
    }

    async function saveEdit(server: ChatVideoServer) {
      saving.value = true
      try {
        // ⛔ No tick: the edit form does not show it, and the box beside the row may have switched
        // it since the form opened, in another tab. The server keeps the row's own.
        await updateMutation({ id: server.id, input: inputOf(edit) })
        toastSuccess(t('chatAdmin.updated'))
        editingId.value = null
        await refetch()
      } catch (e) {
        await failed(e)
      } finally {
        saving.value = false
      }
    }

    // --- the tick "in the random choice", switched at once ---
    // What the box shows while the change is under way. The row only says what the server holds
    // once it has answered; without this, a box whose change the server refused would keep
    // showing the tick it never got.
    const pendingActive = reactive<Record<number, boolean>>({})
    const togglingId = ref<number | null>(null)

    function shownActive(server: ChatVideoServer) {
      return pendingActive[server.id] ?? server.active
    }

    async function setActive(server: ChatVideoServer, active: boolean) {
      pendingActive[server.id] = active
      togglingId.value = server.id
      try {
        const input = {
          baseUrl: server.baseUrl,
          operator: server.operator,
          roomPrefix: server.roomPrefix,
          note: server.note,
          active,
        }
        await updateMutation({ id: server.id, input })
        toastSuccess(
          active
            ? t('chatAdmin.servers.activeOn', { host: server.host })
            : t('chatAdmin.servers.activeOff', { host: server.host }),
        )
        await refetch()
      } catch (e) {
        await failed(e)
      } finally {
        delete pendingActive[server.id]
        togglingId.value = null
      }
    }

    // --- remove a server, after asking ---
    const removeOpen = ref(false)
    const removeTarget = ref<ChatVideoServer | null>(null)
    const removing = ref(false)
    const { mutate: deleteMutation } = useMutation(deleteChatVideoServer)

    function askRemove(server: ChatVideoServer) {
      removeTarget.value = server
      removeOpen.value = true
    }

    async function confirmRemove() {
      removing.value = true
      try {
        await deleteMutation({ id: removeTarget.value?.id })
        toastSuccess(t('chatAdmin.removed'))
        removeOpen.value = false
        await refetch()
      } catch (e) {
        removeOpen.value = false
        await failed(e)
      } finally {
        removing.value = false
      }
    }

    // --- check every server now ---
    const checking = ref(false)
    const { mutate: checkMutation } = useMutation(checkChatVideoServersNow)

    async function checkNow() {
      checking.value = true
      try {
        const answer = await checkMutation()
        const rows: ChatVideoServer[] = answer?.data?.checkChatVideoServersNow ?? []
        toastSuccess(
          t('chatAdmin.servers.checked', {
            ok: rows.filter((row) => row.check?.ok).length,
            count: rows.length,
          }),
        )
        await refetch()
      } catch (e) {
        await failed(e)
      } finally {
        checking.value = false
      }
    }

    const serverRow = (server: ChatVideoServer) => (
      <li key={server.id} class={classes.chatServerRow} data-test={`server-${server.id}`}>
        {editingId.value === server.id ? (
          <div class={classes.chatServerEdit}>
            <BFormInput
              v-model={edit.baseUrl}
              aria-label={t('chatAdmin.form.baseUrl')}
              maxlength={MAX_LENGTH.baseUrl}
              data-test='edit-base-url'
            />
            <BFormInput
              v-model={edit.operator}
              aria-label={t('chatAdmin.form.operator')}
              placeholder={t('chatAdmin.form.operator')}
              maxlength={MAX_LENGTH.operator}
              data-test='edit-operator'
            />
            <BFormInput
              v-model={edit.roomPrefix}
              aria-label={t('chatAdmin.form.prefix')}
              placeholder={t('chatAdmin.form.prefix')}
              maxlength={MAX_LENGTH.prefix}
              data-test='edit-prefix'
            />
            <BFormInput
              v-model={edit.note}
              aria-label={t('chatAdmin.form.note')}
              placeholder={t('chatAdmin.form.note')}
              maxlength={MAX_LENGTH.note}
              data-test='edit-note'
            />
            <div class={classes.chatServerButtons}>
              <BButton
                size='sm'
                variant='primary'
                disabled={saving.value || !edit.baseUrl.trim()}
                data-test='edit-save'
                onClick={() => saveEdit(server)}
              >
                {t('chatAdmin.save')}
              </BButton>
              <BButton size='sm' variant='secondary' data-test='edit-cancel' onClick={cancelEdit}>
                {t('overlay.cancel')}
              </BButton>
            </div>
          </div>
        ) : (
          <>
            <div class={classes.chatServerWhat}>
              <div class={classes.chatServerAddress}>{server.baseUrl}</div>
              <div
                class={[classes.chatServerDetails, 'text-muted']}
                data-test={`details-${server.id}`}
              >
                {detailsOf(server)}
              </div>
            </div>
            <div class={classes.chatServerState} data-test={`state-${server.id}`}>
              <span class={['chat-server-state-word', stateClass(server)]}>
                {stateText(server)}
              </span>
              {server.check ? (
                <small class='d-block text-muted'>
                  {t('chatAdmin.state.checkedAt', { when: checkedWhen(server.check) })}
                </small>
              ) : null}
              {server.check ? (
                <small class='d-block text-muted'>
                  {t('chatAdmin.servers.picks', { count: server.check.picks })}
                </small>
              ) : null}
            </div>
            <div class={classes.chatServerControls}>
              <BFormCheckbox
                class='chat-server-active'
                modelValue={shownActive(server)}
                disabled={togglingId.value === server.id}
                title={t('chatAdmin.servers.activeTitle')}
                data-test={`active-${server.id}`}
                onUpdate:modelValue={(active: unknown) => setActive(server, active as boolean)}
              >
                {t('chatAdmin.servers.active')}
              </BFormCheckbox>
              <BButton
                size='sm'
                variant='outline-secondary'
                data-test={`edit-${server.id}`}
                onClick={() => startEdit(server)}
              >
                {t('chatAdmin.edit')}
              </BButton>
              <BButton
                size='sm'
                variant='outline-danger'
                data-test={`remove-${server.id}`}
                onClick={() => askRemove(server)}
              >
                {t('chatAdmin.remove')}
              </BButton>
            </div>
          </>
        )}
      </li>
    )

    return () => (
      <div class='chat-settings'>
        <div class='h2 mb-3'>{t('chatAdmin.title')}</div>
        {isAdmin.value ? (
          <div class={classes.chatSettingsBody}>
            <div class='h4 mt-4 mb-1'>{t('chatAdmin.servers.title')}</div>
            <small class='text-muted d-block'>{t('chatAdmin.servers.hint')}</small>
            <small class='text-muted d-block mb-3'>{t('chatAdmin.servers.fairness')}</small>

            <BButton
              variant='outline-primary'
              class='mb-3'
              disabled={checking.value}
              data-test='check-now'
              onClick={checkNow}
            >
              {checking.value ? t('chatAdmin.servers.checking') : t('chatAdmin.servers.checkNow')}
            </BButton>

            {loaded.value && servers.value.length === 0 ? (
              <div class='text-muted mb-3' data-test='servers-empty'>
                {t('chatAdmin.servers.empty')}
              </div>
            ) : (
              <ul class='chat-server-list list-unstyled'>{servers.value.map(serverRow)}</ul>
            )}

            <div class='h5 mt-4 mb-2'>{t('chatAdmin.form.addTitle')}</div>
            <div class={classes.chatServerForm}>
              <BFormGroup label={t('chatAdmin.form.baseUrl')} class='mb-2'>
                <BFormInput
                  v-model={form.baseUrl}
                  placeholder='https://'
                  maxlength={MAX_LENGTH.baseUrl}
                  data-test='form-base-url'
                />
                <small class='text-muted d-block mt-1'>{t('chatAdmin.form.baseUrlHint')}</small>
              </BFormGroup>
              <BFormGroup label={t('chatAdmin.form.operator')} class='mb-2'>
                <BFormInput
                  v-model={form.operator}
                  maxlength={MAX_LENGTH.operator}
                  data-test='form-operator'
                />
                <small class='text-muted d-block mt-1'>{t('chatAdmin.form.operatorHint')}</small>
              </BFormGroup>
              <BFormGroup label={t('chatAdmin.form.prefix')} class='mb-2'>
                <BFormInput
                  v-model={form.roomPrefix}
                  maxlength={MAX_LENGTH.prefix}
                  data-test='form-prefix'
                />
                <small class='text-muted d-block mt-1'>{t('chatAdmin.form.prefixHint')}</small>
              </BFormGroup>
              <BFormGroup label={t('chatAdmin.form.note')} class='mb-2'>
                <BFormInput v-model={form.note} maxlength={MAX_LENGTH.note} data-test='form-note' />
              </BFormGroup>
              <BFormCheckbox v-model={form.active} class='mb-3' data-test='form-active'>
                {t('chatAdmin.form.active')}
              </BFormCheckbox>
              <BButton
                variant='primary'
                disabled={creating.value || !form.baseUrl.trim()}
                data-test='form-add'
                onClick={create}
              >
                {t('chatAdmin.form.add')}
              </BButton>
            </div>

            <BModal
              v-model={removeOpen.value}
              title={t('chatAdmin.removeDialog.title')}
              okTitle={t('chatAdmin.removeDialog.confirm')}
              okVariant='danger'
              cancelTitle={t('overlay.cancel')}
              okDisabled={removing.value}
              data-test='remove-dialog'
              onOk={withModifiers(confirmRemove, ['prevent'])}
            >
              {/* The key renews the <p> when the host changes, as the template's text update did.
                  BModal drops its invisible fallback Tab stop only when a child node is added or
                  removed; changing the text in place, as JSX does, leaves it in the dialog. */}
              <p key={removeTarget.value?.host}>
                {t('chatAdmin.removeDialog.question', { host: removeTarget.value?.host ?? '' })}
              </p>
              <small class='text-muted'>{t('chatAdmin.removeDialog.hint')}</small>
            </BModal>
          </div>
        ) : (
          <div>{t('chatAdmin.adminOnly')}</div>
        )}
      </div>
    )
  },
})
