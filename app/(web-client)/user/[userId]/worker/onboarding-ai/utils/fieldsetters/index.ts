/**
 * index.ts
 * 
 * Central export file for all field setter functions.
 * This provides a clean interface for importing field setters
 * throughout the onboarding system.
 */

// Export all field setter functions
export { setBio } from './setBio';
export { setSkillName } from './setSkillName';
export { setExperience } from './setExperience';
export { setWage, type WageUnit } from './setWage';
export { setAddress } from './setAddress';
export { setAvailability, type Availability } from './setAvailability';
export { setVideoIntro } from './setVideoIntro';
export { setQualifications } from './setQualifications';
export { setEquipment } from './setEquipment';
export { setSupportValidation, type SupportValidationResult } from './setSupportValidation';

