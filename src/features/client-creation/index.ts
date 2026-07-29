export { default as AddClientModal } from '@/features/client-creation/components/AddClientModal';
export { useAddClient } from '@/features/client-creation/hooks/useAddClient';
export { createClientSchema, clientGenderSchema } from '@/features/client-creation/schemas/clientCreation.schema';
export type {
  CreateClientGender,
  CreateClientInput,
} from '@/features/client-creation/schemas/clientCreation.schema';
export type {
  CreateClientPayload,
  CreateClientResponse,
} from '@/features/client-creation/types/clientCreation.types';
