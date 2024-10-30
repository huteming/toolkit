import { describe, it, beforeEach, vi, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import { defineComponent } from 'vue'
import useStorage from './useStorage.js'

const KEY = 'storage-key'

describe('useStorage', () => {
  const store = new Map<string, any>()
  const storage = {
    getItem: vi.fn((key) => store.get(key)),
    setItem: vi.fn((key, value) => store.set(key, value)),
    removeItem: vi.fn((key) => store.delete(key)),
  }

  beforeEach(() => {
    store.clear()
    storage.getItem.mockClear()
    storage.setItem.mockClear()
    storage.removeItem.mockClear()
  })

  it('期望返回 storage 中的缓存值作为初始值, 在 storage 存在时', async () => {
    storage.setItem(KEY, 'cached')
    storage.setItem.mockClear()

    const wrapper = mount(
      defineComponent({
        template: '<div>{{ val }}</div>',
        setup() {
          const val = useStorage(KEY, 'abc', {
            storage,
          })
          return { val }
        },
      }),
    )
    await flushPromises()

    expect(wrapper.text()).toBe('cached')
    expect(storage.setItem).toBeCalledTimes(0)
  })

  it('期望写入默认值, 当 storage 不存在时', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div>{{ val }}</div>',
        setup() {
          const val = useStorage(KEY, 'hello', {
            writeDefaults: true,
            storage,
          })
          return { val }
        },
      }),
    )
    await flushPromises()

    expect(wrapper.text()).toBe('hello')
    expect(storage.setItem).toBeCalledWith(KEY, 'hello')
  })

  it('期望在值改变时, 会存储在 storage', async () => {
    const wrapper = mount(
      defineComponent({
        template: '<div @click="val = \'changed\'">{{ val }}</div>',
        setup() {
          const val = useStorage(KEY, 'hello', {
            storage,
          })
          return { val }
        },
      }),
    )
    await flushPromises()

    await wrapper.trigger('click')

    expect(wrapper.text()).toBe('changed')
    expect(storage.setItem).toBeCalledWith(KEY, 'changed')
  })

  it('期望在写入 null 时, 会删除 storage', async () => {
    store.set(KEY, 'hello')
    const data = useStorage(KEY, 'hello', {
      storage,
    })

    data.value = null
    await flushPromises()

    expect(data.value).toBe(null)
    expect(storage.setItem).toBeCalledTimes(0)
    expect(storage.removeItem).toBeCalledWith(KEY)
  })

  it('期望在写入 相同值 时, 不会执行 setItem', async () => {
    store.set(KEY, 'hello')

    const wrapper = mount(
      defineComponent({
        template: '<div @click="val = \'hello\'">{{ val }}</div>',
        setup() {
          const val = useStorage(KEY, 'hello', {
            storage,
          })
          return { val }
        },
      }),
    )
    await flushPromises()
    await wrapper.trigger('click')

    expect(wrapper.text()).toBe('hello')
    expect(storage.setItem).toBeCalledTimes(0)
    expect(storage.removeItem).toBeCalledTimes(0)
  })

  it('期望支持 boolean 类型', async () => {
    const data = useStorage(KEY, true, {
      storage,
    })

    expect(data.value).toBe(true)

    data.value = false
    await flushPromises()

    expect(storage.setItem).toBeCalledWith(KEY, 'false')
    expect(data.value).toBe(false)

    data.value = true
    await flushPromises()

    expect(storage.setItem).toBeCalledWith(KEY, 'true')
    expect(data.value).toBe(true)
  })

  it('期望支持 string 类型', async () => {
    const data = useStorage(KEY, 'a', {
      storage,
    })

    expect(data.value).toBe('a')

    data.value = 'b'
    await flushPromises()

    expect(storage.setItem).toBeCalledWith(KEY, 'b')
    expect(data.value).toBe('b')

    data.value = 'c'
    await flushPromises()

    expect(storage.setItem).toBeCalledWith(KEY, 'c')
    expect(data.value).toBe('c')
  })

  it('期望支持 number 类型', async () => {
    const data = useStorage(KEY, 1, {
      storage,
    })

    expect(data.value).toBe(1)

    data.value = 2
    await flushPromises()

    expect(storage.setItem).toBeCalledWith(KEY, '2')
    expect(data.value).toBe(2)

    data.value = 3
    await flushPromises()

    expect(storage.setItem).toBeCalledWith(KEY, '3')
    expect(data.value).toBe(3)
  })

  it('期望支持 object 类型', async () => {
    const value = { a: 1 }
    const data = useStorage(KEY, value, {
      storage,
    })

    expect(data.value).toEqual(value)

    const value2 = {
      ...value,
      b: '1',
    }
    data.value = value2
    await flushPromises()

    expect(storage.setItem).toBeCalledWith(KEY, JSON.stringify(value2))
    expect(data.value).toEqual(value2)

    const value3 = {
      ...value2,
      c: true,
    }
    data.value = value3
    await flushPromises()

    expect(storage.setItem).toBeCalledWith(KEY, JSON.stringify(value3))
    expect(data.value).toEqual(value3)
  })

  it('期望支持 array 类型', async () => {
    const value = [1]
    const data = useStorage(KEY, value, {
      storage,
    })

    expect(data.value).toEqual(value)

    const value2 = [...value, 2]
    data.value = value2
    await flushPromises()

    expect(storage.setItem).toBeCalledWith(KEY, JSON.stringify(value2))
    expect(data.value).toEqual(value2)

    const value3 = [...value2, 3]
    data.value = value3
    await flushPromises()

    expect(storage.setItem).toBeCalledWith(KEY, JSON.stringify(value3))
    expect(data.value).toEqual(value3)
  })
})
