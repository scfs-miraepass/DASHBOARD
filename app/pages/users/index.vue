<script setup lang="ts">
import type { User } from '@/client'
import { UserType, UserPermission } from '@/client'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
    permissions: [ UserPermission.MANAGE_USER ]
})

const filterUser = reactive<{
    type?: UserType
    permission?: number
}>({
    type: undefined,
    permission: undefined
})
const maxPage = ref<number>(0);
const dataPage = ref<number>(1);

const rowSelection = ref<Record<string, boolean>>({})
const search = ref('')

const queryParams = computed(() => ({
    limit: 20,
    page: dataPage.value,
    user_type: filterUser.type,
    permission: filterUser.permission
}));
const { data: studentsResponse, pending } = await useAsyncData('users.getUsersAdminUsersGet', async (_nuxtApp, { signal }) => {
    const req = await $API.getUsersAdminUsersGet({
        query: queryParams.value,
        ...signal
    })

    if (!req.data?.success || req.response == undefined) return;
    maxPage.value = Number(req.response.headers.get("X-MAX-PAGE"));

    return req.data;
}, { watch: [ queryParams ] })

const students = computed(() => {
    if (studentsResponse.value?.success) {
        return studentsResponse.value.data
    }
    return []
})

const columns = computed<TableColumn<User>[]>(() => {
    const UCheckbox = resolveComponent('UCheckbox')
    const cols: TableColumn<User>[] = [
        {
            id: 'select',
            header: ({ table }) => h(UCheckbox, {
                modelValue: table.getIsAllPageRowsSelected(),
                indeterminate: table.getIsSomePageRowsSelected(),
                'onUpdate:modelValue': (value: boolean) => table.toggleAllPageRowsSelected(value)
            }),
            cell: ({ row }) => h(UCheckbox, {
                modelValue: row.getIsSelected(),
                'onUpdate:modelValue': (value: boolean) => row.toggleSelected(value)
            })
        },
        { accessorKey: 'id', header: 'ID(학번)' },
        { accessorKey: 'name', header: '이름' },
        { accessorKey: 'type', header: '구분' },
        { accessorKey: 'grade', header: '학년' },
        { accessorKey: 'number', header: '반' },
        { accessorKey: 'point', header: '현재 포인트' },
        { accessorKey: 'total_point', header: '누적 포인트' }
    ]

    return cols
})

// TODO: 검색기능 다시.. API 로 검색하는 방식으로
const filteredStudents = computed(() => {
    if (!search.value) return students.value
    return students.value.filter(s =>
        s.name.includes(search.value) ||
        String(s.id).includes(search.value)
    )
})

const selected = computed(() => {
    const selectedIds = Object.keys(rowSelection.value).filter(key => rowSelection.value[key])
    return filteredStudents.value.filter(s => selectedIds.includes(String(s.id)))
})
</script>

<template>
    <UDashboardPanel :ui="{
        root: 'overflow-y-auto',
        body: 'min-h-fit'
    }">
        <template #header>
            <UDashboardNavbar title="학생 관리">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                    <UInput v-model="search" icon="i-lucide-search" placeholder="이름 또는 학번 검색..." class="w-64" />
                    <UButton 
                        v-if="selected.length > 0" 
                        color="primary" 
                        variant="solid" 
                        icon="i-lucide-coins"
                    >
                        포인트 관리 ({{ selected.length }}명)
                    </UButton>
                </div>
                
                <UButton 
                    color="error"
                    variant="solid" 
                    icon="i-lucide-user-plus"
                >
                    사용자 생성
                </UButton>
            </div>

            <UTable 
                v-model:row-selection="rowSelection" 
                :get-row-id="(row) => String(row.id)"
                :data="filteredStudents"
                :columns="columns"
                :loading="pending"
                class="w-full"
            >
                <template #type-cell="{ row }">
                    <UBadge :color="row.original.type === 'student' ? 'success' : 'neutral'" variant="subtle">
                        {{ row.original.type === 'student' ? '학생' : (row.original.type === 'teacher' ? '교사' : '서비스') }}
                    </UBadge>
                </template>
                <template #point-cell="{ row }">
                    <span class="font-semibold text-primary">{{ row.original.point?.toLocaleString() || 0 }} P</span>
                </template>
                <template #total_point-cell="{ row }">
                    <span class="text-gray-500">{{ row.original.total_point?.toLocaleString() || 0 }} P</span>
                </template>
            </UTable>
            <UPagination v-model:page="dataPage" :total="maxPage" :items-per-page="1" />

        </template>
    </UDashboardPanel>
</template>
