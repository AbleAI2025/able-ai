import { OnboardingStep } from "./OnboardingSteps";

const baseInitialSteps: OnboardingStep[] = [
  {
    id: 1,
    type: "botMessage",
    content: "Tell me about yourself and your work experience",
  },
  {
    id: 2,
    type: "userResponseDisplay",
    senderType: "user",
    content:
      "I have been a bartender for three years, and I love creating new cocktails and meeting new people.",
  },
  {
    id: 3,
    type: "botMessage",
    content:
      "Very cool! Do you have any special skills like mixology or expertise in wine?",
    dependsOn: 2,
  },
  {
    id: 4,
    type: "userResponseDisplay",
    senderType: "user",
    content:
      "I have a bar managers license and trained as a cocktail maker at Claridge's bar for two years",
    dependsOn: 3,
  },
  {
    id: 5,
    type: "botMessage",
    content:
      "How much you would like to be paid per hour, we  make sure you are paid above minimum wage",
    dependsOn: 4,
  },
  {
    id: 6,
    type: "userResponseDisplay",
    senderType: "user",
    content: "£15 per hour",
    dependsOn: 5,
  },
  {
    id: 7,
    type: "botMessage",
    content: "Where are you located? You can drop a pin on Google Maps and paste the link here.",
    dependsOn: 6,
  },
  {
    id: 8,
    type: "locationMapLink",
    name: "location",
    dependsOn: 7,
  },
  {
    id: 9,
    type: "botMessage",
    content: "Let me know when you are available for work on your calendar",
  },
  { id: 10, type: "datePicker", isComplete: false, dependsOn: 9 },
  {
    id: 11,
    type: "botMessage",
    content:
      "Follow this link to connect to Stripe so you can be paid at the end of your shift",
    value:
      "https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_C9b1d8c4f2e3a4b5a6c7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0&scope=read_write",
    dependsOn: 10,
  },
  {
    id: 12,
    type: "botMessage",
    content:
      "Lastly, let's record a 30-second intro for your gigfolio. Here is a sample script:",
  },
  {
    id: 13,
    type: "botMessage",
    content:
      '"Hi my name is Benji I am a bartender and waiter. I love making cocktails and bring a sense of fun to every shift. I trained at Claridges and my favourite cocktail is an espresso martini. I am great with crowds and a busy bar - I hope we can work together"',
    dependsOn: 12,
  },
  {
    id: 14,
    type: "recordVideo",
    inputConfig: {
      type: "file",
      name: "videoIntro",
      label: "Record a 30-second video intro",
    },
    dependsOn: 13,
  },
  {
    id: 15,
    type: "botMessage",
    content:
      "You need two references (at least one recommendation per skill) from previous managers, colleagues or teachers. If you don't have experience you can get a reference from a friend or someone in your network",
  },
  {
    id: 16,
    type: "shareLink",
  },
  {
    id: 17,
    type: "botMessage",
    content:
      "Please check out your gigfolio and share with your network - if your connections make a hire on Able you get £5!",
  },
  {
    id: 18,
    type: "botMessage",
    content:
      "Watch out for notifications of your first shift offer! If you dont accept within 90 minutes we will offer the gig to someone else",
  },
  {
    id: 19,
    type: "botMessage",
    content:
      "We might offer you gigs outside of your defined skill area, watch out for those opportunities too!",
  },
];

export default baseInitialSteps;
