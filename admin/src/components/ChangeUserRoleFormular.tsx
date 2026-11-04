// AI-GENERATED — not an architecture reference
import { useMutation, useQuery } from '@vue/apollo-composable'
import { BButton, BFormCheckbox, BFormSelect } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ThemedSelect } from '@/components/ThemedSelect'
import { useAppToast } from '@/composables/useToast'
import { useAdminStore } from '@/store/useAdminStore'
import { creationGroupOption } from '@/utils/creationGroupLabel'
import { isTheModerator } from '@/utils/theModerator'
import {
  creationGroups,
  moderatorCreationGroupScope,
  setModeratorCreationGroupScope as setModeratorCreationGroupScopeMutation,
  setUserCreationGroups as setUserCreationGroupsMutation,
  userCreationGroups,
} from '../graphql/creationGroups.graphql'
import { setCreationAllowed as setCreationAllowedMutation } from '../graphql/setCreationAllowed'
import { setUserRole as setUserRoleMutation } from '../graphql/setUserRole'
import './ChangeUserRoleFormular.css'

const rolesValues = {
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  MODERATOR_AI: 'MODERATOR_AI',
  USER: 'USER',
} as const

export type Role = keyof typeof rolesValues

type RoleMember = {
  userId: number
  gradidoID?: string
  communityUuid?: string
  role?: Role | null
  creationAllowed?: boolean
}

export const ChangeUserRoleFormular = defineComponent({
  name: 'ChangeUserRoleFormular',
  props: {
    item: {
      type: Object as PropType<RoleMember>,
      required: true,
    },
  },
  emits: ['update-role', 'show-modal', 'select-role', 'update-creation-allowed'],
  setup(props, { emit, expose }) {
    const { t } = useI18n()
    const store = useAdminStore()
    const { toastError, toastSuccess } = useAppToast()

    const getCurrentRole = (): string => {
      if (props.item.role) {
        return rolesValues[props.item.role]
      }
      return rolesValues.USER
    }
    const currentRole = ref(getCurrentRole())
    const roleSelected = ref(getCurrentRole())

    // Signed in, there is always a moderator; without one this throws, as it did. The store
    // (JS) declares `moderator: null`, so its type knows no other value.
    const isModeratorRoleAdmin = computed(
      () => (store.moderator as unknown as { role?: string }).role === 'ADMIN',
    )
    const isSelf = computed(() => isTheModerator(store.moderator, props.item))

    const roles = computed(() => [
      { value: rolesValues.USER, text: t('userRole.selectRoles.user') },
      { value: rolesValues.MODERATOR, text: t('userRole.selectRoles.moderator') },
      { value: rolesValues.MODERATOR_AI, text: t('userRole.selectRoles.moderatorAi') },
      { value: rolesValues.ADMIN, text: t('userRole.selectRoles.admin') },
    ])

    // Both moderator kinds carry the same visibility scope — a KI-Moderator is a moderator who
    // may additionally use Crea, not a wider role.
    const showModeratorScope = computed(
      () =>
        roleSelected.value === rolesValues.MODERATOR ||
        roleSelected.value === rolesValues.MODERATOR_AI,
    )

    const showModal = async () => {
      emit('show-modal')
    }

    const { mutate: setUserRole } = useMutation(setUserRoleMutation)

    const updateUserRole = (newRole: string, oldRole: string) => {
      // A role that is not offered throws here, as it did
      const role = roles.value.find((role) => role.value === newRole) as {
        value: string
        text: string
      }
      const roleText = role.text
      // A usual member has no role: USER is the absence of one, and that is null on the wire.
      const roleValue = role.value === rolesValues.USER ? null : role.value

      setUserRole({
        userId: props.item.userId,
        role: roleValue,
      })
        .then(() => {
          emit('update-role', {
            userId: props.item.userId,
            role: roleValue,
          })
          toastSuccess(
            t('userRole.successfullyChangedTo', {
              role: roleText,
            }),
          )
        })
        .catch((error: Error) => {
          roleSelected.value = oldRole
          toastError(error.message)
        })
    }

    // --- Group functions: user main tag + moderator visibility scope ---
    const { result: creationGroupsResult } = useQuery(creationGroups)
    const creationGroupOptions = computed(() => creationGroupsResult.value?.creationGroups ?? [])

    // The user's personal main tag (pre-filled on submission). Setting it here heals a
    // forgotten/misspelled tag at the source, not just on a single contribution.
    // network-only plus an explicit refetch after saving: both queries answer with a bare list
    // of scalars, which Apollo cannot normalise, so a mutation leaves the cached entry standing.
    // The form is mounted and unmounted with the details row, so a cached answer would come
    // back on the next open and show the value from before the change.
    const { result: userTagsResult, refetch: refetchUserTags } = useQuery(
      userCreationGroups,
      () => ({ userId: props.item.userId }),
      { fetchPolicy: 'network-only' },
    )
    const userMainTag = ref('')
    watch(
      userTagsResult,
      (value) => {
        userMainTag.value = value?.userCreationGroups?.[0]?.tag ?? ''
      },
      { immediate: true },
    )
    const mainTagSelectOptions = computed(() => [
      { value: '', text: t('userRole.creationGroups.none') },
      ...creationGroupOptions.value.map(creationGroupOption),
    ])
    const { mutate: setUserCreationGroups } = useMutation(setUserCreationGroupsMutation)
    const saveUserMainTag = async () => {
      try {
        await setUserCreationGroups({
          userId: props.item.userId,
          tags: userMainTag.value ? [userMainTag.value] : [],
        })
        await refetchUserTags()
        toastSuccess(t('userRole.savedCreationGroups'))
      } catch (error) {
        toastError((error as Error).message)
      }
    }

    // The moderator's visibility scope: which creation groups they may see/edit. Sentinels
    // '*all' (everything) and '*untagged' (contributions without a tag). Empty = all.
    const { result: scopeResult, refetch: refetchScope } = useQuery(
      moderatorCreationGroupScope,
      () => ({ userId: props.item.userId }),
      // Only an administrator may read a scope, and only a moderator has one, so asking for
      // every expanded row would earn a 401 per ordinary user.
      { fetchPolicy: 'network-only', enabled: showModeratorScope },
    )
    const moderatorScope = ref<string[]>([])
    watch(
      scopeResult,
      (value) => {
        moderatorScope.value = value?.moderatorCreationGroupScope ?? []
      },
      { immediate: true },
    )
    const scopeSelectOptions = computed(() => [
      { value: '*all', text: t('userRole.scope.all') },
      { value: '*untagged', text: t('userRole.scope.untagged') },
      ...creationGroupOptions.value.map(creationGroupOption),
    ])
    const { mutate: setModeratorCreationGroupScope } = useMutation(
      setModeratorCreationGroupScopeMutation,
    )
    const saveScope = async () => {
      try {
        await setModeratorCreationGroupScope({
          userId: props.item.userId,
          scope: moderatorScope.value,
        })
        await refetchScope()
        toastSuccess(t('userRole.savedScope'))
      } catch (error) {
        toastError((error as Error).message)
      }
    }

    // --- ES-021: may this account create? ---
    // `!== false`: a row from before the field existed says nothing, and nothing means the
    // default every account has -- a person who may create.
    const creationAllowed = ref(props.item.creationAllowed !== false)
    // One request at a time: a second flip while the first is out would let the older answer
    // win and hand the table a stale value.
    const savingCreationAllowed = ref(false)
    const { mutate: setCreationAllowed } = useMutation(setCreationAllowedMutation)
    const saveCreationAllowed = async (allowed: boolean) => {
      if (savingCreationAllowed.value) {
        return
      }
      savingCreationAllowed.value = true
      try {
        const result = await setCreationAllowed({ userId: props.item.userId, allowed })
        const now = result?.data?.setCreationAllowed ?? allowed
        creationAllowed.value = now
        emit('update-creation-allowed', { userId: props.item.userId, creationAllowed: now })
        toastSuccess(
          now
            ? t('userRole.creationAllowed.switchedOn')
            : t('userRole.creationAllowed.switchedOff'),
        )
      } catch (error) {
        // The switch shows the row, not the wish.
        creationAllowed.value = !allowed
        toastError((error as Error).message)
      } finally {
        savingCreationAllowed.value = false
      }
    }

    expose({ currentRole, roleSelected, updateUserRole, saveCreationAllowed })

    const roleForm = () => {
      if (!isModeratorRoleAdmin.value) {
        // ⚠️ Meant to name the member's role: `roles.find((role) => role.value ===
        // currentRole.value)?.text`. The template compared with `currentRole.value` on the
        // already unwrapped string -- undefined, so it never found one, and a moderator always
        // saw an empty line here. Kept as it was.
        return <div class='m-3 mb-4' />
      }
      if (isSelf.value) {
        return <div class='m-3 mb-4'>{t('userRole.notChangeYourSelf')}</div>
      }
      return (
        <div class='m-3'>
          <label for='role' class='me-3'>
            {t('userRole.selectLabel')}
          </label>
          <BFormSelect v-model={roleSelected.value} class='role-select' options={roles.value} />
          <div class='mt-3 mb-5'>
            <BButton variant='danger' onClick={showModal}>
              {t('change_user_role')}
            </BButton>
          </div>

          <hr />
          <div class='mb-3'>
            <label class='d-block mb-1'>{t('userRole.creationGroups.label')}</label>
            <ThemedSelect
              v-model={userMainTag.value}
              class='role-select'
              options={mainTagSelectOptions.value}
              data-test='user-main-tag'
              onChange={saveUserMainTag}
            />
            <small class='d-block text-muted mt-1'>{t('userRole.creationGroups.help')}</small>
          </div>

          {showModeratorScope.value ? (
            <div class='mb-3'>
              <label class='d-block mb-1'>{t('userRole.scope.label')}</label>
              <BFormSelect
                v-model={moderatorScope.value}
                class='role-select'
                options={scopeSelectOptions.value}
                multiple
                selectSize={5}
                data-test='moderator-scope'
                // `change` is no event of BFormSelect: it reaches the element, as it did
                onChange={saveScope}
              />
              <small class='d-block text-muted mt-1'>{t('userRole.scope.help')}</small>
            </div>
          ) : null}
        </div>
      )
    }

    // Half the padding below 992px, as the other forms of an opened member: a phone has no room
    // to spare inside the card.
    return () => (
      <div class='change-user-role-formular'>
        <div class='shadow p-2 p-lg-3 mb-5 rounded'>
          {roleForm()}

          {/* ES-021: "may create" -- next to the roles, because it is a right, but NOT a role:
              one column on the account, both directions. Administrators only (the mutation is
              behind SET_CREATION_ALLOWED); a moderator sees where the switch stands. Outside
              the branches above on purpose: an administrator may flip it on their OWN
              account too, and that branch shows nothing else. */}
          <hr />
          <div class='m-3' data-test='creation-allowed'>
            {isModeratorRoleAdmin.value ? (
              <BFormCheckbox
                // v-model first, then the save -- the order the template called them in
                modelValue={creationAllowed.value}
                onUpdate:modelValue={(value: unknown) => {
                  creationAllowed.value = value as boolean
                  saveCreationAllowed(value as boolean)
                }}
                switch
                disabled={savingCreationAllowed.value}
                data-test='creation-allowed-switch'
              >
                {t('userRole.creationAllowed.label')}
              </BFormCheckbox>
            ) : (
              <div data-test='creation-allowed-readonly'>
                {t('userRole.creationAllowed.label')}:{' '}
                {creationAllowed.value
                  ? t('userRole.creationAllowed.yes')
                  : t('userRole.creationAllowed.no')}
              </div>
            )}
            <small class='d-block text-muted mt-1'>{t('userRole.creationAllowed.help')}</small>
          </div>
        </div>
      </div>
    )
  },
})
