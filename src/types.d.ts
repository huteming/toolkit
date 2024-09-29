export type MaybeValueOrGetter<T> = T | (() => T)

export type AnyFn = (...args: any[]) => any

export type Nullable<T> = T | null | undefined

export type NonNullable<T> = T extends null | undefined ? never : T
