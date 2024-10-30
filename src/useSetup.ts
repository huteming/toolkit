import { ref, watch } from 'vue'
import type { Ref } from 'vue'

export default function useSetup(isReady: Ref<boolean>, handler: () => void) {
  const dispose = ref<(() => void) | null>(null)

  const fire = () => {
    if (isReady.value) {
      handler()
      return
    }

    if (dispose.value) {
      return
    }

    dispose.value = watch(isReady, (newVal, oldVal) => {
      if (newVal) {
        handler()
        dispose.value?.()
        dispose.value = null
      }
    })
  }

  return {
    fire,
  }
}
