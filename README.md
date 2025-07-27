# FrameFlow

FrameFlow is an open-source web application that transforms movies and TV shows into a comic-like viewing experience. It extracts key scenes based on subtitle timing and converts them into comic book-style PDF format.

## Features

- **Movie → Comic Conversion**: Upload video files and convert them into comic book format
- **Subtitle-based Extraction**: Automatically extract dialogue scenes based on subtitle files (`.srt`, `.vtt`)
- **Time Interval Extraction**: Extract frames at regular time intervals
- **Comic Preview**: Preview extracted frames and subtitles in comic format
- **PDF Download**: Download the completed comic as a PDF file

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/user/repo.git
   cd repo
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run the development server:**

   ```bash
   npm run dev
   ```

   This will start the application in development mode. Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

## Usage

1. **Upload Video**: Upload your movie or TV show file.
2. **Upload Subtitles** (Optional): Upload `.srt` or `.vtt` subtitle files.
3. **Conversion Settings**: Choose between subtitle-based or time interval-based extraction.
4. **Convert to Comic**: Click the "Convert to Comic" button to start conversion.
5. **View Results**: Preview the generated comic pages and download as PDF.

## Project Structure

```
/
├── public/                  # Public assets
├── src/
│   ├── assets/              # Image and font assets
│   ├── components/          # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Page components
│   ├── services/            # Services for business logic
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   └── main.tsx             # App entry point
├── .eslintrc.cjs            # ESLint configuration
├── .gitignore               # Git ignore file
├── index.html               # HTML template
├── package.json             # Project dependencies and scripts
├── README.md                # Project README
└── vite.config.ts           # Vite configuration
```

## Contributing

This project is open source! Contributions are welcome. Please open an issue or submit a pull request.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/frameflow.git
cd frameflow

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## License

This project is licensed under the MIT License.
# FrameFlow
