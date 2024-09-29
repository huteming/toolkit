import { describe, it, expect } from 'vitest'
import fuzzyMatch from './fuzzyMatch.js'

it('expect ignore case', () => {
  expect(fuzzyMatch('Abc', 'abc')).toEqual(true)
  expect(fuzzyMatch('abc', 'abc')).toEqual(true)
})

it('expect return true when value is empty', () => {
  expect(fuzzyMatch('str', null)).toEqual(true)
  expect(fuzzyMatch('str', ' ')).toEqual(true)
})

it('expect return false when collection is empty', () => {
  expect(fuzzyMatch(null, 'str')).toEqual(false)
  expect(fuzzyMatch(' ', 'str')).toEqual(false)
})

it('expect return true when all is empty', () => {
  expect(fuzzyMatch(null, null)).toEqual(true)
  expect(fuzzyMatch(' ', ' ')).toEqual(true)
})
