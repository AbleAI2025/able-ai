export const PROMPTS = {
  videoScript: (formData: any) => `Create a personalized video introduction script for a worker profile. Use the following information to create an engaging, professional script that highlights their strengths and personality:

PROFILE DATA:
- About: ${formData.about || 'Not provided'}
- Experience: ${formData.experience || 'Not provided'}
- Skills: ${formData.skills || 'Not provided'}
- Qualifications: ${formData.qualifications || 'Not provided'}
- Job Title: ${formData.jobTitle || 'Not provided'}

IMPORTANT: Focus on the skills field as the primary profession indicator. Do not use bio information for context as it may contain outdated or conflicting information. The skills field represents their current profession.

Create a script that:
1. Is conversational and natural
2. Highlights key strengths and experience
3. Shows personality and enthusiasm
4. Is appropriate for a professional video introduction
5. Is between 30-60 seconds when spoken
6. Uses the person's own words and style when possible
7. Focuses on their current skills/profession, not outdated bio information

Format as a natural speaking script with line breaks for pauses.`,

  intentAnalysis: (userInput: string, currentPrompt: string, recent: string) => `Analyze this user input in the context of an AI onboarding conversation:

USER INPUT: "${userInput}"
CURRENT PROMPT: "${currentPrompt}"
RECENT CONTEXT: ${recent}

Determine if the user is:
1. Asking for help or expressing frustration
2. Providing normal onboarding information
3. Trying to skip or avoid the process
4. Having technical issues

Respond with JSON containing:
- action: "help", "continue", "redirect", or "clarify"
- confidence: 0-1 confidence score
- reason: Brief explanation
- suggestedAction: What the system should do next`,

  contextAwarePrompt: (fieldName: string, aboutInfo: string) => `Generate a personalized prompt for collecting ${fieldName} information. The user has already provided this information: "${aboutInfo}"

IMPORTANT: You MUST maintain context and consistency. If you already know their profession (like "baker"), don't ask generic questions - ask specific questions about their field.

Create a prompt that:
1. References their existing information naturally and specifically
2. Asks for the specific field in a conversational way that builds on what you know
3. Provides helpful context about why this information is needed
4. Is encouraging and supportive
5. Is 1-2 sentences long
6. Shows you remember what they told you
7. AVOID repetitive phrases like "Now that I know you're a..." or "I see you're a..."
8. Use varied, natural language that doesn't sound robotic
9. NEVER repeat the same phrasing pattern more than once in a conversation
10. Build naturally on previous responses without restating what you already know

IMPORTANT FIELD-SPECIFIC REQUIREMENTS:
- For "skills": Ask for professional skills and areas of expertise, NOT job titles
- For "experience": Ask for years of experience or level (beginner/intermediate/senior), NOT detailed project descriptions
- For "qualifications": Ask for certifications/qualifications, degrees, licenses - allow "none" responses
- For "location": Ask for work location/base
- For "availability": Ask for work schedule/availability
- For "equipment": Ask for work equipment/tools they own
- For "hourlyRate": Ask for preferred hourly rate in pounds
- For "videoIntro": Ask to record video introduction

Examples:
- If you're asking for skills, say "What professional skills do you have?" or "What are your key areas of expertise?"
- If you're asking for experience, say "How many years of experience do you have?" or "What's your experience level (beginner, intermediate, senior)?"
- If you're asking for qualifications, say "What qualifications or certifications do you have? (You can say 'none' if you don't have any)"
- If you're asking for location, say "Where are you based for work?"
- If you're asking for availability, say "When are you available to work?"
- If you're asking for equipment, say "What equipment do you have for your work?"
- If you're asking for hourly rate, say "What's your preferred hourly rate?"
- If you're asking for video, say "Let's record a video introduction!"

Make it feel natural, personalized, and contextually aware. Use different phrasing each time.`,
};


