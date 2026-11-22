import * as v from 'valibot'

const deviceStores = new Map<string, DeviceStore<v.GenericSchema>>()

window.addEventListener('storage', ({ key, newValue }) => {
  if (key) {
    const deviceStore = deviceStores.get(key)
    deviceStore?.set(deviceStore.itemToState(newValue), false)
  } else {
    // localStorage.clear was called in another tab
    deviceStores.forEach((value) => value.set(undefined, false))
  }
})

// Store in the name because device has so many meanings
// TSchema is expected to work with undefined as input to return the default values or null like authTokenSchema
export class DeviceStore<const TSchema extends v.GenericSchema> {
  state: v.InferOutput<TSchema>

  constructor(
    public readonly key: string,
    public readonly schema: TSchema,
    public readonly isObject: boolean,
  ) {
    this.state = this.itemToState(localStorage.getItem(this.key))
    deviceStores.set(this.key, this)
  }

  itemToState(item?: string | null): v.InferOutput<TSchema> {
    if (this.isObject && item) {
      try {
        item = JSON.parse(item)
      } catch {
        // no JSON: as if nothing were stored
      }
    }
    return v.parse(this.schema, item)
  }

  stateToItem(state: v.InferOutput<TSchema>): string {
    if (typeof state === 'string') {
      return state
    } else if (this.isObject) {
      return JSON.stringify(state)
    } else if (typeof state === 'number') {
      return state.toString()
    } else {
      throw new Error('unhandled case')
    }
  }

  /**
   * set new value or remove old value and set default if value was empty
   * @param value - undefined for removing, else new value, expected to be valid according to TSchema
   * @param {boolean} persist - if true (default) update localStorage with the change
   */
  set(value: v.InferOutput<TSchema> | undefined, persist: boolean = true) {
    if (value == null) {
      if (persist) {
        localStorage.removeItem(this.key)
      }
      this.state = v.parse(this.schema, undefined)
    } else {
      this.state = value
      if (persist) {
        try {
          localStorage.setItem(this.key, this.stateToItem(this.state))
        } catch {
          // storage full: the value holds for this visit only
          // TODO: send info to backend, which send e-mail to code maintainer/support
        }
      }
    }
  }
}
