/**
 * Which of the two queues a password derivation waits in. The values are what the native
 * side expects (shared-native/napi/passwordHashing.h, `Priority`), so they are not free to
 * change.
 */
export enum PasswordHashPriority {
  /** The login: it is what the member is waiting for, and every high job goes before any low one */
  HIGH = 0,
  /** Everything else: setting or changing a password */
  LOW = 1,
}
