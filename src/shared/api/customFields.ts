import { apiRequest } from "./client";
import type {
  CustomFieldDefinition,
  CustomFieldEntity,
} from "../types/customFields";

export const customFieldService = {
  list: (entity: CustomFieldEntity, signal?: AbortSignal) =>
    apiRequest<{ entity: CustomFieldEntity; fields: CustomFieldDefinition[] }>(
      `/custom-fields/${entity}`,
      signal ? { signal } : {},
    ),

  save: (entity: CustomFieldEntity, fields: CustomFieldDefinition[]) =>
    apiRequest<{ entity: CustomFieldEntity; fields: CustomFieldDefinition[] }>(
      `/custom-fields/${entity}`,
      {
        method: "PUT",
        body: { fields },
      },
    ),

  staffLookups: (signal?: AbortSignal) =>
    apiRequest<{ customFields: CustomFieldDefinition[] }>(
      "/lookups/staff-registration",
      signal ? { signal } : {},
    ),
};
