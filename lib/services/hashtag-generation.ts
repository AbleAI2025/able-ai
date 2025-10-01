/**
 * Centralized Hashtag Generation Service
 * 
 * This module provides a unified interface for generating hashtags for worker profiles
 * using AI services with proper fallback strategies.
 */

import { geminiAIAgent } from '@/lib/firebase/ai';
import { Schema } from '@firebase/ai';

// Type definitions
export interface ProfileData {
  about?: string;
  experience?: string;
  skills?: string;
  qualifications?: string;
  equipment?: string | any[];
  location?: string;
}

export interface HashtagGenerationOptions {
  maxHashtags?: number;
  includeLocation?: boolean;
  fallbackStrategy?: 'basic' | 'skills-based' | 'generic';
}

export interface HashtagGenerationResult {
  success: boolean;
  hashtags: string[];
  source: 'ai' | 'fallback';
  error?: string;
}

// Constants
const DEFAULT_MAX_HASHTAGS = 3;
const FALLBACK_HASHTAGS = ['#worker', '#gig', '#freelance'];

/**
 * Generate fallback hashtags based on different strategies
 */
export function generateFallbackHashtags(
  profileData: ProfileData, 
  strategy: 'basic' | 'skills-based' | 'generic' = 'skills-based'
): string[] {
  switch (strategy) {
    case 'skills-based':
      const skillsHashtag = profileData.skills?.split(',')[0]?.trim().toLowerCase().replace(/\s+/g, '-') || 'worker';
      const aboutHashtag = profileData.about?.split(' ')[0]?.toLowerCase() || 'professional';
      return [`#${skillsHashtag}`, `#${aboutHashtag}`, '#gig-worker'];
    
    case 'basic':
      return FALLBACK_HASHTAGS;
    
    case 'generic':
    default:
      return ['#professional', '#service', '#gig-worker'];
  }
}

/**
 * Prepare equipment data for AI prompt
 */
function prepareEquipmentText(equipment: string | any[]): string {
  if (Array.isArray(equipment)) {
    return equipment.map(item => 
      typeof item === 'string' ? item : item.name || item
    ).join(', ');
  }
  return typeof equipment === 'string' ? equipment : '';
}

/**
 * Generate AI prompt for hashtag generation
 */
function generatePrompt(profileData: ProfileData, options: HashtagGenerationOptions): string {
  const equipmentText = prepareEquipmentText(profileData.equipment || '');
  
  return `You are an AI assistant that generates professional hashtags for gig workers based on their profile information.

Based on the following worker profile data, generate exactly ${options.maxHashtags || DEFAULT_MAX_HASHTAGS} relevant, professional hashtags that would help with job matching and discoverability.

Profile Data:
- About: ${profileData.about || 'Not provided'}
- Experience: ${profileData.experience || 'Not provided'}
- Skills: ${profileData.skills || 'Not provided'}
- Equipment: ${equipmentText || 'Not provided'}
- Location: ${profileData.location || 'Not provided'}

Rules:
1. Generate exactly ${options.maxHashtags || DEFAULT_MAX_HASHTAGS} hashtags (no more, no less)
2. Use professional, industry-standard terms
3. Focus on skills, experience level, and specializations
4. Use hashtag format (e.g., "#bartender", "#mixology", "#events")
5. Make them relevant to hospitality, events, and gig work
6. Avoid generic terms like "#work" or "#job"
7. Consider the worker's experience level and equipment
${options.includeLocation ? '8. Include location-based hashtag if location is provided' : ''}

Examples of good hashtags:
- For bartenders: "#bartender", "#mixology", "#cocktails"
- For chefs: "#chef", "#cooking", "#catering"
- For event staff: "#events", "#hospitality", "#customer-service"

Generate ${options.maxHashtags || DEFAULT_MAX_HASHTAGS} relevant hashtags for this worker:`;
}

/**
 * Main hashtag generation function using AI
 */
export async function generateHashtagsWithAI(
  profileData: ProfileData,
  ai: any,
  options: HashtagGenerationOptions = {}
): Promise<HashtagGenerationResult> {
  try {
    if (!ai) {
      console.log('🔍 No AI service available, using fallback hashtags');
      return {
        success: true,
        hashtags: generateFallbackHashtags(profileData, options.fallbackStrategy),
        source: 'fallback'
      };
    }

    const prompt = generatePrompt(profileData, options);
    
    const response = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt,
        responseSchema: Schema.object({
          properties: {
            hashtags: Schema.array({
              items: Schema.string()
            })
          },
          required: ["hashtags"]
        }),
        isStream: false,
      },
      ai
    );
    
    if (response.ok && response.data) {
      const data = response.data as { hashtags: string[] };
      const hashtags = data.hashtags.slice(0, options.maxHashtags || DEFAULT_MAX_HASHTAGS);
      
      console.log('🔍 AI generated hashtags:', hashtags);
      return {
        success: true,
        hashtags,
        source: 'ai'
      };
    } else {
      console.log('🔍 AI hashtag generation failed, using fallback');
      return {
        success: true,
        hashtags: generateFallbackHashtags(profileData, options.fallbackStrategy),
        source: 'fallback'
      };
    }
    
  } catch (error) {
    console.error('Error generating hashtags with AI:', error);
    return {
      success: true,
      hashtags: generateFallbackHashtags(profileData, options.fallbackStrategy),
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Simplified hashtag generation function for backward compatibility
 */
export async function generateHashtags(
  profileData: ProfileData,
  ai?: any,
  options: HashtagGenerationOptions = {}
): Promise<string[]> {
  const result = await generateHashtagsWithAI(profileData, ai, options);
  return result.hashtags;
}

/**
 * Generate hashtags for API routes (server-side)
 */
export async function generateHashtagsForAPI(
  profileData: ProfileData,
  options: HashtagGenerationOptions = {}
): Promise<HashtagGenerationResult> {
  try {
    const prompt = generatePrompt(profileData, options);
    
    const response = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt,
        responseSchema: Schema.object({
          properties: {
            hashtags: Schema.array({
              items: Schema.string()
            })
          },
          required: ["hashtags"]
        }),
        isStream: false,
      },
      null // No injected AI for server-side calls
    );
    
    if (response.ok && response.data) {
      const data = response.data as { hashtags: string[] };
      const hashtags = data.hashtags.slice(0, options.maxHashtags || DEFAULT_MAX_HASHTAGS);
      
      console.log('✅ Generated hashtags:', hashtags);
      return {
        success: true,
        hashtags,
        source: 'ai'
      };
    } else {
      console.error('AI hashtag generation failed:', response);
      return {
        success: true,
        hashtags: generateFallbackHashtags(profileData, options.fallbackStrategy),
        source: 'fallback'
      };
    }
    
  } catch (error) {
    console.error('Error in hashtag generation API:', error);
    return {
      success: true,
      hashtags: generateFallbackHashtags(profileData, options.fallbackStrategy),
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
