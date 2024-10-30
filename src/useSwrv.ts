import { computed } from 'vue'
import useSWRV, { SWRVCache } from 'swrv'
import { isBoolean, isEmpty, isNumber, omit } from 'lodash'
// @ts-ignore
import type { IConfig, fetcherFn, IKey } from 'swrv/dist/types'
import type { ComputedRef, Ref } from 'vue'

interface IOptions<Data> extends IConfig<Data> {
  initialData?: Data
}

interface IUseServerStateReturn<Data> {
  data: ComputedRef<Data>
  error: Ref<Error | undefined>
  isLoading: ComputedRef<boolean>
  isValidating: Ref<boolean>
  refresh: () => void
}

function isTest() {
  return process.env.NODE_ENV === 'test'
}

function createSWRVConfig(config?: IConfig) {
  const options: IConfig = {
    cache: new SWRVCache(),
    revalidateOnFocus: false,
    ...omit(config, 'initialData'),
  }
  if (isTest()) {
    options.dedupingInterval = 0
  }
  return options
}

function isEmptyResponse(value: any): boolean {
  // number, boolean
  if (isNumber(value) || isBoolean(value)) {
    return false
  }
  // string, array, object, null, undefined
  return isEmpty(value)
}

function useServerState<Data, Error = any>(
  key: IKey,
  fetcher?: fetcherFn<Data>,
  options?: Omit<IOptions<Data>, 'initialData'>,
): IUseServerStateReturn<Data | undefined>

function useServerState<Data, Error = any>(
  key: IKey,
  fetcher?: fetcherFn<Data>,
  options?: IOptions<Data>,
): IUseServerStateReturn<Data>

function useServerState<Data, Error = any>(
  key: IKey,
  fetcher?: fetcherFn<Data>,
  options?: IOptions<Data>,
) {
  const config = createSWRVConfig(options)
  const { cache } = config
  // @ts-ignore
  const { data, error, isValidating, mutate } = useSWRV<Data, Error>(key, fetcher, config)
  const isLoading = computed(() => {
    if (error.value || !isValidating.value) {
      return false
    }
    const cacheData = cache?.get(key as any)?.data?.data
    if (isEmptyResponse(cacheData)) {
      return true
    }
    return false
  })
  const safeData = computed(() => data.value || options?.initialData)

  return {
    data: safeData,
    error,
    isLoading,
    isValidating,
    refresh: () => {
      mutate()
    },
  }
}

export default useServerState
