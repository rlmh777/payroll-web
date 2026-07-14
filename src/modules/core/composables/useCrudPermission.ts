import { computed, type ComputedRef } from 'vue';
import { usePermissions } from '@core/composables/usePermissions';
import { CRUD_PERMISSIONS, type CrudResource } from '@core/utils/permissions';

interface CrudFlagProps {
  showAddNew?: boolean;
  showEdit?: boolean;
}

export function useCrudPermission(resource: CrudResource) {
  const { can } = usePermissions();
  const permission = CRUD_PERMISSIONS[resource];

  const canCrud: ComputedRef<boolean> = computed(() => can(permission));

  function withCrudFlags(props: CrudFlagProps) {
    return {
      showAddNew: computed(() => !!(props.showAddNew && can(permission))),
      showEdit: computed(() => !!(props.showEdit && can(permission))),
    };
  }

  return {
    permission,
    canCrud,
    withCrudFlags,
  };
}
