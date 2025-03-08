import { createClient } from '@supabase/supabase-js'

// Replace with your Supabase project URL and Anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY


if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const Db = createClient(supabaseUrl, supabaseAnonKey)
export const Server = process.env.NEXT_METALOOT_SERVER || ""
export const FrontEnd = process.env.NEXT_FRONT_END_URL || "http://localhost:3000"
export const PrivateKey = process.env.NEXT_PRIVATE_KEY || "123123"
// Helper function to check if a value exists in the database
export const VerfifyUser = async (username: string) => {
  try {
    // Clean up username (remove @ and get just the username)
    const cleanUsername = username.replace('@', '').split('/').pop() || '';
    
    const response = await fetch(`https://x.com/${cleanUsername}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      mode: 'cors', // You might also try 'no-cors'
      credentials: 'omit',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    const html = await response.text();
    
    // Check if the profile exists by looking for specific elements or metadata
    const profileExists = !html.includes('This account doesn\'t exist');
    
    if (profileExists) {
      return {
        username: cleanUsername,
        url: `https://x.com/${cleanUsername}`,
        exists: true
      };
    }
    
    return null;

  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
};
