import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, reactive, ref, watch } from 'vue'
import type { Ref } from 'vue'
import useQuery from './useQuery.js'

function sleep(time = 10) {
  return new Promise((r) => setTimeout(r, time))
}

function createDelayImp<T>(res: T) {
  return () => new Promise((r) => setTimeout(r, 5, res))
}

function uuid() {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

const onUnmounteds: Function[] = []

vi.mock(import('vue'), async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod,
    onMounted: vi.fn((callback: Function) => callback()),
    onUnmounted: (callback: Function) => onUnmounteds.push(callback),
  }
})

describe('useQuery', () => {
  it('期望成功获取数据并更新状态', async () => {
    const dataResponse1 = { message: 'Hello, world!', code: 1 }
    const mockFetcher = vi.fn().mockResolvedValueOnce(dataResponse1)

    const { data, error, isValidating, isLoading } = useQuery('test-key-a', mockFetcher)

    expect(mockFetcher).toHaveBeenCalledTimes(1)

    await sleep()

    expect(data.value).toEqual(dataResponse1)
    expect(error.value).toBeNull()
    expect(isValidating.value).toBeFalsy()
    expect(isLoading.value).toBeFalsy()
  })

  it('期望请求失败并更新状态', async () => {
    const dataResponse1 = { message: 'Hello, world!', code: 1 }
    const mockFetcher = vi.fn().mockRejectedValue(dataResponse1)

    const { data, error, isValidating, isLoading } = useQuery(uuid(), mockFetcher)

    expect(mockFetcher).toHaveBeenCalledTimes(1)
    expect(isValidating.value).toEqual(true)
    expect(isLoading.value).toEqual(true)

    await sleep()

    expect(data.value).toEqual(null)
    expect(error.value).toEqual(dataResponse1)
    expect(isValidating.value).toBeFalsy()
    expect(isLoading.value).toBeFalsy()
  })

  it('期望缓存有效期内，优先返回缓存', async () => {
    const dataResponse1 = { code: 1 }
    const dataResponse2 = { code: 2 }
    const dataResponse3 = { code: 3 }
    const mockFetcher = vi
      .fn()
      .mockResolvedValueOnce(dataResponse1)
      .mockResolvedValueOnce(dataResponse2)
      .mockResolvedValueOnce(dataResponse3)

    const key = uuid()
    const use = () => {
      return useQuery(() => key, mockFetcher, {
        ttl: 20,
        dedupingInterval: 1,
      })
    }

    const { data: data1 } = use()
    await sleep()

    expect(mockFetcher).toHaveBeenCalledTimes(1)
    expect(data1.value).toEqual(dataResponse1)

    const { data: data2 } = use()

    expect(mockFetcher).toHaveBeenCalledTimes(2)
    expect(data2.value).toEqual(dataResponse1)

    await sleep()

    expect(data2.value).toEqual(dataResponse2)

    await sleep(40)
    const { data: data3 } = use()

    expect(mockFetcher).toHaveBeenCalledTimes(3)
    expect(data3.value).toEqual(null)

    await sleep()

    expect(data3.value).toEqual(dataResponse3)
  })

  it('期望 isLoading 仅表示在获取新数据，不包括后台验证的情况', async () => {
    const dataResponse1 = { message: 'Hello, world!', code: 1 }
    const mockFetcher = vi.fn().mockResolvedValueOnce(dataResponse1)

    const { refresh, isLoading } = useQuery(uuid(), mockFetcher)

    expect(isLoading.value).toEqual(true)

    await sleep()

    expect(isLoading.value).toEqual(false)

    refresh()

    expect(isLoading.value).toEqual(false)
  })

  it('期望 key 不存在时不会请求', async () => {
    const dataResponse1 = { message: 'Hello, world!', code: 1 }
    const mockFetcher = vi.fn().mockResolvedValueOnce(dataResponse1)

    const dependent = ref<string>()
    const { data } = useQuery(() => dependent.value, mockFetcher)

    await sleep()

    expect(mockFetcher).toHaveBeenCalledTimes(0)

    dependent.value = 'test-key-b'
    await sleep()

    expect(mockFetcher).toHaveBeenCalledTimes(1)
    expect(data.value).toEqual(dataResponse1)
  })

  it('期望重复时间内不会发起请求', async () => {
    const dataResponse1 = { message: 'Hello, world!', code: 1 }
    const dataResponse2 = { message: 'Hello, world!', code: 2 }
    const mockFetcher = vi
      .fn()
      .mockResolvedValueOnce(dataResponse1)
      .mockResolvedValueOnce(dataResponse2)

    const key = uuid()
    const use = () => {
      return useQuery(() => key, mockFetcher, {
        dedupingInterval: 100,
      })
    }

    const { data: data1 } = use()
    const { data: data2 } = use()
    await sleep()

    expect(mockFetcher).toHaveBeenCalledTimes(1)
    expect(data1.value).toEqual(dataResponse1)
    expect(data2.value).toEqual(dataResponse1)

    const { data: data3 } = use()
    await sleep()

    expect(mockFetcher).toHaveBeenCalledTimes(1)
    expect(data1.value).toEqual(dataResponse1)
    expect(data2.value).toEqual(dataResponse1)
    expect(data3.value).toEqual(dataResponse1)

    await sleep(100)
    const { data: data4 } = use()
    await sleep()

    expect(mockFetcher).toHaveBeenCalledTimes(2)
    expect(data1.value).toEqual(dataResponse2)
    expect(data2.value).toEqual(dataResponse2)
    expect(data3.value).toEqual(dataResponse2)
    expect(data4.value).toEqual(dataResponse2)
  })

  it('期望不同组件内，返回的数据是共享且一致的', async () => {
    const dataResponse1 = { message: 'Hello, world!', code: 1 }
    const dataResponse2 = { message: 'Hello, world!', code: 2 }
    const dataResponse3 = { message: 'Hello, world!', code: 3 }
    const dataResponse4 = { message: 'error message', code: 4 }
    const mockFetcher = vi
      .fn()
      .mockResolvedValueOnce(dataResponse1)
      .mockResolvedValueOnce(dataResponse2)
      .mockResolvedValueOnce(dataResponse3)

    const key = 'aaa'
    const use = () => {
      return useQuery(key, mockFetcher)
    }

    const { data: data1, error: err1, refresh: refresh1 } = use()
    const { data: data2, error: err2, refresh: refresh2 } = use()
    await sleep()

    expect(mockFetcher).toBeCalledTimes(1)
    expect(data1.value).toEqual(dataResponse1)
    expect(data2.value).toEqual(dataResponse1)

    refresh1()
    await sleep()

    expect(mockFetcher).toBeCalledTimes(2)
    expect(data1.value).toEqual(dataResponse2)
    expect(data2.value).toEqual(dataResponse2)

    refresh2()
    await sleep()

    expect(mockFetcher).toBeCalledTimes(3)
    expect(data1.value).toEqual(dataResponse3)
    expect(data2.value).toEqual(dataResponse3)

    mockFetcher.mockRejectedValueOnce(dataResponse4)
    refresh1()
    await sleep()

    expect(mockFetcher).toBeCalledTimes(4)
    expect(data1.value).toEqual(null)
    expect(data2.value).toEqual(null)
    expect(err1.value).toEqual(dataResponse4)
    expect(err2.value).toEqual(dataResponse4)
  })

  it('期望在卸载组件后，组件更新函数不会再触发', async () => {
    const dataResponse1 = { message: 'Hello, world!', code: 1 }
    const dataResponse2 = { message: 'Hello, world!', code: 2 }
    const dataResponse3 = { message: 'Hello, world!', code: 3 }
    const mockFetcher = vi
      .fn()
      .mockResolvedValueOnce(dataResponse1)
      .mockResolvedValueOnce(dataResponse2)
      .mockResolvedValueOnce(dataResponse3)

    const key = uuid()
    const use = () => {
      return useQuery(() => key, mockFetcher, {
        dedupingInterval: 1,
      })
    }

    const { data: data1 } = use()
    const onUnmounted = onUnmounteds.pop()
    await sleep()

    const { data: data2, refresh } = use()
    await sleep()

    onUnmounted!()

    refresh()
    await sleep()

    expect(mockFetcher).toBeCalledTimes(3)
    expect(data1.value).toEqual(dataResponse2)
    expect(data2.value).toEqual(dataResponse3)
  })

  it('期望 key 更改后，旧的 key 数据更新时不会意外将新的 key 的数据更新', async () => {
    const dataResponse1 = { message: 'Hello, world!', code: 1 }
    const dataResponse2 = { message: 'Hello, world!', code: 2 }
    const dataResponse3 = { message: 'Hello, world!', code: 3 }
    const dataResponse4 = { message: 'Hello, world!', code: 4 }
    const mockFetcher = vi
      .fn()
      .mockResolvedValueOnce(dataResponse1)
      .mockResolvedValueOnce(dataResponse2)
      .mockResolvedValueOnce(dataResponse3)
      .mockResolvedValueOnce(dataResponse4)

    const beforeKey = uuid()
    const afterKey = uuid()
    const use = (keyRef: Ref<string>) => {
      return useQuery(() => keyRef.value, mockFetcher, {
        dedupingInterval: 1,
      })
    }

    const { data: data1, refresh: refresh1 } = use(ref(beforeKey))
    await sleep()

    const willChangeKey = ref(beforeKey)
    const { data: data2 } = use(willChangeKey)
    await sleep()

    willChangeKey.value = afterKey
    await sleep()

    refresh1()
    await sleep()

    expect(mockFetcher).toHaveBeenCalledTimes(4)
    expect(data1.value).toEqual(dataResponse4)
    expect(data2.value).toEqual(dataResponse3)
  })

  it('期望在请求未完成时调用刷新函数，不会重复执行 fetcher', async () => {
    const dataResponse1 = { message: 'Hello, world!', code: 1 }
    const dataResponse2 = { message: 'Hello, world!', code: 2 }
    const dataResponse3 = { message: 'Hello, world!', code: 3 }
    const dataResponse4 = { message: 'Hello, world!', code: 4 }
    const mockFetcher = vi
      .fn()
      .mockImplementationOnce(createDelayImp(dataResponse1))
      .mockImplementationOnce(createDelayImp(dataResponse2))
      .mockImplementationOnce(createDelayImp(dataResponse3))
      .mockImplementationOnce(createDelayImp(dataResponse4))

    const key = uuid()
    const use = () => {
      return useQuery(key, mockFetcher, {
        dedupingInterval: 1,
      })
    }

    const { refresh, data } = use()
    refresh()
    await sleep()

    expect(mockFetcher).toHaveBeenCalledTimes(1)
    expect(data.value).toEqual(dataResponse1)
  })

  it('期望无论是否存在缓存，监听数据，都只会触发一次', async () => {
    const dataResponse1 = { code: 1 }
    const dataResponse2 = { code: 2 }
    const dataResponse3 = { code: 3 }
    const mockFetcher = vi
      .fn()
      .mockResolvedValueOnce(dataResponse1)
      .mockResolvedValueOnce(dataResponse2)
      .mockResolvedValueOnce(dataResponse3)

    const watcher1 = vi.fn()
    const watcher2 = vi.fn()

    const use = (key: string) => {
      return useQuery(key, mockFetcher, {
        dedupingInterval: 1,
      })
    }

    // 没有缓存
    const { data: data1 } = use(uuid())
    watch(data1, watcher1)
    await sleep()

    const key = uuid()
    // 建立缓存
    use(key)
    await sleep()
    const { data: data2 } = use(key)
    watch(data2, watcher2)
    await sleep()

    expect(watcher1).toBeCalledTimes(1)
    expect(watcher2).toBeCalledTimes(1)
  })
})

describe('配置参数', () => {
  it('initialValue, 在初始化或者请求失败时返回', async () => {
    const defaultData = 'initial data'
    const errorData = 'error data'
    const asyncData = 'async data'
    const emptyData = null as unknown as string
    const mockFetcher = vi.fn()

    mockFetcher.mockRejectedValueOnce(errorData)
    const { data, error, refresh } = useQuery(uuid(), mockFetcher, {
      initialValue: 'initial data',
    })

    expect(data.value).toEqual(defaultData)

    await sleep()

    expect(data.value).toEqual(defaultData)
    expect(error.value).toEqual(errorData)

    mockFetcher.mockResolvedValueOnce(asyncData)
    refresh()
    await sleep()

    expect(data.value).toEqual(asyncData)
    expect(error.value).toEqual(null)

    mockFetcher.mockResolvedValueOnce(emptyData)
    refresh()
    await sleep()

    expect(data.value).toEqual(emptyData)
  })

  it('onUpdate, 数据改变（包括应用缓存数据）触发', async () => {
    const dataResponse1 = { code: 1 }
    const dataResponse2 = { code: 2 }
    const dataResponse3 = { code: 3 }
    const mockFetcher = vi
      .fn()
      .mockResolvedValueOnce(dataResponse1)
      .mockResolvedValueOnce(dataResponse2)
      .mockResolvedValueOnce(dataResponse3)

    const key = uuid()
    const use = (onUpdate?: (data: any) => void) => {
      return useQuery(key, mockFetcher, {
        dedupingInterval: 1,
        onUpdate,
      })
    }

    use()
    await sleep()

    const watcher = vi.fn()
    use(watcher)
    await sleep()

    expect(watcher).toBeCalledTimes(2)
    expect(watcher).toHaveBeenCalledWith(dataResponse1)
    expect(watcher).toHaveBeenCalledWith(dataResponse2)
  })
})
