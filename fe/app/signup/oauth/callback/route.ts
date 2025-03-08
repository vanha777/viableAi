import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { Db } from '@/app/utils/db'
export async function GET(request: Request) {
  const url = new URL(request.url)
  const database = await Db;
  try {
    // Get the encoded token from URL search params

    const encodedToken = url.searchParams.get('token')

    if (!encodedToken) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 })
    }
    
    // Decode the token data
    const decodedToken = decodeURIComponent(encodedToken)
    console.log("this is raw user",decodedToken)
    const profileData = JSON.parse(decodedToken) as GoogleProfile
  
    // Check if user exists in Supabase or create new user)
    let { data, error } = await database.from('subscribers')
      .select('*')
      .eq('email', profileData.email)
      .single()
    let subscriber = data;
    
    // Update photo if it has changed
    if (subscriber && profileData.picture !== subscriber.photo) {
      console.log("updating user photo")
      const { data: updatedData, error: updateError } = await database
        .from('subscribers')
        .update({ photo: profileData.picture })
        .eq('id', subscriber.id)
        .select()
        .single()
      
      if (!updateError) {
        subscriber = updatedData
        console.log("updated user photo", subscriber)
      }
    }

    if (data == null) {
      // Create new subscriber
      const { data, error } = await Db.from('subscribers').insert([
        {
          email: profileData.email,
          name: profileData.name,
          favourite_game: null,
          studio_name: null,
          wallet: null,
          referal: null,
          type: "developer",
          photo: profileData.picture,
        }
      ]).select().single();
      if (error) {
        console.log("this is error", error)
        const dashboardUrl = new URL('/signup', url.origin)
        return NextResponse.redirect(dashboardUrl.toString())
      }
      console.log("this is new subscriber", data)
      subscriber = data;
    }
    const dashboardUrl = new URL('/signup/thankyou', url.origin)
    dashboardUrl.searchParams.set('user', JSON.stringify(subscriber))
    return NextResponse.redirect(dashboardUrl.toString())
  } catch (error) {
    console.error('Error processing callback:', error)
    const loginUrl = new URL('/signup', url.origin)
    return NextResponse.redirect(loginUrl.toString())
  }
}

// Add TypeScript interface for Google Profile
interface GoogleProfile {
  iss?: string;
  azp?: string;
  aud?: string;
  sub?: string;
  email: string;
  email_verified?: boolean;
  at_hash?: string;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  iat?: number;
  exp?: number;
  session_id?: string;
}