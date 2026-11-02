import { describe, expect, it, vi } from 'vitest';
import { navigateAfterSignIn, safeSignInDestination } from '@/lib/sign-in-navigation';
describe('email-code session navigation',()=>{
 it('keeps the document alive during normal session activation',()=>{
  const navigation={replace:vi.fn(),assign:vi.fn()};
  navigateAfterSignIn('/admin/requests',navigation);
  expect(navigation.replace).toHaveBeenCalledWith('/admin/requests');
  expect(navigation.assign).not.toHaveBeenCalled();
 });
 it('supports Clerk decorated browser recovery navigation',()=>{
  const navigation={replace:vi.fn(),assign:vi.fn()};
  navigateAfterSignIn('https://auth.example.com/recover',navigation);
  expect(navigation.assign).toHaveBeenCalledWith('https://auth.example.com/recover');
  expect(navigation.replace).not.toHaveBeenCalled();
 });
 it('preserves admin destinations and rejects external redirect input',()=>{
  expect(safeSignInDestination('/admin/requests?purpose=investor','https://behindtheprotocol.ai')).toBe('/admin/requests?purpose=investor');
  for(const destination of ['https://other.example','//other.example','javascript:alert(1)',null])expect(safeSignInDestination(destination,'https://behindtheprotocol.ai')).toBe('/situations');
 });
});
