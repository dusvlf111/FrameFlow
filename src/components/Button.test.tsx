import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  it('should render button with correct text', () => {
    render(<Button onClick={() => {}}>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should call onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Test Button</Button>);

    await userEvent.click(screen.getByText('Test Button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Disabled Button</Button>);

    const button = screen.getByText('Disabled Button');
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
