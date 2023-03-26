import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import react from '@vitejs/plugin-react'
import nodePolyfills from 'rollup-plugin-polyfill-node'

//@ts-ignore
import manifest from './src/manifest'
// import { dependencies } from './package.json'

// // Packages we want in the vendor aka the deps needed in the entire app.
// const globalVendorPackages = ['react', 'react-dom', 'styled-components']

// function renderChunks(deps: Record<string, string>) {
//   let chunks = {}
//   Object.keys(deps).forEach((key) => {
//     if (globalVendorPackages.includes(key)) return
//     chunks[key] = [key]
//   })
//   return chunks
// }

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    build: {
      emptyOutDir: true,
      outDir: 'build',
      rollupOptions: {
        build: {
          rollupOptions: {
            plugins: [nodePolyfills()],
          },
          commonjsOptions: {
            transformMixedEsModules: true,
          },
        },
        input: {
          web: 'src/web/web.ts',
        },
        output: {
          entryFileNames: 'web.js',
        },
      },
    },

    plugins: [crx({ manifest }), react()],
  }
})
