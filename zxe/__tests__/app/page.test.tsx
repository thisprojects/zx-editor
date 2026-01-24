import Home from '@/app/page';
import { redirect } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('Home page', () => {
  it('should redirect to /sprite_editor', () => {
    Home();
    expect(redirect).toHaveBeenCalledWith('/sprite_editor');
  });
});
