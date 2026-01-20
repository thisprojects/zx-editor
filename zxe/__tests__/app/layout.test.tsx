import { metadata } from '@/app/layout';

// Note: Testing the RootLayout component directly is problematic because
// it renders <html> and <body> tags which can't be children of the test container.
// We focus on testing the exported metadata instead.

describe('layout metadata', () => {
  it('should have a title', () => {
    expect(metadata.title).toBeDefined();
    expect(typeof metadata.title).toBe('string');
  });

  it('should have a description', () => {
    expect(metadata.description).toBeDefined();
    expect(typeof metadata.description).toBe('string');
  });
});
