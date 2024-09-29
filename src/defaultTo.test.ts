import { it, expect } from 'vitest'
import defaultTo from './defaultTo.js'

it('data 是 null, undefined 则返回 default value', () => {
  expect(defaultTo(1, null)).toBe(1)
  expect(defaultTo(1, undefined)).toBe(1)
})

it('default value 可以是函数', () => {
  expect(defaultTo(() => 1, null)).toBe(1)
})

it('"", NaN 也是有效值', () => {
  expect(defaultTo('aaa', '')).toBe('')
  expect(defaultTo(1, NaN)).toBe(NaN)
})
