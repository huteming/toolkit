import { getCurrentInstance, onUnmounted, ref, watch } from 'vue'
import type { Ref } from 'vue'

interface Options<Res, Params> {
  manual: boolean
  ready: Ref<boolean>

  initialData: Res
  defaultParams: Params

  onError: (err: Error) => void
  onSuccess: (data: Res) => void
  onFinally: () => void
}

interface CombineService<Res, Params extends any[]> {
  (...args: Params): Promise<Res>
}

type UseRequestOptions<Res, Params> = Partial<Options<Res, Params>>

interface UseRequestReturn<Res, Params extends any[]> {
  loading: Ref<boolean>
  error: Ref<Error | undefined>
  data: Ref<Res>
  run: (...args: Params) => Promise<void>
  cancel: () => void
}

const defaultOptions: Options<undefined, any> = {
  manual: true,
  ready: ref(true),

  initialData: undefined,
  defaultParams: [],

  onError: console.error,
  onSuccess: () => {},
  onFinally: () => {},
}

// without "initialData"
function useRequest<Res, Params extends any[]>(
  service: CombineService<Res, Params>,
  options?: Omit<UseRequestOptions<Res, Params>, 'initialData'>,
): UseRequestReturn<Res | undefined, Params>

// with "initialData"
function useRequest<Res, Params extends any[]>(
  service: CombineService<Res, Params>,
  options?: UseRequestOptions<Res, Params>,
): UseRequestReturn<Res, Params>

function useRequest<Res, Params extends any[]>(
  service: CombineService<Res, Params>,
  options: UseRequestOptions<Res, Params> = {},
) {
  const finalOptions = { ...defaultOptions, ...options }
  const { manual, ready, initialData, defaultParams, onError, onSuccess, onFinally } = finalOptions

  const loading = ref(false)
  const data = ref(initialData) as Ref<Res>
  const error = ref<Error>()
  let count = 0

  let unmountedFlag = false
  if (getCurrentInstance()) {
    onUnmounted(() => {
      unmountedFlag = true
    })
  }

  const run = async (...args: Params): Promise<Res> => {
    count++
    loading.value = true
    const curCount = count

    const shouldAbandon = () => unmountedFlag || curCount !== count
    const peddingPromise = new Promise<Res>(() => {})

    try {
      const res = await service(...args)

      if (shouldAbandon()) {
        return peddingPromise
      }

      data.value = res
      error.value = undefined
      loading.value = false
      onSuccess(res as any)
      onFinally()

      return res
    } catch (err: any) {
      if (shouldAbandon()) {
        return peddingPromise
      }

      error.value = err
      loading.value = false
      onError(err)
      onFinally()

      throw err
    }
  }

  const cancel = () => {
    count++
    loading.value = false
  }

  if (!manual) {
    watch(
      ready,
      () => {
        if (ready.value) {
          run(...defaultParams).catch(() => {})
        }
      },
      {
        immediate: true,
      },
    )
  }

  return {
    loading,
    error,
    data,
    run,
    cancel,
  }
}

export default useRequest
