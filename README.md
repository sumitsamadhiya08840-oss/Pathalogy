# Pathology Lab Management System

A comprehensive Next.js 14 application for managing pathology lab operations, built with TypeScript and Material UI.

## 🎯 Features

- **Patient Management**: Manage patient records, medical history, and information
- **Test Management**: Track and manage various pathology tests and their results
- **Analytics & Reports**: View comprehensive analytics and performance metrics
- **User-Friendly Interface**: Built with Material UI for a professional, responsive design
- **Dark Mode Support**: Toggle between light and dark themes
- **Responsive Design**: Fully responsive across desktop, tablet, and mobile devices

## 📋 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org) with strict mode enabled
- **UI Library**: [Material UI v5](https://mui.com)
- **Styling**: [Emotion](https://emotion.sh)
- **Data Visualization**: [Recharts](https://recharts.org)
- **Data Grid**: [MUI X Data Grid](https://mui.com/x/react-data-grid)
- **Date Picker**: [MUI X Date Pickers](https://mui.com/x/react-date-pickers)
- **Date Utilities**: [date-fns](https://date-fns.org)
- **Code Quality**: ESLint and Prettier

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (preferably 20 LTS)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nxa-pathology-lab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory (routes, layouts, pages)
│   ├── layout.tsx          # Root layout with theme provider
│   ├── page.tsx            # Home page component
│   └── globals.css         # Global styles
├── components/             # Reusable React components
├── features/               # Feature-specific modules
├── services/               # API services and external integrations
├── types/                  # TypeScript type definitions
├── theme/                  # Theme configuration and provider
│   ├── theme.ts            # MUI theme definitions
│   └── ThemeProvider.tsx    # Theme provider component with context
└── utils/                  # Utility functions and helpers
```

## 🎨 Theme Customization

The application uses a custom Material UI theme with the following configuration:

- **Primary Color**: `#C4590A` (Orange - Jansetu Brand)
- **Secondary Color**: `#00008B` (Dark Blue - Jansetu Brand)
- **Border Radius**: `8px`
- **Typography**: Roboto font family with customized sizes

### Switching Themes

Use the theme toggle button in the header to switch between light and dark modes. Your preference is automatically saved to localStorage.

```tsx
import { useThemeMode } from '@/theme/ThemeProvider';

export default function MyComponent() {
  const { mode, toggleTheme } = useThemeMode();

  return (
    <button onClick={toggleTheme}>
      Toggle to {mode === 'light' ? 'dark' : 'light'} mode
    </button>
  );
}
```

## 📦 Available Scripts

### Development
```bash
npm run dev
```
Runs the development server with hot-reload at `http://localhost:3000`

### Production Build
```bash
npm run build
```
Creates an optimized production build

### Production Server
```bash
npm start
```
Runs the production build locally

### Linting
```bash
npm run lint
```
Runs ESLint to check code quality

```bash
npm run lint:fix
```
Automatically fixes ESLint issues

### Code Formatting
```bash
npm run format
```
Formats code using Prettier

```bash
npm run format:check
```
Checks code formatting without making changes

## 🔧 Configuration Files

### `tsconfig.json`
- TypeScript strict mode enabled
- Path aliases configured (`@/*` → `./src/*`)
- Optimized for Next.js 14

### `.prettierrc`
- Print width: 100 characters
- Tab width: 2 spaces
- Single quotes for strings
- Trailing commas: ES5 compatible
- End of line: LF (Unix)

### `eslint.config.mjs`
- Configured for Next.js with TypeScript support
- Enforces code quality standards

## 📚 Using Material UI Components

The project is pre-configured with Material UI. Example usage:

```tsx
'use client';

import { Button, Card, CardContent, Typography } from '@mui/material';

export default function Example() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5">Hello Material UI</Typography>
        <Button variant="contained" color="primary">
          Click Me
        </Button>
      </CardContent>
    </Card>
  );
}
```

## 📊 Data Visualization

Use Recharts for creating charts and graphs:

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Test A', value: 100 },
  { name: 'Test B', value: 150 },
];

export default function Chart() {
  return (
    <BarChart data={data}>
      <CartesianGrid />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="value" fill="#1976d2" />
    </BarChart>
  );
}
```

## 🔐 TypeScript Strict Mode

Strict mode is enabled in `tsconfig.json`, enforcing:
- Explicit type annotations where needed
- No implicit `any` types
- Strict null and undefined checks
- No unchecked index access

This ensures type safety across the application.

## 📱 Responsive Design

The application uses Material UI's responsive Grid system:

```tsx
import { Grid, Box } from '@mui/material';

export default function ResponsiveLayout() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={4}>
        Responsive content
      </Grid>
    </Grid>
  );
}
```

## 🌐 Environment Variables

Create a `.env.local` file for environment-specific configuration:

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
DATABASE_URL=your_database_url
```

## 📖 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Material UI Documentation](https://mui.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [React Documentation](https://react.dev)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/AmazingFeature`
2. Commit changes: `git commit -m 'Add AmazingFeature'`
3. Push to branch: `git push origin feature/AmazingFeature`
4. Open a Pull Request

### Code Standards

- Follow the existing code style
- Run `npm run format` before committing
- Ensure `npm run lint` passes
- Add TypeScript types for all new code
- Include meaningful commit messages

## 📝 Best Practices

1. **Component Organization**: Keep components small and focused
2. **Type Safety**: Always use TypeScript types
3. **Styling**: Use sx prop or styled components from Material UI
4. **Performance**: Use React.memo and useMemo where appropriate
5. **Testing**: Write unit tests for critical functions
6. **Documentation**: Add JSDoc comments to complex functions

## 🐛 Troubleshooting

### Port Already in Use
If port 3000 is already in use, run:
```bash
npm run dev -- -p 3001
```

### TypeScript Errors
Clear the TypeScript cache:
```bash
rm -rf .next
npm run build
```

### Module Not Found
Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

This project is part of the Sumit-Samadhiya/nxa-pathology-lab-panel repository.

## ✉️ Support

For support, please reach out to the development team or create an issue in the repository.

---

**Last Updated**: February 4, 2026
**Version**: 1.0.0
**Node.js**: 18+ (preferably 20 LTS)
**npm**: 9+
