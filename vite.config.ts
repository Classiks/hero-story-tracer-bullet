import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

import type { PluginOption } from 'vite'

function preserveViteDevAssetRequests(): PluginOption {
  return {
    name: 'preserve-vite-dev-asset-requests',
    apply: 'serve',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          return next()
        }

        const parsedUrl = getParsedUrl(req.url)
        const pathname = parsedUrl?.pathname
        const fetchDest = req.headers['sec-fetch-dest']
        if (!pathname || (fetchDest && fetchDest !== 'empty')) {
          return next()
        }

        // Some LAN/mobile dev requests arrive without useful Fetch Metadata.
        // Vite 8 uses sec-fetch-dest to identify module/CSS requests; without
        // it, Vite-owned URLs can fall through to TanStack Start's HTML 404.
        if (isViteAssetUrlImport(parsedUrl)) {
          // A CSS ?url import is a JS module that exports the emitted URL, not
          // a stylesheet response. Mark it as script so Vite transforms it.
          req.headers['sec-fetch-dest'] = 'script'

          return next()
        }

        if (isViteStylesheetRequest(pathname)) {
          req.headers['sec-fetch-dest'] = 'style'

          if (!req.headers.accept || req.headers.accept === '*/*') {
            req.headers.accept = 'text/css,*/*;q=0.1'
          }

          return next()
        }

        if (isViteModuleRequest(pathname)) {
          req.headers['sec-fetch-dest'] = 'script'
        }

        next()
      })
    },
  }
}

function getParsedUrl(url: string | undefined) {
  if (!url) {
    return undefined
  }

  try {
    return new URL(url, 'http://localhost')
  } catch {
    return undefined
  }
}

function isViteAssetUrlImport(url: URL) {
  return url.searchParams.has('url') && hasViteAssetPrefix(url.pathname)
}

function hasViteAssetPrefix(pathname: string) {
  return (
    pathname.startsWith('/src/') ||
    pathname.startsWith('/@fs/') ||
    pathname.startsWith('/node_modules/')
  )
}

function isViteStylesheetRequest(pathname: string) {
  return hasViteAssetPrefix(pathname) && pathname.endsWith('.css')
}

function isViteModuleRequest(pathname: string) {
  return (
    pathname === '/@vite/client' ||
    pathname === '/@react-refresh' ||
    pathname.startsWith('/@id/') ||
    isJsLikeViteAsset(pathname)
  )
}

function isJsLikeViteAsset(pathname: string) {
  return hasViteAssetPrefix(pathname) && /\.(?:[cm]?[jt]sx?)$/.test(pathname)
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    preserveViteDevAssetRequests(),
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
