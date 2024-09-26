import { describe, it, expect } from 'vitest'
import isNil from './isNil.js'

describe('isNil', () => {
  it('期望 null, undefined 返回 ture', () => {
    expect(isNil(null)).toBe(true)
    expect(isNil(undefined)).toBe(true)
  })

  it('期望 其他 返回 false', () => {
    expect(isNil(0)).toBe(false)
    expect(isNil('')).toBe(false)
    expect(isNil(false)).toBe(false)
    expect(isNil({})).toBe(false)
    expect(isNil([])).toBe(false)
  })
})
