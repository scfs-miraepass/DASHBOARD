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

    css: ['~/assets/css/main.css'],
})
