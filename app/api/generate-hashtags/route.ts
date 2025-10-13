import { NextRequest, NextResponse } from 'next/server';
import { generateHashtagsForAPI, type ProfileData } from '@/lib/services/hashtag-generation';

export async function POST(request: NextRequest) {
  try {
    console.log('API route called - starting hashtag generation');
    
    const { profileData } = await request.json();
    console.log('Received profile data:', { 
      about: profileData.about ? 'present' : 'missing',
      experience: profileData.experience ? 'present' : 'missing',
      skills: profileData.skills ? 'present' : 'missing',
      equipment: profileData.equipment ? `${profileData.equipment.length} items` : 'none',
      location: profileData.location ? 'present' : 'missing'
    });

    if (!profileData) {
      console.log('Missing profile data');
      return NextResponse.json(
        { ok: false, error: 'Missing profile data' },
        { status: 400 }
      );
    }

    // Use the modular hashtag generation service
    const result = await generateHashtagsForAPI(profileData as ProfileData, {
      maxHashtags: 3,
      includeLocation: true,
      fallbackStrategy: 'skills-based'
    });

    console.log('Hashtag generation result:', { 
      success: result.success, 
      source: result.source, 
      hashtagCount: result.hashtags.length 
    });

    return NextResponse.json({ 
      ok: result.success, 
      hashtags: result.hashtags,
      source: result.source
    });

  } catch (error) {
    console.error('Error in hashtag generation API:', error);
    return NextResponse.json(
      { ok: false, error: 'Hashtag generation service unavailable' },
      { status: 500 }
    );
  }
}
