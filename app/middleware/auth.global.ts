import { getCurrentUserAuthGet } from "@/sdk"

// 클라이언트 캐싱 및 중복 요청 방지를 위한 상태
let lastFetched = 0
let fetchPromise: Promise<any> | null = null
const CACHE_TTL = 1000 * 60 * 5 // 5분 (밀리초)

// 브라우저 콘솔 로그를 예쁘게 출력하기 위한 헬퍼 함수
const authLog = (message: string, ...args: any[]) => {
    console.log(
        `%cAuth Middleware%c ${message}`,
        'background: oklch(48.8% 0.243 264.376); color: white; padding: 2px 6px; border-radius: 4px; font-weight: 600;',
        'color: inherit;',
        ...args
    )
}

export default defineNuxtRouteMiddleware(async (to) => {

    if (import.meta.client) {
        authLog(`'${to.path}'으로 페이지 이동`)
        const session = useSession()

        const now = Date.now()

        // 공통 API 호출 및 세션 상태 업데이트 함수
        const fetchSession = async () => {
            authLog('fetchSession 호출')
            // 중복 호출 방지 (요청 중일 때 기존 Promise 재사용)
            if (!fetchPromise) {
                authLog('새로운 API 요청 시작')
                fetchPromise = getCurrentUserAuthGet().finally(() => {
                    fetchPromise = null
                })
            } else {
                authLog('기존 API 요청 대기')
            }
            
            const req = await fetchPromise
            if (!req.error) {
                authLog( 'API 성공 (session 업데이트)')
                session.value = req.data.data
                lastFetched = Date.now()
            } else {
                session.value = undefined
                lastFetched = 0
            }
            return req
        }

        // 이미 세션 정보가 있는 경우
        if (session.value) {
            authLog('기존 세션 존재')
            // Stale-While-Revalidate 패턴: 캐시 유효기간 경과 시 백그라운드 갱신
            if (now - lastFetched > CACHE_TTL) {
                authLog('캐시 만료, 백그라운드 갱신 시작')
                const req = await fetchSession()
                if (req.error && !to.path.startsWith("/login")) {
                    authLog('갱신 실패, 로그인 페이지으로 이동시킵니다.')
                    return navigateTo("/login", { replace: true })
                }
            } else {
                authLog('캐시와 세션이 유효함.')
            }

            if (to.path.startsWith("/login")) {
                authLog('이미 세션이 존재합니다. 메인 페이지으로 이동시킵니다.')
                return navigateTo("/")
            }
            authLog(`통과. ${(CACHE_TTL - (now - lastFetched))/1000}초 후 만료됨.`)
            return
        }

        authLog('세션 없음, API 호출 대기')
        // 세션 정보가 없으면 API 호출 대기 (최초 진입 등)
        const req = await fetchSession()

        if (to.path.startsWith("/login")) {
            if (!req.error) {
                authLog('이미 세션이 존재합니다. 메인 페이지으로 이동시킵니다.')
                return navigateTo("/")
            }
            authLog('로그인 페이지 통과')
            return
        }
        
        if (req.error) {
            authLog('세션 없습니다. 로그인 페이지으로 이동시킵니다.')
            return navigateTo("/login", { replace: true })
        }
        
        authLog('세션 확인 완료')
    }
})
