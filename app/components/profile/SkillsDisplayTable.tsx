import React, { useState } from "react";
import PillBadge from "../shared/PillBadge";
import styles from "./SkillsDisplayTable.module.css";
import { Skill } from "@/app/types/workerProfileTypes";
import AddSkillModal from "./createSkillModal";

interface SkillsDisplayTableProps {
  skills?: Skill[];
  title?: string;
  isSelfView?: boolean;
  handleAddSkill?: () => void;
  handleSkillDetails: (id: string) => void;
  token: string;
  fetchUserProfile: (token: string) => void;
}

const SkillsDisplayTable: React.FC<SkillsDisplayTableProps> = ({
  skills,
  isSelfView,
  handleSkillDetails,
  fetchUserProfile,
  token,
}) => {
  const hasAbleGigs = !!skills?.[0]?.ableGigs;
  const hasExperience = skills?.[0]?.experienceYears !== undefined;
  const hasEph = skills?.[0]?.agreedRate !== undefined;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddSkill = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleSkillCreated = () => {
  };

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
          {skills
            ? skills.map((skill, index) => (
                <tr key={index}>
                  <td>
                    <PillBadge
                      className={styles.skill}
                      id={skill.id}
                      text={skill.name}
                      variant="dark"
                      handleSkillDetails={handleSkillDetails}
                    />
                  </td>
                  {hasAbleGigs && <td>{skill.ableGigs}</td>}
                  {hasExperience && (
                    <td>
                      {skill.experienceYears}{" "}
                      {skill.experienceYears === 1 ? "year" : "years"}
                    </td>
                  )}
                  {hasEph && <td>£{skill.agreedRate}</td>}
                </tr>
              ))
            : "There are not skills"}
          <tr>
            {isSelfView && (
              <td>
                <button className={styles.addSkill} onClick={handleAddSkill}>
                  + add skill
                </button>
              </td>
            )}
          </tr>
        </tbody>
      </table>
      <AddSkillModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSkillCreated={handleSkillCreated}
        token={token}
        fetchUserProfile={fetchUserProfile}
      />
    </div>
  );
};

export default SkillsDisplayTable;
