type MaybeValueOrGetter<T> = T | (() => T)
type Nullable<T> = T | null | undefined
type AnyFn = (...args: any[]) => any

function isDefined<T>(data: Nullable<T>): data is T {
  if (data === null || data === undefined) {
    return false
  }
  return true
}

function toValue<T>(data: MaybeValueOrGetter<T>): T {
  return typeof data === 'function' ? (data as AnyFn)() : data
}

export default function defaultTo<T>(
  defaults: MaybeValueOrGetter<T>,
  data: MaybeValueOrGetter<T | null | undefined>,
): T {
  const value = toValue(data)

  if (isDefined(value)) {
    return value
  }
  return toValue(defaults)
}
