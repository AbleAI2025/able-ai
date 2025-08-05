"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
    Trophy, Star,Martini,
} from 'lucide-react';
import styles from './SkillSpecificPage.module.css';
import SkillSplashScreen from '@/app/components/profile/SkillSplashScreen';
import CloseButton from '@/app/components/profile/CloseButton';
import HireButton from '@/app/components/profile/HireButton';
import { getSkillDetailsWorker } from '@/actions/user/gig-worker-profile';


// --- COMPONENT ---
export default function PublicSkillProfilePage() {
    const params = useParams();
    const skillId = params?.skillId as string;

  return (
    <div className={styles.skillPageContainer}>
    
    
      <CloseButton />
      <SkillSplashScreen />
      <HireButton workerId={skillId} workerName={"example"} />

    </div> 
  );
} 