/**
 * hospitality-field-setters.ts
 * 
 * Custom field setters for UK Hospitality onboarding fields.
 * Parses and validates hospitality-specific input data.
 */

export interface ValidationResult {
  ok: boolean;
  error?: string;
  [key: string]: any;
}

/**
 * Parse main skill input to extract skill name and experience
 * Input: "I'm a bartender with 6 years experience"
 * Output: { skillName: "Bartender", experience: "6 years", years: 6 }
 */
export function setMainSkill(input: string): ValidationResult {
  if (!input || input.trim().length < 5) {
    return {
      ok: false,
      error: "Please tell me your main skill and experience level. For example: 'I'm a bartender with 6 years experience'"
    };
  }

  const trimmedInput = input.trim();
  
  // Common hospitality skills patterns
  const skillPatterns = [
    /(?:i'm|i am|i work as|i do)\s+(?:a\s+)?(bartender|chef|cook|waiter|waitress|server|barista|manager|supervisor|host|hostess|sommelier|mixologist|kitchen\s+staff|front\s+of\s+house|foh|back\s+of\s+house|boh)/i,
    /(bartender|chef|cook|waiter|waitress|server|barista|manager|supervisor|host|hostess|sommelier|mixologist|kitchen\s+staff|front\s+of\s+house|foh|back\s+of\s+house|boh)/i
  ];

  // Experience patterns
  const experiencePatterns = [
    /(\d+(?:\.\d+)?)\s*(?:years?|yrs?|months?|months?)/i,
    /(?:for|with|over)\s+(\d+(?:\.\d+)?)\s*(?:years?|yrs?|months?|months?)/i,
    /(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i
  ];

  let skillName = '';
  let experience = '';
  let years = 0;

  // Extract skill name
  for (const pattern of skillPatterns) {
    const match = trimmedInput.match(pattern);
    if (match) {
      skillName = match[1].toLowerCase();
      // Capitalize first letter
      skillName = skillName.charAt(0).toUpperCase() + skillName.slice(1);
      break;
    }
  }

  // Extract experience
  for (const pattern of experiencePatterns) {
    const match = trimmedInput.match(pattern);
    if (match) {
      const num = parseFloat(match[1]);
      if (trimmedInput.toLowerCase().includes('month')) {
        years = Math.round(num / 12 * 10) / 10; // Convert months to years
        experience = `${num} months`;
      } else {
        years = num;
        experience = `${num} years`;
      }
      break;
    }
  }

  // If no skill found, try to extract from the beginning
  if (!skillName) {
    const words = trimmedInput.split(' ');
    if (words.length >= 2) {
      skillName = words[1].charAt(0).toUpperCase() + words[1].slice(1);
    }
  }

  // If no experience found, set default
  if (!experience) {
    experience = "Some experience";
    years = 1;
  }

  if (!skillName) {
    return {
      ok: false,
      error: "I couldn't identify your main skill. Please try again with something like 'I'm a bartender with 6 years experience'"
    };
  }

  return {
    ok: true,
    skillName,
    experience,
    years,
    mainSkill: `${skillName} with ${experience}`,
    skills: skillName,
    experienceText: experience
  };
}

/**
 * Validate venue experience input
 * Input: Description of venues worked in
 * Output: Formatted venue experience
 */
export function setVenueExperience(input: string): ValidationResult {
  if (!input || input.trim().length < 10) {
    return {
      ok: false,
      error: "Please tell me about the venues where you've worked. Describe the pubs, restaurants, hotels, festivals, etc."
    };
  }

  const trimmedInput = input.trim();
  
  // Check for common venue types
  const venueTypes = [
    'pub', 'restaurant', 'hotel', 'festival', 'bar', 'cafe', 'club', 'venue', 
    'catering', 'events', 'fine dining', 'casual dining', 'fast food', 'coffee shop'
  ];

  const foundVenues = venueTypes.filter(venue => 
    trimmedInput.toLowerCase().includes(venue)
  );

  if (foundVenues.length === 0) {
    return {
      ok: false,
      error: "Could you mention the types of venues? For example: pubs, restaurants, hotels, festivals, etc."
    };
  }

  return {
    ok: true,
    venueExperience: trimmedInput,
    about: trimmedInput,
    foundVenues
  };
}

/**
 * Validate qualifications input
 * Input: Certifications, licenses, degrees
 * Output: Formatted qualifications
 */
export function setQualifications(input: string): ValidationResult {
  if (!input || input.trim().length === 0) {
    return {
      ok: true,
      qualifications: 'No formal qualifications',
      about: 'No formal qualifications'
    };
  }

  const trimmedInput = input.trim().toLowerCase();
  
  // Check for "none" responses
  const noneKeywords = ['none', 'n/a', 'na', 'no', 'nothing', 'don\'t have', 'no formal', 'no official'];
  const hasNoneKeywords = noneKeywords.some(keyword => trimmedInput.includes(keyword));

  if (hasNoneKeywords) {
    return {
      ok: true,
      qualifications: 'No formal qualifications',
      about: 'No formal qualifications'
    };
  }

  // Check for common UK hospitality qualifications
  const commonQuals = [
    'food hygiene', 'personal license', 'hospitality degree', 'catering', 'culinary',
    'health and safety', 'first aid', 'fire safety', 'allergen awareness', 'wine',
    'cocktail', 'barista', 'sommelier', 'chef', 'cookery'
  ];

  const foundQuals = commonQuals.filter(qual => trimmedInput.includes(qual));

  return {
    ok: true,
    qualifications: input.trim(),
    about: input.trim(),
    foundQualifications: foundQuals
  };
}

/**
 * Parse specific skills and languages
 * Input: Specialized skills, languages, technical abilities
 * Output: Formatted specific skills
 */
export function setSpecificSkills(input: string): ValidationResult {
  if (!input || input.trim().length < 5) {
    return {
      ok: false,
      error: "Please tell me about your specific skills. For example: wine knowledge, multi-lingual abilities, technical skills, etc."
    };
  }

  const trimmedInput = input.trim();
  
  // Check for language indicators
  const languagePatterns = [
    /(?:speak|fluent|bilingual|multilingual|language)/i,
    /(?:english|spanish|french|german|italian|portuguese|mandarin|cantonese|arabic|hindi)/i
  ];

  const hasLanguages = languagePatterns.some(pattern => pattern.test(trimmedInput));

  // Check for technical skills
  const technicalSkills = [
    'pos', 'till', 'cash register', 'computer', 'software', 'system', 'digital',
    'online', 'booking', 'reservation', 'inventory', 'stock', 'ordering'
  ];

  const foundTechnicalSkills = technicalSkills.filter(skill => 
    trimmedInput.toLowerCase().includes(skill)
  );

  return {
    ok: true,
    specificSkills: trimmedInput,
    skills: trimmedInput,
    hasLanguages,
    foundTechnicalSkills
  };
}

/**
 * Parse work traits (3-4 traits)
 * Input: Work traits and personality characteristics
 * Output: Formatted work traits
 */
export function setWorkTraits(input: string): ValidationResult {
  if (!input || input.trim().length < 10) {
    return {
      ok: false,
      error: "Please pick 3-4 work traits that describe you. For example: calm under pressure, team player, customer-focused, creative"
    };
  }

  const trimmedInput = input.trim();
  
  // Common work traits
  const commonTraits = [
    'calm under pressure', 'team player', 'customer-focused', 'creative',
    'detail-oriented', 'leadership', 'problem solver', 'adaptable',
    'enthusiastic', 'professional', 'reliable', 'organized',
    'communication', 'multitasking', 'fast learner', 'hardworking'
  ];

  const foundTraits = commonTraits.filter(trait => 
    trimmedInput.toLowerCase().includes(trait.toLowerCase())
  );

  // Count traits mentioned
  const traitCount = foundTraits.length;

  if (traitCount < 2) {
    return {
      ok: false,
      error: "Please pick at least 3-4 work traits that describe you best."
    };
  }

  if (traitCount > 6) {
    return {
      ok: false,
      error: "Please pick 3-4 work traits that best describe you (not too many!)."
    };
  }

  return {
    ok: true,
    workTraits: trimmedInput,
    about: trimmedInput,
    foundTraits,
    traitCount
  };
}

/**
 * Parse equipment and tools
 * Input: Equipment, tools, systems user is confident with
 * Output: Formatted equipment list
 */
export function setEquipment(input: string): ValidationResult {
  if (!input || input.trim().length === 0) {
    return {
      ok: true,
      equipment: [],
      about: 'No specific equipment mentioned'
    };
  }

  const trimmedInput = input.trim().toLowerCase();
  
  // Check for "none" responses
  const noneKeywords = ['none', 'n/a', 'na', 'no', 'nothing', 'don\'t have', 'no equipment'];
  const hasNoneKeywords = noneKeywords.some(keyword => trimmedInput.includes(keyword));

  if (hasNoneKeywords) {
    return {
      ok: true,
      equipment: [],
      about: 'No equipment specified'
    };
  }

  // Common hospitality equipment
  const commonEquipment = [
    'pos', 'till', 'cash register', 'bar tools', 'coffee machine', 'espresso',
    'blender', 'juicer', 'ice machine', 'refrigerator', 'freezer', 'oven',
    'stove', 'grill', 'fryer', 'microwave', 'dishwasher', 'glasswasher',
    'wine opener', 'corkscrew', 'shaker', 'strainer', 'jigger', 'muddler',
    'cutting board', 'knife', 'utensils', 'plates', 'glasses', 'cutlery'
  ];

  const foundEquipment = commonEquipment.filter(equipment => 
    trimmedInput.includes(equipment)
  );

  // Convert to equipment array format
  const equipmentArray = foundEquipment.map(item => ({
    name: item.charAt(0).toUpperCase() + item.slice(1),
    description: undefined
  }));

  return {
    ok: true,
    equipment: equipmentArray,
    about: trimmedInput,
    foundEquipment
  };
}

/**
 * Helper function to validate hospitality field based on field name
 */
export function validateHospitalityField(fieldName: string, input: string): ValidationResult {
  switch (fieldName) {
    case 'mainSkill':
      return setMainSkill(input);
    case 'venueExperience':
      return setVenueExperience(input);
    case 'qualifications':
      return setQualifications(input);
    case 'specificSkills':
      return setSpecificSkills(input);
    case 'workTraits':
      return setWorkTraits(input);
    case 'equipment':
      return setEquipment(input);
    default:
      return {
        ok: false,
        error: `Unknown field: ${fieldName}`
      };
  }
}
