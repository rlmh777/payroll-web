export interface MenuItem {
  id: string;
  parent_id: string | null;
  title: string;
  route: string | null;
  icon: string | null;
  permission: string | null;
  order: number;
  is_active: boolean;
  type: string;
  module_code?: string | null;
  source?: string | null;
  system_key?: string | null;
  children: MenuItem[];
  parent?: MenuItem | null;
}
