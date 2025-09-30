/**
 * function-mapping-loader.ts
 * 
 * Utility functions to load and use the JSON-based function mapping configuration.
 * This provides an alternative to the TypeScript-based mapping for easier
 * configuration management and dynamic updates.
 */

import functionMappingConfig from '../config/function-mapping.json';

// Type definitions for the JSON configuration
export interface FunctionMappingConfig {
  version: string;
  description: string;
  lastUpdated: string;
  pages: {
    [pageType: string]: {
      name: string;
      description: string;
      functions: {
        [category: string]: string[];
      };
      required: string[];
      optional?: string[];
      validation?: {
        strict: boolean;
        allowFallbacks: boolean;
        escalationEnabled: boolean;
      };
    };
  };
  functionCategories: {
    [category: string]: {
      description: string;
      functions: string[];
    };
  };
  globalSettings: {
    defaultValidation: {
      strict: boolean;
      allowFallbacks: boolean;
      escalationEnabled: boolean;
    };
    functionRegistry: {
      autoLoad: boolean;
      cacheEnabled: boolean;
      validationEnabled: boolean;
    };
    errorHandling: {
      logErrors: boolean;
      showUserFriendlyMessages: boolean;
      escalateOnCriticalErrors: boolean;
    };
  };
}

export type PageType = keyof FunctionMappingConfig['pages'];

/**
 * Load the function mapping configuration
 */
export function loadFunctionMappingConfig(): FunctionMappingConfig {
  return functionMappingConfig as unknown as FunctionMappingConfig;
}

/**
 * Get available functions for a specific page
 */
export function getAvailableFunctionsForPage(pageType: PageType): string[] {
  const config = loadFunctionMappingConfig();
  const pageConfig = config.pages[pageType];
  
  if (!pageConfig) {
    throw new Error(`No configuration found for page type: ${pageType}`);
  }
  
  const allFunctions: string[] = [];
  Object.values(pageConfig.functions).forEach(categoryFunctions => {
    allFunctions.push(...categoryFunctions);
  });
  
  return [...new Set(allFunctions)]; // Remove duplicates
}

/**
 * Get required functions for a specific page
 */
export function getRequiredFunctionsForPage(pageType: PageType): string[] {
  const config = loadFunctionMappingConfig();
  const pageConfig = config.pages[pageType];
  
  if (!pageConfig) {
    throw new Error(`No configuration found for page type: ${pageType}`);
  }
  
  return pageConfig.required;
}

/**
 * Get optional functions for a specific page
 */
export function getOptionalFunctionsForPage(pageType: PageType): string[] {
  const config = loadFunctionMappingConfig();
  const pageConfig = config.pages[pageType];
  
  if (!pageConfig) {
    throw new Error(`No configuration found for page type: ${pageType}`);
  }
  
  return pageConfig.optional || [];
}

/**
 * Check if a function is available for a specific page
 */
export function isFunctionAvailableForPage(pageType: PageType, functionName: string): boolean {
  const availableFunctions = getAvailableFunctionsForPage(pageType);
  return availableFunctions.includes(functionName);
}

/**
 * Get page configuration
 */
export function getPageConfig(pageType: PageType) {
  const config = loadFunctionMappingConfig();
  return config.pages[pageType];
}

/**
 * Get all page types
 */
export function getAllPageTypes(): PageType[] {
  const config = loadFunctionMappingConfig();
  return Object.keys(config.pages) as PageType[];
}

/**
 * Get all functions in a specific category
 */
export function getFunctionsByCategory(category: string): string[] {
  const config = loadFunctionMappingConfig();
  const categoryConfig = config.functionCategories[category];
  
  if (!categoryConfig) {
    throw new Error(`No category found: ${category}`);
  }
  
  return categoryConfig.functions;
}

/**
 * Get all available categories
 */
export function getAvailableCategories(): string[] {
  const config = loadFunctionMappingConfig();
  return Object.keys(config.functionCategories);
}

/**
 * Validate function usage for a page
 */
export function validatePageFunctionUsage(
  pageType: PageType, 
  usedFunctions: string[]
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
} {
  const config = loadFunctionMappingConfig();
  const pageConfig = config.pages[pageType];
  
  if (!pageConfig) {
    return {
      isValid: false,
      errors: [`No configuration found for page type: ${pageType}`],
      warnings: [],
      suggestions: []
    };
  }
  
  const availableFunctions = getAvailableFunctionsForPage(pageType);
  const requiredFunctions = getRequiredFunctionsForPage(pageType);
  const optionalFunctions = getOptionalFunctionsForPage(pageType);
  
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // Check for unauthorized function usage
  const unauthorizedFunctions = usedFunctions.filter(fn => !availableFunctions.includes(fn));
  if (unauthorizedFunctions.length > 0) {
    errors.push(`Unauthorized functions used: ${unauthorizedFunctions.join(', ')}`);
    suggestions.push(`Consider using these alternatives: ${availableFunctions.slice(0, 3).join(', ')}`);
  }
  
  // Check for missing required functions
  const missingRequired = requiredFunctions.filter(fn => !usedFunctions.includes(fn));
  if (missingRequired.length > 0) {
    warnings.push(`Missing required functions: ${missingRequired.join(', ')}`);
    suggestions.push(`Add these required functions: ${missingRequired.join(', ')}`);
  }
  
  // Check for unused optional functions that might be beneficial
  const unusedOptional = optionalFunctions.filter(fn => !usedFunctions.includes(fn));
  if (unusedOptional.length > 0) {
    suggestions.push(`Consider using these optional functions: ${unusedOptional.slice(0, 2).join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}

/**
 * Get validation settings for a page
 */
export function getPageValidationSettings(pageType: PageType) {
  const config = loadFunctionMappingConfig();
  const pageConfig = config.pages[pageType];
  
  if (!pageConfig) {
    return config.globalSettings.defaultValidation;
  }
  
  return pageConfig.validation;
}

/**
 * Get global settings
 */
export function getGlobalSettings() {
  const config = loadFunctionMappingConfig();
  return config.globalSettings;
}

/**
 * Check if a page has strict validation enabled
 */
export function isStrictValidationEnabled(pageType: PageType): boolean {
  const validationSettings = getPageValidationSettings(pageType);
  return validationSettings?.strict || false;
}

/**
 * Check if fallbacks are allowed for a page
 */
export function areFallbacksAllowed(pageType: PageType): boolean {
  const validationSettings = getPageValidationSettings(pageType);
  return validationSettings?.allowFallbacks || false;
}

/**
 * Check if escalation is enabled for a page
 */
export function isEscalationEnabled(pageType: PageType): boolean {
  const validationSettings = getPageValidationSettings(pageType);
  return validationSettings?.escalationEnabled || false;
}
