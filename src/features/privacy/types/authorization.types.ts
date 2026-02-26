export type ExportJobOwnershipInput = {
  jobClientId: string;
  requesterClientId: string;
};

export function canAccessOwnExportJob(input: ExportJobOwnershipInput): boolean {
  return input.jobClientId === input.requesterClientId;
}
