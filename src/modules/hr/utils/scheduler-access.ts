export function isSchedulerAdmin(roleLabel: string): boolean {
  const role = roleLabel.toLowerCase();
  return (
    role === 'super-admin' ||
    role === 'admin' ||
    role === 'super_admin' ||
    role.includes('admin')
  );
}

export function isPayrollOfficer(roleLabel: string): boolean {
  const role = roleLabel.toLowerCase();
  return (
    role === 'payroll-officer' ||
    role === 'payroll_officer' ||
    role === 'payroll officer' ||
    (role.includes('payroll') && role.includes('officer'))
  );
}

/** Roles that load the full paginated employee list (not subordinates only). */
export function canViewAllSchedulerEmployees(roleLabel: string): boolean {
  return isSchedulerAdmin(roleLabel) || isPayrollOfficer(roleLabel);
}

export function isSchedulerSupervisor(roleLabel: string): boolean {
  const role = roleLabel.toLowerCase();
  return (
    role.includes('supervisor') ||
    role.includes('team lead') ||
    role.includes('lead')
  );
}

export function canManageSchedulerEmployees(roleLabel: string): boolean {
  return canViewAllSchedulerEmployees(roleLabel) || isSchedulerSupervisor(roleLabel);
}
