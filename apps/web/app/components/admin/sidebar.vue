<script setup lang="ts">
const route = useRoute()

const menuItems = [
  { label: '사용자 관리', to: '/admin/users', icon: '👤' },
  { label: '권한 관리', to: '/admin/permissions', icon: '🔑' },
]
</script>

<template>
  <aside class="w-56 min-h-[calc(100vh-4rem)] bg-base-100 border-r border-base-200 py-4">
    <ul class="menu menu-md gap-1 px-2 w-auto">
      <li v-for="item in menuItems" :key="item.to" :class="route.path === item.to ? 'menu-active' : ''">
        <NuxtLink :to="item.to">
          <span>{{ item.icon }}</span>
          {{ item.label }}
        </NuxtLink>
      </li>
    </ul>
  </aside>

</template>