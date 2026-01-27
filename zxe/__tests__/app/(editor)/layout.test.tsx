import { render, screen } from '@testing-library/react';
import EditorLayout from '@/app/(editor)/layout';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn().mockReturnValue('/sprite_editor'),
}));

describe('EditorLayout', () => {
  it('should render children', () => {
    render(
      <EditorLayout>
        <div data-testid="child-content">Test Content</div>
      </EditorLayout>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('should render navbar', () => {
    render(
      <EditorLayout>
        <div>Content</div>
      </EditorLayout>
    );

    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should render all navigation links', () => {
    render(
      <EditorLayout>
        <div>Content</div>
      </EditorLayout>
    );

    expect(screen.getByText('UDG Editor')).toBeInTheDocument();
    expect(screen.getByText('Player Sprite')).toBeInTheDocument();
    expect(screen.getByText('Scene Editor')).toBeInTheDocument();
    expect(screen.getByText('Tile Editor')).toBeInTheDocument();
    expect(screen.getByText('Level Editor')).toBeInTheDocument();
  });

  it('should have correct styling', () => {
    render(
      <EditorLayout>
        <div>Content</div>
      </EditorLayout>
    );

    const container = document.querySelector('.min-h-screen.bg-gray-900');
    expect(container).toBeInTheDocument();
  });

  it('should add padding-top for navbar', () => {
    render(
      <EditorLayout>
        <div>Content</div>
      </EditorLayout>
    );

    const contentWrapper = document.querySelector('.pt-10');
    expect(contentWrapper).toBeInTheDocument();
  });
});
