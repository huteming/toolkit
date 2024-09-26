import { describe, it, expect } from 'vitest'
import { strictLessThan, strictLessThanEqual } from './compareNum.js'

describe('compareNum', () => {
  describe('strictLessThan', () => {
    it('当 value 不是数字时，返回 false', () => {
      expect(strictLessThan(null, 10)).toBe(false)
      expect(strictLessThan(undefined, 10)).toBe(false)
      expect(strictLessThan('', 10)).toBe(false)
      expect(strictLessThan('a', 10)).toBe(false)
    })

    it('当 target 不是数字时，返回 false', () => {
      expect(strictLessThan(10, null)).toBe(false)
      expect(strictLessThan(10, undefined)).toBe(false)
      expect(strictLessThan(10, '')).toBe(false)
      expect(strictLessThan(10, 'a')).toBe(false)
    })

    it('当参数时字符串类型的数字，也能正常执行', () => {
      expect(strictLessThan('9', 10)).toBe(true)
      expect(strictLessThan(9, '10')).toBe(true)
      expect(strictLessThan('11', 10)).toBe(false)
      expect(strictLessThan(11, '10')).toBe(false)
    })
  })

  describe('strictLessThanEqual', () => {
    it('当 value 不是数字时，返回 false', () => {
      expect(strictLessThanEqual(null, 10)).toBe(false)
      expect(strictLessThanEqual(undefined, 10)).toBe(false)
      expect(strictLessThanEqual('', 10)).toBe(false)
      expect(strictLessThanEqual('a', 10)).toBe(false)
    })

    it('当 target 不是数字时，返回 false', () => {
      expect(strictLessThanEqual(10, null)).toBe(false)
      expect(strictLessThanEqual(10, undefined)).toBe(false)
      expect(strictLessThanEqual(10, '')).toBe(false)
      expect(strictLessThanEqual(10, 'a')).toBe(false)
    })

    it('当参数时字符串类型的数字，也能正常执行', () => {
      expect(strictLessThanEqual('9', 9)).toBe(true)
      expect(strictLessThanEqual(9, '9')).toBe(true)

      expect(strictLessThanEqual('9', 10)).toBe(true)
      expect(strictLessThanEqual(9, '10')).toBe(true)

      expect(strictLessThanEqual('11', 10)).toBe(false)
      expect(strictLessThanEqual(11, '10')).toBe(false)
    })
  })
})
