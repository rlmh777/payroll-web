import { boot } from 'quasar/wrappers';
import type { DirectiveBinding } from 'vue';
import { usePermissions } from '@core/composables/usePermissions';

function resolvePermission(binding: DirectiveBinding<string | string[]>) {
  if (Array.isArray(binding.value)) {
    return binding.value;
  }

  return binding.value;
}

export default boot(({ app }) => {
  app.directive('can', {
    mounted(el, binding) {
      const { can, canAny } = usePermissions();
      const value = resolvePermission(binding);

      const allowed = Array.isArray(value)
        ? canAny(value)
        : can(value);

      if (!allowed) {
        el.style.display = 'none';
      }
    },
    updated(el, binding) {
      const { can, canAny } = usePermissions();
      const value = resolvePermission(binding);

      const allowed = Array.isArray(value)
        ? canAny(value)
        : can(value);

      el.style.display = allowed ? '' : 'none';
    },
  });
});
