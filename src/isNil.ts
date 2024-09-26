export default function isNil(data: any): data is null | undefined {
  if (data === null || data === undefined) {
    return true
  }
  return false
}
