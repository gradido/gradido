// AI-GENERATED — not an architecture reference
import { createContributionLink } from '@admin/graphql/createContributionLink'
import { updateContributionLink } from '@admin/graphql/updateContributionLink'
import m, { type ClassComponent, type Vnode } from 'mithril'
import { toastError, toastSuccess } from '@/components/Toasts'
import type { ContributionLink, ContributionLinkForm as Form } from '@/data/ContributionLink.schema'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'

interface Attrs {
  /** what the form holds; written as the moderator types */
  form: Form
  /** the link edited, null for a new one */
  editing: ContributionLink | null
  onreset: () => void
  onclose: () => void
  /** the link is saved: the list is out of date */
  onsaved: () => void
}

type Input = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

// a labelled field of the form, as a b-form-group was
const group = (label: string, field: m.Children) =>
  m('.b-form-group', { role: 'group' }, [m('label.form-label.d-block', label), field])

export class ContributionLinkForm implements ClassComponent<Attrs> {
  private async submit({ form, editing, onsaved }: Attrs) {
    // the variables the mutation does not declare (id of a new link) the server does not read
    const variables = { ...form, id: editing?.id ?? null }
    if (editing) {
      const answer = await graphqlRequest(updateContributionLink, variables)
      if (!answer.success) {
        toastError(answer.error.message)
        return
      }
      toastSuccess(t('contributionLink.changeSaved'))
    } else {
      const answer = await graphqlRequest<{ createContributionLink: { link: string } }>(
        createContributionLink,
        variables,
      )
      if (!answer.success) {
        toastError(answer.error.message)
        return
      }
      toastSuccess(answer.value.createContributionLink.link)
    }
    onsaved()
  }

  view({ attrs }: Vnode<Attrs>) {
    const { form, editing, onreset, onclose } = attrs
    // writes what is typed into the form
    const bind = (key: 'name' | 'memo' | 'amount' | 'validFrom' | 'validTo' | 'cycle') => ({
      value: form[key] ?? '',
      oninput: (event: Event) => {
        form[key] = (event.target as Input).value
      },
    })
    const dateInput = (key: 'validFrom' | 'validTo', testClass: string, min?: string) =>
      m('input.form-control.form-control-lg.mb-4', {
        ...bind(key),
        class: testClass,
        type: 'date',
        required: true,
        min,
      })

    // On a phone the pairs of dates and cycles stand under each other and the form keeps a
    // margin of 8px, not 48px (old admin, measured 23.10.2026).
    return m(
      '.contribution-link-form',
      m(
        'form.m-2.m-lg-5',
        {
          onsubmit: (event: Event) => {
            event.preventDefault()
            this.submit(attrs)
          },
          onreset,
        },
        [
          m('.row', [
            m(
              '.col-12.col-lg-6',
              group(t('contributionLink.validFrom'), dateInput('validFrom', 'test-validFrom')),
            ),
            m(
              '.col-12.col-lg-6',
              group(
                t('contributionLink.validTo'),
                dateInput('validTo', 'test-validTo', form.validFrom ?? undefined),
              ),
            ),
          ]),
          group(
            t('contributionLink.name'),
            m('input.form-control.form-control-lg.test-name', {
              ...bind('name'),
              type: 'text',
              placeholder: 'Name',
              required: true,
              maxlength: 100,
            }),
          ),
          group(
            t('contributionLink.memo'),
            m('textarea.form-control.form-control-lg.test-memo', {
              ...bind('memo'),
              placeholder: t('contributionLink.memo'),
              required: true,
              rows: 2,
              maxlength: 255,
            }),
          ),
          group(
            t('contributionLink.amount'),
            m('input.form-control.form-control-lg.test-amount', {
              ...bind('amount'),
              type: 'number',
              placeholder: '0',
              required: true,
            }),
          ),
          m('.row.mb-4', [
            m('.col-12.col-lg-6', [
              m('label', { for: 'cycle' }, t('contributionLink.cycle')),
              m('select.form-select.form-select-lg.mb-3', bind('cycle'), [
                m('option', { value: 'ONCE' }, t('contributionLink.options.cycle.once')),
                m('option', { value: 'DAILY' }, t('contributionLink.options.cycle.daily')),
              ]),
            ]),
            m('.col-12.col-lg-6', [
              m('label', { for: 'maxPerCycle' }, t('contributionLink.maxPerCycle')),
              // only one choice so far, and the server takes 1 where none is sent
              m(
                'select.form-select.form-select-lg.mb-3',
                { disabled: true },
                m('option', { value: '1' }, '1 x'),
              ),
            ]),
          ]),
          // on a phone the buttons wrap with room between them; from 992px on a row
          m('.mt-6.d-flex.flex-wrap.gap-2.d-lg-block', [
            m(
              'button.btn.btn-md.btn-primary.me-lg-2',
              { type: 'submit' },
              editing ? t('contributionLink.saveChange') : t('contributionLink.create'),
            ),
            m(
              'button.btn.btn-md.btn-danger.me-lg-2',
              { type: 'reset' },
              t('contributionLink.clear'),
            ),
            m('button.btn.btn-md.btn-secondary', { type: 'button', onclick: onclose }, t('close')),
          ]),
        ],
      ),
    )
  }
}
