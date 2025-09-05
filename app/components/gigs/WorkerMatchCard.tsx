"use client";

import React from 'react';
import Image from 'next/image';
import styles from './WorkerMatchCard.module.css';

export interface WorkerMatch {
  workerId: string;
  workerName: string;
  primarySkill: string;
  bio?: string;
  location?: string;
  hourlyRate: number;
  experienceYears: number;
  matchScore: number;
  matchReasons: string[];
  availability: {
    days: string[];
    startTime: string;
    endTime: string;
  }[];
  skills: {
    name: string;
    experienceYears: number;
    agreedRate: number;
  }[];
}

interface WorkerMatchCardProps {
  worker: WorkerMatch;
  onSelect: (workerId: string) => void;
  isSelected?: boolean;
  isSelecting?: boolean;
}

export default function WorkerMatchCard({ 
  worker, 
  onSelect, 
  isSelected = false,
  isSelecting = false 
}: WorkerMatchCardProps) {


  const initials = worker.workerName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div 
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
    >


      {/* Worker Info */}
      <div className={styles.workerInfo}>
        <div className={styles.avatar}>
          <Image
            src="/images/default-avatar.svg"
            alt={worker.workerName}
            width={64}
            height={64}
            className={styles.avatarImage}
            onError={(e) => {
              // Fallback to initials if image fails
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<div class="${styles.avatarFallback}">${initials}</div>`;
              }
            }}
          />
        </div>
        
        <div className={styles.workerDetails}>
          <h3 className={styles.workerName}>
            {worker.workerName}
          </h3>
          <p className={styles.primarySkill}>
            {worker.primarySkill}
          </p>
          {worker.location && (
            <p className={styles.location}>
              📍 {worker.location}
            </p>
          )}
          <div className={styles.workerStats}>
            <div className={styles.stat}>
              <span>£{worker.hourlyRate}/hour</span>
            </div>
            <div className={styles.stat}>
              <span>{worker.experienceYears} years experience</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      {worker.bio && (
        <div className={styles.bio}>
          {worker.bio}
        </div>
      )}

      {/* Match Reasons */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Why this match?</h4>
        <ul className={styles.matchReasons}>
          {worker.matchReasons.map((reason, index) => (
            <li key={index} className={styles.matchReason}>
              <span className={styles.checkIcon}>✓</span>
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {/* Skills */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Skills</h4>
        <div className={styles.skillsContainer}>
          {worker.skills.slice(0, 3).map((skill, index) => (
            <span 
              key={index}
              className={styles.skillTag}
            >
              {skill.name} ({skill.experienceYears}y)
            </span>
          ))}
          {worker.skills.length > 3 && (
            <span className={`${styles.skillTag} ${styles.skillTagMore}`}>
              +{worker.skills.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Availability */}
      {worker.availability.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Availability</h4>
          <div className={styles.availability}>
            {worker.availability[0]?.days?.join(', ')} • {worker.availability[0]?.startTime} - {worker.availability[0]?.endTime}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <button
          onClick={() => onSelect(worker.workerId)}
          disabled={isSelecting}
          className={`${styles.button} ${styles.selectButton} ${isSelected ? styles.selectedButton : ''}`}
        >
          {isSelecting ? 'Selecting...' : isSelected ? 'Selected' : 'Select Worker'}
        </button>
      </div>
    </div>
  );
}
