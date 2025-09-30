/**
 * Check if a skill title already exists across all workers
 */
export async function checkExistingSkillTitle(skillName: string, workerProfileId: string): Promise<{
  exists: boolean;
  existingSkills: Array<{
    id: number;
    name: string;
    experienceYears: number | null;
    agreedRate: number | null;
    workerName: string;
  }>;
}> {
  try {
    const response = await fetch('/api/check-existing-skill-title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        skillName,
        workerProfileId
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error checking existing skill title:', error);
    return { exists: false, existingSkills: [] };
  }
}

/**
 * Build a confirmation step for existing skill titles
 */
export function buildExistingSkillTitleConfirmationStep(
  stepId: number,
  inputName: string,
  value: string,
  existingSkills: Array<{
    id: number;
    name: string;
    experienceYears: number | null;
    agreedRate: number | null;
    workerName: string;
  }>
) {
  const skillList = existingSkills.map(skill => 
    `• ${skill.name} (${skill.workerName})`
  ).join('\n');

  return {
    id: stepId,
    type: "confirmation",
    confirmationConfig: {
      type: "existing-skill-title",
      existingValue: value,
      fieldName: inputName,
      existingSkills: existingSkills,
      message: `⚠️ This skill title already exists in our system:\n\n${skillList}\n\nWould you like to use a different skill title to avoid confusion?`
    },
    isComplete: false,
    isNew: true,
  };
}
