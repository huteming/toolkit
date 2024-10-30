export async function sleep(time: number) {
  await new Promise((r) => setTimeout(r, time))
  return time
}
