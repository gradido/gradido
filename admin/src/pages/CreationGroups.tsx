// AI-GENERATED — not an architecture reference
import { useApolloClient, useMutation, useQuery } from '@vue/apollo-composable'
import { BButton, BFormCheckbox, BFormGroup, BFormInput, BModal } from 'bootstrap-vue-next'
import { computed, defineComponent, ref, watch, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import {
  addCreationGroup,
  adoptLegacyHashtags as adoptLegacyHashtagsMutation,
  creationGroups as creationGroupsQuery,
  editCreationGroup,
  legacyHashtagCounts as legacyHashtagCountsQuery,
} from '@/graphql/creationGroups.graphql'
import { useAdminStore } from '@/store/useAdminStore'
import classes from './CreationGroups.module.css'

type CreationGroup = {
  id: number
  tag: string
  name?: string | null
  hashtagsAdoptedAt?: string | null
  hashtagsAdoptedCount?: number | null
}

type HashtagCounts = { exact: number; loose: number }

function slugify(value: string) {
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

export const CreationGroups = defineComponent({
  name: 'CreationGroups',
  setup() {
    const { t, d } = useI18n()
    const store = useAdminStore()
    const { toastSuccess, toastError } = useAppToast()

    const isAdmin = computed(() => (store.moderator as { role?: string }).role === 'ADMIN')

    const { result, error, refetch } = useQuery(creationGroupsQuery, null, {
      fetchPolicy: 'network-only',
      enabled: isAdmin,
    })
    const tags = computed<CreationGroup[]>(() => result.value?.creationGroups ?? [])

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
        toastError((e as Error).message)
      } finally {
        creating.value = false
      }
    }

    // --- edit an existing group ---
    const editingId = ref<number | null>(null)
    const editName = ref('')
    const editTag = ref('')
    const saving = ref(false)

    function startEdit(tag: CreationGroup) {
      editingId.value = tag.id
      editName.value = tag.name ?? ''
      editTag.value = tag.tag
    }

    function cancelEdit() {
      editingId.value = null
    }

    const { mutate: updateMutation } = useMutation(editCreationGroup)

    async function saveEdit(tag: CreationGroup) {
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
        toastError((e as Error).message)
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
    const adoptionTag = ref<string | null>(null)
    const adoptionLabel = ref('')
    const includeLoose = ref(true)
    const adopting = ref(false)
    const counts = ref<HashtagCounts | null>(null)
    const countsLoading = ref(false)
    let adoptionId: number | null = null
    // Which search the panel is waiting for. Counted rather than compared by group id, so that
    // reopening the SAME group also drops the earlier answer -- see openAdoption.
    let adoptionRequest = 0

    function adoptionState(tag: CreationGroup) {
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
      const total =
        (counts.value?.exact ?? 0) + (includeLoose.value ? (counts.value?.loose ?? 0) : 0)
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
    async function openAdoption(tag: CreationGroup) {
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
        toastError((e as Error).message)
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
        toastError((e as Error).message)
      } finally {
        adopting.value = false
      }
    }

    const groupRow = (tag: CreationGroup) =>
      editingId.value === tag.id ? (
        <>
          <BFormInput
            v-model={editName.value}
            class={classes.creationGroupInput}
            placeholder={t('creationGroupsAdmin.name')}
          />
          <BFormInput
            v-model={editTag.value}
            class={classes.creationGroupInput}
            placeholder={t('creationGroupsAdmin.tag')}
          />
          <BButton
            size='sm'
            variant='primary'
            disabled={saving.value}
            onClick={() => saveEdit(tag)}
          >
            {t('creationGroupsAdmin.save')}
          </BButton>
          <BButton size='sm' variant='secondary' onClick={cancelEdit}>
            {t('creationGroupsAdmin.cancel')}
          </BButton>
        </>
      ) : (
        <>
          <span class={classes.creationGroupName}>{tag.name || '—'}</span>
          <span class={[classes.creationGroup, 'text-muted']}>#{tag.tag}</span>
          <span
            class={[classes.adoptionState, 'text-muted']}
            data-test={`adoption-state-${tag.id}`}
          >
            {adoptionState(tag)}
          </span>
          <BButton
            size='sm'
            variant='outline-secondary'
            class='ms-auto'
            onClick={() => openAdoption(tag)}
          >
            {t('creationGroupsAdmin.adoption.check')}
          </BButton>
          <BButton size='sm' variant='outline-secondary' onClick={() => startEdit(tag)}>
            {t('creationGroupsAdmin.edit')}
          </BButton>
        </>
      )

    const adoptionPanel = () => {
      if (countsLoading.value) {
        return <div class='text-muted'>{t('creationGroupsAdmin.adoption.searching')}</div>
      }
      if (!counts.value) {
        return null
      }
      return (
        <>
          <p>
            {t('creationGroupsAdmin.adoption.foundExact', {
              count: counts.value.exact,
              tag: adoptionTag.value,
            })}
          </p>
          {counts.value.loose > 0 ? (
            <BFormCheckbox v-model={includeLoose.value} class='mb-2'>
              {t('creationGroupsAdmin.adoption.foundLoose', {
                count: counts.value.loose,
                tag: adoptionTag.value,
              })}
            </BFormCheckbox>
          ) : null}
          {counts.value.exact === 0 && counts.value.loose === 0 ? (
            <p class='text-muted'>{t('creationGroupsAdmin.adoption.foundNothing')}</p>
          ) : null}
          <small class='text-muted d-block'>{t('creationGroupsAdmin.adoption.hint')}</small>
        </>
      )
    }

    return () => (
      <div class='creation-groups'>
        <div class='h2 mb-3'>{t('creationGroupsAdmin.title')}</div>
        {isAdmin.value ? (
          <div class={classes.creationGroupsBody}>
            <p class='text-muted'>{t('creationGroupsAdmin.intro')}</p>

            <div class={[classes.creationGroupsForm, 'mb-4']}>
              <div class='h5 mb-2'>{t('creationGroupsAdmin.addTitle')}</div>
              <BFormGroup label={t('creationGroupsAdmin.name')} class='mb-2'>
                {/* v-model first, then the suggestion: both listened on update:model-value, in
                    this order, in the template version. */}
                <BFormInput
                  modelValue={newName.value}
                  onUpdate:modelValue={(value) => {
                    newName.value = value as string
                    onNewName()
                  }}
                  placeholder={t('creationGroupsAdmin.namePlaceholder')}
                />
              </BFormGroup>
              <BFormGroup label={t('creationGroupsAdmin.tag')} class='mb-2'>
                <BFormInput
                  modelValue={newTag.value}
                  onUpdate:modelValue={(value) => {
                    newTag.value = value as string
                    tagTouched.value = true
                  }}
                  placeholder={t('creationGroupsAdmin.tagPlaceholder')}
                />
                <small class='text-muted d-block mt-1'>{t('creationGroupsAdmin.tagHint')}</small>
              </BFormGroup>
              <BButton
                variant='primary'
                disabled={creating.value || !canCreate.value}
                onClick={create}
              >
                {t('creationGroupsAdmin.add')}
              </BButton>
            </div>

            <div class='h5 mb-2'>{t('creationGroupsAdmin.existingTitle')}</div>
            {tags.value.length === 0 ? (
              <div class='text-muted'>{t('creationGroupsAdmin.empty')}</div>
            ) : (
              <ul class='creation-group-list list-unstyled'>
                {tags.value.map((tag) => (
                  <li key={tag.id} class={classes.creationGroupRow}>
                    {groupRow(tag)}
                  </li>
                ))}
              </ul>
            )}

            {/* Adopting the hashtags that predate the group field. Deliberately its own step:
                it reads every memo, and it writes onto other members' contributions. */}
            <BModal
              v-model={adoptionOpen.value}
              title={t('creationGroupsAdmin.adoption.title', { group: adoptionLabel.value })}
              okTitle={adoptionOkTitle.value}
              cancelTitle={t('creationGroupsAdmin.cancel')}
              okDisabled={adopting.value || counts.value === null}
              onOk={withModifiers(adopt, ['prevent'])}
            >
              {adoptionPanel()}
            </BModal>
          </div>
        ) : (
          <div>{t('creationGroupsAdmin.adminOnly')}</div>
        )}
      </div>
    )
  },
})
