import { getCurrentScope, onScopeDispose } from 'vue'

export default function tryOnScopeDispose(callback: () => void) {
  if (getCurrentScope()) {
    onScopeDispose(callback)
  }
}
