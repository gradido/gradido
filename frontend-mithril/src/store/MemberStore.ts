import type * as v from 'valibot'
import { DeviceStore, type DeviceStoreBasicType } from './DeviceStore'
import { session } from './Session'

/**
 * A value this device keeps for each of its members apart, read through `schema`. It lies in
 * localStorage under `<name>:<gradidoID>`, and stays there when the member signs out: the
 * next member on this device reads their own.
 */
export class MemberStore<const TSchema extends v.GenericSchema> {
  // one DeviceStore to a key: a second would take the first one's place with the listener
  // for other tabs, and the first would no longer hear them
  readonly #deviceStores = new Map<string, DeviceStore<TSchema>>()

  constructor(
    private readonly name: string,
    private readonly schema: TSchema,
    private readonly type: DeviceStoreBasicType,
  ) {}

  /**
   * The `DeviceStore` that holds the value of the member signed in. A value kept once per
   * something of theirs (per page, per booking) names it in `keyParts`, which follow the ID
   * in the key: `forSignedInMember('overview')` is `<name>:<gradidoID>:overview`. Throws
   * while nobody is signed in: only a page behind the sign-in has such a value.
   */
  forSignedInMember(...keyParts: string[]) {
    const { member } = session.state
    if (!member) {
      throw new Error(`${this.name} is kept for a member, and nobody is signed in`)
    }
    const key = [this.name, member.gradidoID, ...keyParts].join(':')
    let deviceStore = this.#deviceStores.get(key)
    if (!deviceStore) {
      deviceStore = new DeviceStore(key, this.schema, this.type)
      this.#deviceStores.set(key, deviceStore)
    }
    return deviceStore
  }
}
