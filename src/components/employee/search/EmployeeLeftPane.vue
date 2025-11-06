<template>
    <div class="left-pane-container">
        <div class="fixed-search">
            <MiniSearchEmployeeComponent />
        </div>
        <div class="scrollable-list">
            <EmployeeList />
        </div>
    </div>
</template>

<script setup lang="ts">
import EmployeeList from './EmployeeList.vue';
import MiniSearchEmployeeComponent from './MiniSearchEmployeeComponent.vue';
</script>

<style scoped>
.left-pane-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.fixed-search {
    flex-shrink: 0;
    z-index: 1;
}

.scrollable-list {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
}
</style>