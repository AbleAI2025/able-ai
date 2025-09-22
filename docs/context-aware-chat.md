# Context-Aware Chat with Able

## Overview

The context-aware chat feature allows Able AI to provide more relevant and helpful assistance based on the current page the user is on. When a user clicks "Chat with Able" from any page, the system automatically detects the page context and provides tailored assistance.

## How It Works

### 1. Context Detection

The system uses the `detectPageContext()` function to analyze the current URL and determine:
- **Page Type**: profile, gigs, settings, calendar, notifications, etc.
- **Section**: specific area within the page (edit, view, create, etc.)
- **Action**: what the user is currently doing (editing, browsing, configuring, etc.)
- **Description**: human-readable description of the current context
- **Available Actions**: list of actions the user can perform on this page

### 2. Context Passing

When a user clicks "Chat with Able", the `ScreenHeaderWithBack` component:
1. Detects the current page context
2. Encodes the context as URL parameters
3. Navigates to the AI chat page with context information

### 3. Context Processing

The AI chat page:
1. Parses context from URL parameters
2. Generates a context-aware welcome message
3. Uses context to provide more relevant AI responses

## Supported Page Types

| Page Type | Description | Example Actions |
|-----------|-------------|-----------------|
| `profile` | Profile management | Update info, Add skills, Upload photo |
| `gigs` | Gig-related pages | Search gigs, Create gig, Apply to gigs |
| `settings` | Account settings | Update preferences, Change password |
| `calendar` | Schedule management | Set availability, View upcoming gigs |
| `notifications` | Notification center | Mark as read, Reply to messages |
| `offers` | Gig offers | Accept offers, View details |
| `delegate` | Gig delegation | Select worker, Set terms |
| `amend` | Gig amendments | Update details, Modify schedule |
| `report` | Issue reporting | Describe issue, Submit report |
| `home` | Dashboard | View activity, Quick actions |

## Implementation Details

### Context Detection Utility (`lib/context-detection.ts`)

```typescript
interface PageContext {
  pageType: 'profile' | 'gigs' | 'settings' | 'calendar' | 'notifications' | 'offers' | 'delegate' | 'amend' | 'report' | 'home' | 'unknown';
  section?: string;
  action?: string;
  data?: Record<string, any>;
  description: string;
}
```

### URL Parameter Format

Context is passed via URL parameters:
```
/user/123/able-ai?pageType=profile&section=edit&action=editing&description=You%20are%20editing%20your%20profile&availableActions=Update%20info,Add%20skills
```

### AI Prompt Enhancement

The AI receives context-aware prompts that include:
- Current page context
- Available actions
- User's specific message
- Relevant guidance for the current page

## Example Usage

### Profile Editing Page
When a user is on `/user/123/profile/edit` and clicks "Chat with Able":

**Context Detected:**
- Page Type: `profile`
- Section: `edit`
- Action: `editing`
- Description: "You are on the profile editing page where you can update your personal information, skills, and preferences."

**AI Welcome Message:**
```
Hello! I'm Able, your AI assistant! 🤖 

I can see you're currently editing on the profile page. You are on the profile editing page where you can update your personal information, skills, and preferences.

I'm here to help you with tasks related to this page, such as:
• Update personal info
• Add/remove skills
• Set availability
• Upload profile photo

What would you like help with?
```

### Gig Browsing Page
When a user is on `/user/123/gigs/browse` and clicks "Chat with Able":

**Context Detected:**
- Page Type: `gigs`
- Section: `browse`
- Action: `browsing`
- Description: "You are browsing available gigs to find work opportunities that match your skills and availability."

**AI Welcome Message:**
```
Hello! I'm Able, your AI assistant! 🤖 

I can see you're currently browsing on the gigs page. You are browsing available gigs to find work opportunities that match your skills and availability.

I'm here to help you with tasks related to this page, such as:
• Search gigs
• Filter by location
• Filter by pay rate
• Apply to gigs
• Save gigs

What would you like help with?
```

## Benefits

1. **Relevant Assistance**: AI provides context-specific help based on the current page
2. **Better User Experience**: Users get immediate, relevant guidance
3. **Reduced Confusion**: AI understands what the user is trying to accomplish
4. **Actionable Suggestions**: AI can suggest specific actions available on the current page
5. **Improved Efficiency**: Users don't need to explain their current context

## Future Enhancements

- **Dynamic Context**: Include more specific page data (form fields, selected items, etc.)
- **User History**: Consider user's recent actions and preferences
- **Smart Suggestions**: Proactively suggest relevant actions based on context
- **Multi-page Context**: Track context across page transitions
- **Custom Context**: Allow pages to provide custom context information
