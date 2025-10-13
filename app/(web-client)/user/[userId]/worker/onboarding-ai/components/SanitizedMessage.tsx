import React from 'react';
import styles from '../OnboardingAIPage.module.css';
import ValidationButtons from './ValidationButtons';

type Props = {
  naturalSummary: string;
  isCompleted: boolean;
  confirmClicked: boolean;
  isReformulatingThisField: boolean;
  fieldName: string;
  sanitizedValue: any;
  onConfirm: (field: string, value: any) => void;
  onReformulate: (field: string) => void;
};

const SanitizedMessage: React.FC<Props> = ({
  naturalSummary,
  isCompleted,
  confirmClicked,
  isReformulatingThisField,
  fieldName,
  sanitizedValue,
  onConfirm,
  onReformulate,
}) => (
  <div>
    <div style={{ 
      marginBottom: '16px', 
      color: '#ffffff', 
      fontWeight: 600, 
      fontSize: '16px', 
      lineHeight: 1.4 
    }}>
      {naturalSummary}
    </div>
    <ValidationButtons
      isCompleted={isCompleted}
      confirmClicked={confirmClicked}
      isReformulatingThisField={isReformulatingThisField}
      fieldName={fieldName}
      sanitizedValue={sanitizedValue}
      onConfirm={onConfirm}
      onReformulate={onReformulate}
    />
  </div>
);

export default SanitizedMessage;


