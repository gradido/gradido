// AI-GENERATED — not an architecture reference
import classes from '@admin/components/CreationFormular.module.css'
import { adminCreateContribution } from '@admin/graphql/adminCreateContribution'
import m, { type ClassComponent, type Vnode } from 'mithril'
import * as v from 'valibot'
import { toastError, toastSuccess } from '@/components/Toasts'
import { creationMonths } from '@/data/CreationMonths.logic'
import type { SearchedMember } from '@/data/SearchedMember.schema'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import { adminStore, setOpenCreations } from '@/store/admin.store'
import { isPhone } from '@/viewport'

interface Attrs {
  /** the row of the member: the amounts still open are written to it after a creation */
  member: SearchedMember
}

// the amounts still open per month, GradidoUnit as strings, as the server answers them
const openAmountsSchema = v.object({ adminCreateContribution: v.array(v.string()) })

const MIN_TEXT = 10

/**
 * A creation for a member, made by the moderator: one of the three months still open, an amount
 * and a text. Choosing a month writes the text for it, over what was typed.
 */
export class CreationFormular implements ClassComponent<Attrs> {
  // the index of the month chosen, null for none
  private month: number | null = null
  // as the fields hold it: GradidoUnit travels as a string, and so it is sent
  private amount = '0'
  private text = ''
  // locked while the creation is on its way: a second press would book it twice
  private submitting = false

  private reset() {
    this.month = null
    this.amount = '0'
    this.text = ''
  }

  private chooseMonth(index: number) {
    const { month, year } = creationMonths()[index]
    this.month = index
    this.text = `${t('creation_form.creation_for')} ${month} ${year}`
  }

  private async submit(member: SearchedMember) {
    // also a second press that comes before the button is drawn locked
    if (this.submitting) {
      return
    }
    const amount = this.amount
    this.submitting = true
    const answer = await graphqlRequest(adminCreateContribution, {
      email: member.email,
      creationDate: creationMonths()[this.month as number].date,
      amount,
      memo: this.text,
    })
    this.submitting = false
    // after an answer of either kind the form starts anew
    this.reset()
    if (!answer.success) {
      // a project account does not create: the server answers with a code, the sentence is ours
      const { message } = answer.error
      toastError(
        message.includes('CREATION_NOT_ALLOWED') ? t('creation_form.not_allowed') : message,
      )
      return
    }
    member.creation = v.parse(openAmountsSchema, answer.value).adminCreateContribution
    setOpenCreations(adminStore.openCreations + 1)
    toastSuccess(t('creation_form.toasted', { value: amount, email: member.email }))
  }

  private amountRow(member: SearchedMember) {
    const max = (this.month !== null && member.creation[this.month]) || '0'
    const id = `creation-amount-${member.userId}`
    const field = (type: 'number' | 'range') =>
      m(type === 'number' ? 'input.form-control' : 'input.form-range', {
        id: type === 'number' ? id : undefined,
        'aria-label': type === 'range' ? t('creation_form.select_value') : undefined,
        type,
        min: 0,
        max,
        step: type === 'range' ? 10 : undefined,
        value: this.amount,
        oninput: (event: Event) => {
          this.amount = (event.target as HTMLInputElement).value
        },
      })
    const addon = (text: string) => m('span.input-group-text', m('span', text))
    return m('.d-flex', { class: `${classes.block} ${classes.amountRow}` }, [
      m('label', { for: id }, t('creation_form.select_value')),
      m('div', [
        m('.input-group', { role: 'group' }, [addon('GDD'), field('number'), addon('.00')]),
        m('.input-group.mt-3.flex-nowrap.align-items-center', { role: 'group' }, [
          addon('0'),
          field('range'),
          addon(max),
        ]),
      ]),
    ])
  }

  view({ attrs: { member } }: Vnode<Attrs>) {
    const { userId, creation } = member
    const phone = isPhone()
    const textValid = this.text.length >= MIN_TEXT
    const disabled =
      this.submitting || this.month === null || Number(this.amount) <= 0 || !textValid
    // The three parts keep the room `m-4` gave them at the desk, and take the width of the card on
    // a phone (CreationFormular.module.css).
    return m('.component-creation-formular', [
      t('creation_form.form'),
      ' ',
      m(
        '.shadow.p-2.p-lg-3.mb-5.rounded',
        m(
          'form',
          {
            onreset: (event: Event) => {
              event.preventDefault()
              this.reset()
            },
          },
          [
            m('.mt-0', { class: classes.block }, [
              m('label', { id: `creation-months-${userId}` }, t('creation_form.select_month')),
              // on a phone the months stand under each other
              m(
                '.btn-group-md',
                { role: 'radiogroup', 'aria-labelledby': `creation-months-${userId}` },
                creationMonths().map(({ month }, index) => {
                  const id = `creation-month-${userId}-${index}`
                  // a string, as the server sends it: "0" names its amount as well
                  const label = month + (creation[index] ? ` ${creation[index]} GDD` : '')
                  return m('.form-check', { class: phone ? '' : 'form-check-inline' }, [
                    m('input.form-check-input', {
                      id,
                      type: 'radio',
                      name: `month-selection-${userId}`,
                      checked: this.month === index,
                      onchange: () => this.chooseMonth(index),
                    }),
                    m('label.form-check-label', { for: id }, label),
                  ])
                }),
              ),
            ]),
            this.month === null ? null : this.amountRow(member),
            m('div', { class: classes.block }, [
              m('label', { for: `creation-text-${userId}` }, t('creation_form.enter_text')),
              m(
                'div',
                m('textarea.form-control', {
                  id: `creation-text-${userId}`,
                  class: textValid ? 'is-valid' : 'is-invalid',
                  placeholder: t('creation_form.min_characters'),
                  rows: 3,
                  value: this.text,
                  oninput: (event: Event) => {
                    this.text = (event.target as HTMLTextAreaElement).value
                  },
                }),
              ),
            ]),
            m('.d-flex.justify-content-between', { class: classes.buttonsWrapper }, [
              m('button.btn.btn-md.btn-danger', { type: 'reset' }, t('creation_form.reset')),
              m(
                'div',
                m(
                  'button.btn.btn-md.btn-success.test-submit',
                  {
                    type: 'button',
                    disabled,
                    class: disabled ? 'disabled' : '',
                    onclick: () => this.submit(member),
                  },
                  t('creation_form.submit_creation'),
                ),
              ),
            ]),
          ],
        ),
      ),
    ])
  }
}
