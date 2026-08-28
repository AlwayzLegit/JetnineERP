'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoadingRows } from '@/components/ui';
import { RoleEditor } from '../role-editor';

function NewRoleInner() {
  const params = useSearchParams();
  const basedOn = params?.get('basedOn') ?? undefined;
  return <RoleEditor basedOnId={basedOn} />;
}

export default function NewRolePage() {
  // useSearchParams needs a Suspense boundary under the app router.
  return (
    <Suspense fallback={<LoadingRows rows={6} />}>
      <NewRoleInner />
    </Suspense>
  );
}
