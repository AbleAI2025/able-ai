/**
 * ManualOnboardingWithToggleExample.tsx
 * 
 * Example showing how to use the ManualProfileForm with toggle options
 * for choosing between existing and new data.
 */

import React, { useState } from 'react';
import ManualProfileForm from '../ManualProfileForm';
import { ExistingData } from '../DataToggleOptions';

// Example existing profile data
const exampleExistingData: ExistingData = {
  about: "I'm a skilled carpenter with 5 years of experience in residential construction. I specialize in custom furniture and home renovations.",
  skills: "Carpentry, Woodworking, Furniture Making, Home Renovation, Custom Cabinets",
  experience: "5 years",
  location: {
    lat: 51.5074,
    lng: -0.1278,
    address: "London, UK"
  },
  availability: {
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '08:00',
    endTime: '17:00',
    frequency: 'weekly',
    ends: 'never'
  },
  qualifications: "City & Guilds Level 3 Carpentry, Health & Safety Certificate",
  equipment: "Table saw, Router, Planer, Chisels, Measuring tools, Safety equipment",
  hourlyRate: 25,
  videoIntro: "https://example.com/video-intro.mp4"
};

export default function ManualOnboardingWithToggleExample() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (formData: any) => {
    setIsSubmitting(true);
    console.log('Form submitted with data:', formData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    alert('Profile updated successfully!');
  };

  const handleSwitchToAI = () => {
    console.log('Switching to AI onboarding...');
    // Handle switch to AI onboarding
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Manual Onboarding with Toggle Options</h1>
      <p>
        This example shows how the ManualProfileForm now supports toggle options
        for users to choose between using existing profile data or entering new data.
      </p>
      
      <div style={{ 
        background: '#f3f4f6', 
        padding: '16px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>Features:</h3>
        <ul>
          <li>✅ Toggle between existing and new data for each field</li>
          <li>✅ Visual indicators showing which data source is selected</li>
          <li>✅ Edit buttons to switch from existing to new data</li>
          <li>✅ Summary showing how many fields use existing vs new data</li>
          <li>✅ Responsive design for mobile and desktop</li>
        </ul>
      </div>

      <ManualProfileForm
        onSubmit={handleFormSubmit}
        onSwitchToAI={handleSwitchToAI}
        initialData={{}}
        workerProfileId="example-worker-id"
        existingProfileData={exampleExistingData}
      />
    </div>
  );
}

// Example of how to integrate with the main onboarding flow
export function IntegrationExample() {
  const [existingProfileData, setExistingProfileData] = useState<ExistingData | undefined>();

  // Simulate fetching existing profile data
  React.useEffect(() => {
    const fetchExistingData = async () => {
      // This would be your actual API call
      const response = await fetch('/api/worker-profile');
      if (response.ok) {
        const data = await response.json();
        setExistingProfileData(data);
      }
    };

    fetchExistingData();
  }, []);

  return (
    <ManualProfileForm
      onSubmit={(data) => console.log('Submitted:', data)}
      onSwitchToAI={() => console.log('Switch to AI')}
      initialData={{}}
      workerProfileId="worker-123"
      existingProfileData={existingProfileData}
    />
  );
}
