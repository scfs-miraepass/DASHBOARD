import type { UseFetchOptions } from 'nuxt/app'
import { $fetch } from "./$fetch"

export const useAPI = <T>(
    url: string | (() => string),
    options?: UseFetchOptions<T>,
) => {
    return useFetch(url, {
        ...options,
        $fetch: $fetch as typeof globalThis.$fetch
    })
}
