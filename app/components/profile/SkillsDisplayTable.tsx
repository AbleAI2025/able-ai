import React from 'react';
import PillBadge from '../shared/PillBadge';
import styles from './SkillsDisplayTable.module.css';

interface SkillItem {
  name: string;
  ableGigs?: number | string;
  experience?: string;
  eph?: number | string;
}

interface SkillsDisplayTableProps {
  skills: SkillItem[];
  title?: string;
  isSelfView?: boolean;
  handleAddSkill?: () => void;
  handleSkillDetails: (name: string) => void; // Optional handler for skill details 
}

const SkillsDisplayTable: React.FC<SkillsDisplayTableProps> = ({
  skills,
  isSelfView,
  handleAddSkill,
  handleSkillDetails,
}) => {
  const hasAbleGigs = skills.length > 0 && skills[0].ableGigs !== undefined;
  const hasExperience = skills.length > 0 && skills[0].experience !== undefined;
  const hasEph = skills.length > 0 && skills[0].eph !== undefined;

  

  return (
    <div className={styles.skillsCard}>
      <table className={styles.skillsTable}>
        <thead>
          <tr>
            <th className={styles.skillNameHeader}>Skills:</th>
            {hasAbleGigs && <th>Able gigs:</th>}
            {hasExperience && <th>Experience:</th>}
            {hasEph && <th>£ph</th>}
          </tr>
        </thead>
        <tbody>
          {skills.map((skill, index) => (
              <tr key={index}>
                <td>
                  <PillBadge className={styles.skill} text={skill.name} variant="dark" handleSkillDetails={handleSkillDetails}/>
                </td>
                {hasAbleGigs && <td>{skill.ableGigs}</td>}
                {hasExperience && <td>{skill.experience}</td>}
                {hasEph && <td>£{skill.eph}</td>}
              </tr>
          ))}
          <tr>
            {isSelfView && <td><button className={styles.addSkill} onClick={handleAddSkill}>+ add skill</button></td>}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default SkillsDisplayTable; 