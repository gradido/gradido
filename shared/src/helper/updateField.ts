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
  incoming: T[K] | undefined
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
export function updateAllDefinedAndChanged<T extends object>(entity: T, incoming: Partial<T>): boolean {
	let updated = false
	for (const [key, value] of Object.entries(incoming)) {
		if (key in entity && updateIfDefinedAndChanged(entity, key as keyof T, value as T[keyof T])) {
			updated = true
		}
	}
	return updated
}