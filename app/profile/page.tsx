import { Suspense } from 'react';
import ProfilePage from '@/components/Profile/ProfilePage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Account - Super Media Bros',
  description: 'Manage your account details, payment methods, addresses, and password.',
};

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfilePage />
    </Suspense>
  );
}

