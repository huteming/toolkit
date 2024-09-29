import { describe, it, expect } from 'vitest'
import format from './timeago.js'

const second = 1 * 1000
const minute = 1 * 60 * second
const hour = 1 * 60 * minute
const day = 1 * 24 * hour
const week = 1 * 7 * day
const month = (1 * 365 * day) / 12
const year = 1 * 365 * day

describe('timeago', () => {
  it('刚刚', () => {
    const now = new Date()
    expect(format(+now - 3 * second, { relativeDate: now })).toBe('just now')
    expect(format(+now + 3 * second, { relativeDate: now })).toBe('right now')
  })

  it('分钟', () => {
    const now = new Date()
    expect(format(+now - 3 * minute, { relativeDate: now })).toBe('3 minutes ago')
    expect(format(+now + 3 * minute, { relativeDate: now })).toBe('in 3 minutes')
  })

  it('小时', () => {
    const now = new Date()
    const diff = 3 * hour
    expect(format(+now - diff, { relativeDate: now })).toBe('3 hours ago')
    expect(format(+now + diff, { relativeDate: now })).toBe('in 3 hours')
  })

  it('天', () => {
    const now = new Date()
    expect(format(+now - 3 * day, { relativeDate: now })).toBe('3 days ago')
    expect(format(+now + 3 * day, { relativeDate: now })).toBe('in 3 days')
  })

  it('星期', () => {
    const now = new Date()
    expect(format(+now - 3 * week, { relativeDate: now })).toBe('3 weeks ago')
    expect(format(+now + 3 * week, { relativeDate: now })).toBe('in 3 weeks')
  })

  it('月', () => {
    const now = new Date()
    expect(format(+now - 3 * month, { relativeDate: now })).toBe('3 months ago')
    expect(format(+now + 3 * month, { relativeDate: now })).toBe('in 3 months')
  })

  it('年', () => {
    const now = new Date()
    expect(format(+now - 3 * year, { relativeDate: now })).toBe('3 years ago')
    expect(format(+now + 3 * year, { relativeDate: now })).toBe('in 3 years')
  })
})
