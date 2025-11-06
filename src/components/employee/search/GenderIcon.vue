<template>
    <div
        class="gender-icon"
        :class="genderIconClass"
    >
        {{ genderSymbol }}
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Gender } from '../../models';

interface Props {
    gender?: Gender | null;
}

const props = withDefaults(defineProps<Props>(), {
    gender: null,
});

const genderSymbol = computed((): string => {
    if (!props.gender?.name) return '?';
    const name = props.gender.name.toLowerCase();
    if (name.includes('male') || name === 'm') return '♂';
    if (name.includes('female') || name === 'f') return '♀';
    return '?';
});

const genderIconClass = computed((): string => {
    if (!props.gender?.name) return 'gender-unknown';
    const name = props.gender.name.toLowerCase();
    if (name.includes('Male') || name === 'm') return 'gender-male';
    if (name.includes('Female') || name === 'f') return 'gender-female';
    return 'gender-unknown';
});
</script>

<style scoped>
.gender-icon {
    font-size: 20px;
    font-weight: bold;
    line-height: 1;
}

.gender-male {
    color: #2196f3; /* blue */
}

.gender-female {
    color: #e91e63; /* pink */
}

.gender-unknown {
    color: #9e9e9e; /* grey */
}
</style>

