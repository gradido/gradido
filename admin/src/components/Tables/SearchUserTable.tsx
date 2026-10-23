// AI-GENERATED — not an architecture reference
import {
  BButton,
  BCard,
  BTab,
  BTable,
  BTabs,
  type TableField,
  useModalController,
} from 'bootstrap-vue-next'
import { computed, defineComponent, nextTick, type PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { useAdminStore } from '@/store/useAdminStore'
import IPhCaretDown from '~icons/ph/caret-down'
import IPhCaretUpFill from '~icons/ph/caret-up-fill'
import circleSlash from '../../assets/icons/circle-slash.png'
import elopageFavicon from '../../assets/icons/elopage_favicon.png'
import envelope from '../../assets/icons/envelope.png'
import person from '../../assets/icons/person.png'
import { ChangeUserRoleFormular, type Role } from '../ChangeUserRoleFormular'
import { ConfirmRegisterMailFormular } from '../ConfirmRegisterMailFormular'
import { CreationFormular } from '../CreationFormular'
import { CreationTransactionList } from '../CreationTransactionList'
import { DeletedUserFormular } from '../DeletedUserFormular'
import { MemberWalletLink } from '../MemberWalletLink'
import { TransactionLinkList } from '../TransactionLinkList'
import './SearchUserTable.css'

export type MemberRow = {
  userId: number
  firstName?: string
  lastName?: string
  alias?: string | null
  email?: string
  creation: number[]
  createdAt?: string
  emailChecked?: boolean
  emailConfirmationSend?: string | null
  hasElopage?: boolean
  enabled?: boolean
  deletedAt?: string | Date | null
  role?: Role | null
  creationAllowed?: boolean
  findableOnMap?: boolean
  _showDetails?: boolean
}

type TableRow = {
  value: unknown
  item: MemberRow
  detailsShowing: boolean | string
}

// The parts of the forms under a row this table calls, as they expose them
type RoleForm = {
  roleSelected: string
  currentRole: string
  updateUserRole: (newRole: string, oldRole: string) => void
}
type DeleteForm = {
  deleteUserMutation: () => void
  undeleteUserMutation: () => void
}

const rolesValues = {
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  MODERATOR_AI: 'MODERATOR_AI',
  USER: 'USER',
}

export const SearchUserTable = defineComponent({
  name: 'SearchUserTable',
  props: {
    items: {
      type: Array as PropType<MemberRow[]>,
      required: true,
    },
    fields: {
      type: Array as PropType<TableField<MemberRow>[]>,
      required: true,
    },
    // The short names of the three months of `creation`, in its order: the card a member is on
    // a phone names each amount by its month. The page knows them (useCreationMonths).
    creationMonths: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
  },
  emits: ['update-role', 'update-deleted-at'],
  setup(props, { emit }) {
    const { t, d } = useI18n()
    const { confirm } = useModalController()
    const store = useAdminStore()
    const { toastError } = useAppToast()

    const userChangeForm = ref<RoleForm>()
    const deletedUserForm = ref<DeleteForm>()
    const undeletedUserForm = ref<DeleteForm>()
    const myItems = ref<MemberRow[]>([])
    const creationUserData = ref({})
    const rowDetails = ref()

    // Opened only from an open row, so a row is always selected here
    const selectedRow = computed(() => myItems.value.find((obj) => obj._showDetails) as MemberRow)

    const userRoleChangeConfirmationBody = computed(() => {
      let roleLabel = ''
      switch ((userChangeForm.value as RoleForm).roleSelected) {
        case rolesValues.ADMIN:
          roleLabel = t('userRole.selectRoles.admin')
          break
        case rolesValues.MODERATOR:
          roleLabel = t('userRole.selectRoles.moderator')
          break
        case rolesValues.MODERATOR_AI:
          roleLabel = t('userRole.selectRoles.moderatorAi')
          break
        default:
          roleLabel = t('userRole.selectRoles.user')
          break
      }
      return t('overlay.changeUserRole.question', {
        username: `${selectedRow.value.firstName} ${selectedRow.value.lastName}`,
        newRole: roleLabel,
      })
    })

    const showModal = async () => {
      await confirm?.({
        props: {
          cancelTitle: t('overlay.cancel'),
          centered: true,
          noHeaderClose: true,
          title: t('overlay.changeUserRole.title'),
          okTitle: t('overlay.changeUserRole.yes'),
          okVariant: 'danger',
          body: userRoleChangeConfirmationBody.value,
        },
      })
        .then((ok) => {
          if (ok) {
            const form = userChangeForm.value as RoleForm
            form.updateUserRole(form.roleSelected, form.currentRole)
          }
        })
        .catch((error: Error) => {
          toastError(error.message)
        })
    }

    const showDeleteModal = async () => {
      await confirm?.({
        props: {
          cancelTitle: t('overlay.cancel'),
          centered: true,
          noHeaderClose: true,
          title: t('overlay.deleteUser.title'),
          okTitle: t('overlay.deleteUser.yes'),
          okVariant: 'danger',
          // ⚠️ No prop of the modal in this version of bootstrap-vue-next; handed on as it was
          ...({ static: true } as object),
          body: t('overlay.deleteUser.question', {
            username: `${selectedRow.value.firstName} ${selectedRow.value.lastName}`,
          }),
        },
      })
        .then((ok) => {
          if (ok) {
            ;(deletedUserForm.value as DeleteForm).deleteUserMutation()
          }
        })

        .catch((error: Error) => {
          toastError(error.message)
        })
    }

    const showUndeleteModal = async () => {
      await confirm?.({
        props: {
          cancelTitle: t('overlay.cancel'),
          centered: true,
          noHeaderClose: true,
          title: t('overlay.undeleteUser.title'),
          okTitle: t('overlay.undeleteUser.yes'),
          okVariant: 'success',
          body: t('overlay.undeleteUser.question', {
            username: `${selectedRow.value.firstName} ${selectedRow.value.lastName}`,
          }),
        },
      })
        .then((ok) => {
          if (ok) {
            // What came of it the form reports (update-deleted-at), and the page says so then.
            // The success used to be announced here, before the server had answered.
            ;(undeletedUserForm.value as DeleteForm).undeleteUserMutation()
          }
        })
        .catch((error: Error) => {
          toastError(error.message)
        })
    }

    const updateUserData = (rowItem: MemberRow, newCreation: number[]) => {
      rowItem.creation = newCreation
    }

    /**
     * The row as this table draws it: a copy of the member the page handed in (the watch at the
     * end). What a form under the row changed is written there, as a new address and a creation
     * are -- the page is told as well, but its rows are not the ones on the screen.
     */
    const ownRow = (userId: number) => myItems.value.find((obj) => obj.userId === userId)

    const updateRole = ({ userId, role }: { userId: number; role: Role | null }) => {
      const row = ownRow(userId)
      if (row) {
        row.role = role
      }
      emit('update-role', userId, role)
    }

    /**
     * ⛔ A member deleted or brought back in their open row is shown as that at once. The row
     * used to stay as it was until the list was asked again: the button went on offering to
     * delete a member who was deleted, and the pin or the arrow behind the username led to
     * somebody who was gone (measured in the built admin interface, 13.10.2026).
     */
    const updateDeletedAt = ({
      userId,
      deletedAt,
    }: {
      userId: number
      deletedAt: string | Date | null
    }) => {
      const row = ownRow(userId)
      if (row) {
        row.deletedAt = deletedAt
        // The pin goes with the account: the server gives a deleted member none. Brought back,
        // the row shows the arrow (the bubble, for a contact) until the list is asked again --
        // whether they stand on the map only the server knows.
        if (deletedAt) {
          row.findableOnMap = false
        }
      }
      emit('update-deleted-at', userId, deletedAt)
    }

    const onRowClicked = async (item: MemberRow) => {
      const status = myItems.value.find((obj) => {
        return obj?.userId === item?.userId
      })?._showDetails

      myItems.value.forEach((obj) => {
        if (obj === item) {
          obj._showDetails = !status
        } else {
          obj._showDetails = false
        }
      })
      await nextTick()
    }

    watch(
      () => props.items,
      (items) => {
        myItems.value = items.map((item) => {
          return { ...item, _showDetails: false }
        })
      },
      { immediate: true },
    )

    /**
     * A member's state in words (Bernd, 23.10.2026, AO-006): deleted -- or else an address not
     * confirmed and no purchase at Elopage, either or both -- and active where none of them is.
     * The search delivers no `enabled`. Badges on the card a member is on a phone; at the desk
     * the same words stand beside their symbols (statusCell).
     */
    const statusBadges = (item: MemberRow): { word: string; tone: string }[] => {
      if (item.deletedAt) {
        return [{ word: t('deleted'), tone: 'text-bg-danger' }]
      }
      const badges: { word: string; tone: string }[] = []
      if (!item.emailChecked) {
        badges.push({ word: t('userStatus.emailUnconfirmed'), tone: 'text-bg-warning' })
      }
      if (!item.hasElopage) {
        badges.push({ word: t('userStatus.noElopage'), tone: 'text-bg-secondary' })
      }
      return badges.length > 0 ? badges : [{ word: t('enabled'), tone: 'text-bg-success' }]
    }

    /**
     * The status cell at the desk: each symbol with its word behind it (AO-006).
     *
     * The words stand from 1200px on. Narrower, the column they need made the others break:
     * every row grew by one or two lines (at 768, 800 and 992 to 1024px), and the table reached
     * past the window (51px at 950px, 14px at 992px, where it does not without them). Below
     * 1200px the cell is the one of before, to the pixel -- hence the wrappers and margins as
     * they were (with the words, half the margin behind them). From 1200px on the words still
     * cost a line in the rows or in the head at some widths up to 1440px. Measured in the built
     * bundle with a 36-character address, 23.10.2026. A screen reader hears the word from the
     * symbol's `alt` on every width, so the word beside it is hidden from it.
     */
    const statusWord = (word: string) => (
      <small class='ms-2 d-none d-xl-inline' aria-hidden='true'>
        {word}
      </small>
    )
    const statusCell = (row: TableRow) => (
      <div class='d-flex gap-3 justify-content-end align-items-center'>
        {row.item.deletedAt ? (
          <span class='d-inline-flex align-items-center me-3 me-xl-2'>
            <div
              class='test-deleted-icon position-relative rounded-circle'
              style='width: 40px; height: 40px'
            >
              <img src={circleSlash} alt={t('deleted')} class='position-absolute' />
              <img
                src={person}
                alt=''
                class='position-relative'
                style='transform: translate(50%, 30%)'
              />
            </div>
            {statusWord(t('deleted'))}
          </span>
        ) : null}
        {!row.item.deletedAt ? (
          <span class='d-flex gap-2'>
            {!row.item.emailChecked ? (
              <span class='d-inline-flex align-items-center me-3 me-xl-2'>
                <div
                  class='rounded-circle position-relative'
                  style='background-color: #dc3545; width: 40px; height: 40px'
                >
                  <img
                    src={envelope}
                    alt={t('userStatus.emailUnconfirmed')}
                    style='transform: translate(30%, 30%); width: 25px; height: 25px'
                    class='position-absolute'
                  />
                </div>
                {statusWord(t('userStatus.emailUnconfirmed'))}
              </span>
            ) : null}
            <div>
              {!row.item.hasElopage ? (
                <span class='d-inline-flex align-items-center me-3 me-xl-2'>
                  <img
                    class='rounded-circle bg-red-dark'
                    src={elopageFavicon}
                    alt={t('userStatus.noElopage')}
                    style='background-color: #dc3545; width: 40px; height: 40px'
                  />
                  {statusWord(t('userStatus.noElopage'))}
                </span>
              ) : null}
            </div>
          </span>
        ) : null}
        {/* ⚠️ detailsShowing is a boolean and never 'caret-up-fill': the caret always points
            down. Kept as it was. It is no button -- the row opens on a click anywhere in it --
            and says nothing to a screen reader. Its title read `enabled`, which the search
            never delivers, and called every member deleted. */}
        {row.detailsShowing === 'caret-up-fill' ? (
          <IPhCaretUpFill style='color: #212529' aria-hidden='true' />
        ) : (
          <IPhCaretDown style='color: #212529' aria-hidden='true' />
        )}
      </div>
    )

    /**
     * The card a member is on a phone, in the one cell UserSearch hands the table there: what
     * the seven columns say at the desk, a line each -- the name, the username with the way
     * into the wallet, the address, when they registered, what they can still be credited per
     * month, their state. The row opens on a click anywhere in it, as at the desk, and on a
     * button of its own that says so, which opens it itself and keeps the press from the row.
     */
    const memberCard = (row: TableRow) => {
      const item = row.item
      const name = `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim()
      const open = Boolean(item._showDetails)
      const fold = open ? t('hide_details') : t('show_details')
      return (
        <div class='member-card'>
          <div class='d-flex justify-content-between align-items-start gap-2'>
            {/* min-width 0: a long name or username breaks here instead of widening the card. */}
            <div style='min-width: 0'>
              <div class='fw-semibold text-break'>{name || item.alias}</div>
              <small class='text-break'>
                {item.alias} <MemberWalletLink member={item} name={item.alias || item.firstName} />
              </small>
            </div>
            {/* ⛔ The press stays with the button. Its click draws the other symbol at once: a
                browser runs the page's queued work between two listeners of a real press, so Vue
                swaps the <svg> before the row hears it. The table then finds the target of the
                press in no button any more, takes it for a press on the row and closes what the
                button had just opened (measured in the built bundle, 23.10.2026; a click sent
                by a test or by `element.click()` hears the row only after drawing). */}
            <BButton
              variant='link'
              class='phone-icon-btn text-body'
              aria-expanded={open ? 'true' : 'false'}
              aria-label={fold}
              title={fold}
              onClick={(event: MouseEvent) => {
                event.stopPropagation()
                onRowClicked(item)
              }}
            >
              {open ? <IPhCaretUpFill aria-hidden='true' /> : <IPhCaretDown aria-hidden='true' />}
            </BButton>
          </div>
          <div class='text-break'>{item.email}</div>
          <div class='small text-body-secondary'>
            {item.createdAt
              ? `${t('registered_at')} ${d(new Date(item.createdAt), 'short')}`
              : null}
          </div>
          {/* A month keeps its amount on its line (a protected space): where the line breaks,
              it breaks between two months. */}
          <div class='small'>
            {`${t('creation')}: `}
            {props.creationMonths
              .map((month, index) => `${month}\u00a0${item.creation?.[index] ?? '–'}`)
              .join(' · ')}
          </div>
          <div class='d-flex flex-wrap gap-1 mt-1'>
            {statusBadges(item).map((badge) => (
              <span class={['badge', badge.tone]}>{badge.word}</span>
            ))}
          </div>
        </div>
      )
    }

    // The card takes its surface from Bootstrap's `--bs-card-bg`, which a dark mode can turn. On a
    // phone it gives its side margins to the forms and lists it holds (App.css).
    const rowDetailsSlot = (row: TableRow) => (
      <BCard ref={rowDetails} class='shadow-lg ps-3 pe-3 mb-5 rounded row-details-card'>
        <BTabs contentClass='mt-3'>
          <BTab title={t('creation')} active disabled={row.item.deletedAt !== null}>
            {!row.item.deletedAt ? (
              <CreationFormular
                pagetype='singleCreation'
                creation={row.item.creation}
                item={row.item}
                creationUserData={creationUserData.value}
                onUpdate-user-data={updateUserData}
              />
            ) : null}
          </BTab>
          <BTab title={t('e_mail')} disabled={row.item.deletedAt !== null}>
            {!row.item.deletedAt ? (
              <ConfirmRegisterMailFormular
                checked={row.item.emailChecked}
                email={row.item.email}
                userId={row.item.userId}
                dateLastSend={
                  row.item.emailConfirmationSend
                    ? d(new Date(row.item.emailConfirmationSend), 'long')
                    : ''
                }
                onEmail-replaced={(email: string) => {
                  row.item.email = email
                }}
              />
            ) : null}
          </BTab>
          <BTab title={t('creationList')} disabled={row.item.deletedAt !== null}>
            {!row.item.deletedAt ? <CreationTransactionList userId={row.item.userId} /> : null}
          </BTab>
          <BTab title={t('transactionlink.name')} disabled={row.item.deletedAt !== null}>
            {!row.item.deletedAt ? <TransactionLinkList userId={row.item.userId} /> : null}
          </BTab>
          <BTab title={t('userRole.tabTitle')}>
            <ChangeUserRoleFormular
              ref={userChangeForm}
              item={row.item}
              onUpdate-role={updateRole}
              onShow-modal={showModal}
              onUpdate-creation-allowed={(event: { creationAllowed: boolean }) => {
                row.item.creationAllowed = event.creationAllowed
              }}
            />
          </BTab>
          {(store.moderator as unknown as { role?: string }).role === 'ADMIN' ? (
            <BTab title={t('delete_user')}>
              {!row.item.deletedAt ? (
                <DeletedUserFormular
                  ref={deletedUserForm}
                  item={row.item}
                  onUpdate-deleted-at={updateDeletedAt}
                  onShow-delete-modal={showDeleteModal}
                />
              ) : (
                <DeletedUserFormular
                  ref={undeletedUserForm}
                  item={row.item}
                  onUpdate-deleted-at={updateDeletedAt}
                  onShow-undelete-modal={showUndeleteModal}
                />
              )}
            </BTab>
          ) : null}
        </BTabs>
      </BCard>
    )

    return () => (
      <div class='search-user-table'>
        <BTable
          tbodyTrClass='pointer'
          items={myItems.value}
          fields={props.fields}
          captionTop
          striped
          hover
          stacked='md'
          selectMode='single'
          // ⚠️ No prop of BTable: it lands on the table as an attribute, as it did
          selectable-on-row-selected=''
          onRow-clicked={onRowClicked}
        >
          {{
            /* The username as before -- an empty cell where the member has none -- and behind
               it the way to reach them in the wallet: the pin of a member who stands on the
               map, the arrow into the send form for every other, and the bubble into the
               conversation with a contact of the moderator, behind the pin or in the arrow's
               place. All are buttons, and a press on a button does not open the row. */
            'cell(alias)': (row: TableRow) => [
              row.value,
              ' ',
              <MemberWalletLink member={row.item} name={row.item.alias || row.item.firstName} />,
            ],
            'cell(creation)': (data: TableRow) => <div innerHTML={data.value as string} />,
            'cell(createdAt)': (data: TableRow) => d(new Date(data.value as string), 'long'),
            'cell(status)': statusCell,
            'cell(memberCard)': memberCard,
            'row-details': rowDetailsSlot,
          }}
        </BTable>
      </div>
    )
  },
})
