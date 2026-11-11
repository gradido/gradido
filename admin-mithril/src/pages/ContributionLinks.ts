// AI-GENERATED — not an architecture reference
import { deleteContributionLink } from '@admin/graphql/deleteContributionLink'
import { listContributionLinks } from '@admin/graphql/listContributionLinks'
import m, { type ClassComponent } from 'mithril'
import * as v from 'valibot'
import { Modal } from '@/components/bootstrap/Modal'
import { ContributionLinkForm } from '@/components/contributionLink/ContributionLinkForm'
import { ContributionLinkList } from '@/components/contributionLink/ContributionLinkList'
import { FigureQrCode } from '@/components/contributionLink/FigureQrCode'
import { toastError, toastSuccess } from '@/components/Toasts'
import {
  type ContributionLink,
  contributionLinkFormOf,
  contributionLinkListSchema,
  newContributionLinkForm,
} from '@/data/ContributionLink.schema'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import { adminStore } from '@/store/admin.store'

/** The starting balances of the community: the links that hand them out, made and printed here. */
export class ContributionLinks implements ClassComponent {
  private links: ContributionLink[] = []
  private count = 0
  // The form stays drawn while closed, so that what was typed into it is there when it opens
  // again -- only closing it, saving or editing another link starts it anew.
  private formOpen = false
  private editing: ContributionLink | null = null
  private form = newContributionLinkForm()
  // the link the moderator is asked about, and the one shown with its QR code
  private deleting: ContributionLink | null = null
  private showing: ContributionLink | null = null

  oninit() {
    this.load()
  }

  private async load() {
    const answer = await graphqlRequest(listContributionLinks)
    const parsed = answer.success ? v.safeParse(contributionLinkListSchema, answer.value) : null
    if (!parsed?.success) {
      // the list shown stays as it was
      toastError('listContributionLinks has no result, use default data')
      return
    }
    ;({ links: this.links, count: this.count } = parsed.output.listContributionLinks)
  }

  private closeForm() {
    if (this.formOpen) {
      this.formOpen = false
      this.editing = null
      this.form = newContributionLinkForm()
    }
  }

  private edit(link: ContributionLink) {
    this.formOpen = true
    this.editing = link
    this.form = contributionLinkFormOf(link)
  }

  private async remove(link: ContributionLink) {
    this.deleting = null
    const answer = await graphqlRequest(deleteContributionLink, { id: link.id })
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    toastSuccess(t('contributionLink.deleted'))
    this.closeForm()
    this.load()
  }

  private deleteModal(link: ContributionLink) {
    const close = () => {
      this.deleting = null
    }
    return m(
      Modal,
      {
        onclose: close,
        footer: [
          m('button.btn.btn-md.btn-secondary', { type: 'button', onclick: close }, 'Cancel'),
          m(
            'button.btn.btn-md.btn-primary',
            { type: 'button', onclick: () => this.remove(link) },
            'OK',
          ),
        ],
      },
      t('contributionLink.deleteNow', { name: link.name }),
    )
  }

  private qrModal(link: ContributionLink) {
    const close = () => {
      this.showing = null
    }
    return m(
      Modal,
      {
        onclose: close,
        headerClose: false,
        footer: m('button.btn.btn-md.btn-primary', { type: 'button', onclick: close }, 'OK'),
      },
      m('.card', [
        m('header.card-header', m('h6.mb-0', link.name)),
        m('.card-body', m('.card-text', [link.memo, ' ', m(FigureQrCode, { link: link.link })])),
        m('footer.card-footer', m('em', link.link)),
      ]),
    )
  }

  view() {
    // Making a starting balance is an administrator's job: the backend's rights decide, this
    // only keeps the page from offering what would be refused.
    const isAdmin = adminStore.moderator?.role === 'ADMIN'
    return m('.contribution-link', [
      m('.card.border-success.mt-5', [
        m(
          '.card-header.text-white.bg-success.text-center',
          t('contributionLink.contributionLinks'),
        ),
        m('.card-body', [
          isAdmin && !this.editing
            ? m(
                'button.btn.btn-md.btn-secondary.my-3.d-flex.justify-content-left',
                {
                  type: 'button',
                  'data-test': 'new-contribution-link-button',
                  onclick: () => {
                    this.formOpen = !this.formOpen
                  },
                },
                `${t('math.plus')} ${t('contributionLink.newContributionLink')}`,
              )
            : null,
          m(
            '#newContribution.collapse.mt-2',
            { class: this.formOpen ? 'show' : '' },
            // on a phone the card keeps no side room of its own, the form needs it
            m(
              '.card',
              m('.card-body.px-0.px-lg-3', [
                m('p.h2.ms-5', t('contributionLink.contributionLinks')),
                m(ContributionLinkForm, {
                  form: this.form,
                  editing: this.editing,
                  onreset: () => {
                    this.form = newContributionLinkForm()
                  },
                  onclose: () => this.closeForm(),
                  onsaved: () => {
                    this.closeForm()
                    this.load()
                  },
                }),
              ]),
            ),
          ),
          m(
            '.card-text',
            this.count > 0
              ? m(ContributionLinkList, {
                  links: this.links,
                  isAdmin,
                  ondelete: (link) => {
                    this.deleting = link
                  },
                  onedit: (link) => this.edit(link),
                  onshow: (link) => {
                    this.showing = link
                  },
                })
              : m('div', t('contributionLink.noContributionLinks')),
          ),
        ]),
      ]),
      this.deleting ? this.deleteModal(this.deleting) : null,
      this.showing ? this.qrModal(this.showing) : null,
    ])
  }
}
