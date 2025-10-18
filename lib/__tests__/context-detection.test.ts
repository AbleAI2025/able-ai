/**
 * Tests for context detection utility
 */

import { detectPageContext, generateContextAwarePrompt, parseContextFromURL } from '../context-detection';

describe('Context Detection', () => {
  describe('detectPageContext', () => {
    it('should detect profile edit page context', () => {
      const context = detectPageContext('/user/123/profile/edit');
      expect(context.pageType).toBe('profile');
      expect(context.section).toBe('edit');
      expect(context.action).toBe('editing');
      expect(context.description).toContain('profile editing page');
    });

    it('should detect gigs browse page context', () => {
      const context = detectPageContext('/user/123/gigs/browse');
      expect(context.pageType).toBe('gigs');
      expect(context.section).toBe('browse');
      expect(context.action).toBe('browsing');
      expect(context.description).toContain('browsing available gigs');
    });

    it('should detect settings page context', () => {
      const context = detectPageContext('/user/123/settings');
      expect(context.pageType).toBe('settings');
      expect(context.section).toBe('general');
      expect(context.action).toBe('configuring');
      expect(context.description).toContain('settings page');
    });

    it('should detect calendar page context', () => {
      const context = detectPageContext('/user/123/calendar');
      expect(context.pageType).toBe('calendar');
      expect(context.section).toBe('view');
      expect(context.action).toBe('scheduling');
      expect(context.description).toContain('calendar');
    });

    it('should detect home/dashboard context', () => {
      const context = detectPageContext('/user/123/worker');
      expect(context.pageType).toBe('home');
      expect(context.section).toBe('dashboard');
      expect(context.action).toBe('overview');
      expect(context.description).toContain('dashboard');
    });

    it('should handle unknown paths', () => {
      const context = detectPageContext('/some/unknown/path');
      expect(context.pageType).toBe('unknown');
      expect(context.section).toBe('general');
    });
  });

  describe('generateContextAwarePrompt', () => {
    it('should generate context-aware prompt', () => {
      const context = {
        pageType: 'profile' as const,
        section: 'edit',
        action: 'editing',
        description: 'You are editing your profile',
        data: {
          availableActions: ['Update info', 'Add skills']
        }
      };
      
      const prompt = generateContextAwarePrompt(context, 'How do I add a skill?');
      expect(prompt).toContain('profile page');
      expect(prompt).toContain('editing');
      expect(prompt).toContain('Update info');
      expect(prompt).toContain('How do I add a skill?');
    });
  });

  describe('parseContextFromURL', () => {
    it('should parse context from URL search params', () => {
      const searchParams = new URLSearchParams({
        pageType: 'gigs',
        section: 'browse',
        action: 'browsing',
        description: 'You are browsing gigs',
        availableActions: 'Search gigs,Filter gigs'
      });
      
      const context = parseContextFromURL(searchParams);
      expect(context.pageType).toBe('gigs');
      expect(context.section).toBe('browse');
      expect(context.action).toBe('browsing');
      expect(context.description).toBe('You are browsing gigs');
      expect(context.data?.availableActions).toEqual(['Search gigs', 'Filter gigs']);
    });
  });
});
