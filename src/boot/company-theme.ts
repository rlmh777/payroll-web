import { boot } from 'quasar/wrappers';
import { applyCompanyTheme, loadStoredCompanyTheme } from 'src/utils/company-theme';
import { useAuthStore } from 'src/stores/auth';
import { useOrganizationStore } from 'src/stores/organization-store';

export default boot(async () => {
  const storedTheme = loadStoredCompanyTheme();
  if (storedTheme) {
    applyCompanyTheme(storedTheme.primaryColor, storedTheme.secondaryColor);
  }

  const authStore = useAuthStore();
  if (!authStore.token) {
    return;
  }

  const organizationStore = useOrganizationStore();
  await organizationStore.fetchOrganizations();
  organizationStore.applyOrganizationTheme();
});
