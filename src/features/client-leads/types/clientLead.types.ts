export type LeadStatus = 'CONTACTED' | 'HAD_MEETING' | 'MADE_DEAL' | 'CONVERTED';

export type ClientLead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  subscriptionType: string | null;
  notes: string | null;
  convertedClientId: string | null;
  credentialEmail: string | null;
  hasCredentials: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateClientLeadPayload = {
  name: string;
  email?: string;
  phone?: string;
  status?: LeadStatus;
  subscriptionType?: string;
  notes?: string;
};

export type UpdateClientLeadPayload = {
  name?: string;
  email?: string;
  phone?: string | null;
  status?: LeadStatus;
  subscriptionType?: string | null;
  notes?: string | null;
  convertedClientId?: string;
  credentialEmail?: string;
  credentialPassword?: string;
};

export type ClientLeadCredentials = {
  email: string;
  password: string;
};
