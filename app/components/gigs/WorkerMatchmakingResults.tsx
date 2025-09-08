"use client";

import React, { useState } from 'react';
import WorkerCard, { WorkerData } from '../onboarding/WorkerCard';
import { WorkerMatch } from './WorkerMatchCard';
import Loader from '../shared/Loader';
import { VALIDATION_CONSTANTS } from '@/app/constants/validation';

interface WorkerMatchmakingResultsProps {
  matches: WorkerMatch[];
  isLoading?: boolean;
  onSelectWorker: (workerId: string) => void;
  onSkipSelection: () => void;
  selectedWorkerId?: string;
  isSelecting?: boolean;
  isSkipping?: boolean;
  totalWorkersAnalyzed?: number;
}

export default function WorkerMatchmakingResults({
  matches,
  isLoading = false,
  onSelectWorker,
  onSkipSelection,
  selectedWorkerId,
  isSelecting = false,
  isSkipping = false,
  totalWorkersAnalyzed = 0,
}: WorkerMatchmakingResultsProps) {
  const [sortBy, setSortBy] = useState<'score' | 'rate' | 'experience'>('score');

  // Function to convert WorkerMatch to WorkerData format
  const convertToWorkerData = (worker: WorkerMatch): WorkerData => {
    // Calculate total hours and price using constants
    const totalHours = VALIDATION_CONSTANTS.GIG_DEFAULTS.DEFAULT_TOTAL_HOURS;
    const totalPrice = worker.hourlyRate * totalHours;
    
    return {
      name: worker.workerName,
      title: worker.primarySkill,
      gigs: 0, // No gig count data available yet
      experience: `${worker.experienceYears} years experience`,
      keywords: worker.bio || "professional, reliable, skilled", // Use bio as keywords
      hourlyRate: worker.hourlyRate,
      totalHours: totalHours,
      totalPrice: totalPrice,
      ableFees: VALIDATION_CONSTANTS.GIG_DEFAULTS.ABLE_FEES,
      stripeFees: VALIDATION_CONSTANTS.GIG_DEFAULTS.STRIPE_FEES,
      imageSrc: VALIDATION_CONSTANTS.GIG_DEFAULTS.DEFAULT_IMAGE
    };
  };

  const sortedMatches = [...matches].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.matchScore - a.matchScore;
      case 'rate':
        return a.hourlyRate - b.hourlyRate;
      case 'experience':
        return b.experienceYears - a.experienceYears;
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <Loader />
          <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">
            Finding the perfect workers for your gig...
          </h3>
          <p className="text-gray-600">
            Our AI is analyzing {totalWorkersAnalyzed} workers to find the best matches
          </p>
        </div>
      </div>
    );
  }

     if (matches.length === 0) {
     return (
       <div className="bg-white rounded-lg border border-gray-200 p-6">
         <div className="flex items-start space-x-3">
           {/* AI Avatar */}
           <div className="flex-shrink-0">
             <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
               <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
               </svg>
             </div>
           </div>
           
           {/* Message Content */}
           <div className="flex-1 min-w-0">
             <div className="bg-gray-50 rounded-lg p-4">
               <p className="text-gray-800 font-medium mb-2">No workers found</p>
               <p className="text-gray-600 text-sm mb-4">
                 We couldn't find any workers that match your gig requirements right now. Your gig is still active and workers can apply directly.
               </p>
               
               <button
                 onClick={onSkipSelection}
                 disabled={isSkipping}
                 style={{ 
                   background: 'var(--primary-color)', 
                   color: '#fff', 
                   border: 'none', 
                   borderRadius: 8, 
                   padding: '8px 16px', 
                   fontWeight: 600, 
                   fontSize: '14px', 
                   cursor: 'pointer', 
                   transition: 'background-color 0.2s'
                 }}
               >
                 {isSkipping ? 'Going to Home...' : 'Go to Home'}
               </button>
             </div>
           </div>
         </div>
       </div>
     );
   }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700">

      {/* Worker Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMatches.map((worker) => (
            <WorkerCard
              key={worker.workerId}
              worker={convertToWorkerData(worker)}
              onBook={(name, price) => onSelectWorker(worker.workerId)}
            />
          ))}
        </div>
      </div>

             {/* Footer */}
       <div className="px-6 py-4 bg-gray-800 border-t border-gray-700 rounded-b-lg">
         
                  {/* Skip Selection Button */}
         <div className="text-center">
          
             <div style={{ 
               display: 'flex', 
               alignItems: 'center', 
               marginBottom: '8px' 
             }}>
               
                 
               </div>
               <span style={{ 
                 fontSize: '14px', 
                 fontWeight: 600, 
                 color: 'White' 
               }}>
                
               </span>
             </div>
             
             <button
               onClick={onSkipSelection}
               disabled={isSkipping || isSelecting}
               style={{ 
                 background: '#7eeef9', 
                 color: 'black', 
                 border: 'none', 
                 borderRadius: 8, 
                 padding: '12px 20px', 
                 fontWeight: 600, 
                 fontSize: '14px', 
                 cursor: 'pointer', 
                 transition: 'all 0.2s',
                 boxShadow: '0 2px 4px rgba(126, 238, 249, 0.3)',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 width: '100%'
               }}
               onMouseOver={(e) => {
                 if (!isSkipping && !isSelecting) {
                   e.currentTarget.style.background = '#5eead4';
                   e.currentTarget.style.transform = 'translateY(-1px)';
                   e.currentTarget.style.boxShadow = '0 4px 8px rgba(126, 238, 249, 0.4)';
                 }
               }}
               onMouseOut={(e) => {
                 if (!isSkipping && !isSelecting) {
                   e.currentTarget.style.background = '#7eeef9';
                   e.currentTarget.style.transform = 'translateY(0)';
                   e.currentTarget.style.boxShadow = '0 2px 4px rgba(126, 238, 249, 0.3)';
                 }
               }}
             >
               {isSkipping ? (
                 <>
                   <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   Proceeding to Dashboard...
                 </>
               ) : (
                 <>

                   Skip Selection & Go to Dashboard
                 </>
               )}
             </button>
           </div>
         </div>
    
  );
}
