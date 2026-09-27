export type ClientDisplayNameSource = {
  name?: string | null;
  username?: string | null;
  email?: string | null;
};

export function getClientDisplayName(client: ClientDisplayNameSource): string {
  const name = client.name?.trim();
  if (name) return name;

  const username = client.username?.trim();
  if (username) return username;

  const emailPrefix = client.email?.split('@')[0]?.trim();
  if (emailPrefix) return emailPrefix;

  return 'Member';
}
