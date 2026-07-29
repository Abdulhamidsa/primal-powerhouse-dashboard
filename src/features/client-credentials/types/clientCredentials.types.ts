export type ClientCredentials = {
  email: string;
  password: string | null;
};

export type ResetClientPasswordResponse = {
  email: string;
  password: string;
};

export type CredentialDisplayMode = 'stored' | 'reset';
