import type { Ref, ComputedRef } from 'vue'
import { ref, watch, onUnmounted, computed } from 'vue'
import { isNumber, isBoolean, isEmpty } from 'lodash'

interface IListener<Data, Err> {
  (err: Err | null, isValidating: boolean, newData: Data | null): void
}

type IKey = string | null | undefined

interface CacheEntry<Data, Err> {
  isValidating: boolean
  data: Data | null
  error: Err | null
  createdAt: number
  listeners: Set<IListener<Data, Err>>
}

export interface QueryOptions<Data> {
  // Note: Only takes effect on the current hook! will not be saved to cache!
  initialValue?: Data
  ttl?: number
  dedupingInterval?: number
  onUpdate?: (data: Data) => void
}

interface Cache {
  [key: string]: CacheEntry<any, any>
}

interface QueryReturns<Data, Err> {
  data: Ref<Data>
  error: Ref<Err | null>
  isValidating: Ref<boolean>
  isLoading: ComputedRef<boolean>
  refresh: () => void
}

const cache: Cache = {}

function useQuery<Data, Err>(
  key: (() => IKey) | IKey,
  fetcher: () => Promise<Data>,
  options?: Omit<QueryOptions<Data>, 'initialValue'>,
): QueryReturns<Data | null, Err>
function useQuery<Data, Err>(
  key: (() => IKey) | IKey,
  fetcher: () => Promise<Data>,
  options?: QueryOptions<Data>,
): QueryReturns<Data, Err>
function useQuery<Data, Err>(
  key: (() => IKey) | IKey,
  fetcher: () => Promise<Data>,
  options: QueryOptions<Data> = {},
): QueryReturns<Data, Err> | QueryReturns<Data | null, Err> {
  const { ttl = 0, dedupingInterval = 2000, initialValue = null, onUpdate } = options

  const data = ref(initialValue) as Ref<Data | null>
  const error: Ref<Err | null> = ref(null)
  const isValidating = ref(false)

  const keyRef: Ref<IKey> = typeof key === 'function' ? (key as any) : ref(key)

  const fetchData = async (cacheKey: string) => {
    const cachedEntry = cache[cacheKey]

    if (cachedEntry.isValidating) {
      return
    }

    cachedEntry.isValidating = true
    cachedEntry.listeners.forEach((listener) => listener(null, true, null))

    try {
      const result = await fetcher()

      cachedEntry.data = result
      cachedEntry.error = null
      cachedEntry.createdAt = Date.now()
      cachedEntry.listeners.forEach((listener) => listener(null, false, result))
    } catch (err) {
      cachedEntry.data = null
      cachedEntry.error = err
      cachedEntry.listeners.forEach((listener) => listener(err, false, null))
    } finally {
      cachedEntry.isValidating = false
    }
  }

  const loadCache = (cacheKey: string) => {
    const cachedEntry = cache[cacheKey]
    cachedEntry.listeners.add(listener)

    const passedTime = Date.now() - cachedEntry.createdAt
    const isCacheEffect = isCacheValid(cachedEntry, passedTime, ttl)
    const isOverDedupe = dedupingInterval > 0 && passedTime > dedupingInterval

    if (isCacheEffect) {
      data.value = cachedEntry.data
      error.value = cachedEntry.error
      isValidating.value = cachedEntry.isValidating
      safeUpdate(data.value)
    }

    if (isDataEmpty(cachedEntry.data)) {
      fetchData(cacheKey)
      return
    }

    if (isOverDedupe) {
      fetchData(cacheKey)
    }
  }

  const listener: IListener<Data, Err> = (err, loading, newData) => {
    error.value = err
    isValidating.value = loading

    if (!loading) {
      data.value = err && initialValue ? initialValue : newData
    }
    safeUpdate(newData)
  }

  const removeListener = (cacheKey: IKey) => {
    if (!cacheKey) {
      return
    }
    const cachedEntry = cache[cacheKey]
    cachedEntry?.listeners.delete(listener)
  }

  const createCacheEntry = (cacheKey: string) => {
    if (!cache[cacheKey]) {
      cache[cacheKey] = {
        isValidating: false,
        data: null,
        error: null,
        createdAt: 0,
        listeners: new Set([listener]),
      }
    }
  }

  const refresh = () => {
    const cacheKey = keyRef.value
    if (!cacheKey) {
      return
    }
    fetchData(cacheKey)
  }

  const safeUpdate = (newData: Data | null) => {
    if (!newData) {
      return
    }
    onUpdate?.(newData)
  }

  const isLoading = computed(() => {
    return isValidating.value && isDataEmpty(data.value)
  })

  watch(
    keyRef,
    (newKey, oldKey) => {
      removeListener(oldKey)

      keyRef.value = newKey

      if (!newKey) {
        return
      }

      createCacheEntry(newKey)
      loadCache(newKey)
    },
    {
      immediate: true,
    },
  )

  onUnmounted(() => {
    const cacheKey = keyRef.value
    removeListener(cacheKey)
  })

  return { data, error, isValidating, isLoading, refresh }
}

function isDataEmpty(value: any): boolean {
  // number, boolean
  if (isNumber(value) || isBoolean(value)) {
    return false
  }
  // string, array, object, null, undefined
  return isEmpty(value)
}

function isCacheValid(cachedEntry: CacheEntry<any, any>, passedTime: number, ttl: number) {
  if (cachedEntry.createdAt <= 0) {
    return false
  }
  if (ttl <= 0) {
    return true
  }
  return passedTime <= ttl
}

export default useQuery
