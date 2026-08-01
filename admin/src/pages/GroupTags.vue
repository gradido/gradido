<template>
  <div class="group-tags">
    <div class="h2 mb-3">{{ $t('groupTagsAdmin.title') }}</div>
    <div v-if="isAdmin" class="group-tags-body">
      <p class="text-muted">{{ $t('groupTagsAdmin.intro') }}</p>

      <div class="group-tags-form mb-4">
        <div class="h5 mb-2">{{ $t('groupTagsAdmin.addTitle') }}</div>
        <BFormGroup :label="$t('groupTagsAdmin.name')" class="mb-2">
          <BFormInput
            v-model="newName"
            :placeholder="$t('groupTagsAdmin.namePlaceholder')"
            @update:model-value="onNewName"
          />
        </BFormGroup>
        <BFormGroup :label="$t('groupTagsAdmin.tag')" class="mb-2">
          <BFormInput
            v-model="newTag"
            :placeholder="$t('groupTagsAdmin.tagPlaceholder')"
            @update:model-value="tagTouched = true"
          />
          <small class="text-muted d-block mt-1">{{ $t('groupTagsAdmin.tagHint') }}</small>
        </BFormGroup>
        <BButton variant="primary" :disabled="creating || !canCreate" @click="create">
          {{ $t('groupTagsAdmin.add') }}
        </BButton>
      </div>

      <div class="h5 mb-2">{{ $t('groupTagsAdmin.existingTitle') }}</div>
      <div v-if="tags.length === 0" class="text-muted">{{ $t('groupTagsAdmin.empty') }}</div>
      <ul v-else class="group-list list-unstyled">
        <li v-for="tag in tags" :key="tag.id" class="group-row">
          <template v-if="editingId === tag.id">
            <BFormInput
              v-model="editName"
              class="group-input"
              :placeholder="$t('groupTagsAdmin.name')"
            />
            <BFormInput
              v-model="editTag"
              class="group-input"
              :placeholder="$t('groupTagsAdmin.tag')"
            />
            <BButton size="sm" variant="primary" :disabled="saving" @click="saveEdit(tag)">
              {{ $t('groupTagsAdmin.save') }}
            </BButton>
            <BButton size="sm" variant="secondary" @click="cancelEdit">
              {{ $t('groupTagsAdmin.cancel') }}
            </BButton>
          </template>
          <template v-else>
            <span class="group-name">{{ tag.name || '—' }}</span>
            <span class="group-tag text-muted">#{{ tag.tag }}</span>
            <span class="adoption-state text-muted" :data-test="`adoption-state-${tag.id}`">
              {{ adoptionState(tag) }}
            </span>
            <BButton
              size="sm"
              variant="outline-secondary"
              class="ms-auto"
              @click="openAdoption(tag)"
            >
              {{ $t('groupTagsAdmin.adoption.check') }}
            </BButton>
            <BButton size="sm" variant="outline-secondary" @click="startEdit(tag)">
              {{ $t('groupTagsAdmin.edit') }}
            </BButton>
          </template>
        </li>
      </ul>

      <!-- Adopting the hashtags that predate the group field. Deliberately its own step:
           it reads every memo, and it writes onto other members' contributions. -->
      <BModal
        v-model="adoptionOpen"
        :title="$t('groupTagsAdmin.adoption.title', { group: adoptionLabel })"
        :ok-title="adoptionOkTitle"
        :cancel-title="$t('groupTagsAdmin.cancel')"
        :ok-disabled="adopting || counts === null"
        @ok.prevent="adopt"
      >
        <div v-if="countsLoading" class="text-muted">
          {{ $t('groupTagsAdmin.adoption.searching') }}
        </div>
        <template v-else-if="counts">
          <p>
            {{
              $t('groupTagsAdmin.adoption.foundExact', { count: counts.exact, tag: adoptionTag })
            }}
          </p>
          <BFormCheckbox v-if="counts.loose > 0" v-model="includeLoose" class="mb-2">
            {{
              $t('groupTagsAdmin.adoption.foundLoose', { count: counts.loose, tag: adoptionTag })
            }}
          </BFormCheckbox>
          <p v-if="counts.exact === 0 && counts.loose === 0" class="text-muted">
            {{ $t('groupTagsAdmin.adoption.foundNothing') }}
          </p>
          <small class="text-muted d-block">{{ $t('groupTagsAdmin.adoption.hint') }}</small>
        </template>
      </BModal>
    </div>
    <div v-else>{{ $t('groupTagsAdmin.adminOnly') }}</div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useMutation, useQuery, useApolloClient } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useAppToast } from '@/composables/useToast'
import {
  groupTags as groupTagsQuery,
  createGroupTag,
  updateGroupTag,
  legacyHashtagCounts as legacyHashtagCountsQuery,
  adoptLegacyHashtags as adoptLegacyHashtagsMutation,
} from '@/graphql/groupTags.graphql'

const { t, d } = useI18n()
const store = useStore()
const { toastSuccess, toastError } = useAppToast()

const isAdmin = computed(() => store.state.moderator.roles.includes('ADMIN'))

const { result, error, refetch } = useQuery(groupTagsQuery, null, {
  fetchPolicy: 'network-only',
  enabled: isAdmin,
})
const tags = computed(() => result.value?.groupTags ?? [])

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

const { mutate: createMutation } = useMutation(createGroupTag)

async function create() {
  creating.value = true
  try {
    await createMutation({ tag: newTag.value.trim(), name: newName.value.trim() || null })
    toastSuccess(t('groupTagsAdmin.created'))
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

const { mutate: updateMutation } = useMutation(updateGroupTag)

async function saveEdit(tag) {
  saving.value = true
  try {
    await updateMutation({
      id: tag.id,
      tag: editTag.value.trim(),
      name: editName.value.trim() || null,
    })
    toastSuccess(t('groupTagsAdmin.updated'))
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

function adoptionState(tag) {
  if (!tag.hashtagsAdoptedAt) {
    return t('groupTagsAdmin.adoption.stateUnchecked')
  }
  const when = d(new Date(tag.hashtagsAdoptedAt), 'short')
  return tag.hashtagsAdoptedCount
    ? t('groupTagsAdmin.adoption.stateAdopted', { date: when, count: tag.hashtagsAdoptedCount })
    : t('groupTagsAdmin.adoption.stateNothing', { date: when })
}

// Both spellings are ticked by default. The exact one always displayed as the group; the
// blank typo never did, so it is shown with its own count and can be unticked -- but for
// the stock this was built for it is the common case, not the exception.
const adoptionOkTitle = computed(() => {
  const total = (counts.value?.exact ?? 0) + (includeLoose.value ? (counts.value?.loose ?? 0) : 0)
  return total > 0
    ? t('groupTagsAdmin.adoption.adopt', { count: total })
    : t('groupTagsAdmin.adoption.markChecked')
})

// ⚠️ NOT useLazyQuery. Its load() answers only on the FIRST call and returns a bare `false`
// on every one after that, without asking the server -- so opening a second group reported
// whatever the fallback said. Asking the client directly runs every time, which is what a
// panel opened once per group needs.
const { client } = useApolloClient()

async function openAdoption(tag) {
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
    // No fallback on purpose. A missing answer is not "nothing found" -- reading it as zero
    // is exactly what made a broken query look like an empty result.
    if (!data?.legacyHashtagCounts) {
      throw new Error(t('groupTagsAdmin.adoption.searchFailed'))
    }
    counts.value = data.legacyHashtagCounts
  } catch (e) {
    toastError(e.message)
    adoptionOpen.value = false
  } finally {
    countsLoading.value = false
  }
}

const { mutate: adoptMutation } = useMutation(adoptLegacyHashtagsMutation)

// Runs even when nothing was found: that is what writes the "looked at" date, and without
// it a group with nothing to adopt would keep asking to be checked forever.
async function adopt() {
  adopting.value = true
  try {
    await adoptMutation({ id: adoptionId, includeLoose: includeLoose.value })
    toastSuccess(t('groupTagsAdmin.adoption.done'))
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
.group-tags-body {
  max-width: 720px;
}

.group-tags-form {
  max-width: 640px;
}

.group-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid rgb(0 0 0 / 7.5%);
}

.group-name {
  font-weight: 500;
}

.group-tag {
  font-size: 0.9em;
}

.group-input {
  max-width: 220px;
}

/* Discreet but present: adopting the old hashtags is a one-off tidy-up, not a state the
   moderator has to live with. */
.adoption-state {
  font-size: 0.85em;
}
</style>
