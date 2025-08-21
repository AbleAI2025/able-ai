# ChatAI Module Structure - Organized Architecture

This directory contains the organized Able AI document content converted to TypeScript for optimal performance and maintainability. The content is now logically organized into focused, single-responsibility modules.

## 🏗️ **New Organized Structure**

### **📁 Core Values and Ethics**
- **`core/core-values.ts`** - Core values and principles
- **`core/ethical-standards.ts`** - Ethical guidelines and rules
- **`core/platform-behavior.ts`** - Platform-specific behavior rules

### **📁 Content Moderation**
- **`moderation/content-moderation.ts`** - Content standards and moderation guidelines

### **📁 Skills and Taxonomy**
- **`skills/skill-categories.ts`** - Detailed skill categories and sub-skills
- **`skills/skill-levels.ts`** - Experience-based skill levels
- **`skills/semantic-matching.ts`** - Matching algorithms and terminology

### **📁 Roles and Behaviors**
- **`roles/gigfolio-coach.ts`** - Onboarding assistant role
- **`roles/shift-concierge.ts`** - Gig management assistant role
- **`roles/role-metrics.ts`** - Success metrics and KPIs

### **📁 System Prompts and Instructions**
- **`prompts/system-prompts.ts`** - Base and context-specific prompts
- **`prompts/prompt-templates.ts`** - Reusable prompt templates
- **`prompts/ai-behavior.ts`** - AI behavior instructions
- **`prompts/prompt-builders.ts`** - Prompt building utilities

### **📁 Central Export**
- **`index.ts`** - Central export file for all modules

## 🚀 **Benefits of the New Structure**

1. **Single Responsibility**: Each file has one clear purpose
2. **Easy Navigation**: Find content quickly in logical locations
3. **Maintainability**: Update specific content without affecting others
4. **Scalability**: Easy to add new content categories
5. **Team Collaboration**: Multiple developers can work on different modules
6. **Type Safety**: Full TypeScript support with IntelliSense
7. **Performance**: No runtime document processing

## 📚 **Usage Examples**

### **Basic Import from Central Index**
```typescript
import { 
  ETHICAL_STANDARDS,
  SKILL_CATEGORIES,
  GIGFOLIO_COACH_CONTENT,
  buildContextPrompt 
} from '@/app/components/shared/ChatAI';
```

### **Direct Module Import**
```typescript
import { CORE_VALUES } from '@/app/components/shared/ChatAI/core/core-values';
import { SKILL_LEVELS } from '@/app/components/shared/ChatAI/skills/skill-levels';
import { ROLE_METRICS } from '@/app/components/shared/ChatAI/roles/role-metrics';
```

### **Context-Specific Prompts**
```typescript
import { CONTEXT_PROMPTS } from '@/app/components/shared/ChatAI';

const onboardingPrompt = CONTEXT_PROMPTS.onboarding;
const gigCreationPrompt = CONTEXT_PROMPTS.gigCreation;
```

### **Role-Specific Content**
```typescript
import { GIGFOLIO_COACH_BEHAVIOR } from '@/app/components/shared/ChatAI';

const coachBehavior = GIGFOLIO_COACH_BEHAVIOR;
const coachTone = GIGFOLIO_COACH_BEHAVIOR.tone;
```

### **Building Dynamic Prompts**
```typescript
import { buildContextPrompt, buildRolePrompt } from '@/app/components/shared/ChatAI';

// Context-aware prompt
const prompt = buildContextPrompt('onboarding', 'Help me create my profile');

// Role-specific prompt
const rolePrompt = buildRolePrompt('gigfolioCoach', 'Profile creation', 'How do I start?');
```

### **Skills and Taxonomy**
```typescript
import { SKILL_CATEGORIES, SKILL_LEVELS } from '@/app/components/shared/ChatAI';

const bartendingSkills = SKILL_CATEGORIES.foodBeverage.bartending;
const expertLevel = SKILL_LEVELS.expert;
```

## 🔄 **Migration from Old Structure**

The old structure has been completely reorganized. Here's how to migrate:

**Old Way:**
```typescript
import { MASTER_PROMPT_CONTENT } from '@/lib/firebase/ableAIDocuments';
```

**New Way:**
```typescript
// From central index
import { ETHICAL_STANDARDS } from '@/app/components/shared/ChatAI';

// Or directly from specific module
import { ETHICAL_STANDARDS } from '@/app/components/shared/ChatAI/core/ethical-standards';
```

## 📝 **Adding New Content**

To add new content to the organized structure:

1. **Identify the appropriate module** based on content type
2. **Add the content** to the relevant file
3. **Export it** from the file
4. **Re-export it** in `index.ts` if needed globally
5. **Update this README** to document the new content

### **Example: Adding New Ethical Guidelines**
```typescript
// In core/ethical-standards.ts
export const NEW_ETHICAL_GUIDELINES = {
  // New content here
};

// In index.ts
export { NEW_ETHICAL_GUIDELINES } from './core/ethical-standards';
```

## 🎯 **Module-Specific Features**

### **Core Values (`core/`)**
- Platform fundamental principles
- Value implementation strategies
- Ethical foundation

### **Skills (`skills/`)**
- Detailed skill breakdowns
- Experience level definitions
- Semantic matching algorithms
- Industry terminology mapping

### **Roles (`roles/`)**
- AI assistant role definitions
- Behavior guidelines
- Success metrics and KPIs
- Performance tracking

### **Prompts (`prompts/`)**
- System prompt templates
- Context-aware prompt building
- AI behavior instructions
- Response quality standards

## 🔧 **Development Workflow**

1. **Content Updates**: Modify content in specific module files
2. **Export Management**: Update exports in `index.ts` as needed
3. **Testing**: Verify imports work correctly
4. **Documentation**: Update README for new content
5. **Deployment**: Deploy updated modules

## 📊 **Performance Benefits**

- **Faster Imports**: Import only what you need
- **Tree Shaking**: Unused code eliminated during build
- **Memory Efficiency**: No runtime document processing
- **Bundle Optimization**: Better code splitting and optimization

## 🚨 **Important Notes**

- **Backward Compatibility**: The old `ableAIDocuments.ts` still imports from these modules
- **Type Safety**: All exports are fully typed for better development experience
- **Maintenance**: Update content in the appropriate module files, not in the old structure
- **Testing**: Always test imports after making changes

This new organized structure makes it much easier to maintain, extend, and collaborate on the Able AI guidelines while keeping everything performant and scalable.
