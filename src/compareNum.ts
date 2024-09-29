type Nullable<T> = T | null | undefined

interface StrictComparer {
  (value: Nullable<number | string>, target: Nullable<number | string>): boolean
}

interface NumberComparer {
  (value: number, target: number): boolean
}

function isDefined<T>(data: Nullable<T>): data is T {
  if (data === null || data === undefined) {
    return false
  }
  return true
}

function compareNum(compareFn: NumberComparer): StrictComparer {
  const realComparer: StrictComparer = (value, target) => {
    if (!isDefined(value) || !isDefined(target)) {
      return false
    }
    if (value === '' || target === '') {
      return false
    }
    value = Number(value)
    target = Number(target)
    if (Number.isNaN(value) || Number.isNaN(target)) {
      return false
    }
    return compareFn(value, target)
  }

  return realComparer
}

export const strictLessThan = compareNum((value, target) => value < target)
export const strictLessThanEqual = compareNum((value, target) => value <= target)
