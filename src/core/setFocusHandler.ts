import { isOnline, isDocumentVisible, Console, isServer } from './utils'
import { queryCaches } from './queryCache'

type FocusHandler = () => void

const visibilityChangeEvent = 'visibilitychange'
const focusEvent = 'focus'

const onWindowFocus: FocusHandler = () => {
  if (isDocumentVisible() && isOnline()) {
    queryCaches.forEach(queryCache => {
      // Continue any paused queries
      queryCache.getQueries(query => {
        query.continue()
      })

      // Invalidate queries which should refetch on window focus
      queryCache
        .invalidateQueries(query => query.shouldRefetchOnWindowFocus())
        .catch(Console.error)
    })
  }
}

let removePreviousHandler: (() => void) | void

export function setFocusHandler(callback: (callback: FocusHandler) => void) {
  // Unsub the old watcher
  if (removePreviousHandler) {
    removePreviousHandler()
  }
  // Sub the new watcher
  removePreviousHandler = callback(onWindowFocus)
}

setFocusHandler((handleFocus: FocusHandler) => {
  // Listen to visibillitychange and focus
  if (!isServer && window?.addEventListener) {
    window.addEventListener(visibilityChangeEvent, handleFocus, false)
    window.addEventListener(focusEvent, handleFocus, false)

    return () => {
      // Be sure to unsubscribe if a new handler is set
      window.removeEventListener(visibilityChangeEvent, handleFocus)
      window.removeEventListener(focusEvent, handleFocus)
    }
  }
  return
})