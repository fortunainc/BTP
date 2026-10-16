import { MemberNav } from '@/components/MemberNav';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return <><MemberNav />{children}</>;
}
