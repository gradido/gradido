// AI-GENERATED — not an architecture reference
import { BButton, BCard, BCardText, BCollapse } from 'bootstrap-vue-next'
import { defineComponent, type PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIsAdmin } from '@/composables/useIsAdmin'
import { ContributionLinkForm } from '../ContributionLink/ContributionLinkForm'
import {
  ContributionLinkList,
  type ContributionLinkRow,
} from '../ContributionLink/ContributionLinkList'

export const ContributionLink = defineComponent({
  name: 'ContributionLink',
  props: {
    items: {
      type: Array as PropType<ContributionLinkRow[]>,
      required: true,
    },
    count: {
      type: Number,
      required: true,
    },
  },
  emits: ['get-contribution-links'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const visible = ref(false)
    const contributionLinkData = ref<Record<string, unknown>>({})
    const editContributionLink = ref(false)

    // Creating a starting balance is an administrator's job. Moderators may look the links
    // up and pass them on, so they keep the list and the QR-code view.
    const isAdmin = useIsAdmin()

    const closeContributionForm = () => {
      if (visible.value) {
        visible.value = false
        editContributionLink.value = false
        contributionLinkData.value = {}
      }
    }

    const editContributionLinkData = (data: ContributionLinkRow) => {
      if (!visible.value) {
        visible.value = true
      }
      contributionLinkData.value = data
      editContributionLink.value = true
    }

    const getContributionLinks = () => emit('get-contribution-links')

    return () => (
      <div class='contribution-link'>
        <BCard
          borderVariant='success'
          header={t('contributionLink.contributionLinks')}
          headerBgVariant='success'
          headerTextVariant='white'
          headerClass='text-center'
          class='mt-5'
        >
          {isAdmin.value && !editContributionLink.value ? (
            <BButton
              class='my-3 d-flex justify-content-left'
              data-test='new-contribution-link-button'
              onClick={() => {
                visible.value = !visible.value
              }}
            >
              {t('math.plus')} {t('contributionLink.newContributionLink')}
            </BButton>
          ) : null}

          <BCollapse id='newContribution' v-model={visible.value} class='mt-2'>
            {/* On a phone this card keeps no side room of its own: inside the card of the page it
                left the form 220px of a 320px window (measured 23.10.2026). From 992px on the
                16px of a card body, as before. */}
            <BCard bodyClass='px-0 px-lg-3'>
              <p class='h2 ms-5'>{t('contributionLink.contributionLinks')}</p>
              <ContributionLinkForm
                contributionLinkData={contributionLinkData.value}
                editContributionLink={editContributionLink.value}
                onGet-contribution-links={getContributionLinks}
                onClose-contribution-form={closeContributionForm}
              />
            </BCard>
          </BCollapse>

          <BCardText>
            {props.count > 0 ? (
              <ContributionLinkList
                items={props.items}
                onEdit-contribution-link-data={editContributionLinkData}
                onGet-contribution-links={getContributionLinks}
                onClose-contribution-form={closeContributionForm}
              />
            ) : (
              <div>{t('contributionLink.noContributionLinks')}</div>
            )}
          </BCardText>
        </BCard>
      </div>
    )
  },
})
