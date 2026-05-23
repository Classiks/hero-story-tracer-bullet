import { useNavigate, useRouter, type NavigateOptions } from '@tanstack/react-router'
import { useCallback } from 'react'

const NAVIGATION_FALLBACK_DELAY_MS = 900

export function useAppNavigate() {
  const navigate = useNavigate()
  const router = useRouter()

  return useCallback(
    (options: NavigateOptions) => {
      const targetHref = buildTargetHref(router, options)
      const navigation = navigate(options)

      if (typeof window === 'undefined' || !targetHref || options.reloadDocument) {
        return navigation
      }

      // Rarely, mobile-hosted dev sessions can leave the router transition stuck:
      // the click fires, but the URL never commits. Fall back instead of requiring refresh.
      const fallback = window.setTimeout(() => {
        if (isCurrentBrowserHref(targetHref)) {
          return
        }

        if (options.replace) {
          window.location.replace(targetHref)
          return
        }

        window.location.assign(targetHref)
      }, NAVIGATION_FALLBACK_DELAY_MS)

      void Promise.resolve(navigation).finally(() => {
        if (isCurrentBrowserHref(targetHref)) {
          window.clearTimeout(fallback)
        }
      })

      return navigation
    },
    [navigate, router],
  )
}

function buildTargetHref(router: ReturnType<typeof useRouter>, options: NavigateOptions) {
  try {
    return router.buildLocation({
      ...options,
      _includeValidateSearch: true,
    }).publicHref
  } catch {
    return null
  }
}

function isCurrentBrowserHref(targetHref: string) {
  const target = new URL(targetHref, window.location.origin)
  const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`
  const normalizedTargetHref = `${target.pathname}${target.search}${target.hash}`

  return currentHref === normalizedTargetHref
}
