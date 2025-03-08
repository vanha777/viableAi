import Main from "./components/main";
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CoLaunch - Connect Business and Scale Up',
  description: 'CoLaunch is a platform that connects businesses and scale ups with the right people and resources to help them grow.',
  openGraph: {
    title: 'CoLaunch - Connect Business and Scale Up',
    description: 'CoLaunch is a platform that connects businesses and scale ups with the right people and resources to help them grow.',
    // url: 'https://www.metaloot.dev/',
    images: [
      {
        url: 'https://vbfejmafjqgcfrzxewcd.supabase.co/storage/v1/object/public/general//colaunchit.jpeg',
        alt: 'CoLaunch - Connect Business and Scale Up',
      },
    ],
  },
  icons: {
    icon: '/logo.png',
    // You can also specify different sizes
    apple: [
      { url: '/logo.png' },
      { url: '/apple.png', sizes: '180x180' }
    ],
    shortcut: '/favicon.ico'
  },
};
export const revalidate = 0
export default async function IdeaPage({ params }: { params: { id: string } }) {
  console.log('user ID:', params.id);
  return (
    <Main user_id={params.id} />
  );
}
