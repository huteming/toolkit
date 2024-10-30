import { it, expect, vi } from 'vitest'
import useRequest from './useRequest.js'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

it('support run immediately', async () => {
  const wrapper: any = mount({
    template: '<div>{{ data }}</div>',
    setup() {
      const { loading, data } = useRequest(
        async () => {
          return 'hello'
        },
        {
          initialData: 'default',
          manual: false,
        },
      )
      return { loading, data }
    },
  })

  expect(wrapper.html()).toContain('default')
  expect(wrapper.vm.loading).toBe(true)

  await flushPromises()

  expect(wrapper.html()).toContain('hello')
  expect(wrapper.vm.loading).toBe(false)
})

it('support run with params', async () => {
  const mockService = vi.fn().mockResolvedValue('async')

  const wrapper: any = mount({
    template: '<div>{{ data }}</div>',
    setup() {
      const { loading, data, run } = useRequest(mockService, {
        manual: false,
        defaultParams: [1, '2', true],
      })
      return { loading, data, run }
    },
  })
  await flushPromises()

  expect(mockService).toBeCalledTimes(1)
  expect(mockService).lastCalledWith(1, '2', true)

  wrapper.vm.run(2, '3', false)
  await flushPromises()

  expect(mockService).toBeCalledTimes(2)
  expect(mockService).lastCalledWith(2, '3', false)
})

it('support manual control call', async () => {
  const mockService = vi.fn().mockResolvedValue('hello')

  const wrapper: any = mount({
    template: '<div>{{ data }}</div>',
    setup() {
      const { loading, data, run } = useRequest(mockService, {
        manual: true,
      })
      return { loading, data, run }
    },
  })

  expect(mockService).toBeCalledTimes(0)
  expect(wrapper.vm.loading).toBe(false)

  wrapper.vm.run()
  await flushPromises()

  expect(mockService).toBeCalledTimes(1)
  expect(wrapper.html()).toContain('hello')
  expect(wrapper.vm.loading).toBe(false)
})

it('support callback "onSuccess"', async () => {
  const onSuccess = vi.fn()

  const wrapper = mount({
    template: '<div>{{ data }}</div>',
    setup() {
      const { loading, data } = useRequest(
        async () => {
          return 'hello'
        },
        {
          manual: false,
          onSuccess: (data) => {
            onSuccess(data)
          },
        },
      )
      return { loading, data }
    },
  })
  await flushPromises()

  expect(onSuccess).toBeCalledTimes(1)
  expect(onSuccess).toBeCalledWith('hello')
})

it('support callback "onError"', async () => {
  const onError = vi.fn()

  const wrapper: any = mount({
    template: '<div>{{ data }}</div>',
    setup() {
      const { loading, data } = useRequest(vi.fn().mockRejectedValue('err'), {
        manual: false,
        onError,
      })
      return { loading, data }
    },
  })

  expect(wrapper.vm.loading).toBe(true)

  await flushPromises()

  expect(wrapper.vm.loading).toBe(false)
  expect(onError).toHaveBeenCalledTimes(1)
  expect(onError).toBeCalledWith('err')
})

it('support watch ready state to run', async () => {
  const wrapper: any = mount({
    template: '<div id="button" @click="onclick">{{ data }}</div>',
    setup() {
      const ready = ref(false)
      const { loading, data } = useRequest(
        async () => {
          return 'hello'
        },
        {
          ready,
          manual: false,
          initialData: 'default',
        },
      )
      return { loading, data, ready }
    },
    methods: {
      onclick() {
        ;(this as any).ready = true
      },
    },
  })
  await flushPromises()

  expect(wrapper.html()).toContain('default')
  expect(wrapper.vm.loading).toBe(false)

  await wrapper.find('#button').trigger('click')
  await flushPromises()

  expect(wrapper.html()).toContain('hello')
  expect(wrapper.vm.loading).toBe(false)
})

it('expect the process will be suspended, when the request is canceled', async () => {
  const mockCallback = vi.fn()
  const { run, cancel } = useRequest(vi.fn().mockResolvedValue(''), {
    manual: true,
  })

  run().then(mockCallback)
  cancel()
  await flushPromises()

  expect(mockCallback).toBeCalledTimes(0)
})

it('expects to throw an exception when the request fails', async () => {
  const onError = vi.fn()
  const error = new Error('rejected')
  const { run } = useRequest(vi.fn().mockRejectedValue(error), {
    manual: true,
    onError,
  })

  try {
    await run()
    expect(true).toBe(false)
  } catch (err: any) {
    expect(err.message).toBe(error.message)
    expect(onError).toBeCalledTimes(1)
    expect(onError).toBeCalledWith(error)
  }
})
