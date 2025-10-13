/**
 * Context detection utility for Able AI chat
 * Detects the current page context to provide relevant AI assistance
 */

export interface PageContext {
  pageType: 'profile' | 'gigs' | 'settings' | 'calendar' | 'worker-calendar' | 'notifications' | 'offers' | 'delegate' | 'amend' | 'report' | 'home' | 'unknown';
  section?: string;
  action?: string;
  data?: Record<string, any>;
  description: string;
  contextId?: string; // Short context identifier for URLs
}

/**
 * Detects the current page context based on the URL pathname
 */
export function detectPageContext(pathname: string): PageContext {
  // Remove query parameters and normalize path
  const cleanPath = pathname.split('?')[0];
  
  // Profile pages
  if (cleanPath.includes('/profile')) {
    if (cleanPath.includes('/edit')) {
      return {
        pageType: 'profile',
        section: 'edit',
        action: 'editing',
        description: 'You are on the profile editing page where you can update your personal information, skills, and preferences.',
        contextId: 'profile-edit',
        data: {
          availableActions: ['Update personal info', 'Add/remove skills', 'Set availability', 'Upload profile photo']
        }
      };
    }
    return {
      pageType: 'profile',
      section: 'view',
      action: 'viewing',
      description: 'You are viewing your profile page where you can see your personal information and settings.',
      contextId: 'profile-view',
      data: {
        availableActions: ['Edit profile', 'View settings', 'Check notifications']
      }
    };
  }

  // Gigs pages
  if (cleanPath.includes('/gigs')) {
    // Individual gig page - extract gigId from path
    const gigIdMatch = cleanPath.match(/\/gigs\/([^\/]+)/);
    if (gigIdMatch) {
      const gigId = gigIdMatch[1];
      const isWorkerPage = cleanPath.includes('/worker/');
      const isBuyerPage = cleanPath.includes('/buyer/');
      
      if (isWorkerPage) {
        return {
          pageType: 'gigs',
          section: 'view-worker',
          action: 'viewing',
          description: `You are viewing a specific gig (ID: ${gigId}) as a worker. You can see gig details, apply if it's an offer, or manage your application.`,
          contextId: 'gig-view-worker',
          data: {
            gigId: gigId,
            availableActions: ['View gig details', 'Apply to gig', 'Save gig', 'Contact buyer', 'Report issue'],
            gigContext: {
              type: 'worker-view',
              gigId: gigId
            }
          }
        };
      } else if (isBuyerPage) {
        return {
          pageType: 'gigs',
          section: 'view-buyer',
          action: 'managing',
          description: `You are viewing your own gig (ID: ${gigId}) as a buyer. You can manage applications, edit details, or monitor progress.`,
          contextId: 'gig-view-buyer',
          data: {
            gigId: gigId,
            availableActions: ['View applications', 'Edit gig details', 'Manage workers', 'Close gig', 'Extend deadline'],
            gigContext: {
              type: 'buyer-view',
              gigId: gigId
            }
          }
        };
      } else {
        // General gig page without role context
        return {
          pageType: 'gigs',
          section: 'view',
          action: 'viewing',
          description: `You are viewing a specific gig (ID: ${gigId}). You can see gig details and take appropriate actions based on your role.`,
          contextId: 'gig-view',
          data: {
            gigId: gigId,
            availableActions: ['View gig details', 'Apply to gig', 'Contact buyer', 'Report issue'],
            gigContext: {
              type: 'general-view',
              gigId: gigId
            }
          }
        };
      }
    }
    
    if (cleanPath.includes('/browse')) {
      return {
        pageType: 'gigs',
        section: 'browse',
        action: 'browsing',
        description: 'You are browsing available gigs to find work opportunities that match your skills and availability.',
        contextId: 'gigs-browse',
        data: {
          availableActions: ['Search gigs', 'Filter by location', 'Filter by pay rate', 'Apply to gigs', 'Save gigs']
        }
      };
    }
    if (cleanPath.includes('/new')) {
      return {
        pageType: 'gigs',
        section: 'create',
        action: 'creating',
        description: 'You are creating a new gig posting to hire workers for a specific task or project.',
        contextId: 'gigs-create',
        data: {
          availableActions: ['Set gig details', 'Choose location', 'Set pay rate', 'Set schedule', 'Add requirements']
        }
      };
    }
    if (cleanPath.includes('/offers')) {
      return {
        pageType: 'offers',
        section: 'view',
        action: 'viewing',
        description: 'You are viewing gig offers that have been sent to you by buyers.',
        contextId: 'gigs-offers',
        data: {
          availableActions: ['Accept offers', 'Decline offers', 'View gig details', 'Contact buyer']
        }
      };
    }
    return {
      pageType: 'gigs',
      section: 'general',
      action: 'managing',
      description: 'You are managing gigs - this could include viewing, editing, or organizing your gig-related activities.',
      contextId: 'gigs-manage',
      data: {
        availableActions: ['View gigs', 'Create new gig', 'Manage existing gigs']
      }
    };
  }

  // Settings pages
  if (cleanPath.includes('/settings')) {
    return {
      pageType: 'settings',
      section: 'general',
      action: 'configuring',
      description: 'You are in the settings page where you can configure your account preferences, notifications, and platform settings.',
      contextId: 'settings',
      data: {
        availableActions: ['Update preferences', 'Manage notifications', 'Change password', 'Update payment info', 'Privacy settings']
      }
    };
  }

  // Calendar pages
  if (cleanPath.includes('/calendar')) {
    return {
      pageType: 'calendar',
      section: 'view',
      action: 'scheduling',
      description: 'You are viewing your calendar to manage your schedule, availability, and upcoming gigs.',
      contextId: 'calendar',
      data: {
        availableActions: ['Set availability', 'View upcoming gigs', 'Block time slots', 'Schedule meetings']
      }
    };
  }

  // Worker availability pages
  if (cleanPath.includes('/availability')) {
    return {
      pageType: 'worker-calendar',
      section: 'availability',
      action: 'managing',
      description: 'You are managing your availability schedule to show when you are available for gigs.',
      contextId: 'worker-calendar',
      data: {
        availableActions: ['Set available times', 'Edit availability slots', 'Create recurring availability', 'Clear all availability', 'View availability calendar']
      }
    };
  }

  // Notifications pages
  if (cleanPath.includes('/notifications')) {
    return {
      pageType: 'notifications',
      section: 'view',
      action: 'reviewing',
      description: 'You are reviewing your notifications to stay updated on gig offers, messages, and platform updates.',
      contextId: 'notifications',
      data: {
        availableActions: ['Mark as read', 'Reply to messages', 'View gig offers', 'Update notification preferences']
      }
    };
  }

  // Delegate pages
  if (cleanPath.includes('/delegate')) {
    return {
      pageType: 'delegate',
      section: 'gig',
      action: 'delegating',
      description: 'You are delegating a gig to another worker, transferring responsibility for a specific task.',
      contextId: 'delegate',
      data: {
        availableActions: ['Select worker', 'Set delegation terms', 'Send invitation', 'Monitor progress']
      }
    };
  }

  // Amend pages
  if (cleanPath.includes('/amend')) {
    return {
      pageType: 'amend',
      section: 'gig',
      action: 'modifying',
      description: 'You are amending or modifying an existing gig, updating its details or terms.',
      contextId: 'amend',
      data: {
        availableActions: ['Update gig details', 'Change schedule', 'Modify pay rate', 'Add requirements', 'Submit changes']
      }
    };
  }

  // Report issue pages
  if (cleanPath.includes('/report-issue')) {
    return {
      pageType: 'report',
      section: 'issue',
      action: 'reporting',
      description: 'You are reporting an issue or problem with a gig, worker, or platform functionality.',
      contextId: 'report-issue',
      data: {
        availableActions: ['Describe the issue', 'Select issue type', 'Provide evidence', 'Submit report', 'Contact support']
      }
    };
  }

  // Home/Dashboard pages
  if (cleanPath.includes('/worker') || cleanPath.includes('/buyer') || cleanPath.endsWith('/user/[userId]')) {
    return {
      pageType: 'home',
      section: 'dashboard',
      action: 'overview',
      description: 'You are on your main dashboard where you can see an overview of your activities, recent gigs, and quick actions.',
      contextId: 'dashboard',
      data: {
        availableActions: ['View recent activity', 'Create new gig', 'Browse opportunities', 'Check notifications', 'Update profile']
      }
    };
  }

  // Default/unknown context
  return {
    pageType: 'unknown',
    section: 'general',
    action: 'browsing',
    description: 'You are on a general page of the platform. I can help you navigate or find what you need.',
    contextId: 'general',
    data: {
      availableActions: ['Navigate to main areas', 'Search for features', 'Get help with platform']
    }
  };
}

/**
 * Generates a context-aware prompt for the AI based on the current page
 */
export function generateContextAwarePrompt(context: PageContext, userMessage: string): string {
  const basePrompt = `You are Able, an AI assistant for a gig platform. The user is currently on a ${context.pageType} page where they are ${context.action}. 

Current context: ${context.description}

Available actions on this page: ${context.data?.availableActions?.join(', ') || 'General platform assistance'}

User message: "${userMessage}"

Please provide helpful, context-aware assistance based on what the user is trying to do on this specific page. Focus on actions and guidance relevant to their current location and activity.`;

  return basePrompt;
}

/**
 * Gets context data that can be passed via URL parameters
 */
export function getContextForURL(context: PageContext): Record<string, string> {
  const baseContext: Record<string, string> = {
    pageType: context.pageType,
    section: context.section || '',
    action: context.action || '',
    description: context.description
  };

  // Add gigId if present in context data
  if (context.data?.gigId) {
    baseContext.gigId = context.data.gigId;
  }

  return baseContext;
}

/**
 * Gets context from a short context identifier
 */
export function getContextFromId(contextId: string): PageContext | null {
  const contextMap: Record<string, PageContext> = {
    'profile-edit': {
      pageType: 'profile',
      section: 'edit',
      action: 'editing',
      description: 'You are on the profile editing page where you can update your personal information, skills, and preferences.',
      contextId: 'profile-edit',
      data: {
        availableActions: ['Update personal info', 'Add/remove skills', 'Set availability', 'Upload profile photo']
      }
    },
    'profile-view': {
      pageType: 'profile',
      section: 'view',
      action: 'viewing',
      description: 'You are viewing your profile page where you can see your personal information and settings.',
      contextId: 'profile-view',
      data: {
        availableActions: ['Edit profile', 'View settings', 'Check notifications']
      }
    },
    'gigs-browse': {
      pageType: 'gigs',
      section: 'browse',
      action: 'browsing',
      description: 'You are browsing available gigs to find work opportunities that match your skills and availability.',
      contextId: 'gigs-browse',
      data: {
        availableActions: ['Search gigs', 'Filter by location', 'Filter by pay rate', 'Apply to gigs', 'Save gigs']
      }
    },
    'gigs-create': {
      pageType: 'gigs',
      section: 'create',
      action: 'creating',
      description: 'You are creating a new gig posting to hire workers for a specific task or project.',
      contextId: 'gigs-create',
      data: {
        availableActions: ['Set gig details', 'Choose location', 'Set pay rate', 'Set schedule', 'Add requirements']
      }
    },
    'gigs-offers': {
      pageType: 'offers',
      section: 'view',
      action: 'viewing',
      description: 'You are viewing gig offers that have been sent to you by buyers.',
      contextId: 'gigs-offers',
      data: {
        availableActions: ['Accept offers', 'Decline offers', 'View gig details', 'Contact buyer']
      }
    },
    'gigs-manage': {
      pageType: 'gigs',
      section: 'general',
      action: 'managing',
      description: 'You are managing gigs - this could include viewing, editing, or organizing your gig-related activities.',
      contextId: 'gigs-manage',
      data: {
        availableActions: ['View gigs', 'Create new gig', 'Manage existing gigs']
      }
    },
    'gig-view-worker': {
      pageType: 'gigs',
      section: 'view-worker',
      action: 'viewing',
      description: 'You are viewing a specific gig as a worker. You can see gig details, apply if it\'s an offer, or manage your application.',
      contextId: 'gig-view-worker',
      data: {
        availableActions: ['View gig details', 'Apply to gig', 'Save gig', 'Contact buyer', 'Report issue']
      }
    },
    'gig-view-buyer': {
      pageType: 'gigs',
      section: 'view-buyer',
      action: 'managing',
      description: 'You are viewing your own gig as a buyer. You can manage applications, edit details, or monitor progress.',
      contextId: 'gig-view-buyer',
      data: {
        availableActions: ['View applications', 'Edit gig details', 'Manage workers', 'Close gig', 'Extend deadline']
      }
    },
    'gig-view': {
      pageType: 'gigs',
      section: 'view',
      action: 'viewing',
      description: 'You are viewing a specific gig. You can see gig details and take appropriate actions based on your role.',
      contextId: 'gig-view',
      data: {
        availableActions: ['View gig details', 'Apply to gig', 'Contact buyer', 'Report issue']
      }
    },
    'settings': {
      pageType: 'settings',
      section: 'general',
      action: 'configuring',
      description: 'You are in the settings page where you can configure your account preferences, notifications, and platform settings.',
      contextId: 'settings',
      data: {
        availableActions: ['Update preferences', 'Manage notifications', 'Change password', 'Update payment info', 'Privacy settings']
      }
    },
    'calendar': {
      pageType: 'calendar',
      section: 'view',
      action: 'scheduling',
      description: 'You are viewing your calendar to manage your schedule, availability, and upcoming gigs.',
      contextId: 'calendar',
      data: {
        availableActions: ['Set availability', 'View upcoming gigs', 'Block time slots', 'Schedule meetings']
      }
    },
    'worker-calendar': {
      pageType: 'worker-calendar',
      section: 'availability',
      action: 'managing',
      description: 'You are managing your availability schedule to show when you are available for gigs.',
      contextId: 'worker-calendar',
      data: {
        availableActions: ['Set available times', 'Edit availability slots', 'Create recurring availability', 'Clear all availability', 'View availability calendar']
      }
    },
    'notifications': {
      pageType: 'notifications',
      section: 'view',
      action: 'reviewing',
      description: 'You are reviewing your notifications to stay updated on gig offers, messages, and platform updates.',
      contextId: 'notifications',
      data: {
        availableActions: ['Mark as read', 'Reply to messages', 'View gig offers', 'Update notification preferences']
      }
    },
    'delegate': {
      pageType: 'delegate',
      section: 'gig',
      action: 'delegating',
      description: 'You are delegating a gig to another worker, transferring responsibility for a specific task.',
      contextId: 'delegate',
      data: {
        availableActions: ['Select worker', 'Set delegation terms', 'Send invitation', 'Monitor progress']
      }
    },
    'amend': {
      pageType: 'amend',
      section: 'gig',
      action: 'modifying',
      description: 'You are amending or modifying an existing gig, updating its details or terms.',
      contextId: 'amend',
      data: {
        availableActions: ['Update gig details', 'Change schedule', 'Modify pay rate', 'Add requirements', 'Submit changes']
      }
    },
    'report-issue': {
      pageType: 'report',
      section: 'issue',
      action: 'reporting',
      description: 'You are reporting an issue or problem with a gig, worker, or platform functionality.',
      contextId: 'report-issue',
      data: {
        availableActions: ['Describe the issue', 'Select issue type', 'Provide evidence', 'Submit report', 'Contact support']
      }
    },
    'dashboard': {
      pageType: 'home',
      section: 'dashboard',
      action: 'overview',
      description: 'You are on your main dashboard where you can see an overview of your activities, recent gigs, and quick actions.',
      contextId: 'dashboard',
      data: {
        availableActions: ['View recent activity', 'Create new gig', 'Browse opportunities', 'Check notifications', 'Update profile']
      }
    },
    'general': {
      pageType: 'unknown',
      section: 'general',
      action: 'browsing',
      description: 'You are on a general page of the platform. I can help you navigate or find what you need.',
      contextId: 'general',
      data: {
        availableActions: ['Navigate to main areas', 'Search for features', 'Get help with platform']
      }
    }
  };

  return contextMap[contextId] || null;
}

/**
 * Parses context from URL parameters (legacy support)
 */
export function parseContextFromURL(searchParams: URLSearchParams): PageContext {
  // Check for new simplified context parameter
  const contextId = searchParams.get('context');
  if (contextId) {
    const context = getContextFromId(contextId);
    if (context) {
      // Add gigId if present in URL parameters
      const gigId = searchParams.get('gigId');
      if (gigId && context.data) {
        context.data.gigId = gigId;
        context.data.gigContext = {
          type: context.data.gigContext?.type || 'general-view',
          gigId: gigId
        };
      }
      return context;
    }
  }

  // Fallback to legacy parameter parsing
  const gigId = searchParams.get('gigId');
  const data: Record<string, any> = {
    availableActions: searchParams.get('availableActions')?.split(',') || []
  };
  
  if (gigId) {
    data.gigId = gigId;
    data.gigContext = {
      type: 'general-view',
      gigId: gigId
    };
  }

  return {
    pageType: (searchParams.get('pageType') as PageContext['pageType']) || 'unknown',
    section: searchParams.get('section') || undefined,
    action: searchParams.get('action') || undefined,
    description: searchParams.get('description') || 'General platform assistance',
    data: data
  };
}
