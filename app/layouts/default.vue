<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { UserPermission } from '@/client'

const session = useSession()
const open = ref(false)

const links = computed(() => {

    const items = [
        {
            label: '메인',
            icon: 'i-lucide-house',
            to: '/'
        },
        {
            label: "학생관리",
            icon: 'i-lucide-users',
            to: '/student'
        }
    ] satisfies NavigationMenuItem[]

    if (!!((session.value?.permissions ?? 0) & UserPermission.MANAGE_USER))

})
</script>

<template>
    <UDashboardGroup unit="rem">
        <!-- 메뉴 -->
        <UDashboardSidebar
            id="default"
            v-model:open="open"
            collapsible
            resizable
            class="bg-elevated/25"
            :ui="{ header: 'flex items-center justify-center' }"
        >
            <template #header="{ collapsed }">
                <LogoSymbol :size="25" />
                <p class="font-semibold text-xl tracking-wide" v-if="!collapsed">미래패스</p>
            </template>
            <template #default="{ collapsed }">
                <UNavigationMenu
                    :collapsed="collapsed"
                    :items="links"
                    orientation="vertical"
                    tooltip
                    popover
                />
            </template>

            <template #footer="{ collapsed }">
                <UserMenu :collapsed="collapsed" />
            </template>
        </UDashboardSidebar>

        <!-- Panel -->
        <slot />
    </UDashboardGroup>
</template>