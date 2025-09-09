import React, { useState } from "react";
import PillBadge from "../shared/PillBadge";
import styles from "./deleteSkillModal.module.css";
import { Skill } from "@/app/types/workerProfileTypes";
import AddSkillModal from "./createSkillModal";
import { Trash2 } from "lucide-react";
import DeleteSkillModal from "./deleteSkillModal";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { deleteSkillWorker } from "@/actions/user/edit-worker-profile";

interface SkillsDisplayTableProps {
  skills?: Skill[];
  title?: string;
  isSelfView?: boolean;
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
  const [deleteSkillModalOpen, setDeleteSkillModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAddSkill = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const openDeleteSkillModal = (skill: Skill) => {
    setSelectedSkill(skill);
    setDeleteSkillModalOpen(true);
  };

  const handleDeleteSkill = async () => {
    if (!selectedSkill) return;

    try {
      if (!user) throw new Error("User not authenticated");

      setLoading(true);
      const result = await deleteSkillWorker(selectedSkill.id, token);

      if (result.success) {
        toast.success("Skill deleted successfully");
        fetchUserProfile(token);
        setDeleteSkillModalOpen(false);
        setSelectedSkill(null);
      } else {
        toast.error("Error deleting skill: " + result.error);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error deleting skill: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillCreated = () => {
    fetchUserProfile(token);
    setIsModalOpen(false);
  };

  return (
    <div className={styles.skillsCard}>
      <table className={styles.skillsTable}>
        <thead>
          <tr>
            <th className={styles.skillNameHeader}>
              Skills:
              {isSelfView && (
                <button className={styles.addSkill} onClick={handleAddSkill}>
                  + new
                </button>
              )}
            </th>
            {hasAbleGigs && <th>Able gigs:</th>}
            {hasExperience && <th>Experience:</th>}
            {hasEph && <th>£ph</th>}
          </tr>
        </thead>
        <tbody>
          {skills && skills.length > 0 ? (
            skills.map((skill) => (
              <tr key={skill.id}>
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
                {hasEph && <td>{skill.agreedRate}</td>}
                {isSelfView && (
                  <th aria-label="Actions">
                    <button
                      className={styles.deleteButton}
                      onClick={() => openDeleteSkillModal(skill)}
                    >
                      <Trash2 />
                    </button>
                  </th>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4}>There are no skills</td>
            </tr>
          )}
        </tbody>
      </table>

      <AddSkillModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSkillCreated={handleSkillCreated}
        token={token}
        fetchUserProfile={fetchUserProfile}
      />

      <DeleteSkillModal
        isOpen={deleteSkillModalOpen}
        onClose={() => setDeleteSkillModalOpen(false)}
        onConfirm={handleDeleteSkill}
        skillName={selectedSkill?.name}
        loading={loading}
      />
    </div>
  );
};

export default SkillsDisplayTable;
