import { describe, it, expect, vi } from 'vitest'
import useSetup from './useSetup.js'
import { ref } from 'vue'
import { sleep } from './shared/utils.js'

it('如果没有触发过，准备好后也不会执行', async () => {
  const isReady = ref(false)
  const handler = vi.fn()
  const { fire } = useSetup(isReady, handler)

  isReady.value = true
  await sleep(5)
  expect(handler).toHaveBeenCalledTimes(0)
})

it('触发时如果没有准备好，延迟执行', async () => {
  const isReady = ref(false)
  const handler = vi.fn()
  const { fire } = useSetup(isReady, handler)

  fire()
  fire()
  expect(handler).toHaveBeenCalledTimes(0)

  isReady.value = true
  await sleep(5)
  expect(handler).toHaveBeenCalledTimes(1)
})

it('触发时如果准备好了，立即执行', async () => {
  const isReady = ref(false)
  const handler = vi.fn()
  const { fire } = useSetup(isReady, handler)

  isReady.value = true
  await sleep(5)
  fire()
  expect(handler).toHaveBeenCalledTimes(1)
})

it('每次触发都是独立的，都会判断当前状态是否准备好', async () => {
  const isReady = ref(false)
  const handler = vi.fn()
  const { fire } = useSetup(isReady, handler)

  isReady.value = true
  await sleep(5)
  fire()
  expect(handler).toHaveBeenCalledTimes(1)

  isReady.value = false
  await sleep(5)
  fire()
  expect(handler).toHaveBeenCalledTimes(1)
})

it('执行过后，直到下次准备好时，如果过程中如果没触发过，也不会执行', async () => {
  const isReady = ref(false)
  const handler = vi.fn()
  const { fire } = useSetup(isReady, handler)

  fire()
  isReady.value = true
  await sleep(5)
  expect(handler).toHaveBeenCalledTimes(1)

  isReady.value = false
  await sleep(5)
  isReady.value = true
  await sleep(5)
  expect(handler).toHaveBeenCalledTimes(1)
})
