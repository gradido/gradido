<template>
  <div class="creation-groups">
    <div class="h2 mb-3">{{ $t('creationGroupsAdmin.title') }}</div>
    <div v-if="isAdmin" class="creation-groups-body">
      <p class="text-muted">{{ $t('creationGroupsAdmin.intro') }}</p>

      <div class="creation-groups-form mb-4">
        <div class="h5 mb-2">{{ $t('creationGroupsAdmin.addTitle') }}</div>
        <BFormGroup :label="$t('creationGroupsAdmin.name')" class="mb-2">
          <BFormInput
            v-model="newName"
            :placeholder="$t('creationGroupsAdmin.namePlaceholder')"
            @update:model-value="onNewName"
          />
        </BFormGroup>
        <BFormGroup :label="$t('creationGroupsAdmin.tag')" class="mb-2">
          <BFormInput
            v-model="newTag"
            :placeholder="$t('creationGroupsAdmin.tagPlaceholder')"
            @update:model-value="tagTouched = true"
          />
          <small class="text-muted d-block mt-1">{{ $t('creationGroupsAdmin.tagHint') }}</small>
        </BFormGroup>
        <BButton variant="primary" :disabled="creating || !canCreate" @click="create">
          {{ $t('creationGroupsAdmin.add') }}
        </BButton>
      </div>

      <div class="h5 mb-2">{{ $t('creationGroupsAdmin.existingTitle') }}</div>
      <div v-if="tags.length === 0" class="text-muted">{{ $t('creationGroupsAdmin.empty') }}</div>
      <ul v-else class="creation-group-list list-unstyled">
        <li v-for="tag in tags" :key="tag.id" class="creation-group-row">
          <template v-if="editingId === tag.id">
            <BFormInput
              v-model="editName"
              class="creation-group-input"
              :placeholder="$t('creationGroupsAdmin.name')"
            />
            <BFormInput
              v-model="editTag"
              class="creation-group-input"
              :placeholder="$t('creationGroupsAdmin.tag')"
            />
            <BButton size="sm" variant="primary" :disabled="saving" @click="saveEdit(tag)">
              {{ $t('creationGroupsAdmin.save') }}
            </BButton>
            <BButton size="sm" variant="secondary" @click="cancelEdit">
              {{ $t('creationGroupsAdmin.cancel') }}
            </BButton>
          </template>
          <template v-else>
            <span class="creation-group-name">{{ tag.name || '—' }}</span>
            <span class="creation-group text-muted">#{{ tag.tag }}</span>
            <span class="adoption-state text-muted" :data-test="`adoption-state-${tag.id}`">
              {{ adoptionState(tag) }}
            </span>
            <BButton
              size="sm"
              variant="outline-secondary"
              class="ms-auto"
              @click="openAdoption(tag)"
            >
              {{ $t('creationGroupsAdmin.adoption.check') }}
            </BButton>
            <BButton size="sm" variant="outline-secondary" @click="startEdit(tag)">
              {{ $t('creationGroupsAdmin.edit') }}
            </BButton>
          </template>
        </li>
      </ul>

      <!-- Adopting the hashtags that predate the group field. Deliberately its own step:
           it reads every memo, and it writes onto other members' contributions. -->
      <BModal
        v-model="adoptionOpen"
        :title="$t('creationGroupsAdmin.adoption.title', { group: adoptionLabel })"
        :ok-title="adoptionOkTitle"
        :cancel-title="$t('creationGroupsAdmin.cancel')"
        :ok-disabled="adopting || counts === null"
        @ok.prevent="adopt"
      >
        <div v-if="countsLoading" class="text-muted">
          {{ $t('creationGroupsAdmin.adoption.searching') }}
        </div>
        <template v-else-if="counts">
          <p>
            {{
              $t('creationGroupsAdmin.adoption.foundExact', {
                count: counts.exact,
                tag: adoptionTag,
              })
            }}
          </p>
          <BFormCheckbox v-if="counts.loose > 0" v-model="includeLoose" class="mb-2">
            {{
              $t('creationGroupsAdmin.adoption.foundLoose', {
                count: counts.loose,
                tag: adoptionTag,
              })
            }}
          </BFormCheckbox>
          <p v-if="counts.exact === 0 && counts.loose === 0" class="text-muted">
            {{ $t('creationGroupsAdmin.adoption.foundNothing') }}
          </p>
          <small class="text-muted d-block">{{ $t('creationGroupsAdmin.adoption.hint') }}</small>
        </template>
      </BModal>
    </div>
    <div v-else>{{ $t('creationGroupsAdmin.adminOnly') }}</div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useMutation, useQuery, useApolloClient } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useAppToast } from '@/composables/useToast'
import {
  creationGroups as creationGroupsQuery,
  addCreationGroup,
  editCreationGroup,
  legacyHashtagCounts as legacyHashtagCountsQuery,
  adoptLegacyHashtags as adoptLegacyHashtagsMutation,
} from '@/graphql/creationGroups.graphql'

const { t, d } = useI18n()
const store = useStore()
const { toastSuccess, toastError } = useAppToast()

const isAdmin = computed(() => store.state.moderator.roles.includes('ADMIN'))

const { result, error, refetch } = useQuery(creationGroupsQuery, null, {
  fetchPolicy: 'network-only',
  enabled: isAdmin,
})
const tags = computed(() => result.value?.creationGroups ?? [])

watch(error, () => {
  if (error.value) {
    toastError(error.value.message)
  }
})

// --- create a new group ---
const newName = ref('')
const newTag = ref('')
const tagTouched = ref(false)
const creating = ref(false)
const canCreate = computed(() => newTag.value.trim().length > 0)

function slugify(value) {
  // Keep every letter — including umlauts and other accented characters (ä ö ü ß å æ ø …) —
  // and digits; turn runs of whitespace into a hyphen and drop the rest. The backend only
  // rejects whitespace, so whatever survives here is a valid tag.
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

function onNewName() {
  // Suggest a slug from the name until the user edits the tag field by hand.
  if (!tagTouched.value) {
    newTag.value = slugify(newName.value)
  }
}

const { mutate: createMutation } = useMutation(addCreationGroup)

async function create() {
  creating.value = true
  try {
    await createMutation({ tag: newTag.value.trim(), name: newName.value.trim() || null })
    toastSuccess(t('creationGroupsAdmin.created'))
    newName.value = ''
    newTag.value = ''
    tagTouched.value = false
    await refetch()
  } catch (e) {
    toastError(e.message)
  } finally {
    creating.value = false
  }
}

// --- edit an existing group ---
const editingId = ref(null)
const editName = ref('')
const editTag = ref('')
const saving = ref(false)

function startEdit(tag) {
  editingId.value = tag.id
  editName.value = tag.name ?? ''
  editTag.value = tag.tag
}

function cancelEdit() {
  editingId.value = null
}

const { mutate: updateMutation } = useMutation(editCreationGroup)

async function saveEdit(tag) {
  saving.value = true
  try {
    await updateMutation({
      id: tag.id,
      tag: editTag.value.trim(),
      name: editName.value.trim() || null,
    })
    toastSuccess(t('creationGroupsAdmin.updated'))
    editingId.value = null
    await refetch()
  } catch (e) {
    toastError(e.message)
  } finally {
    saving.value = false
  }
}

// --- adopt the hashtags that predate the group field ---
// LEGACY-HASHTAG-ADOPTION -- a changeover aid; see legacyHashtagAdoption.ts for how to
// take the whole thing back out again.
//
// The state is read off the group, not guessed from its age: every group that exists today
// was created before this existed, so "never looked at" has to be a stored fact. That is
// also why the list can show it without reading a single memo.
const adoptionOpen = ref(false)
const adoptionTag = ref(null)
const adoptionLabel = ref('')
const includeLoose = ref(true)
const adopting = ref(false)
const counts = ref(null)
const countsLoading = ref(false)
let adoptionId = null
// Which search the panel is waiting for. Counted rather than compared by group id, so that
// reopening the SAME group also drops the earlier answer -- see openAdoption.
let adoptionRequest = 0

function adoptionState(tag) {
  if (!tag.hashtagsAdoptedAt) {
    return t('creationGroupsAdmin.adoption.stateUnchecked')
  }
  const when = d(new Date(tag.hashtagsAdoptedAt), 'short')
  return tag.hashtagsAdoptedCount
    ? t('creationGroupsAdmin.adoption.stateAdopted', {
        date: when,
        count: tag.hashtagsAdoptedCount,
      })
    : t('creationGroupsAdmin.adoption.stateNothing', { date: when })
}

// Both spellings are ticked by default. The exact one always displayed as the group; the
// blank typo never did, so it is shown with its own count and can be unticked -- but for
// the stock this was built for it is the common case, not the exception.
const adoptionOkTitle = computed(() => {
  const total = (counts.value?.exact ?? 0) + (includeLoose.value ? (counts.value?.loose ?? 0) : 0)
  return total > 0
    ? t('creationGroupsAdmin.adoption.adopt', { count: total })
    : t('creationGroupsAdmin.adoption.markChecked')
})

// ⚠️ NOT useLazyQuery. Its load() answers only on the FIRST call and returns a bare `false`
// on every one after that, without asking the server -- so opening a second group reported
// whatever the fallback said. Asking the client directly runs every time, which is what a
// panel opened once per group needs.
const { client } = useApolloClient()

// ⚠️ Every way out of here has to ask whether this search is still the one being waited
// for. Closing the panel and opening another group starts a second search while the first
// is still running, and the first one coming back late must not touch the screen at all:
// not its counts (they would show under the other group's title, with the confirm button
// live -- and confirming adopts the group in adoptionId, not the one whose numbers are on
// screen), not its error (it would close the panel that is now searching for something
// else), and not its spinner (clearing it leaves the panel blank until the real answer
// lands). A superseded search is dropped in silence; its outcome is of no interest to
// anyone, and the search that replaced it reports for itself.
async function openAdoption(tag) {
  const request = ++adoptionRequest
  const current = () => request === adoptionRequest
  adoptionId = tag.id
  adoptionTag.value = tag.tag
  adoptionLabel.value = tag.name || `#${tag.tag}`
  includeLoose.value = true
  counts.value = null
  adoptionOpen.value = true
  countsLoading.value = true
  try {
    const { data } = await client.query({
      query: legacyHashtagCountsQuery,
      variables: { id: tag.id },
      fetchPolicy: 'network-only',
    })
    if (!current()) {
      return
    }
    // No fallback on purpose. A missing answer is not "nothing found" -- reading it as zero
    // is exactly what made a broken query look like an empty result.
    if (!data?.legacyHashtagCounts) {
      throw new Error(t('creationGroupsAdmin.adoption.searchFailed'))
    }
    counts.value = data.legacyHashtagCounts
  } catch (e) {
    if (!current()) {
      return
    }
    toastError(e.message)
    adoptionOpen.value = false
  } finally {
    if (current()) {
      countsLoading.value = false
    }
  }
}

const { mutate: adoptMutation } = useMutation(adoptLegacyHashtagsMutation)

// Runs even when nothing was found: that is what writes the "looked at" date, and without
// it a group with nothing to adopt would keep asking to be checked forever.
async function adopt() {
  adopting.value = true
  try {
    await adoptMutation({ id: adoptionId, includeLoose: includeLoose.value })
    toastSuccess(t('creationGroupsAdmin.adoption.done'))
    adoptionOpen.value = false
    await refetch()
  } catch (e) {
    toastError(e.message)
  } finally {
    adopting.value = false
  }
}
</script>

<style scoped>
.creation-groups-body {
  max-width: 720px;
}

.creation-groups-form {
  max-width: 640px;
}

.creation-group-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid rgb(0 0 0 / 7.5%);
}

.creation-group-name {
  font-weight: 500;
}

.creation-group {
  font-size: 0.9em;
}

.creation-group-input {
  max-width: 220px;
}

/* Discreet but present: adopting the old hashtags is a one-off tidy-up, not a state the
   moderator has to live with. */
.adoption-state {
  font-size: 0.85em;
}
</style>
