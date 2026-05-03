// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: false },

    future: {
        compatibilityVersion: 4,
    },
    typescript: {
        typeCheck: 'build',
        strict: true
    },

    modules: [
        '@nuxt/ui',
        '@vueuse/nuxt'
    ],

    routeRules: {
        '/api/**': {
            proxy: process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:8000/**',
        },
    },

    css: ['~/assets/css/main.css'],
})
