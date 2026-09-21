import { ResultNoError } from '../errorTypes'

/**
 * Updates a field if the incoming value is not undefined and not equal to the current value.
 * So basically undefined means don't touch value, null means set value to null.
 * @param current The current value of the field.
 * @param incoming The incoming value of the field.
 * @returns True if the field was updated, false otherwise.
 */
export function updateIfDefinedAndChanged<T, K extends keyof T>(
  entity: T,
  key: K,
  incoming: T[K] | undefined,
): boolean {
  if (typeof incoming === 'undefined') {
    return false
  }
  // Object.is compare actual values and return true if they are identical
  if (Object.is(entity[key], incoming)) {
    return false
  }
  entity[key] = incoming
  return true
}

/**
 * Check all keys of incoming and if exist on entity, call {@link updateIfDefinedAndChanged}
 * to update entity if value isn't undefined and not equal to current value.
 * @param entity The entity to update.
 * @param incoming The incoming values to update the entity with.
 * @returns True if at least one field was updated, false otherwise.
 */
export function updateAllDefinedAndChanged<T extends object>(
  entity: T,
  incoming: Partial<T>,
): boolean {
  let updated = false
  for (const [key, value] of Object.entries(incoming)) {
    if (key in entity && updateIfDefinedAndChanged(entity, key as keyof T, value as T[keyof T])) {
      updated = true
    }
  }
  return updated
}

/*
 * incoming only contain keys with values, no undefined or null
 */
export function getChangedFields<T extends object>(
  current: T,
  incoming: Partial<T>,
): ResultNoError<Partial<T>> {
  const changedFields: Partial<T> = {}

  let changed = false
  for (const [field, incomingValue] of Object.entries(incoming)) {
    const currentValue = current[field as keyof T]

    const equal =
      Buffer.isBuffer(currentValue) && Buffer.isBuffer(incomingValue)
        ? currentValue.equals(incomingValue)
        : Object.is(currentValue, incomingValue)

    if (!equal) {
      Object.assign(changedFields, { [field]: incomingValue })
      changed = true
    }
  }

  if (changed) {
    return { success: true, value: changedFields }
  }
  return { success: false }
}
