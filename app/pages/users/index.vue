<script setup lang="ts">
import { UserType, UserPermission, type User } from '@/client'
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
const searchLoading = ref<boolean>(false)
const searchUsers = ref<User[] | undefined>(undefined)
let searchTimeout: NodeJS.Timeout | null = null

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
    if (searchUsers.value != undefined) {
        return searchUsers.value
    }
    if (studentsResponse.value?.success) {
        return studentsResponse.value.data
    }
    return []
})

const columns = computed<TableColumn<User>[]>(() => {
    const UCheckbox = resolveComponent('UCheckbox')
    const UDropdownMenu = resolveComponent('UDropdownMenu')
    const UButton = resolveComponent('UButton')

    const cols: TableColumn<User>[] = [
        {
            id: 'select',
            header: ({ table }) => h(UCheckbox, {
                modelValue: table.getIsAllPageRowsSelected(),
                indeterminate: table.getIsSomePageRowsSelected(),
                'onUpdate:modelValue': (value: boolean) => table.toggleAllPageRowsSelected(value),
                ui: {
                    base: "cursor-pointer"
                }
            }),
            cell: ({ row }) => h(UCheckbox, {
                modelValue: row.getIsSelected(),
                'onUpdate:modelValue': (value: boolean) => row.toggleSelected(value),
                ui: {
                    base: "cursor-pointer"
                }
            })
        },
        { accessorKey: 'id', header: '고유번호' },
        { accessorKey: 'name', header: '이름' },
        { accessorKey: 'type', header: '구분' },
        { accessorKey: 'grade', header: '학년' },
        { accessorKey: 'number', header: '반' },
        { accessorKey: 'point', header: '현재 포인트' },
        { accessorKey: 'total_point', header: '누적 포인트' },
        {
            id: 'actions',
            meta: {
                class: {
                    td: 'text-right'
                }
            },
            cell: () => {
                return h(
                    UDropdownMenu,
                    {
                        content: {
                            align: 'end'
                        },
                        items: [
                            {
                                label: '사용자 삭제',
                                onSelect() {
                                    // TODO
                                },
                                icon: 'i-lucide-trash-2',
                                color: "error"
                            },
                            {
                                label: '사용자 수정',
                                onSelect() {
                                    // TODO
                                },
                                icon: 'i-lucide-file-pen-line'
                            }
                        ]
                    },
                    () =>
                        h(UButton, {
                            icon: 'i-lucide-ellipsis-vertical',
                            color: 'neutral',
                            variant: 'ghost',
                            ui: {
                                base: 'cursor-pointer hover:bg-accented dark:hover:bg-elevated'
                            }
                        })
                )
            }
        }
    ]

    return cols
})

const selected = computed(() => {
    const selectedIds = Object.keys(rowSelection.value).filter(key => rowSelection.value[key])
    return students.value.filter(s => selectedIds.includes(String(s.id)))
})

const onSearch = async (event: InputEvent) => {
    search.value = (event.target as HTMLInputElement).value;

    searchUsers.value = []

    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        if (search.value.replaceAll(" ", "").length <= 0) {
            searchUsers.value = undefined
            return
        }

        searchLoading.value = true
        const search_req = await $API.searchSearchGet({
            query: {
                q: search.value
            }
        })
        if (!search_req.data?.success || search_req.response == undefined) return;
        searchUsers.value = search_req.data.data
        searchLoading.value = false
    }, 200);
}
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
                    <UInput v-model="search" @input="onSearch" icon="i-lucide-search" placeholder="이름 또는 학번 검색..." class="w-64" />
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
                :data="students"
                :columns="columns"
                :loading="pending || searchLoading"
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
            <UPagination v-model:page="dataPage" :total="maxPage" :items-per-page="1" v-if="searchUsers == undefined" />

        </template>
    </UDashboardPanel>
</template>
