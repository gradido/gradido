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
            <BButton size="sm" variant="outline-secondary" class="ms-auto" @click="startEdit(tag)">
              {{ $t('groupTagsAdmin.edit') }}
            </BButton>
          </template>
        </li>
      </ul>
    </div>
    <div v-else>{{ $t('groupTagsAdmin.adminOnly') }}</div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useAppToast } from '@/composables/useToast'
import {
  groupTags as groupTagsQuery,
  createGroupTag,
  updateGroupTag,
} from '@/graphql/groupTags.graphql'

const { t } = useI18n()
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
</style>
