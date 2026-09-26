<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="chat-settings">
    <div class="h2 mb-3">{{ $t('chatAdmin.title') }}</div>
    <div v-if="isAdmin" class="chat-settings-body">
      <div class="h4 mt-4 mb-1">{{ $t('chatAdmin.servers.title') }}</div>
      <small class="text-muted d-block">{{ $t('chatAdmin.servers.hint') }}</small>
      <small class="text-muted d-block mb-3">{{ $t('chatAdmin.servers.fairness') }}</small>

      <BButton
        variant="outline-primary"
        class="mb-3"
        :disabled="checking"
        data-test="check-now"
        @click="checkNow"
      >
        {{ checking ? $t('chatAdmin.servers.checking') : $t('chatAdmin.servers.checkNow') }}
      </BButton>

      <div v-if="loaded && servers.length === 0" class="text-muted mb-3" data-test="servers-empty">
        {{ $t('chatAdmin.servers.empty') }}
      </div>
      <ul v-else class="chat-server-list list-unstyled">
        <li
          v-for="server in servers"
          :key="server.id"
          class="chat-server-row"
          :data-test="`server-${server.id}`"
        >
          <div v-if="editingId === server.id" class="chat-server-edit">
            <BFormInput
              v-model="edit.baseUrl"
              :aria-label="$t('chatAdmin.form.baseUrl')"
              :maxlength="MAX_LENGTH.baseUrl"
              data-test="edit-base-url"
            />
            <BFormInput
              v-model="edit.operator"
              :aria-label="$t('chatAdmin.form.operator')"
              :placeholder="$t('chatAdmin.form.operator')"
              :maxlength="MAX_LENGTH.operator"
              data-test="edit-operator"
            />
            <BFormInput
              v-model="edit.roomPrefix"
              :aria-label="$t('chatAdmin.form.prefix')"
              :placeholder="$t('chatAdmin.form.prefix')"
              :maxlength="MAX_LENGTH.prefix"
              data-test="edit-prefix"
            />
            <BFormInput
              v-model="edit.note"
              :aria-label="$t('chatAdmin.form.note')"
              :placeholder="$t('chatAdmin.form.note')"
              :maxlength="MAX_LENGTH.note"
              data-test="edit-note"
            />
            <div class="chat-server-buttons">
              <BButton
                size="sm"
                variant="primary"
                :disabled="saving || !edit.baseUrl.trim()"
                data-test="edit-save"
                @click="saveEdit(server)"
              >
                {{ $t('chatAdmin.save') }}
              </BButton>
              <BButton size="sm" variant="secondary" data-test="edit-cancel" @click="cancelEdit">
                {{ $t('overlay.cancel') }}
              </BButton>
            </div>
          </div>
          <template v-else>
            <div class="chat-server-what">
              <div class="chat-server-address">{{ server.baseUrl }}</div>
              <div class="chat-server-details text-muted" :data-test="`details-${server.id}`">
                {{ detailsOf(server) }}
              </div>
            </div>
            <div class="chat-server-state" :data-test="`state-${server.id}`">
              <span :class="['chat-server-state-word', stateClass(server)]">
                {{ stateText(server) }}
              </span>
              <small v-if="server.check" class="d-block text-muted">
                {{ $t('chatAdmin.state.checkedAt', { when: checkedWhen(server.check) }) }}
              </small>
              <small v-if="server.check" class="d-block text-muted">
                {{ $t('chatAdmin.servers.picks', { count: server.check.picks }) }}
              </small>
            </div>
            <div class="chat-server-controls">
              <BFormCheckbox
                class="chat-server-active"
                :model-value="shownActive(server)"
                :disabled="togglingId === server.id"
                :title="$t('chatAdmin.servers.activeTitle')"
                :data-test="`active-${server.id}`"
                @update:model-value="(active) => setActive(server, active)"
              >
                {{ $t('chatAdmin.servers.active') }}
              </BFormCheckbox>
              <BButton
                size="sm"
                variant="outline-secondary"
                :data-test="`edit-${server.id}`"
                @click="startEdit(server)"
              >
                {{ $t('chatAdmin.edit') }}
              </BButton>
              <BButton
                size="sm"
                variant="outline-danger"
                :data-test="`remove-${server.id}`"
                @click="askRemove(server)"
              >
                {{ $t('chatAdmin.remove') }}
              </BButton>
            </div>
          </template>
        </li>
      </ul>

      <div class="h5 mt-4 mb-2">{{ $t('chatAdmin.form.addTitle') }}</div>
      <div class="chat-server-form">
        <BFormGroup :label="$t('chatAdmin.form.baseUrl')" class="mb-2">
          <BFormInput
            v-model="form.baseUrl"
            placeholder="https://"
            :maxlength="MAX_LENGTH.baseUrl"
            data-test="form-base-url"
          />
          <small class="text-muted d-block mt-1">{{ $t('chatAdmin.form.baseUrlHint') }}</small>
        </BFormGroup>
        <BFormGroup :label="$t('chatAdmin.form.operator')" class="mb-2">
          <BFormInput
            v-model="form.operator"
            :maxlength="MAX_LENGTH.operator"
            data-test="form-operator"
          />
          <small class="text-muted d-block mt-1">{{ $t('chatAdmin.form.operatorHint') }}</small>
        </BFormGroup>
        <BFormGroup :label="$t('chatAdmin.form.prefix')" class="mb-2">
          <BFormInput
            v-model="form.roomPrefix"
            :maxlength="MAX_LENGTH.prefix"
            data-test="form-prefix"
          />
          <small class="text-muted d-block mt-1">{{ $t('chatAdmin.form.prefixHint') }}</small>
        </BFormGroup>
        <BFormGroup :label="$t('chatAdmin.form.note')" class="mb-2">
          <BFormInput v-model="form.note" :maxlength="MAX_LENGTH.note" data-test="form-note" />
        </BFormGroup>
        <BFormCheckbox v-model="form.active" class="mb-3" data-test="form-active">
          {{ $t('chatAdmin.form.active') }}
        </BFormCheckbox>
        <BButton
          variant="primary"
          :disabled="creating || !form.baseUrl.trim()"
          data-test="form-add"
          @click="create"
        >
          {{ $t('chatAdmin.form.add') }}
        </BButton>
      </div>

      <BModal
        v-model="removeOpen"
        :title="$t('chatAdmin.removeDialog.title')"
        :ok-title="$t('chatAdmin.removeDialog.confirm')"
        ok-variant="danger"
        :cancel-title="$t('overlay.cancel')"
        :ok-disabled="removing"
        data-test="remove-dialog"
        @ok.prevent="confirmRemove"
      >
        <p>{{ $t('chatAdmin.removeDialog.question', { host: removeTarget?.host ?? '' }) }}</p>
        <small class="text-muted">{{ $t('chatAdmin.removeDialog.hint') }}</small>
      </BModal>
    </div>
    <div v-else>{{ $t('chatAdmin.adminOnly') }}</div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { BButton, BFormCheckbox, BFormGroup, BFormInput, BModal } from 'bootstrap-vue-next'
import { useAppToast } from '@/composables/useToast'
import { useIsAdmin } from '@/composables/useIsAdmin'
import {
  chatVideoServers as chatVideoServersQuery,
  checkChatVideoServersNow,
  createChatVideoServer,
  deleteChatVideoServer,
  updateChatVideoServer,
} from '@/graphql/chatVideoServers.graphql'

// The columns of chat_video_servers: the fields cannot take more, and the server refuses more.
const MAX_LENGTH = { baseUrl: 255, operator: 120, prefix: 40, note: 255 }

const { t, locale } = useI18n()
const { toastSuccess, toastError } = useAppToast()
const isAdmin = useIsAdmin()

// The page shows what the pool of the running server holds, as it answers: after every change
// and after "check now" it asks again. No timer of its own.
const { result, error, refetch } = useQuery(chatVideoServersQuery, null, {
  fetchPolicy: 'network-only',
  enabled: isAdmin,
})
const servers = computed(() => result.value?.chatVideoServers ?? [])
// "Nothing there" is only said once the server has answered, not while it is being asked.
const loaded = computed(() => result.value !== undefined && result.value !== null)

watch(error, () => {
  if (error.value) {
    toastError(error.value.message)
  }
})

// The server answers with a code; the sentence is built here, in the admin's language. Literal
// keys per case, so the i18n lint can see every one of them.
function reasonText(reason) {
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

function invalidText(reason) {
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
function errorText(e) {
  const message = e?.message ?? String(e)
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
async function failed(e) {
  toastError(errorText(e))
  await refetch()
}

// Operator, prefix and note in one line, joined here rather than in the template: between
// elements on lines of their own the template keeps no space, and the separators came out
// uneven.
function detailsOf(server) {
  return [
    server.operator || t('chatAdmin.servers.noOperator'),
    server.roomPrefix ? t('chatAdmin.servers.prefix', { prefix: server.roomPrefix }) : null,
    server.note,
  ]
    .filter(Boolean)
    .join(' · ')
}

function stateText(server) {
  const check = server.check
  if (!check) {
    return t('chatAdmin.state.unchecked')
  }
  return check.ok
    ? t('chatAdmin.state.ok', { ms: check.latencyMs ?? '–' })
    : t('chatAdmin.state.failed', { reason: reasonText(check.reason) })
}

function stateClass(server) {
  if (!server.check) {
    return 'text-secondary'
  }
  return server.check.ok ? 'text-success' : 'text-danger'
}

// How long ago, in the admin's language: Intl knows all ten of them (date-fns' locales in
// useDateLocale only five). At least a second ago -- the server's clock may run a little ahead.
function checkedWhen(check) {
  const seconds = Math.min(-1, Math.round((new Date(check.checkedAt) - Date.now()) / 1000))
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
function inputOf(values, active) {
  const orNone = (value) => (value ?? '').trim() || null
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
const editingId = ref(null)
const edit = reactive(emptyForm())
const saving = ref(false)
const { mutate: updateMutation } = useMutation(updateChatVideoServer)

function startEdit(server) {
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

async function saveEdit(server) {
  saving.value = true
  try {
    // ⛔ No tick: the edit form does not show it, and the box beside the row may have switched it
    // since the form opened, in another tab. The server keeps the row's own.
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
const pendingActive = reactive({})
const togglingId = ref(null)

function shownActive(server) {
  return pendingActive[server.id] ?? server.active
}

async function setActive(server, active) {
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
const removeTarget = ref(null)
const removing = ref(false)
const { mutate: deleteMutation } = useMutation(deleteChatVideoServer)

function askRemove(server) {
  removeTarget.value = server
  removeOpen.value = true
}

async function confirmRemove() {
  removing.value = true
  try {
    await deleteMutation({ id: removeTarget.value.id })
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
    const rows = answer?.data?.checkChatVideoServersNow ?? []
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
</script>

<style scoped>
.chat-settings-body {
  max-width: 960px;
}

.chat-server-form {
  max-width: 640px;
}

/* One server per row; on a narrow screen its parts wrap under each other, nothing sticks out. */
.chat-server-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid rgb(0 0 0 / 7.5%);
}

.chat-server-what {
  flex: 2 1 16rem;
  min-width: 0;
}

.chat-server-address {
  font-weight: 500;
  overflow-wrap: anywhere;
}

.chat-server-details {
  font-size: 0.9em;
  overflow-wrap: anywhere;
}

.chat-server-state {
  flex: 1 1 13rem;
  min-width: 0;
}

/* The tick and the two buttons stay together, and wrap as one. */
.chat-server-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
}

.chat-server-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chat-server-edit {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  width: 100%;
}

.chat-server-edit > .form-control {
  flex: 1 1 12rem;
  min-width: 0;
}
</style>
