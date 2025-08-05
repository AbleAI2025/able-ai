import { ChatConfig } from '../types/index';

export const chatConfig: ChatConfig = {
  initialPrompt: "Hi! Tell me about yourself and what gig or gigs you need filling - we can assemble a team if you need one!",
  fields: {
    gigDescription: {
      type: "text",
      label: "Gig Description:",
      placeholder: "e.g., Bartender for a wedding reception",
    },
    additionalInstructions: {
      type: "textarea",
      label: "Additional Instructions:",
      placeholder: "e.g., Cocktail making experience would be ideal",
      rows: 3,
    },
    hourlyRate: {
      type: "number",
      label: "Hourly Rate:",
      placeholder: "£15",
    },
    gigLocation: {
      type: "location",
      label: "Gig Location:",
      placeholder: "e.g., The Green Tavern, Rye Lane, Peckham, SE15 5AR",
    },
    gigDate: {
      type: "date",
      label: "Date of Gig:",
    },
  },
};
