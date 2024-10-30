import { getCurrentInstance, onMounted } from 'vue'

export default function tryOnMounted(callback: Function) {
  if (getCurrentInstance()) {
    onMounted(callback)
    return
  }
  callback()
}
