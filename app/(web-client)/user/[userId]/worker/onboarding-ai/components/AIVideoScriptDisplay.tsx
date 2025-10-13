import React, { useState, useEffect } from 'react';
import styles from '../OnboardingAIPage.module.css';
import { generateAIVideoScript } from '../utils/ai-systems/ai-utils';

interface AIVideoScriptDisplayProps {
  formData: FormData;
  ai: any;
}

/**
 * AI Video Script Display Component
 */
const AIVideoScriptDisplay: React.FC<AIVideoScriptDisplayProps> = ({ formData, ai }) => {
  const [script, setScript] = useState<string>('Generating your personalized script...');
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    const generateScript = async () => {
      try {
        setIsGenerating(true);
        const aiScript = await generateAIVideoScript(formData, ai);
        setScript(aiScript);
      } catch (error) {
        setScript('Hi my name is [Name] I am a [job title]. I love [skills] and bring a sense of fun to every shift. I trained at [experience] and my favourite [skill] is [specific skill]. I am great with [strengths] - i hope we can work together');
      } finally {
        setIsGenerating(false);
      }
    };
    generateScript();
  }, [formData, ai]);

  return (
    <div className={styles.aiVideoScriptContainer}>
      <div className={styles.aiVideoScriptTitle}>
        🎬 AI-Generated Video Script
      </div>
      <div className={styles.aiVideoScriptContent}>
        {isGenerating ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            {script}
          </div>
        ) : (
          script
        )}
      </div>
      <div className={styles.aiVideoScriptFooter}>
        💡 This script is personalized based on your profile. Feel free to modify it or use it as inspiration!
      </div>
    </div>
  );
};

export default AIVideoScriptDisplay;
