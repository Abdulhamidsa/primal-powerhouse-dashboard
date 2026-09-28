import { NextResponse } from 'next/server';
import {
  getActiveMandatoryPolicyDocuments,
  getApprovedConfiguredDocuments,
  toLegalDocumentSummary,
} from '@/features/legal/legal-registry';

export function GET() {
  return NextResponse.json({
    signupAcceptanceRequired: getActiveMandatoryPolicyDocuments().length === 2,
    documents: getApprovedConfiguredDocuments().map(toLegalDocumentSummary),
  });
}
