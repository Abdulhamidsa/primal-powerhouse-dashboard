// src/app/loading.tsx
export default function Loading() {
  // Return null to avoid hydration mismatches
  // Middleware handles auth redirects, pages show their own loading states
  return null;
}
