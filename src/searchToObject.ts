export default function searchToObject(search: URLSearchParams | string) {
  if (typeof search === 'string' && search.startsWith('?')) {
    search = search.substring(1)
  }

  const searchString = search.toString()

  if (!searchString) {
    return {}
  }

  return JSON.parse(
    '{"' +
      decodeURI(searchString).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') +
      '"}',
  )
}
