import { ref, watch } from 'vue'
import type { Ref } from 'vue'

interface Serializer<T> {
  read(raw: string): T
  write(value: T): string
}

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

interface UseStorageConfig {
  storage: StorageLike

  /**
   * 当 storage 中不存在数据时，写入默认值
   *
   * @default true
   */
  writeDefaults: boolean
}

type MaybeValueOrGetter<T> = T | (() => T)
type Nullable<T> = T | null | undefined
type AnyFn = (...args: any[]) => any

export default function useStorage<T>(
  key: string,
  defaults: MaybeValueOrGetter<T>,
  options: Partial<UseStorageConfig> = {},
): Ref<T | null> {
  const { writeDefaults = true, storage = window.localStorage } = options

  const initial = toValue(defaults)
  const serializer = getSerializer<T>(initial)

  const data = ref(
    toValue(() => {
      const cache = storage.getItem(key)

      if (isNil(cache)) {
        if (writeDefaults && isDefined(initial)) {
          storage.setItem(key, serializer.write(initial))
        }
        return initial
      }

      return serializer.read(cache)
    }),
  ) as Ref<T | null>

  watch(data, (val) => {
    if (isNil(val)) {
      storage.removeItem(key)
      return
    }

    const serialized = serializer.write(val)
    const oldValue = storage.getItem(key)
    if (oldValue !== serialized) {
      storage.setItem(key, serialized)
    }
  })

  return data
}

function isNil(data: any): data is null | undefined {
  if (data === null || data === undefined) {
    return true
  }
  return false
}

function isDefined<T>(data: Nullable<T>): data is T {
  if (data === null || data === undefined) {
    return false
  }
  return true
}

function toValue<T>(data: MaybeValueOrGetter<T>): T {
  return typeof data === 'function' ? (data as AnyFn)() : data
}

function getSerializer<T extends string>(type: T): Serializer<T>
function getSerializer<T extends number>(type: T): Serializer<T>
function getSerializer<T extends boolean>(type: T): Serializer<T>
function getSerializer<T extends Date>(type: T): Serializer<T>
function getSerializer<T extends Map<any, any>>(type: T): Serializer<T>
function getSerializer<T extends Set<any>>(type: T): Serializer<T>
function getSerializer<T extends object>(type: T): Serializer<T>
function getSerializer<T>(type: T): Serializer<any>
function getSerializer<T>(data: T): Serializer<T> {
  const type = guessSerializerType(data)

  switch (type) {
    case 'string':
      return {
        read: (v: any) => v,
        write: (v: any) => String(v),
      }
    case 'number':
      return {
        read: (v: any) => Number.parseFloat(v),
        write: (v: any) => String(v),
      } as any
    case 'boolean':
      return {
        read: (v: any) => v === 'true',
        write: (v: any) => String(v),
      } as any
    case 'object':
      return {
        read: (v: any) => JSON.parse(v),
        write: (v: any) => JSON.stringify(v),
      }
    case 'map':
      return {
        read: (v: any) => new Map(JSON.parse(v)),
        write: (v: any) => JSON.stringify(Array.from((v as Map<any, any>).entries())),
      } as any
    case 'set':
      return {
        read: (v: any) => new Set(JSON.parse(v)),
        write: (v: any) => JSON.stringify(Array.from(v as Set<any>)),
      } as any
    case 'date':
      return {
        read: (v: any) => new Date(v),
        write: (v: any) => v.toISOString(),
      } as any
    default:
      return {
        read: (v: any) => v,
        write: (v: any) => String(v),
      }
  }
}

function guessSerializerType(rawInit: any) {
  return rawInit == null
    ? 'any'
    : rawInit instanceof Set
    ? 'set'
    : rawInit instanceof Map
    ? 'map'
    : rawInit instanceof Date
    ? 'date'
    : typeof rawInit === 'boolean'
    ? 'boolean'
    : typeof rawInit === 'string'
    ? 'string'
    : typeof rawInit === 'object'
    ? 'object'
    : !Number.isNaN(rawInit)
    ? 'number'
    : 'any'
}
