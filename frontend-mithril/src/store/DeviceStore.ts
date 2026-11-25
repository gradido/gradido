import m from 'mithril'
import * as v from 'valibot'

const deviceStores = new Map<string, DeviceStore<v.GenericSchema>>()

window.addEventListener('storage', ({ key, storageArea }) => {
  if (storageArea !== localStorage) {
    return
  }
  if (key) {
    const deviceStore = deviceStores.get(key)
    // load from storage, because if multiple tabs change at the same time, and events running after, we need the last, actual state
    deviceStore?.set(deviceStore.load(), false)
  } else {
    // localStorage.clear was called in another tab
    deviceStores.forEach((value) => value.set(value.load(), false))
  }
  // a change from another tab happens outside of Mithril
  m.redraw()
})

export enum DeviceStoreBasicType {
  Object,
  String,
  Number,
}

// Store in the name because device has so many meanings
// TSchema is expected to work with undefined as input to return the default values or null like authTokenSchema
export class DeviceStore<const TSchema extends v.GenericSchema> {
  state: v.InferOutput<TSchema>

  constructor(
    public readonly key: string,
    public readonly schema: TSchema,
    public readonly type: DeviceStoreBasicType,
  ) {
    this.state = this.load()
    deviceStores.set(this.key, this)
  }

  load() {
    return this.itemToState(localStorage.getItem(this.key))
  }

  itemToState(item?: string | null): v.InferOutput<TSchema> {
    let typedItem: string | null | undefined | number = item
    if (item) {
      if (this.type === DeviceStoreBasicType.Object) {
        try {
          typedItem = JSON.parse(item)
        } catch {
          // no JSON: as if nothing were stored
        }
      } else if (this.type === DeviceStoreBasicType.Number) {
        typedItem = Number(item)
      }
    }
    return v.parse(this.schema, typedItem)
  }

  stateToItem(state: v.InferOutput<TSchema>): string {
    if (typeof state === 'string') {
      return state
    } else if (this.type === DeviceStoreBasicType.Object) {
      return JSON.stringify(state)
    } else if (this.type === DeviceStoreBasicType.Number) {
      if (typeof state !== 'number') {
        throw new Error('Type Mismatch between schema and type')
      }
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
        const item = this.stateToItem(this.state)
        try {
          localStorage.setItem(this.key, item)
        } catch {
          // storage full: the value holds for this visit only
          // TODO: send info to backend, which send e-mail to code maintainer/support
        }
      }
    }
  }
}
