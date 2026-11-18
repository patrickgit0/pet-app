import { pageTitle } from '@/i18n/server';
import { ForgotPasswordForm } from '../password-forms';

export const generateMetadata = pageTitle('Esqueci minha senha');

export default function Page() {
  return <main className="px-4"><ForgotPasswordForm /></main>;
}
