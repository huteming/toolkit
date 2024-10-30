import { ref } from 'vue'
import tryOnMounted from './tryOnMounted.js'
import tryOnScopeDispose from './tryOnScopeDispose.js'

export default function useWindowSize() {
  const width = ref(0)
  const height = ref(0)
  const cleanups: Function[] = []

  const update = () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  const register = () => {
    const eventName = 'resize'
    window.addEventListener(eventName, update, { passive: true })
    cleanups.push(() => window.removeEventListener(eventName, update))
  }

  const cleanup = () => {
    cleanups.forEach((fn) => fn())
    cleanups.length = 0
  }

  update()
  tryOnMounted(register)
  tryOnScopeDispose(cleanup)

  return { width, height }
}
