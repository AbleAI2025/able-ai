# Function Mapping System

## 🎯 What is Page-Specific Functions Mapping?

**Page-Specific Functions Mapping** is a centralized system that defines which modular functions are available and should be used on each page/component of your application. It's like a "menu" that tells each page which functions it can access.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Function Mapping System                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   TypeScript    │    │   JSON Config   │                │
│  │   Mapping       │    │   Mapping       │                │
│  │   (function-    │    │   (function-    │                │
│  │   mapping.ts)   │    │   mapping.json) │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                        │
│           └───────────┬───────────┘                        │
│                       │                                    │
│  ┌─────────────────────────────────────────────────────────┤
│  │              Function Registry                          │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │  │Field Setters│ │Content      │ │AI Validation│      │
│  │  │             │ │Filters      │ │             │      │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │
│  └─────────────────────────────────────────────────────────┤
│                       │                                    │
│  ┌─────────────────────────────────────────────────────────┤
│  │                Page Components                          │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │  │AI Onboarding│ │Manual       │ │Profile Edit │      │
│  │  │Page         │ │Onboarding   │ │Page         │      │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │
│  └─────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

## 📁 File Structure

```
config/
├── function-mapping.json        # JSON-based mapping
└── README.md                    # This documentation

utils/
├── function-mapping-loader.ts   # JSON loader utilities
└── ...

examples/
└── function-mapping-usage.tsx   # Usage examples
```

## 🚀 Quick Start

### 1. Using TypeScript Mapping

```typescript
import { 
  PAGE_TYPES,
  getAvailableFunctions,
  isFunctionAvailable,
  getFunction 
} from '../utils/function-mapping-loader';

// Get available functions for AI onboarding page
const availableFunctions = getAvailableFunctions(PAGE_TYPES.ONBOARDING_AI);

// Check if a function is available
if (isFunctionAvailable(PAGE_TYPES.ONBOARDING_AI, 'setSkillName')) {
  const setSkillName = getFunction('setSkillName');
  const result = setSkillName('Carpentry');
}
```

### 2. Using JSON Mapping

```typescript
import { 
  getAvailableFunctionsForPage,
  isFunctionAvailableForPage,
  loadFunctionMappingConfig 
} from '../utils/function-mapping-loader';

// Get available functions for a page
const availableFunctions = getAvailableFunctionsForPage('onboarding-ai');

// Check if function is available
if (isFunctionAvailableForPage('onboarding-ai', 'setSkillName')) {
  // Use the function
}
```

## 📋 Page Types and Their Functions

### 🤖 AI Onboarding Page (`onboarding-ai`)
**Most comprehensive page with full AI validation**

**Available Functions:**
- **Field Setters:** All 8 functions (setSkillName, setExperience, setWage, setAddress, setAvailability, setVideoIntro, setQualifications, setEquipment)
- **Content Filters:** All 4 functions (checkInappropriateContent, checkOffTopicResponse, validateContentWithAI, filterContent)
- **AI Validation:** All 3 functions (validateResponseWithAI, sanitizeResponseWithAI, processValidatedResponse)

**Required Functions:**
- `setSkillName` - Primary skill validation
- `setExperience` - Experience normalization
- `checkInappropriateContent` - Content filtering
- `validateResponseWithAI` - AI validation

**Validation Settings:**
- ✅ Strict validation enabled
- ✅ Fallbacks allowed
- ✅ Escalation enabled

### 📝 Manual Onboarding Page (`onboarding-manual`)
**Traditional form-based onboarding with basic AI validation**

**Available Functions:**
- **Field Setters:** 7 functions (excludes setVideoIntro)
- **Content Filters:** 2 functions (checkInappropriateContent, checkOffTopicResponse)
- **AI Validation:** 1 function (sanitizeResponseWithAI)

**Required Functions:**
- `setSkillName` - Primary skill validation
- `setExperience` - Experience normalization
- `checkInappropriateContent` - Content filtering

**Validation Settings:**
- ❌ Strict validation disabled
- ✅ Fallbacks allowed
- ❌ Escalation disabled

### ✏️ Profile Edit Page (`profile-edit`)
**Edit existing user profile with validation**

**Available Functions:**
- **Field Setters:** All 8 functions
- **Content Filters:** 2 functions (checkInappropriateContent, checkOffTopicResponse)

**Required Functions:**
- `checkInappropriateContent` - Content filtering

**Validation Settings:**
- ❌ Strict validation disabled
- ✅ Fallbacks allowed
- ❌ Escalation disabled

### 🛠️ Skill Management Page (`skill-management`)
**Add, edit, or remove user skills**

**Available Functions:**
- **Field Setters:** 4 functions (setSkillName, setExperience, setQualifications, setEquipment)
- **Content Filters:** 2 functions (checkInappropriateContent, checkOffTopicResponse)

**Required Functions:**
- `setSkillName` - Primary skill validation
- `checkInappropriateContent` - Content filtering

**Validation Settings:**
- ✅ Strict validation enabled
- ❌ Fallbacks disabled
- ✅ Escalation enabled

### 📅 Availability Management Page (`availability-management`)
**Manage user availability and scheduling**

**Available Functions:**
- **Field Setters:** 1 function (setAvailability)
- **Content Filters:** 1 function (checkInappropriateContent)

**Required Functions:**
- `setAvailability` - Availability validation

**Validation Settings:**
- ✅ Strict validation enabled
- ❌ Fallbacks disabled
- ❌ Escalation disabled

## 🔧 Function Categories

### 1. Field Setters (`fieldsetters`)
Functions for setting and validating user input fields.

| Function | Description | Pages Using |
|----------|-------------|-------------|
| `setSkillName` | Primary skill validation | 4/5 pages |
| `setExperience` | Experience normalization | 4/5 pages |
| `setWage` | Wage validation | 3/5 pages |
| `setAddress` | Location handling | 3/5 pages |
| `setAvailability` | Availability scheduling | 3/5 pages |
| `setVideoIntro` | Video introduction | 2/5 pages |
| `setQualifications` | Qualifications validation | 3/5 pages |
| `setEquipment` | Equipment validation | 3/5 pages |

### 2. Content Filters (`content-filters`)
Functions for filtering inappropriate and off-topic content.

| Function | Description | Pages Using |
|----------|-------------|-------------|
| `checkInappropriateContent` | Inappropriate content detection | 5/5 pages |
| `checkOffTopicResponse` | Off-topic response detection | 4/5 pages |
| `validateContentWithAI` | AI-powered content validation | 1/5 pages |
| `filterContent` | Comprehensive content filtering | 1/5 pages |

### 3. AI Validation (`ai-validation`)
AI-powered validation and sanitization functions.

| Function | Description | Pages Using |
|----------|-------------|-------------|
| `validateResponseWithAI` | Main AI validation | 1/5 pages |
| `sanitizeResponseWithAI` | AI content sanitization | 2/5 pages |
| `processValidatedResponse` | Complete processing pipeline | 1/5 pages |

## 🛡️ Validation and Security

### Validation Levels

1. **Strict Validation** - All functions must pass validation
2. **Fallback Allowed** - Can use alternative methods if primary fails
3. **Escalation Enabled** - Can escalate to human support

### Security Features

- ✅ **Function Authorization** - Pages can only use allowed functions
- ✅ **Content Filtering** - All user input is filtered for inappropriate content
- ✅ **AI Validation** - AI-powered validation for complex inputs
- ✅ **Escalation System** - Human support for problematic cases

## 📊 Usage Statistics

### Most Used Functions
1. `checkInappropriateContent` - Used in 5/5 pages (100%)
2. `setSkillName` - Used in 4/5 pages (80%)
3. `setExperience` - Used in 4/5 pages (80%)
4. `checkOffTopicResponse` - Used in 4/5 pages (80%)

### Least Used Functions
1. `validateContentWithAI` - Used in 1/5 pages (20%)
2. `processValidatedResponse` - Used in 1/5 pages (20%)
3. `setVideoIntro` - Used in 2/5 pages (40%)

## 🔄 Migration Guide

### From Individual Imports to Centralized Mapping

**Before (Individual Imports):**
```typescript
import { setSkillName } from '../utils/fieldsetters';
import { checkInappropriateContent } from '../utils/content-filters';
import { validateResponseWithAI } from '../utils/ai-response-validation';

// Direct function usage
const result = setSkillName('Carpentry');
```

**After (Centralized Mapping):**
```typescript
import { 
  PAGE_TYPES,
  isFunctionAvailable,
  getFunction 
} from '../utils/function-mapping-loader';

// Check availability first
if (isFunctionAvailable(PAGE_TYPES.ONBOARDING_AI, 'setSkillName')) {
  const setSkillName = getFunction('setSkillName');
  const result = setSkillName('Carpentry');
}
```

## 🧪 Testing and Validation

### Function Usage Validation

```typescript
import { validatePageFunctionUsage } from '../utils/function-mapping-loader';

const usedFunctions = ['setSkillName', 'setExperience', 'checkInappropriateContent'];
const validation = validatePageFunctionUsage(PAGE_TYPES.ONBOARDING_AI, usedFunctions);

if (!validation.isValid) {
  console.error('Validation failed:', validation.errors);
}
```

### Runtime Function Availability Check

```typescript
import { isFunctionAvailable } from '../utils/function-mapping-loader';

const handleUserInput = (input: string) => {
  if (isFunctionAvailable(PAGE_TYPES.ONBOARDING_AI, 'setSkillName')) {
    // Safe to use the function
    const setSkillName = getFunction('setSkillName');
    return setSkillName(input);
  } else {
    // Handle unavailable function
    throw new Error('setSkillName not available for this page');
  }
};
```

## 🚀 Benefits

### 1. **Centralized Management**
- Single source of truth for function availability
- Easy to update function mappings across all pages
- Consistent validation rules

### 2. **Type Safety**
- TypeScript support with proper type definitions
- Compile-time validation of function usage
- IntelliSense support for available functions

### 3. **Security**
- Prevents unauthorized function usage
- Ensures proper validation on all pages
- Centralized security policies

### 4. **Maintainability**
- Easy to add new pages or functions
- Clear documentation of page capabilities
- Automated validation and testing

### 5. **Performance**
- Function registry with caching
- Lazy loading of functions
- Optimized function resolution

## 🔮 Future Enhancements

### Planned Features
- [ ] **Dynamic Configuration** - Runtime configuration updates
- [ ] **Function Dependencies** - Automatic dependency resolution
- [ ] **Usage Analytics** - Track function usage across pages
- [ ] **A/B Testing** - Different function sets for different user groups
- [ ] **Performance Monitoring** - Track function performance metrics

### Integration Opportunities
- [ ] **Admin Dashboard** - Visual function mapping management
- [ ] **CI/CD Integration** - Automated function usage validation
- [ ] **Documentation Generation** - Auto-generate API documentation
- [ ] **Testing Framework** - Automated function availability testing

## 📞 Support

For questions or issues with the function mapping system:

1. **Check the examples** in `examples/function-mapping-usage.tsx`
2. **Review the configuration** in `config/function-mapping.json`
3. **Validate your usage** with the validation utilities
4. **Generate a report** using `generateFunctionMappingReport()`

---

**Last Updated:** January 15, 2024  
**Version:** 1.0.0  
**Maintainer:** AI Onboarding Team
