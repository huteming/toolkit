import { describe, it, expect } from 'vitest'
import searchToObject from './searchToObject.js'

it('search 字符串 => object', () => {
  const url = new URL('http://localhost?a=a&b=b')
  expect(searchToObject(url.search)).toEqual({
    a: 'a',
    b: 'b',
  })
  expect(searchToObject(url.search.substring(1))).toEqual({
    a: 'a',
    b: 'b',
  })
})

it('searchParams => object', () => {
  const url = new URL('http://localhost?a=a&b=b')
  expect(searchToObject(url.searchParams)).toEqual({
    a: 'a',
    b: 'b',
  })
})

it('没有查询参数返回空对象', () => {
  const url = new URL('http://localhost')
  expect(searchToObject(url.search)).toEqual({})
  expect(searchToObject(url.searchParams)).toEqual({})
})
