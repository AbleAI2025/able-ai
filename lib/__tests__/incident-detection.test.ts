/**
 * Test file for incident detection functionality
 */

import { detectIncident, generateIncidentId, getIncidentSeverity } from '../incident-detection';

describe('Incident Detection', () => {
  describe('detectIncident', () => {
    it('should detect harassment incidents', () => {
      const testCases = [
        'I am being harassed at work',
        'My boss keeps making inappropriate comments',
        'I feel uncomfortable and harassed',
        'This person is stalking me',
        'I am experiencing sexual harassment'
      ];

      testCases.forEach(input => {
        const result = detectIncident(input);
        expect(result.isIncident).toBe(true);
        expect(result.incidentType).toBe('harassment');
        expect(result.confidence).toBeGreaterThan(0.4);
      });
    });

    it('should detect unsafe work conditions', () => {
      const testCases = [
        'The workplace is unsafe',
        'I got injured because there was no safety equipment',
        'This is a dangerous environment',
        'There are safety hazards everywhere',
        'I am concerned about my safety'
      ];

      testCases.forEach(input => {
        const result = detectIncident(input);
        expect(result.isIncident).toBe(true);
        expect(result.incidentType).toBe('unsafe_work_conditions');
        expect(result.confidence).toBeGreaterThan(0.4);
      });
    });

    it('should detect discrimination incidents', () => {
      const testCases = [
        'I am being discriminated against',
        'They are racist towards me',
        'I was fired because of my age',
        'This is sexist behavior',
        'I am treated unfairly because of my gender'
      ];

      testCases.forEach(input => {
        const result = detectIncident(input);
        expect(result.isIncident).toBe(true);
        expect(result.incidentType).toBe('discrimination');
        expect(result.confidence).toBeGreaterThan(0.4);
      });
    });

    it('should detect threats', () => {
      const testCases = [
        'I am being threatened',
        'They threatened to hurt me',
        'I received threats of violence',
        'They are threatening to fire me',
        'I feel threatened and scared'
      ];

      testCases.forEach(input => {
        const result = detectIncident(input);
        expect(result.isIncident).toBe(true);
        expect(result.incidentType).toBe('threats');
        expect(result.confidence).toBeGreaterThan(0.4);
      });
    });

    it('should not detect incidents in normal conversation', () => {
      const testCases = [
        'Hello, how are you?',
        'I need help finding gigs',
        'What time is the event?',
        'Can you help me with my profile?',
        'I am looking for work opportunities'
      ];

      testCases.forEach(input => {
        const result = detectIncident(input);
        expect(result.isIncident).toBe(false);
        expect(result.incidentType).toBeNull();
      });
    });

    it('should return appropriate confidence scores', () => {
      const result = detectIncident('I am being sexually harassed at work');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.detectedKeywords.length).toBeGreaterThan(0);
    });
  });

  describe('generateIncidentId', () => {
    it('should generate unique incident IDs', () => {
      const id1 = generateIncidentId();
      const id2 = generateIncidentId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^INC-[a-z0-9]+-[a-z0-9]+$/i);
      expect(id2).toMatch(/^INC-[a-z0-9]+-[a-z0-9]+$/i);
    });
  });

  describe('getIncidentSeverity', () => {
    it('should return appropriate severity levels', () => {
      expect(getIncidentSeverity('harassment', 0.9)).toBe('CRITICAL');
      expect(getIncidentSeverity('threats', 0.8)).toBe('CRITICAL');
      expect(getIncidentSeverity('discrimination', 0.7)).toBe('HIGH');
      expect(getIncidentSeverity('unsafe_work_conditions', 0.6)).toBe('HIGH');
      expect(getIncidentSeverity('inappropriate_behavior', 0.5)).toBe('MEDIUM');
      expect(getIncidentSeverity('safety_concern', 0.4)).toBe('LOW');
    });
  });
});
