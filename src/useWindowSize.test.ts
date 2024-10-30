import { vi, beforeEach, afterAll, it, expect } from 'vitest'
import useWindowSize from './useWindowSize.js'

const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

beforeEach(() => {
  addEventListenerSpy.mockClear()
})

afterAll(() => {
  addEventListenerSpy.mockRestore()
})

it('should work', () => {
  const { width, height } = useWindowSize()

  expect(width.value).toBe(window.innerWidth)
  expect(height.value).toBe(window.innerHeight)
})

it('sets handler for window "resize" event', async () => {
  useWindowSize()

  expect(addEventListenerSpy).toBeCalledTimes(1)

  const call = addEventListenerSpy.mock.calls[0]
  expect(call[0]).toEqual('resize')
  expect(call[2]).toEqual({ passive: true })
})
