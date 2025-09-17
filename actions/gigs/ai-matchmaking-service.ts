import { findMostRelevantSkill } from "./ai-matchmaking-utils";

export async function analyzeWorkerMatches(
  gigContext: any,
  workerData: any[]
): Promise<{
  workerId: string;
  workerName: string;
  matchScore: number;
  matchReasons: string[];
  availability: any[];
  skills: any[];
}[]> {
  try {
    // Always use AI for matching - no fallback needed
    if (workerData.length === 0) {
      return [];
    }

    // Call the AI matchmaking API route
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gigContext,
        workerData,
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const result = await response.json();

    if (result.ok && result.matches) {
      return result.matches;
    } else {
      console.error('AI matchmaking API failed:', result);
      // Fallback to intelligent matching without AI
      return createIntelligentFallbackMatches(gigContext, workerData);
    }

  } catch (error) {
    console.error('Error in AI worker analysis:', error);
    // Fallback to intelligent matching without AI
    return createIntelligentFallbackMatches(gigContext, workerData);
  }
}

// Intelligent fallback matching when AI is unavailable
export function createIntelligentFallbackMatches(gigContext: any, workerData: any[]): {
  workerId: string;
  workerName: string;
  matchScore: number;
  matchReasons: string[];
  availability: any[];
  skills: any[];
}[] {
  const gigTitle = (gigContext.title || '').toLowerCase();
  const gigDescription = (gigContext.description || '').toLowerCase();
  const gigText = `${gigTitle} ${gigDescription}`;
  const gigRate = gigContext.hourlyRate || 0;

  return workerData.map(worker => {
    // Find the most relevant skill for this specific gig
    const { skill: mostRelevantSkill, relevanceScore } = findMostRelevantSkill(
      worker.skills || [],
      gigContext.title || '',
      gigContext.description || ''
    );

    const primarySkill = mostRelevantSkill?.name || '';
    const experience = parseFloat(mostRelevantSkill?.experienceYears || '0');
    const rate = parseFloat(mostRelevantSkill?.agreedRate || '0');
    const bio = (worker.bio || '').toLowerCase();

    let matchScore = 50; // Base score
    const reasons = [];

    // Use the relevance score from our skill matching function
    if (mostRelevantSkill) {
      matchScore += Math.min(relevanceScore * 0.3, 30); // Scale relevance score to 0-30 points
      reasons.push(`Relevant ${primarySkill} experience (${relevanceScore}% match)`);
    }

    // Bio relevance scoring
    const roleKeywords: { [key: string]: string[] } = {
      baker: ['baker', 'cake', 'pastry'],
      chef: ['chef', 'cook'],
      server: ['server', 'waiter', 'bartender'],
      bartender: ['bartender', 'mixologist'],
    };
    if (bio) {
      for (const role in roleKeywords) {
        if (gigText.includes(role) && roleKeywords[role].some(kw => bio.includes(kw))) {
          matchScore += 15;
          reasons.push('Bio mentions relevant experience');
          break; // Found a match, no need to check others
        }
      }
    }
    // Experience scoring
    if (experience > 0) {
      if (experience >= 5) {
        matchScore += 15;
        reasons.push(`${experience} years of experience`);
      } else if (experience >= 2) {
        matchScore += 10;
        reasons.push(`${experience} years of experience`);
      } else {
        matchScore += 5;
        reasons.push(`${experience} years of experience`);
      }
    }

    // Rate compatibility scoring
    if (rate > 0 && gigRate > 0) {
      const rateDiff = Math.abs(rate - gigRate);
      const ratePercent = (rateDiff / gigRate) * 100;

      if (ratePercent <= 20) {
        matchScore += 10;
        reasons.push(`Rate matches budget (£${rate}/hour)`);
      } else if (ratePercent <= 50) {
        matchScore += 5;
        reasons.push(`Rate within range (£${rate}/hour)`);
      } else if (rate < gigRate) {
        matchScore += 3;
        reasons.push(`Competitive rate (£${rate}/hour)`);
      }
    }

    // Location scoring (if available)
    const EXCLUDED_LOCATIONS = ['Colombia', 'Ethiopia'];
    if (worker.location && !EXCLUDED_LOCATIONS.includes(worker.location)) {
      matchScore += 5;
      reasons.push(`Located in ${worker.location}`);
    }
    // Cap the score at 100
    matchScore = Math.min(matchScore, 100);

    // If no specific reasons, add generic ones
    if (reasons.length === 0) {
      reasons.push('Available for work', 'Professional service provider');
    }

    return {
      workerId: worker.workerId,
      workerName: worker.workerName,
      matchScore: Math.round(matchScore),
      matchReasons: reasons.slice(0, 3), // Limit to 3 reasons
      availability: worker.availability,
      skills: worker.skills,
    };
  });
}