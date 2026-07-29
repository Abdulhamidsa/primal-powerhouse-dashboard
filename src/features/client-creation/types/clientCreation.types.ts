import type { z } from 'zod';
import { createClientSchema, clientGenderSchema } from '@/features/client-creation/schemas/clientCreation.schema';

export type CreateClientPayload = z.infer<typeof createClientSchema>;
export type CreateClientGender = NonNullable<z.infer<typeof clientGenderSchema>>;

export type CreateClientResponse = {
  client: {
    id: string;
    name: string;
    email: string;
    gender: 'MALE' | 'FEMALE' | null;
  };
  credentials: {
    email: string;
    password: string;
  };
};
