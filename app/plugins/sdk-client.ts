// plugins/api-client.ts
import { client } from '@/sdk/client.gen'

export default defineNuxtPlugin((nuxtApp) => {
    client.setConfig({
        credentials: "include",
        baseUrl: "/api/",
    })
})