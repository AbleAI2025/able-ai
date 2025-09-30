type ChatStep = {
  id: number;
  type: string;
  fieldName?: string;
  originalValue?: any;
  suggestedJobTitle?: string;
  confidence?: number;
  matchedTerms?: string[];
  isAISuggested?: boolean;
  similarSkills?: any[];
  isNew?: boolean;
};

export const buildJobTitleConfirmationStep = (
  stepId: number,
  inputName: string,
  originalValue: string,
  jobTitleResult: { jobTitle: string; confidence: number; matchedTerms: string[]; isAISuggested: boolean }
): ChatStep => ({
  id: Date.now() + 3,
  type: "jobTitleConfirmation",
  fieldName: inputName,
  originalValue,
  suggestedJobTitle: jobTitleResult.jobTitle,
  confidence: jobTitleResult.confidence,
  matchedTerms: jobTitleResult.matchedTerms,
  isAISuggested: jobTitleResult.isAISuggested,
  isNew: true,
});

export const buildSimilarSkillsConfirmationStep = (
  stepId: number,
  inputName: string,
  originalValue: string,
  similarSkills: any[]
): ChatStep => ({
  id: Date.now() + 3,
  type: "similarSkillsConfirmation",
  fieldName: inputName,
  originalValue,
  similarSkills,
  isNew: true,
});


