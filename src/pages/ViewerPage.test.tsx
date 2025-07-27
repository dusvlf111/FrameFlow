import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ViewerPage from './ViewerPage';
import { ComicPage } from '../utils/imageLayout';
import { exportImagesAsZip } from '../utils/fileExport';
import { exportImagesAsPdf } from '../utils/pdfExport';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: { [key: string]: string } = {
        'viewer_title': 'Comic Viewer',
        'viewer_no_pages': 'No comic pages to display. Please go back to the home page and convert a video.',
        'page_count': `Page ${options?.current || 1} / ${options?.total || 1}`,
        'previous_button': 'Previous',
        'next_button': 'Next',
        'export_zip_button': 'Export All as ZIP',
        'export_pdf_button': 'Export All as PDF',
        'go_to_home': 'Go to Home',
        'comic_page_alt': `Comic Page ${options?.page || 1}`,
      };
      return translations[key] || key;
    },
  }),
}));

// Mock fileExport and pdfExport utilities
vi.mock('../utils/fileExport', () => ({
  exportImagesAsZip: vi.fn(),
}));

vi.mock('../utils/pdfExport', () => ({
  exportImagesAsPdf: vi.fn(),
}));

// Mock alert function
const mockAlert = vi.fn();
vi.stubGlobal('alert', mockAlert);

describe('ViewerPage', () => {
  const mockComicPages: ComicPage[] = [
    {
      dataUrl: 'data:image/jpeg;base64,page1data',
      timestamps: [1000, 2000, 3000],
    },
    {
      dataUrl: 'data:image/jpeg;base64,page2data',
      timestamps: [4000, 5000, 6000],
    },
    {
      dataUrl: 'data:image/jpeg;base64,page3data',
      timestamps: [7000, 8000, 9000],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(exportImagesAsZip).mockResolvedValue(undefined);
    vi.mocked(exportImagesAsPdf).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render comic pages when comicPages are provided', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/viewer', state: { comicPages: mockComicPages } }]}>
        <ViewerPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Comic Viewer')).toBeInTheDocument();
    expect(screen.getByText('Page 1 / 3')).toBeInTheDocument();
    expect(screen.getByAltText('Comic Page 1')).toBeInTheDocument();
  });

  it('should show no pages message when no comicPages are provided', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/viewer', state: { comicPages: [] } }]}>
        <ViewerPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Comic Viewer')).toBeInTheDocument();
    expect(screen.getByText('No comic pages to display. Please go back to the home page and convert a video.')).toBeInTheDocument();
  });

  it('should navigate to next page when Next button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter initialEntries={[{ pathname: '/viewer', state: { comicPages: mockComicPages } }]}>
        <ViewerPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Page 1 / 3')).toBeInTheDocument();

    const nextButton = screen.getByRole('button', { name: 'Next' });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Page 2 / 3')).toBeInTheDocument();
    });
  });

  it('should disable Previous button on first page', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/viewer', state: { comicPages: mockComicPages } }]}>
        <ViewerPage />
      </MemoryRouter>
    );

    const prevButton = screen.getByRole('button', { name: 'Previous' });
    expect(prevButton).toBeDisabled();
  });

  it('should export comic pages as ZIP when Export All as ZIP button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter initialEntries={[{ pathname: '/viewer', state: { comicPages: mockComicPages } }]}>
        <ViewerPage />
      </MemoryRouter>
    );

    const exportZipButton = screen.getByRole('button', { name: 'Export All as ZIP' });
    await user.click(exportZipButton);

    const expectedDataUrls = mockComicPages.map(page => page.dataUrl);
    expect(exportImagesAsZip).toHaveBeenCalledWith(expectedDataUrls, 'FrameFlow_Comic.zip');
  });

  it('should disable export buttons when no comic pages are available', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/viewer', state: { comicPages: [] } }]}>
        <ViewerPage />
      </MemoryRouter>
    );

    const exportZipButton = screen.getByRole('button', { name: 'Export All as ZIP' });
    const exportPdfButton = screen.getByRole('button', { name: 'Export All as PDF' });

    expect(exportZipButton).toBeDisabled();
    expect(exportPdfButton).toBeDisabled();
  });

  it('should render Go to Home link', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/viewer', state: { comicPages: mockComicPages } }]}>
        <ViewerPage />
      </MemoryRouter>
    );

    const homeLink = screen.getByRole('link', { name: 'Go to Home' });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
