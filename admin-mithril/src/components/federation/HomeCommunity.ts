// AI-GENERATED — not an architecture reference
import { updateHomeCommunity } from '@admin/graphql/updateHomeCommunity'
import m, { type ClassComponent, type Vnode } from 'mithril'
import { icon } from '@/components/icon'
import { toastError, toastSuccess } from '@/components/Toasts'
import type { Community, Location } from '@/data/Community.schema'
import {
  type Coordinate,
  coordinatesComplete,
  coordinatesLine,
  parseCoordinate,
  splitCoordinates,
} from '@/data/Coordinates.logic'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import { adminStore } from '@/store/admin.store'
import pencilFillIcon from '~icons/bi/pencil-fill'

interface Attrs {
  community: Community
}

type Values = { gmsApiKey: string | null; hieroTopicId: string | null; location: Location | null }

// a labelled field, as a b-form-group was
const field = (id: string, label: string, value: string, oninput: (value: string) => void) =>
  m('.b-form-group', { role: 'group' }, [
    m('label.form-label.d-block', { for: id }, label),
    m('input.form-control', {
      id,
      type: 'text',
      value,
      oninput: (event: Event) => oninput((event.target as HTMLInputElement).value),
    }),
  ])

/**
 * The GMS key, the Hiero topic and the place of the own community, and their edit (an
 * administrator's). What is saved is shown at once; the server's answer only adds a toast.
 */
export class HomeCommunity implements ClassComponent<Attrs> {
  private saved!: Values
  private values!: Values
  private editing = false
  // whether the save is offered: decided by the field typed in last, as before
  private changed = false
  // what the edit's fields show: each keeps what is typed into it, the others follow
  private texts = { line: '', latitude: '', longitude: '' }
  private latitude: Coordinate = ''
  private longitude: Coordinate = ''
  private valuesAtEdit!: Values

  oninit({ attrs: { community } }: Vnode<Attrs>) {
    const { gmsApiKey, hieroTopicId, location } = community
    this.saved = { gmsApiKey, hieroTopicId, location }
    this.values = { ...this.saved }
  }

  private edit() {
    this.editing = true
    this.changed = false
    this.valuesAtEdit = { ...this.values }
    this.latitude = parseCoordinate(this.values.location?.latitude)
    this.longitude = parseCoordinate(this.values.location?.longitude)
    this.texts = {
      line: coordinatesLine(this.latitude, this.longitude),
      latitude: String(this.latitude),
      longitude: String(this.longitude),
    }
  }

  private typeText(key: 'gmsApiKey' | 'hieroTopicId', value: string) {
    this.values[key] = value
    this.changed = value !== this.valuesAtEdit[key]
  }

  // A new place with every input -- also where its numbers stay the same, as before: the toast
  // names it as changed. Both empty is no place at all, and the server is told so with null.
  private placeTyped() {
    this.values.location =
      this.latitude === '' && this.longitude === ''
        ? null
        : ({ latitude: this.latitude, longitude: this.longitude } as Location)
    this.changed = coordinatesComplete(this.latitude, this.longitude)
  }

  private typeLine(line: string) {
    this.texts.line = line
    const pair = splitCoordinates(line)
    if (pair) {
      ;({ latitude: this.latitude, longitude: this.longitude } = pair)
    }
    this.texts.latitude = String(this.latitude)
    this.texts.longitude = String(this.longitude)
    this.placeTyped()
  }

  private typeCoordinate(key: 'latitude' | 'longitude', text: string) {
    this[key] = parseCoordinate(text)
    // the other field shows its number as read, this one what is typed
    this.texts.latitude = String(this.latitude)
    this.texts.longitude = String(this.longitude)
    this.texts[key] = text
    this.texts.line = coordinatesLine(this.latitude, this.longitude)
    this.placeTyped()
  }

  private async save(uuid: string | null) {
    this.editing = false
    const { values, saved } = this
    const answer = await graphqlRequest(updateHomeCommunity, { uuid, ...values })
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    const keyChanged = values.gmsApiKey !== saved.gmsApiKey
    const placeChanged = values.location !== saved.location
    if (keyChanged && placeChanged) {
      toastSuccess(t('federation.toast_gmsApiKeyAndLocationUpdated'))
    } else if (keyChanged) {
      toastSuccess(t('federation.toast_gmsApiKeyUpdated'))
    } else if (placeChanged) {
      toastSuccess(t('federation.toast_gmsLocationUpdated'))
    }
    if (values.hieroTopicId !== saved.hieroTopicId) {
      toastSuccess(t('federation.toast_hieroTopicIdUpdated'))
    }
    this.saved = { ...values }
  }

  private close() {
    this.values = { ...this.saved }
    this.editing = false
  }

  private shown() {
    const { gmsApiKey, hieroTopicId, location } = this.values
    const line = (label: string, value: string | null) =>
      m('.d-flex', [
        m('p', { style: { textWrap: 'nowrap' } }, `${label} `),
        m('span.d-block', { style: { overflowX: 'auto' } }, value),
      ])
    return [
      line(t('federation.gmsApiKey'), gmsApiKey),
      line(t('federation.hieroTopicId'), hieroTopicId),
      m('fieldset.b-form-group', [
        t('federation.coordinates'),
        ' ',
        location?.latitude && location.longitude
          ? m('span', coordinatesLine(location.latitude, location.longitude))
          : null,
      ]),
    ]
  }

  private fields() {
    const complete = coordinatesComplete(this.latitude, this.longitude)
    return [
      field(
        'home-community-api-key',
        t('federation.gmsApiKey'),
        this.values.gmsApiKey ?? '',
        (value) => this.typeText('gmsApiKey', value),
      ),
      field(
        'home-community-hiero-topic-id',
        t('federation.hieroTopicId'),
        this.values.hieroTopicId ?? '',
        (value) => this.typeText('hieroTopicId', value),
      ),
      m(
        '.mb-4',
        m('fieldset.b-form-group', { class: complete ? '' : 'is-invalid' }, [
          m('legend.form-label.col-form-label.pt-0', t('geo-coordinates.label')),
          m('.b-form-group', { role: 'group' }, [
            m(
              'label.form-label.d-block',
              { for: 'home-community-latitude-longitude-smart' },
              t('latitude-longitude-smart'),
            ),
            m('input.form-control', {
              id: 'home-community-latitude-longitude-smart',
              type: 'text',
              value: this.texts.line,
              oninput: (event: Event) => this.typeLine((event.target as HTMLInputElement).value),
            }),
            m(
              'small.text-body-secondary.form-text',
              t('geo-coordinates.latitude-longitude-smart.describe'),
            ),
          ]),
          field('home-community-latitude', t('latitude'), this.texts.latitude, (text) =>
            this.typeCoordinate('latitude', text),
          ),
          field('home-community-longitude', t('longitude'), this.texts.longitude, (text) =>
            this.typeCoordinate('longitude', text),
          ),
          complete
            ? null
            : m(
                '.d-block.invalid-feedback',
                { 'aria-live': 'assertive' },
                t('geo-coordinates.both-or-none'),
              ),
        ]),
      ),
    ]
  }

  view({ attrs: { community } }: Vnode<Attrs>) {
    const allowEdit = adminStore.moderator?.role === 'ADMIN'
    return m('div', [
      this.editing ? this.fields() : this.shown(),
      !allowEdit
        ? null
        : this.editing
          ? m('fieldset.b-form-group', [
              m(
                'button.btn.btn-md.btn-success.save-button',
                {
                  type: 'button',
                  disabled: !this.changed,
                  class: this.changed ? '' : 'disabled',
                  onclick: () => this.save(community.uuid),
                },
                t('save'),
              ),
              m(
                'button.btn.btn-md.btn-secondary.close-button.ms-2',
                { type: 'button', onclick: () => this.close() },
                t('close'),
              ),
            ])
          : m(
              'fieldset.b-form-group',
              // 'prime' is no Bootstrap variant: the button shows unstyled, as it always did
              m('button.btn.btn-md.btn-prime', { type: 'button', onclick: () => this.edit() }, [
                icon(pencilFillIcon, {}),
                ` ${t('edit')}`,
              ]),
            ),
    ])
  }
}
