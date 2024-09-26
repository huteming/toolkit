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
    expect(format(+now - 3 * second)).toBe('just now')
    expect(format(+now + 3 * second)).toBe('right now')
  })

  it('分钟', () => {
    const now = new Date()
    expect(format(+now - 3 * minute)).toBe('3 minutes ago')
    expect(format(+now + 3 * minute)).toBe('in 3 minutes')
  })

  it('小时', () => {
    const now = new Date()
    expect(format(+now - 3 * hour)).toBe('3 hours ago')
    expect(format(+now + 3 * hour)).toBe('in 3 hours')
  })

  it('天', () => {
    const now = new Date()
    expect(format(+now - 3 * day)).toBe('3 days ago')
    expect(format(+now + 3 * day)).toBe('in 3 days')
  })

  it('星期', () => {
    const now = new Date()
    expect(format(+now - 3 * week)).toBe('3 weeks ago')
    expect(format(+now + 3 * week)).toBe('in 3 weeks')
  })

  it('月', () => {
    const now = new Date()
    expect(format(+now - 3 * month)).toBe('3 months ago')
    expect(format(+now + 3 * month)).toBe('in 3 months')
  })

  it('年', () => {
    const now = new Date()
    expect(format(+now - 3 * year)).toBe('3 years ago')
    expect(format(+now + 3 * year)).toBe('in 3 years')
  })
})
