export interface ServiceFieldDefinition {
  key: string;
  label: string;
  type: string;
  required?: boolean;
}

export interface ServiceModuleDefinition {
  label: string;
  statuses: string[];
  fields: ServiceFieldDefinition[];
  permission?: string;
  writePermission?: string;
}

export interface ServiceRecord {
  id: string;
  title: string;
  status: string;
  payload: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceRecordsResponse {
  success: true;
  data: {
    definition: ServiceModuleDefinition;
    data: ServiceRecord[];
    meta: { total: number; page?: number; perPage?: number; lastPage?: number };
  };
}

export interface ServiceRecordInput {
  title: string;
  status: string;
  payload: Record<string, string>;
}
