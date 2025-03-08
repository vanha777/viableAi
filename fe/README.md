# CoLaunch Landing Page

This is a modern, responsive landing page for CoLaunch built with Next.js and Tailwind CSS.

## Features

- Modern, clean design with gradient accents
- Fully responsive for all device sizes
- Animated components using Framer Motion
- SVG icons for better scaling and customization
- Optimized for performance

## Customization

### Landing Page

The main landing page component is located at `components/Landing.tsx`. You can customize:

- Hero section text and buttons
- Benefits cards (titles, descriptions, icons)
- Partner logos
- Background colors and effects

### Icons

SVG icons are stored in the `public/icons/` directory:
- `validate.svg` - Checkmark icon for idea validation
- `collaborate.svg` - People icon for collaboration
- `secure.svg` - Lock icon for security

You can replace these with your own SVG icons as needed.

### Images

Replace the placeholder dashboard image with your actual dashboard screenshot:
1. Add your image to the `public/` directory
2. Update the image component in `components/Landing.tsx`

### Colors

The theme uses a gradient color scheme with blues and purples. To change the color scheme:

1. Update gradient classes in the components (search for `from-` and `to-` classes)
2. Modify the glowing orb colors in the background sections

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Structure

- `app/page.tsx` - Main page that includes all components
- `components/Landing.tsx` - Main landing section
- `components/Features.tsx` - Features section
- `components/Partner.tsx` - Partners/integrations section
- `components/Starters.tsx` - Getting started section
- `components/NavBar.tsx` - Navigation bar
- `components/Footer.tsx` - Footer section

## Credits

- Icons from [Feather Icons](https://feathericons.com/)
- Animations powered by [Framer Motion](https://www.framer.com/motion/)
- Built with [Next.js](https://nextjs.org/) and [Tailwind CSS](https://tailwindcss.com/)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
