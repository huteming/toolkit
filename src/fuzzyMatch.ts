type Nullable<T> = T | null | undefined

export default function fuzzyMatch(word: Nullable<string>, searchValue: Nullable<string>): boolean {
  word = word?.trim()
  searchValue = searchValue?.trim()

  if (!searchValue) {
    return true
  }
  if (!word) {
    return false
  }

  word = word.toLowerCase()
  searchValue = searchValue.toLowerCase()

  return word.includes(searchValue)
}
