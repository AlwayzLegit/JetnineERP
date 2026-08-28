'use client';

import { useParams } from 'next/navigation';
import { RoleEditor } from '../role-editor';

export default function EditRolePage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  if (!id) return null;
  return <RoleEditor roleId={id} />;
}
