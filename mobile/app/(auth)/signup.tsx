import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function SignupRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/(auth)/login'); }, []);
  return null;
}
