<template>
    <div
        class="gender-icon"
        :class="genderIconClass"
        :aria-label="genderLabel"
        :title="genderLabel"
        role="img"
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
    if (name.includes('female') || name === 'f') return '♀';
    if (name.includes('male') || name === 'm') return '♂';
    return '?';
});

const genderIconClass = computed((): string => {
    if (!props.gender?.name) return 'gender-unknown';
    const name = props.gender.name.toLowerCase();
    if (name.includes('female') || name === 'f') return 'gender-female';
    if (name.includes('male') || name === 'm') return 'gender-male';
    return 'gender-unknown';
});

const genderLabel = computed((): string => {
    if (!props.gender?.name) return 'Gender unknown';
    return `${props.gender.name}`;
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

