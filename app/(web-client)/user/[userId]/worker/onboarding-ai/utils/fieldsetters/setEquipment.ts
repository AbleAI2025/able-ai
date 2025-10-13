/**
 * setEquipment.ts
 * 
 * Field setter for equipment validation.
 * Handles equipment text validation and processing.
 */

import { checkInappropriateContent, checkOffTopicResponse } from '../filters';
import { setSupportValidation } from './setSupportValidation';

/**
 * Parse equipment text into separate equipment items using AI
 * Handles various formats intelligently:
 * - "I use Mechanic tools, Wrenches, Screws"
 * - "Baking Equipment, Mixing Bowls"
 * - "Aprons as a chef for my equipment"
 * - "Pans, Aprons as equipment"
 */
async function parseEquipmentItemsWithAI(text: string, ai?: any): Promise<{ name: string; description?: string }[]> {
  if (!ai) {
    // Fallback to basic parsing if no AI available
    return parseEquipmentItemsBasic(text);
  }

  try {
    const response = await ai.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `Extract and clean equipment names from this text. Return only the core equipment names, removing any prefixes, suffixes, or descriptive text.

Examples:
- "I use Pans, Aprons as a chef for my equipment" → ["Pans", "Aprons"]
- "Baking Equipment, Mixing Bowls" → ["Baking Equipment", "Mixing Bowls"]
- "Aprons as equipment" → ["Aprons"]
- "Pans for my equipment" → ["Pans"]
- "I have: Mechanic tools, Wrenches, Screws" → ["Mechanic tools", "Wrenches", "Screws"]

Text to clean: "${text}"

Return only a JSON array of equipment names, no explanations.`
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 200
      }
    });

    if (response?.response?.text()) {
      const cleanedText = response.response.text().trim();
      // Try to parse as JSON array
      const equipmentNames = JSON.parse(cleanedText);
      if (Array.isArray(equipmentNames)) {
        return equipmentNames.map(name => ({
          name: name.trim(),
          description: undefined
        }));
      }
    }
  } catch (error) {
    console.log('🔍 AI equipment parsing failed, using fallback:', error);
  }

  // Fallback to basic parsing
  return parseEquipmentItemsBasic(text);
}

/**
 * Basic equipment parsing fallback
 */
function parseEquipmentItemsBasic(text: string): { name: string; description?: string }[] {
  // Remove common prefixes and suffixes - be more aggressive but smart
  const cleanedText = text
    .replace(/^(i use|i have|i own|equipment:|tools:|my equipment:|my tools:?)\s*/i, '')
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/^:\s*/, '') // Remove leading colon
    .replace(/\s+as\s+a\s+\w+\s+for\s+my\s+equipment$/i, '') // Remove "as a [profession] for my equipment"
    .replace(/\s+for\s+my\s+equipment$/i, '') // Remove "for my equipment"
    .replace(/\s+as\s+a\s+\w+$/i, '') // Remove "as a [profession]"
    .replace(/\s+as\s+equipment$/i, '') // Remove "as equipment"
    .replace(/\s+for\s+equipment$/i, '') // Remove "for equipment"
    // Only remove "equipment" if it's clearly a suffix, not part of a compound term
    // Don't remove "equipment" if it's part of a compound term like "Baking Equipment"
    // This regex is more selective - only removes standalone "equipment" at the end
    .replace(/\s+equipment$/i, '') // Remove trailing "equipment"
    .trim();
  
  // Split by common separators (comma, semicolon, "and", "&")
  const separators = /[,;]|\s+and\s+|\s+&\s+/i;
  const items = cleanedText.split(separators);
  
  // Clean and filter items
  const equipmentItems: { name: string; description?: string }[] = [];
  
  for (const item of items) {
    const cleanedItem = item.trim();
    
    // Skip empty items
    if (!cleanedItem) continue;
    
    // Skip common filler words
    if (/^(and|or|the|a|an|with|for|in|on|at|by|to|from)$/i.test(cleanedItem)) continue;
    
    // Clean up the item name - be more aggressive
    const name = cleanedItem
      .replace(/^(the|a|an)\s+/i, '') // Remove articles
      .replace(/\s+as\s+a\s+\w+$/i, '') // Remove "as a [profession]"
      .replace(/\s+as\s+equipment$/i, '') // Remove "as equipment"
      .replace(/\s+for\s+equipment$/i, '') // Remove "for equipment"
      .replace(/\s+equipment$/i, '') // Remove trailing "equipment"
      .replace(/\s+for\s+my\s+equipment$/i, '') // Remove "for my equipment"
      .replace(/\s+as\s+a\s+\w+\s+for\s+my\s+equipment$/i, '') // Remove "as a [profession] for my equipment"
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    if (name.length > 0) {
      equipmentItems.push({
        name: name,
        description: undefined // No description for now, can be enhanced later
      });
    }
  }
  
  return equipmentItems;
}

export async function setEquipment(value: string, ai?: any): Promise<{
  ok: boolean;
  error?: string;
  equipment?: { name: string; description?: string }[];
  isAppropriate?: boolean;
  isWorkerRelated?: boolean;
  needsSupport?: boolean;
  supportMessage?: string;
  escalationTrigger?: any;
}> {
  const trimmed = (value || '').trim();
  
  // Check for support/escalation needs first
  const supportValidation = setSupportValidation(trimmed, {
    fieldType: 'equipment',
    currentStep: 'equipment_validation'
  });
  
  if (supportValidation.needsSupport) {
    return {
      ok: false,
      error: supportValidation.supportMessage || 'Support assistance needed',
      needsSupport: true,
      supportMessage: supportValidation.supportMessage,
      escalationTrigger: supportValidation.escalationTrigger
    };
  }
  
  // Check for skip/none responses first
  const skipPatterns = [
    'none', 'n/a', 'na', 'skip', 'no equipment', 'no tools', 'no gear',
    'don\'t have any', 'don\'t have', 'no formal', 'no official', 'nothing',
    'not applicable', 'not relevant', 'no tools', 'no gear', 'no equipment',
    'i don\'t have any', 'i don\'t have', 'i have none', 'i have nothing'
  ];
  
  const isSkipResponse = skipPatterns.some(pattern => 
    trimmed.toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (isSkipResponse) {
    return { 
      ok: true, 
      equipment: [], // Empty array for no equipment
      isAppropriate: true,
      isWorkerRelated: true
    };
  }
  
  // Basic validation for non-skip responses
  if (!trimmed) {
    return { ok: false, error: 'Please enter your equipment or say "none" if you don\'t have any' };
  }
  
  if (trimmed.length < 2) {
    return { ok: false, error: 'Please provide at least one piece of equipment, or say "none" if you don\'t have any' };
  }
  
  if (trimmed.length > 1000) {
    return { ok: false, error: 'Equipment description must be less than 1000 characters' };
  }
  
  // Check for inappropriate content
  const inappropriateCheck = checkInappropriateContent(trimmed);
  if (!inappropriateCheck.isAppropriate) {
    return { 
      ok: false, 
      error: inappropriateCheck.message || 'Please keep your equipment description professional and appropriate',
      isAppropriate: false
    };
  }
  
  // Check if it's worker-related - be more lenient for equipment
  const offTopicCheck = checkOffTopicResponse({
    currentStep: 'equipment',
    currentField: 'equipment',
    currentPrompt: 'Please list any equipment you have that you can use for your work.',
    previousMessages: [] // Not available in this context, but kept for type compatibility
  }, trimmed);
  
  // Only reject if it's clearly not equipment-related (be very lenient)
  if (!offTopicCheck.isRelevant && trimmed.length > 10) {
    return { 
      ok: false, 
      error: offTopicCheck.reason || 'Please provide information relevant to your work equipment',
      isWorkerRelated: false
    };
  }
  
  // Parse and separate equipment items using AI
  const equipmentItems = await parseEquipmentItemsWithAI(trimmed, ai);
  
  if (equipmentItems.length === 0) {
    return { ok: false, error: 'Please provide at least one piece of equipment' };
  }
  
  return { 
    ok: true, 
    equipment: equipmentItems, // Return array of equipment items
    isAppropriate: true,
    isWorkerRelated: true
  };
}
