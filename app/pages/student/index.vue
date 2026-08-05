<script setup lang="ts">
import { getStudentsAdminStudentGet, updateStudentsPointAdminPointPost } from '@/sdk'
import type { User, AdminPointRequest } from '@/sdk'
import type { TableColumn } from '@nuxt/ui'

// 데이터 패치
const { data: studentsResponse, pending, refresh } = await useAsyncData('students', () => getStudentsAdminStudentGet())

const students = computed(() => {
    if (studentsResponse.value?.data) {
        return studentsResponse.value.data.data
    }
    return []
})

// 테이블 컬럼 정의
const columns = computed<TableColumn<User>[]>(() => {
    const UCheckbox = resolveComponent('UCheckbox')
    return [
        {
            id: 'select',
            header: ({ table }) => h(UCheckbox, {
                modelValue: table.getIsAllPageRowsSelected(),
                indeterminate: table.getIsSomePageRowsSelected(),
                'onUpdate:modelValue': (value: boolean) => table.toggleAllPageRowsSelected(!!value)
            }),
            cell: ({ row }) => h(UCheckbox, {
                modelValue: row.getIsSelected(),
                'onUpdate:modelValue': (value: boolean) => row.toggleSelected(!!value)
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
})

const rowSelection = ref<Record<string, boolean>>({})
const search = ref('')

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

// 모달 상태
const isPointModalOpen = ref(false)
const isCreateUserModalOpen = ref(false)

// 포인트 지급 폼 상태
const pointForm = ref({
    amount: 0,
    reason: ''
})
const isSubmittingPoints = ref(false)
const toast = useToast()

const openPointModal = () => {
    pointForm.value = { amount: 0, reason: '' }
    isPointModalOpen.value = true
}

const handlePointSubmit = async () => {
    if (selected.value.length === 0) {
        toast.add({ title: '사용자를 선택해주세요.', color: 'error' })
        return
    }
    
    if (pointForm.value.amount === 0) {
        toast.add({ title: '금액을 입력해주세요.', color: 'error' })
        return
    }

    if (!pointForm.value.reason) {
        toast.add({ title: '사유를 입력해주세요.', color: 'error' })
        return
    }

    isSubmittingPoints.value = true
    try {
        const requestData: AdminPointRequest = {
            user_ids: selected.value.map(s => s.id as number),
            amount: pointForm.value.amount,
            reason: pointForm.value.reason,
            is_all_students: false
        }
        
        const res = await updateStudentsPointAdminPointPost({ body: requestData })
        
        if (res.error == undefined) {
            toast.add({ title: '포인트가 성공적으로 처리되었습니다.', color: 'success' })
            isPointModalOpen.value = false
            rowSelection.value = {}
            await refresh()
        } else {
            toast.add({ title: '처리 중 오류가 발생했습니다.', color: 'error' })
        }
    } catch (e) {
        console.error(e)
        toast.add({ title: '네트워크 오류가 발생했습니다.', color: 'error' })
    } finally {
        isSubmittingPoints.value = false
    }
}

// 사용자 생성 폼 상태 (UI Only)
const createUserForm = ref({
    name: '',
    type: 'student',
    grade: 1,
    number: 1
})

const handleCreateUser = () => {
    console.log('Create User (UI Only):', createUserForm.value)
    toast.add({ title: '사용자 생성 폼이 제출되었습니다. (API 미연동)', color: 'success' })
    isCreateUserModalOpen.value = false
}
</script>

<template>
    <UDashboardPanel>
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
                        @click="openPointModal"
                    >
                        포인트 관리 ({{ selected.length }}명)
                    </UButton>
                </div>
                
                <UButton 
                    color="error"
                    variant="solid" 
                    icon="i-lucide-user-plus"
                    @click="isCreateUserModalOpen = true"
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

            <!-- 포인트 지급/차감 모달 -->
            <UModal v-model="isPointModalOpen">
                <UCard>
                    <template #header>
                        <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                            포인트 관리 ({{ selected.length }}명 선택됨)
                        </h3>
                    </template>
                    
                    <div class="space-y-4">
                        <UFormField label="금액" help="양수 입력 시 지급, 음수 입력 시 차감됩니다.">
                            <UInput v-model.number="pointForm.amount" type="number" placeholder="예: 500 또는 -200" />
                        </UFormField>
                        
                        <UFormField label="사유 / 메모">
                            <UTextarea v-model="pointForm.reason" placeholder="포인트 지급/차감 사유를 입력하세요" />
                        </UFormField>
                    </div>

                    <template #footer>
                        <div class="flex justify-end gap-2">
                            <UButton color="error" variant="ghost" @click="isPointModalOpen = false">취소</UButton>
                            <UButton color="primary" :loading="isSubmittingPoints" @click="handlePointSubmit">
                                적용하기
                            </UButton>
                        </div>
                    </template>
                </UCard>
            </UModal>

            <!-- 사용자 생성 모달 (UI Only) -->
            <UModal v-model="isCreateUserModalOpen">
                <UCard>
                    <template #header>
                        <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                            사용자 생성 (UI 전용)
                        </h3>
                    </template>
                    
                    <div class="space-y-4">
                        <UFormField label="이름">
                            <UInput v-model="createUserForm.name" placeholder="홍길동" />
                        </UFormField>
                        
                        <UFormField label="구분">
                            <USelect 
                                v-model="createUserForm.type" 
                                :items="[{ label: '학생', value: 'student' }, { label: '교사', value: 'teacher' }, { label: '서비스', value: 'service' }]" 
                            />
                        </UFormField>

                        <div class="grid grid-cols-2 gap-4" v-if="createUserForm.type === 'student'">
                            <UFormField label="학년">
                                <UInput v-model.number="createUserForm.grade" type="number" min="1" max="3" />
                            </UFormField>
                            <UFormField label="반">
                                <UInput v-model.number="createUserForm.number" type="number" min="1" max="15" />
                            </UFormField>
                        </div>
                    </div>

                    <template #footer>
                        <div class="flex justify-end gap-2">
                            <UButton color="error" variant="ghost" @click="isCreateUserModalOpen = false">취소</UButton>
                            <UButton color="primary" @click="handleCreateUser">
                                생성 (더미)
                            </UButton>
                        </div>
                    </template>
                </UCard>
            </UModal>

        </template>
    </UDashboardPanel>
</template>
