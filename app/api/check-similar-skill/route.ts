import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle/db';
import { SkillsTable, GigWorkerProfilesTable, UsersTable } from '@/lib/drizzle/schema';
import { eq, and, or, like, ilike } from 'drizzle-orm';
import { isUserAuthenticated } from '@/lib/user.server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Check similar skills API called');
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
      return NextResponse.json({ exists: false, similarSkills: [] });
    }

    // Search for similar skills using fuzzy matching
    console.log('🔍 Searching for similar skills with workerProfileId:', workerProfile.id);
    const similarSkills = await db.query.SkillsTable.findMany({
      where: and(
        eq(SkillsTable.workerProfileId, workerProfile.id),
        or(
          ilike(SkillsTable.name, `%${skillName}%`),
          ilike(SkillsTable.name, `%${skillName.split(' ')[0]}%`),
          ilike(SkillsTable.name, `%${skillName.split(' ').pop()}%`)
        )
      ),
    });
    console.log('🔍 Found similar skills:', similarSkills.length);

    // Also check for partial matches with individual words
    const skillWords = skillName.toLowerCase().split(/\s+/);
    console.log('🔍 Skill words to search:', skillWords);
    const additionalSkills = await db.query.SkillsTable.findMany({
      where: and(
        eq(SkillsTable.workerProfileId, workerProfile.id),
          or(
            ...skillWords.map((word: string) => 
              word.length > 2 ? ilike(SkillsTable.name, `%${word}%`) : undefined
            ).filter(Boolean)
          )
      ),
    });
    console.log('🔍 Found additional skills:', additionalSkills.length);

    // Combine and deduplicate results
    const allSimilarSkills = [...similarSkills, ...additionalSkills];
    const uniqueSkills = allSimilarSkills.filter((skill, index, self) => 
      index === self.findIndex(s => s.id === skill.id)
    );
    console.log('🔍 Total unique skills found:', uniqueSkills.length);

    // Score and prioritize skills by relevance
    const scoredSkills = uniqueSkills.map(skill => {
      const skillNameLower = skill.name.toLowerCase();
      const inputLower = skillName.toLowerCase();
      
      let score = 0;
      
      // Exact match gets highest score
      if (skillNameLower === inputLower) {
        score = 100;
      }
      // Contains the full input gets high score
      else if (skillNameLower.includes(inputLower)) {
        score = 80;
      }
      // Input contains the skill name gets medium score
      else if (inputLower.includes(skillNameLower)) {
        score = 60;
      }
      // Word overlap gets lower score
      else {
        const skillWords = skillNameLower.split(/\s+/);
        const inputWords = inputLower.split(/\s+/);
        const commonWords = skillWords.filter(word => inputWords.includes(word));
        score = commonWords.length * 20;
      }
      
      return { ...skill, relevanceScore: score };
    });

    // Sort by relevance score and take only the top 2 most relevant
    const topSkills = scoredSkills
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 2)
      .filter(skill => skill.relevanceScore > 0); // Only include skills with some relevance

    console.log('🔍 Top relevant skills:', topSkills.map(s => ({ name: s.name, score: s.relevanceScore })));

    const result = {
      exists: topSkills.length > 0,
      similarSkills: topSkills.map(skill => ({
        id: skill.id,
        name: skill.name,
        experienceYears: skill.experienceYears,
        agreedRate: skill.agreedRate
      }))
    };
    console.log('🔍 Returning result:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('🔍 Error checking similar skills:', error);
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
