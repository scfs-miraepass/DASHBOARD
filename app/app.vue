<script setup lang="ts">
const session = useSession()
</script>

<template>
    <UApp>
        <NuxtLoadingIndicator />

        <NuxtLayout v-if="session">
            <NuxtPage />
        </NuxtLayout>
    </UApp>
</template>
