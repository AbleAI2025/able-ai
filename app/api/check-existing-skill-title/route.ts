import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle/db';
import { SkillsTable, GigWorkerProfilesTable, UsersTable } from '@/lib/drizzle/schema';
import { eq, and, or, like, ilike } from 'drizzle-orm';
import { isUserAuthenticated } from '@/lib/user.server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Check existing skill title API called');
    const { skillName, workerProfileId } = await request.json();
    console.log('🔍 Request data:', { skillName, workerProfileId });

    if (!skillName || !workerProfileId) {
      console.log('🔍 Missing required parameters');
      return NextResponse.json({ error: 'Skill name and worker profile ID are required' }, { status: 400 });
    }

    // Verify the worker profile exists
    console.log('🔍 Looking up worker profile by ID:', workerProfileId);
    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.id, workerProfileId),
    });
    console.log('🔍 Worker profile found:', !!workerProfile);
    
    if (!workerProfile) {
      console.log('🔍 No worker profile found, returning empty result');
      return NextResponse.json({ exists: false, existingSkills: [] });
    }

    // Search for existing skill titles across ALL workers (not just current user)
    console.log('🔍 Searching for existing skill titles across all workers');
    const existingSkills = await db.query.SkillsTable.findMany({
      where: or(
        ilike(SkillsTable.name, `%${skillName}%`),
        ilike(SkillsTable.name, `%${skillName.split(' ')[0]}%`),
        ilike(SkillsTable.name, `%${skillName.split(' ').pop()}%`)
      ),
      with: {
        workerProfile: {
          with: {
            user: true
          }
        }
      }
    });
    console.log('🔍 Found existing skills:', existingSkills.length);

    // Also check for partial matches with individual words
    const skillWords = skillName.toLowerCase().split(/\s+/);
    console.log('🔍 Skill words to search:', skillWords);
    const additionalSkills = await db.query.SkillsTable.findMany({
      where: or(
        ...skillWords.map((word: string) => 
          word.length > 2 ? ilike(SkillsTable.name, `%${word}%`) : undefined
        ).filter(Boolean)
      ),
      with: {
        workerProfile: {
          with: {
            user: true
          }
        }
      }
    });
    console.log('🔍 Found additional skills:', additionalSkills.length);

    // Combine and deduplicate results
    const allExistingSkills = [...existingSkills, ...additionalSkills];
    const uniqueSkills = allExistingSkills.filter((skill, index, self) => 
      index === self.findIndex(s => s.id === skill.id)
    );
    console.log('🔍 Total unique existing skills found:', uniqueSkills.length);

    const result = {
      exists: uniqueSkills.length > 0,
      existingSkills: uniqueSkills.map(skill => ({
        id: skill.id,
        name: skill.name,
        experienceYears: skill.experienceYears,
        agreedRate: skill.agreedRate,
        workerName: skill.workerProfile?.user?.fullName || 'Unknown Worker'
      }))
    };
    console.log('🔍 Returning result:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('🔍 Error checking existing skill titles:', error);
    console.error('🔍 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
