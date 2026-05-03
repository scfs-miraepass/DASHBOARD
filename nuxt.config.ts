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

    app: {
        head: {
            title: "미래패스 관리자",
            htmlAttrs: {
                lang: 'ko'
            },
            link: [
                { rel: 'icon', href: '/favicon.ico' }
            ],
        },
    },

    css: ['~/assets/css/main.css'],
})
