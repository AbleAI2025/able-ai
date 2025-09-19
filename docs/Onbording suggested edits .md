# **Complete Able AI Onboarding Implementation Reference Document**

## **Executive Summary**

This document contains the complete implementation specification for the
Able AI onboarding system, optimized for UK launch in London. It covers
all 46 job types with a 6-phase onboarding flow, comprehensive hashtag
system, and integration guidelines.

## **Table of Contents**

1.  [[System
    > Overview]{.underline}](https://claude.ai/chat/95cfce8a-f014-4a2d-a494-ded79455d994#system-overview)

2.  [[6-Phase Onboarding
    > Flow]{.underline}](https://claude.ai/chat/95cfce8a-f014-4a2d-a494-ded79455d994#6-phase-onboarding-flow)

3.  [[Complete Job Title Standardization (46
    > Types)]{.underline}](https://claude.ai/chat/95cfce8a-f014-4a2d-a494-ded79455d994#complete-job-title-standardization)

4.  [[Comprehensive Hashtag
    > System]{.underline}](https://claude.ai/chat/95cfce8a-f014-4a2d-a494-ded79455d994#comprehensive-hashtag-system)

5.  [[Role-Specific Skills Prompts with
    > Languages](https://claude.ai/chat/95cfce8a-f014-4a2d-a494-ded79455d994#role-specific-skills-prompts)
    > and 5.1 Role-specific Equipment prompts]{.underline}

6.  [[Video Bio Script
    > Generator]{.underline}](https://claude.ai/chat/95cfce8a-f014-4a2d-a494-ded79455d994#video-bio-script-generator)

7.  [[Exhaustive Training
    > Examples]{.underline}](https://claude.ai/chat/95cfce8a-f014-4a2d-a494-ded79455d994#exhaustive-training-examples)

8.  [[UK-Specific
    > Configuration]{.underline}](https://claude.ai/chat/95cfce8a-f014-4a2d-a494-ded79455d994#uk-specific-configuration)

9.  [[Integration
    > Notes]{.underline}](https://claude.ai/chat/95cfce8a-f014-4a2d-a494-ded79455d994#integration-notes)

## **1. System Overview**

### **Architecture Context**

-   **Backend**: Python, PostgreSQL, GraphQL/REST APIs

-   **AI/ML**: TensorFlow, PyTorch, Scikit-learn

-   **Search**: Elasticsearch

-   **Existing Features**: Bookable calendars, KYC verification
    > (SwiftDil), Payments (Stripe)

### **What We\'re Removing**

-   Duplicate job title confirmations

-   Generic \"area of hospitality\" questions

-   Excessive emoji use (max 1-2 per message)

-   Availability questions (using existing calendar feature)

### **What We\'re Adding**

-   Video bio script generation with note-taking guidance

-   Rich hashtag system for matching

-   Equipment tracking

-   Languages in specific skills phase

-   UK-specific terminology and compliance

## **2. 6-Phase Onboarding Flow**

### **Phase Structure**

class OnboardingPhase(Enum):

INITIAL_SKILL = \"initial_skill\"

EXPERIENCE_DEEP_DIVE = \"experience_deep_dive\"

QUALIFICATIONS = \"qualifications\"

SPECIFIC_SKILLS_AND_LANGUAGES = \"specific_skills_and_languages\"

PERSONAL_TRAITS = \"personal_traits\"

EQUIPMENT = \"equipment\"

VIDEO_BIO_GENERATION = \"video_bio_generation\"

### **Phase 1: Initial Skill**

\"\"\"

Welcome to Able AI! I\'m your Gigfolio Coach, here to help you create an
amazing profile that showcases your skills and gets you gigs in London
and beyond. 🎯

Let\'s start simple - what\'s your main skill and how long have you been
doing it?

For example: \"I\'m a bartender with 6 years experience\" or \"I\'ve
been a chef for 10 years\"

Tell me about your primary role!

\"\"\"

### **Phase 2: Experience Deep Dive**

f\"\"\"

Great! You have {context.get(\'years_experience\', \'\')} years
experience as a {context.get(\'standardized_title\', \'\')}.

Now help me understand where you\'ve gained this experience - this will
help us match you with the perfect gigs.

Have you worked in:

\- Pubs or bars?

\- Fine dining or casual restaurants?

\- Hotels or B&Bs?

\- Members\' clubs or private venues?

\- Events or festivals?

\- Cafes or coffee shops?

Tell me about the venues and what made your experience there special.
What was the atmosphere like? What kind of service did you provide?

\"\"\"

### **Phase 3: Qualifications**

f\"\"\"

Brilliant experience at {\', \'.join(context.get(\'venue_types\',
\[\]))}!

Now, let\'s talk about your qualifications - these really help you stand
out.

Do you have any of these:

\- Food Hygiene Certificate (Level 1, 2, or 3)?

\- Personal License or Bar Management License?

\- College or university degree (especially hospitality-related)?

\- Professional certifications (e.g., Cask Marque, Wine & Spirit
Education Trust)?

\- First Aid or Health & Safety certificates?

List any qualifications you have, or just say \"none\" if you don\'t
have formal certificates yet.

\"\"\"

### **Phase 4: Specific Skills and Languages**

f\"\"\"

Now let\'s highlight what makes you exceptional as a
{context.get(\'standardized_title\', \'\')}.

{self.\_get_comprehensive_role_skills_prompt_with_languages(context.get(\'standardized_title\',
\'\'))}

Tell me about your specific skills, and don\'t forget to mention any
languages you speak fluently!

\"\"\"

### **Phase 5: Personal Traits**

\"\"\"

You\'re doing brilliantly! Now tell me about you as a person - your vibe
is important for finding the right match.

Think about how you work best. Are you:

\- Hard-working and reliable?

\- Great with customers and love a chat?

\- Calm under pressure during busy periods?

\- A natural team player who helps others?

\- Detail-oriented and organised?

\- Creative and good at problem-solving?

\- Energetic and enthusiastic?

Pick 3-4 traits that best describe your work style.

\"\"\"

### **Phase 6: Equipment**

f\"\"\"

Nearly there! Finally, do you have any equipment that makes it easier to
hire you for gigs?

{self.\_get_role_specific_equipment_prompt(context.get(\'standardized_title\',
\'\'))}

It\'s totally fine if you don\'t have these - this just helps with
certain gigs!

\"\"\"

## **3. Complete Job Title Standardization**

### **Implementation**

class JobTitleMapper:

def \_\_init\_\_(self):

self.title_mappings = {

\# Food & Beverage Service (9 roles)

\"Waitstaff\": \[\"waiter\", \"waitress\", \"server\", \"waiting
staff\", \"wait staff\",

\"food server\", \"table service\", \"front of house\", \"service
staff\"\],

\"Bartender\": \[\"bar tender\", \"bar staff\", \"barman\", \"barmaid\",
\"bar person\",

\"mixologist\", \"cocktail bartender\"\],

\"Barback\": \[\"bar support\", \"bar assistant\", \"bar porter\", \"bar
runner\"\],

\"Barista\": \[\"coffee specialist\", \"coffee maker\", \"barrista\",
\"coffee barista\"\],

\"Mixologist\": \[\"cocktail specialist\", \"craft bartender\",
\"cocktail creator\"\],

\"Host\": \[\"hostess\", \"guest greeter\", \"maitre d\", \"maître
d\'\", \"front desk\",

\"restaurant host\", \"greeting staff\"\],

\"Runner\": \[\"food runner\", \"drink runner\", \"service runner\",
\"kitchen runner\"\],

\"Food Runner\": \[\"server assistant\", \"service support\", \"food
expeditor\"\],

\# Kitchen Staff (8 roles)

\"Head Chef\": \[\"executive chef\", \"chef de cuisine\", \"kitchen
manager\",

\"head cook\", \"chief chef\"\],

\"Sous Chef\": \[\"deputy chef\", \"second chef\", \"assistant head
chef\",

\"deputy kitchen manager\"\],

\"Chef de Partie\": \[\"station chef\", \"line cook\", \"section chef\",

\"chef de station\"\],

\"Commis Chef\": \[\"junior chef\", \"apprentice chef\", \"trainee
chef\",

\"assistant chef\"\],

\"Kitchen Porter\": \[\"dishwasher\", \"kitchen assistant\", \"kp\",
\"pot wash\",

\"kitchen helper\", \"dish pit\"\],

\"Kitchen Assistant\": \[\"prep cook\", \"food prep\", \"kitchen help\",

\"preparation assistant\"\],

\"Catering Assistant\": \[\"food service assistant\", \"catering
staff\",

\"catering help\", \"buffet assistant\"\],

\# Event Staff (5 roles)

\"Event Staff\": \[\"event crew\", \"event assistant\", \"event
helper\",

\"event support\", \"general event staff\"\],

\"Event Steward\": \[\"usher\", \"crowd control\", \"event guide\",
\"festival staff\",

\"venue steward\"\],

\"Security\": \[\"door supervisor\", \"sia licensed security\",
\"bouncer\",

\"doorman\", \"door staff\", \"security guard\"\],

\"Brand Ambassador\": \[\"promo staff\", \"promotional staff\", \"brand
rep\",

\"brand representative\", \"product demonstrator\"\],

\"AV Technician\": \[\"stage crew\", \"av operator\", \"sound tech\",
\"lighting tech\",

\"audio visual technician\", \"technical crew\"\],

\# Cleaning & Housekeeping (3 roles)

\"Cleaner\": \[\"janitorial staff\", \"cleaning staff\", \"janitor\",
\"cleaner\",

\"sanitation worker\", \"hygiene assistant\"\],

\"Housekeeper\": \[\"room attendant\", \"housekeeping staff\",
\"chambermaid\",

\"hotel cleaner\", \"domestic staff\"\],

\"Cloakroom Attendant\": \[\"coat check\", \"wardrobe attendant\",
\"cloakroom staff\",

\"garment attendant\"\],

\# Reception & Guest Services (2 roles)

\"Receptionist\": \[\"front desk agent\", \"reception staff\", \"desk
clerk\",

\"front office\", \"guest services\"\],

\"Concierge\": \[\"guest services\", \"hotel concierge\", \"customer
service agent\",

\"guest relations\"\],

\# Management Roles (7 roles)

\"Event Manager\": \[\"event coordinator\", \"event organizer\", \"event
planner\",

\"function coordinator\"\],

\"Catering Manager\": \[\"banquet manager\", \"food service manager\",

\"catering coordinator\"\],

\"Bar Manager\": \[\"beverage manager\", \"bar supervisor\", \"bar team
leader\"\],

\"Duty Manager\": \[\"shift manager\", \"operations manager\", \"floor
manager\"\],

\"Floor Supervisor\": \[\"service supervisor\", \"restaurant
supervisor\",

\"team leader\"\],

\"Sommelier\": \[\"wine specialist\", \"wine expert\", \"wine steward\",

\"wine service\"\],

\# Creative & Specialist Roles (4 roles)

\"DJ\": \[\"disc jockey\", \"music selector\", \"party dj\", \"event
dj\"\],

\"Photographer\": \[\"event photographer\", \"photo specialist\",
\"camera operator\"\],

\"Videographer\": \[\"video specialist\", \"cameraman\", \"video
operator\",

\"film crew\"\],

\# Modern/Digital Roles (8 roles)

\"Social Media Assistant\": \[\"social media manager\", \"content
creator\",

\"social media specialist\"\],

\"Live Stream Host\": \[\"streaming host\", \"live broadcaster\",
\"stream presenter\"\],

\"Pop-up Chef\": \[\"guest chef\", \"temporary chef\", \"visiting
chef\",

\"special event chef\"\],

\"Vibe Curator\": \[\"atmosphere host\", \"ambiance coordinator\",
\"mood setter\",

\"experience curator\"\],

\"Food Stylist\": \[\"food presenter\", \"culinary stylist\", \"plate
designer\"\],

\"Wellness Host\": \[\"wellness coordinator\", \"spa host\",
\"relaxation specialist\"\],

\"Supper Club Host\": \[\"dinner party host\", \"private dining host\",

\"culinary host\"\],

\"Food Blogger\": \[\"food writer\", \"culinary blogger\", \"food
reviewer\",

\"restaurant blogger\"\],

\"Food Vlogger\": \[\"food video creator\", \"culinary vlogger\", \"food
youtuber\",

\"food content creator\"\]

}

\# Create reverse mapping for quick lookup

self.reverse_mapping = {}

for primary, alternatives in self.title_mappings.items():

for alt in alternatives:

self.reverse_mapping\[alt.lower()\] = primary

def standardize_title(self, user_input: str) -\> tuple\[str, bool\]:

\"\"\"Returns (standardized_title, needs_confirmation)\"\"\"

user_input_lower = user_input.lower().strip()

\# Check if it\'s already a primary title

for primary_title in self.title_mappings.keys():

if primary_title.lower() == user_input_lower:

return primary_title, False

\# Check alternatives

if user_input_lower in self.reverse_mapping:

return self.reverse_mapping\[user_input_lower\], False

\# Fuzzy matching for close matches

closest_match = self.\_fuzzy_match(user_input_lower)

if closest_match:

return closest_match, True \# Needs confirmation

return user_input, True \# No match - for future expansion

## **4. Comprehensive Hashtag System**

### **Complete Implementation for All 46 Roles**

class ComprehensiveHashtagGenerator:

def \_\_init\_\_(self):

self.skill_hashtags = {

\# Service Staff

\"Waitstaff\": {

\"service_style\": \[\"silver-service\", \"fine-dining\",
\"casual-dining\",

\"buffet-service\", \"banquet-service\", \"room-service\",

\"family-service\", \"formal-service\"\],

\"skills\": \[\"wine-knowledge\", \"upselling\", \"table-management\",

\"allergen-aware\", \"pos-systems\", \"customer-focused\",

\"menu-expert\", \"multi-lingual\"\],

\"pace\": \[\"high-volume\", \"fast-paced\", \"relaxed-service\",
\"detailed-service\",

\"breakfast-rush\", \"lunch-service\", \"dinner-service\"\]

},

\"Bartender\": {

\"service_style\": \[\"cocktail-bar\", \"pub-service\", \"nightclub\",
\"hotel-bar\",

\"event-bar\", \"wine-bar\", \"craft-beer\", \"sports-bar\"\],

\"skills\": \[\"mixology\", \"flair\", \"wine-knowledge\",
\"beer-expert\",

\"speed-pouring\", \"cocktail-creation\", \"customer-chat\",

\"till-operation\", \"stock-control\"\],

\"pace\": \[\"high-volume\", \"craft-focused\", \"party-atmosphere\",

\"sophisticated\", \"late-night\", \"day-drinking\"\]

},

\"Barista\": {

\"service_style\": \[\"specialty-coffee\", \"high-street\",
\"independent\",

\"hotel\", \"corporate\", \"artisan\", \"chain\"\],

\"skills\": \[\"latte-art\", \"coffee-knowledge\",
\"machine-maintenance\",

\"customer-service\", \"food-prep\", \"brewing-methods\",

\"bean-knowledge\", \"milk-texturing\"\],

\"pace\": \[\"morning-rush\", \"all-day\", \"relaxed\", \"high-volume\",

\"commuter-focused\", \"destination-cafe\"\]

},

\"Barback\": {

\"skills\": \[\"glass-collection\", \"stock-replenishment\",
\"cleaning\",

\"keg-changing\", \"ice-management\", \"bar-support\"\],

\"pace\": \[\"high-volume\", \"busy-nights\", \"efficient\",
\"team-support\"\]

},

\"Mixologist\": {

\"specialty\": \[\"molecular-mixology\", \"craft-cocktails\",
\"classics\",

\"seasonal-drinks\", \"signature-creations\"\],

\"skills\": \[\"innovation\", \"presentation\", \"flavor-pairing\",
\"technique\"\]

},

\"Host\": {

\"style\": \[\"fine-dining\", \"casual\", \"high-volume\",
\"vip-service\"\],

\"skills\": \[\"reservation-management\", \"seating-optimization\",

\"customer-greeting\", \"waitlist-management\"\]

},

\"Runner\": {

\"skills\": \[\"speed\", \"accuracy\", \"communication\",
\"coordination\"\],

\"type\": \[\"food-runner\", \"drink-runner\", \"both\"\]

},

\"Food Runner\": {

\"skills\": \[\"hot-food-handling\", \"presentation-check\",
\"table-knowledge\",

\"speed\", \"coordination\"\]

},

\# Kitchen Staff

\"Head Chef\": {

\"cuisine\": \[\"british\", \"italian\", \"french\", \"asian\",
\"fusion\",

\"modern-european\", \"gastropub\", \"fine-dining\", \"casual\",

\"street-food\", \"mediterranean\", \"middle-eastern\"\],

\"skills\": \[\"menu-planning\", \"allergen-expert\", \"pastry\",
\"grill\",

\"kitchen-management\", \"cost-control\", \"supplier-relations\",

\"team-leadership\", \"innovation\"\],

\"level\": \[\"michelin-trained\", \"rosette-experience\",
\"volume-catering\",

\"boutique\", \"chain-experience\"\]

},

\"Sous Chef\": {

\"skills\": \[\"team-leadership\", \"quality-control\", \"training\",
\"expediting\",

\"menu-development\", \"stock-control\", \"deputizing\"\],

\"speciality\": \[\"all-rounder\", \"pastry-skilled\", \"sauce-expert\",

\"butchery\", \"fish-prep\"\],

\"environment\": \[\"fine-dining\", \"high-volume\", \"hotel\",
\"restaurant\",

\"event-catering\"\]

},

\"Chef de Partie\": {

\"section\": \[\"grill\", \"sauce\", \"pastry\", \"fish\",
\"vegetables\", \"larder\",

\"pizza\", \"pasta\", \"wok\", \"breakfast\"\],

\"skills\": \[\"speed\", \"consistency\", \"presentation\",
\"mise-en-place\",

\"multi-tasking\", \"quality-focused\"\],

\"level\": \[\"senior-cdp\", \"junior-cdp\", \"experienced\",
\"specialist\"\]

},

\"Commis Chef\": {

\"level\": \[\"first-commis\", \"second-commis\", \"third-commis\",
\"apprentice\"\],

\"learning\": \[\"keen-learner\", \"culinary-student\",
\"career-changer\"\],

\"strengths\": \[\"knife-skills\", \"following-recipes\",
\"time-management\",

\"cleanliness\", \"enthusiasm\"\]

},

\"Kitchen Porter\": {

\"skills\": \[\"dishwashing\", \"pot-wash\", \"cleaning\",
\"basic-prep\",

\"deliveries\", \"waste-management\", \"hygiene-focused\"\],

\"attributes\": \[\"reliable\", \"fast-worker\", \"team-player\",
\"organized\"\],

\"experience\": \[\"restaurant\", \"hotel\", \"catering\", \"cafe\"\]

},

\"Kitchen Assistant\": {

\"skills\": \[\"food-prep\", \"vegetable-prep\", \"salad-making\",
\"portioning\",

\"labeling\", \"stock-rotation\"\],

\"attributes\": \[\"detail-oriented\", \"hygienic\", \"efficient\"\]

},

\"Catering Assistant\": {

\"skills\": \[\"buffet-setup\", \"portion-control\", \"serving\",
\"clearing\",

\"food-presentation\"\],

\"events\": \[\"corporate\", \"weddings\", \"conferences\",
\"parties\"\]

},

\# Event Staff

\"Event Staff\": {

\"events\": \[\"corporate\", \"weddings\", \"festivals\",
\"exhibitions\",

\"conferences\", \"sports\", \"concerts\", \"private-parties\"\],

\"skills\": \[\"setup-breakdown\", \"registration\",
\"crowd-management\",

\"guest-assistance\", \"problem-solving\", \"flexibility\"\],

\"attributes\": \[\"professional\", \"adaptable\", \"customer-focused\",

\"team-worker\"\]

},

\"Event Steward\": {

\"venues\": \[\"stadiums\", \"arenas\", \"festivals\",
\"exhibitions\"\],

\"skills\": \[\"crowd-control\", \"direction-giving\",
\"safety-awareness\",

\"queue-management\"\],

\"attributes\": \[\"visible\", \"approachable\", \"calm\",
\"authoritative\"\]

},

\"Security\": {

\"licensing\": \[\"sia-licensed\", \"door-supervisor\",
\"cctv-operator\",

\"close-protection\", \"first-aid-trained\"\],

\"venues\": \[\"nightclub\", \"event\", \"corporate\", \"retail\",
\"festival\",

\"concert\", \"vip\"\],

\"skills\": \[\"conflict-resolution\", \"observation\",
\"communication\",

\"crowd-control\", \"risk-assessment\"\]

},

\"Brand Ambassador\": {

\"skills\": \[\"product-demo\", \"sampling\", \"lead-generation\",
\"sales\",

\"social-media\", \"public-speaking\", \"networking\"\],

\"personality\": \[\"outgoing\", \"professional\", \"enthusiastic\",
\"engaging\",

\"confident\", \"articulate\"\],

\"experience\": \[\"retail\", \"events\", \"promotional\",
\"experiential\"\]

},

\"AV Technician\": {

\"skills\": \[\"sound-setup\", \"lighting\", \"projection\",
\"troubleshooting\",

\"cable-management\", \"mixing-desk\"\],

\"equipment\": \[\"pa-systems\", \"microphones\", \"led-screens\",
\"projectors\"\],

\"venues\": \[\"conferences\", \"concerts\", \"corporate\",
\"theaters\"\]

},

\# Cleaning & Housekeeping

\"Cleaner\": {

\"speciality\": \[\"deep-cleaning\", \"office-cleaning\",
\"venue-cleaning\",

\"event-cleaning\", \"industrial\", \"eco-friendly\"\],

\"skills\": \[\"attention-detail\", \"time-efficient\",
\"health-safety\",

\"equipment-trained\", \"chemical-knowledge\"\],

\"availability\": \[\"day-shift\", \"night-shift\", \"weekend\",
\"on-call\"\]

},

\"Housekeeper\": {

\"standards\": \[\"hotel-trained\", \"5-star\", \"boutique\",
\"airbnb\",

\"private-residence\", \"corporate\"\],

\"skills\": \[\"bed-making\", \"bathroom-excellence\",
\"turn-down-service\",

\"laundry\", \"inventory\", \"vip-service\"\],

\"attributes\": \[\"discreet\", \"thorough\", \"efficient\",
\"trustworthy\"\]

},

\"Cloakroom Attendant\": {

\"skills\": \[\"organization\", \"ticketing\", \"customer-service\",
\"security\"\],

\"venues\": \[\"theaters\", \"clubs\", \"events\", \"restaurants\"\],

\"attributes\": \[\"trustworthy\", \"efficient\", \"friendly\"\]

},

\# Guest Services

\"Receptionist\": {

\"environment\": \[\"hotel\", \"corporate\", \"medical\", \"salon\",
\"gym\",

\"restaurant\", \"venue\"\],

\"skills\": \[\"phone-manner\", \"booking-systems\", \"admin\",
\"multi-tasking\",

\"problem-solving\", \"languages\"\],

\"attributes\": \[\"professional\", \"organized\", \"friendly\",
\"efficient\"\]

},

\"Concierge\": {

\"services\": \[\"restaurant-bookings\", \"tickets\", \"transport\",
\"recommendations\"\],

\"knowledge\": \[\"local-area\", \"luxury-services\",
\"vip-handling\"\],

\"skills\": \[\"problem-solving\", \"networking\", \"languages\"\]

},

\# Management

\"Event Manager\": {

\"events\": \[\"corporate\", \"weddings\", \"conferences\",
\"exhibitions\",

\"product-launches\", \"festivals\"\],

\"skills\": \[\"planning\", \"budgeting\", \"vendor-management\",
\"logistics\",

\"team-coordination\", \"crisis-management\"\],

\"level\": \[\"senior\", \"experienced\", \"freelance\", \"agency\"\]

},

\"Catering Manager\": {

\"scale\": \[\"large-events\", \"banquets\", \"multi-site\",
\"single-venue\"\],

\"skills\": \[\"menu-planning\", \"costing\", \"team-management\",
\"logistics\",

\"quality-control\"\],

\"experience\": \[\"hotels\", \"venues\", \"contract-catering\"\]

},

\"Bar Manager\": {

\"skills\": \[\"stock-control\", \"gp-management\", \"staff-training\",

\"compliance\", \"promotions\", \"customer-experience\"\],

\"venue\": \[\"pub\", \"cocktail-bar\", \"hotel\", \"nightclub\",
\"restaurant\"\],

\"experience\": \[\"independent\", \"chain\", \"high-volume\",
\"premium\"\]

},

\"Duty Manager\": {

\"skills\": \[\"operations\", \"decision-making\", \"problem-solving\",

\"staff-management\", \"customer-service\"\],

\"sectors\": \[\"hospitality\", \"retail\", \"leisure\", \"events\"\]

},

\"Floor Supervisor\": {

\"skills\": \[\"team-coordination\", \"service-standards\",
\"training\",

\"quality-control\", \"shift-management\"\],

\"environment\": \[\"restaurant\", \"hotel\", \"retail\", \"events\"\]

},

\# Specialists

\"Sommelier\": {

\"certification\": \[\"wset-1\", \"wset-2\", \"wset-3\", \"diploma\",

\"court-certified\", \"master\"\],

\"expertise\": \[\"old-world\", \"new-world\", \"natural-wine\",
\"spirits\",

\"sake\", \"beer-cicerone\"\],

\"skills\": \[\"wine-pairing\", \"list-creation\", \"staff-training\",

\"customer-education\"\]

},

\"DJ\": {

\"genres\": \[\"house\", \"techno\", \"hip-hop\", \"rnb\",
\"commercial\",

\"wedding\", \"corporate\", \"indie\", \"drum-bass\"\],

\"skills\": \[\"mixing\", \"beatmatching\", \"scratching\",
\"crowd-reading\",

\"mc-skills\", \"production\"\],

\"equipment\": \[\"cdjs\", \"controller\", \"vinyl\", \"serato\",
\"rekordbox\"\]

},

\"Photographer\": {

\"specialty\": \[\"event\", \"wedding\", \"corporate\", \"food\",
\"portrait\",

\"product\", \"social-media\"\],

\"skills\": \[\"editing\", \"lighting\", \"composition\", \"drone\",
\"video\"\],

\"style\": \[\"documentary\", \"artistic\", \"commercial\", \"candid\"\]

},

\"Videographer\": {

\"specialty\": \[\"event\", \"wedding\", \"corporate\", \"promotional\",
\"documentary\"\],

\"skills\": \[\"filming\", \"editing\", \"drone\", \"livestream\",
\"color-grading\"\],

\"equipment\": \[\"dslr\", \"cinema-camera\", \"gimbal\", \"lighting\"\]

},

\# Modern/Digital Roles

\"Social Media Assistant\": {

\"platforms\": \[\"instagram\", \"tiktok\", \"facebook\", \"linkedin\",
\"twitter\"\],

\"skills\": \[\"content-creation\", \"scheduling\", \"analytics\",
\"engagement\",

\"copywriting\", \"hashtag-research\"\],

\"tools\": \[\"canva\", \"hootsuite\", \"later\", \"photoshop\"\]

},

\"Live Stream Host\": {

\"platforms\": \[\"youtube\", \"twitch\", \"instagram-live\",
\"linkedin-live\"\],

\"skills\": \[\"presentation\", \"engagement\", \"technical-setup\",
\"moderation\"\],

\"content\": \[\"events\", \"cooking\", \"interviews\", \"tutorials\"\]

},

\"Pop-up Chef\": {

\"style\": \[\"street-food\", \"fine-dining\", \"experimental\",
\"themed\"\],

\"skills\": \[\"menu-creation\", \"adaptability\", \"marketing\",
\"setup\"\],

\"venues\": \[\"markets\", \"events\", \"collaborations\",
\"residencies\"\]

},

\"Vibe Curator\": {

\"skills\": \[\"atmosphere-design\", \"music-curation\", \"decor\",
\"theming\"\],

\"events\": \[\"parties\", \"corporate\", \"weddings\", \"launches\"\],

\"style\": \[\"luxury\", \"underground\", \"themed\", \"minimalist\"\]

},

\"Food Stylist\": {

\"skills\": \[\"plating\", \"prop-styling\", \"photography\",
\"color-theory\"\],

\"clients\": \[\"restaurants\", \"photographers\", \"brands\",
\"magazines\"\],

\"style\": \[\"natural\", \"artistic\", \"commercial\", \"editorial\"\]

},

\"Wellness Host\": {

\"services\": \[\"meditation\", \"yoga\", \"spa\", \"retreats\",
\"workshops\"\],

\"skills\": \[\"facilitation\", \"relaxation-techniques\",
\"customer-care\"\],

\"venues\": \[\"hotels\", \"spas\", \"events\", \"corporate\"\]

},

\"Supper Club Host\": {

\"style\": \[\"intimate\", \"themed\", \"experimental\",
\"traditional\"\],

\"skills\": \[\"hosting\", \"cooking\", \"atmosphere\",
\"storytelling\"\],

\"scale\": \[\"home\", \"venue\", \"pop-up\", \"regular\"\]

},

\"Food Blogger\": {

\"focus\": \[\"restaurant-reviews\", \"recipes\", \"food-trends\",
\"local-scene\",

\"cuisine-specific\", \"dietary\"\],

\"skills\": \[\"writing\", \"photography\", \"seo\", \"social-media\",

\"networking\", \"food-knowledge\"\],

\"platforms\": \[\"wordpress\", \"instagram\", \"youtube\", \"tiktok\"\]

},

\"Food Vlogger\": {

\"content\": \[\"reviews\", \"cooking\", \"food-tours\",
\"challenges\"\],

\"skills\": \[\"video-creation\", \"editing\", \"personality\",
\"storytelling\"\],

\"platforms\": \[\"youtube\", \"tiktok\", \"instagram-reels\"\],

\"equipment\": \[\"camera\", \"microphone\", \"lighting\",
\"editing-software\"\]

}

}

\# Venue-based hashtags

self.venue_hashtags = {

\"pub\": \[\"traditional-pub\", \"gastropub\", \"sports-bar\",
\"local-pub\", \"chain-pub\"\],

\"restaurant\": \[\"fine-dining\", \"casual-dining\",
\"chain-restaurant\", \"independent\",

\"michelin\", \"bistro\", \"brasserie\"\],

\"hotel\": \[\"boutique-hotel\", \"luxury-hotel\", \"business-hotel\",
\"budget-hotel\",

\"country-hotel\", \"city-hotel\"\],

\"cafe\": \[\"coffee-shop\", \"cafe-bar\", \"brunch-spot\",
\"tea-room\", \"bakery-cafe\"\],

\"event\": \[\"wedding\", \"corporate-event\", \"festival\",
\"private-party\", \"conference\",

\"exhibition\", \"sports-event\"\],

\"club\": \[\"members-club\", \"nightclub\", \"social-club\",
\"sports-club\", \"gentlemens-club\"\]

}

\# Experience level hashtags

self.experience_level_hashtags = {

(0, 1): \[\"entry-level\", \"eager-learner\", \"fresh-perspective\"\],

(1, 3): \[\"developing-professional\", \"solid-foundation\",
\"growing-expertise\"\],

(3, 5): \[\"experienced\", \"seasoned\", \"skilled-practitioner\"\],

(5, 10): \[\"highly-experienced\", \"expert-level\", \"veteran\"\],

(10, 100): \[\"master-level\", \"industry-veteran\",
\"mentor-quality\"\]

}

\# Trait hashtags

self.trait_hashtags = {

\"work_style\": \[\"team-player\", \"independent\", \"leader\",
\"supportive\", \"flexible\"\],

\"personality\": \[\"friendly\", \"professional\", \"energetic\",
\"calm\", \"enthusiastic\",

\"detail-oriented\", \"creative\", \"reliable\"\],

\"strengths\": \[\"pressure-resistant\", \"multitasker\",
\"problem-solver\", \"quick-learner\",

\"customer-focused\", \"quality-focused\", \"efficient\"\]

}

## **5. Role-Specific Skills Prompts with Languages**

### **All 46 Job Types with UK Context and Language Suggestions**

def \_get_comprehensive_role_skills_prompt_with_languages(self, role:
str) -\> str:

\"\"\"UK-specific role prompts with language suggestions for all 46
roles\"\"\"

role_skills = {

\# Food & Beverage Service

\"Waitstaff\": \"\"\"

Think about your service skills:

• Service style: Silver service, fine dining, casual, or gastropub?

• Technical skills: Wine service, EPOS systems, contactless payments?

• Customer skills: Upselling, dietary requirements (vegan, coeliac,
halal)?

• Work style: High-volume service, attention to detail?

• Languages: Do you speak any languages besides English (French,
Spanish, Italian, Polish, etc.)?

What are your strongest skills as waitstaff?

\"\"\",

\"Bartender\": \"\"\"

Consider your bar skills:

• Drink making: Cocktails, real ales, craft beers, wine service?

• Technical skills: Speed pouring, till management, Weights & Measures
compliance?

• Creative skills: Creating seasonal drinks, garnishing, menu
development?

• Service style: Pub atmosphere, cocktail bar, high-volume, customer
banter?

• Languages: Any additional languages for international customers?

What makes you a brilliant bartender?

\"\"\",

\"Barista\": \"\"\"

Think about your coffee expertise:

• Coffee skills: Flat whites, latte art, alternative milks (oat, soy,
almond)?

• Technical: Machine maintenance, grinder calibration, extraction
timing?

• Service: Regular customer relationships, morning rush efficiency?

• Additional: Breakfast service, paninis, pastries?

• Languages: Any languages for tourist areas or business districts?

What are your key barista skills?

\"\"\",

\"Barback\": \"\"\"

Consider your bar support skills:

• Core duties: Glass collection, restocking, keg changes?

• Speed: Keeping up during busy service, anticipating needs?

• Knowledge: Bar layout, stock locations, basic drinks?

• Team support: Working with bartenders, communication?

• Languages: Understanding bar orders in different languages?

What makes you an efficient barback?

\"\"\",

\"Mixologist\": \"\"\"

Think about your craft cocktail expertise:

• Techniques: Molecular mixology, barrel-aging, infusions?

• Knowledge: Classic cocktails, spirits history, flavor profiles?

• Creativity: Seasonal menus, signature drinks, presentation?

• Sustainability: Zero-waste cocktails, local ingredients?

• Languages: Explaining complex cocktails to international guests?

What defines your mixology skills?

\"\"\",

\"Host\": \"\"\"

Consider your front-of-house skills:

• Systems: OpenTable, ResDiary, Seven Rooms, paper bookings?

• Customer service: Greeting style, managing wait times, VIP
recognition?

• Organization: Table rotation, reservation management, special
requests?

• Communication: Team coordination, dietary requirements?

• Languages: Welcoming international diners in their language?

What are your hosting strengths?

\"\"\",

\"Runner\": \"\"\"

Think about your service support skills:

• Speed: Quick delivery, multiple plates, hot food handling?

• Knowledge: Table numbers, menu items, allergens?

• Communication: Kitchen to floor, special instructions?

• Efficiency: Clearing, resetting, supporting waitstaff?

• Languages: Basic food terms in other languages?

What makes you an excellent runner?

\"\"\",

\"Food Runner\": \"\"\"

Consider your food service skills:

• Presentation: Checking plates, garnishes, temperature?

• Speed: Hot food delivery, efficient routes, timing?

• Knowledge: Menu descriptions, ingredients, table layouts?

• Care: Handling special dietary plates, allergen awareness?

• Languages: Pronouncing international dish names?

What are your food running strengths?

\"\"\",

\# Kitchen Roles

\"Head Chef\": \"\"\"

Consider your culinary leadership:

• Cuisines: British gastropub, modern European, Asian fusion, Sunday
roasts?

• Management: Menu costing, supplier relationships (local farms), team
rotas?

• Compliance: Food hygiene Level 3, allergen management (Natasha\'s
Law)?

• Specialties: Dietary requirements, seasonal British produce?

• Languages: Kitchen languages (French culinary terms, any other
languages)?

What defines you as a Head Chef?

\"\"\",

\"Sous Chef\": \"\"\"

Think about your kitchen management:

• Leadership: Running pass, training commis, covering head chef?

• Technical: All sections proficient, HACCP compliance, stock rotation?

• Organisation: Prep lists, ordering, wastage control?

• Specialties: Particular cuisine expertise or dietary knowledge?

• Languages: Any additional kitchen languages?

What are your core strengths as a Sous Chef?

\"\"\",

\"Chef de Partie\": \"\"\"

Consider your section expertise:

• Sections: Grill, sauce, pastry, fish, veg, larder, or breakfast?

• Skills: Speed during service, consistency, presentation standards?

• Volume: Gastropub covers or fine dining precision?

• Specialties: Any particular techniques (sous vide, molecular)?

• Languages: Kitchen communication in other languages?

Which section and skills define you?

\"\"\",

\"Commis Chef\": \"\"\"

Think about your developing chef skills:

• Sections: Which sections have you worked or trained in?

• Basic skills: Knife skills, following recipes, mise en place?

• Learning: Quick learner, taking instruction, asking questions?

• College: Catering college training, stages, apprenticeships?

• Languages: Understanding chef instructions in different languages?

What skills are you developing as a Commis?

\"\"\",

\"Kitchen Porter\": \"\"\"

Consider your kitchen support skills:

• Core duties: Pot wash efficiency, dishwasher operation, deep cleaning?

• Support: Basic veg prep, deliveries, waste management, recycling?

• Standards: Health & Safety awareness, COSHH compliance?

• Additional: Any basic cooking skills or food prep?

• Languages: Communication with diverse kitchen teams?

What makes you an efficient KP?

\"\"\",

\"Kitchen Assistant\": \"\"\"

Think about your prep skills:

• Food prep: Vegetable prep, salads, sandwiches, basic cooking?

• Organization: Labeling, dating, stock rotation, FIFO?

• Standards: Food hygiene, temperature control, cleanliness?

• Support: Helping chefs, following specs, portion control?

• Languages: Reading recipes in different languages?

What are your kitchen assistant strengths?

\"\"\",

\"Catering Assistant\": \"\"\"

Consider your catering skills:

• Service: Buffet setup, plated service, canapés, drinks service?

• Events: Corporate lunches, weddings, conferences, parties?

• Standards: Presentation, portion control, dietary requirements?

• Flexibility: Different venues, varied menus, long events?

• Languages: Serving international guests?

What makes you a great catering assistant?

\"\"\",

\# Event Staff

\"Event Staff\": \"\"\"

Think about your event experience:

• London venues: ExCeL, O2, Olympia, hotels, historic venues?

• Event types: Corporate functions, weddings, festivals (Glastonbury,
BST)?

• Skills: Registration, cloakroom, setup/breakdown, crowd management?

• Flexibility: Indoor/outdoor British weather, varied shift patterns?

• Languages: International conferences, tourist events?

What event skills do you excel at?

\"\"\",

\"Event Steward\": \"\"\"

Consider your stewarding experience:

• Venues: Stadiums (Wembley, Emirates), arenas, festivals?

• Duties: Queue management, ticket checking, accessibility assistance?

• Safety: Emergency procedures, crowd flow, incident reporting?

• Communication: Radio use, briefings, public interaction?

• Languages: Directing international visitors?

What are your stewarding strengths?

\"\"\",

\"Security\": \"\"\"

Consider your security qualifications:

• Licensing: SIA badge (door supervisor, CCTV), first aid certificate?

• Experience: Pubs, clubs, concerts, football matches, retail?

• Skills: Conflict resolution, licensing laws, Challenge 25?

• Venues: West End, City venues, festivals, sporting events?

• Languages: De-escalation in multiple languages?

What are your security strengths and valid licenses?

\"\"\",

\"Brand Ambassador\": \"\"\"

Think about your promotional skills:

• Experience: Product sampling, demos, lead generation, guerrilla
marketing?

• Personality: Outgoing, professional appearance, enthusiasm?

• Skills: Sales pitch, data capture, social media, reporting?

• Events: Trade shows, shopping centres, festivals, launches?

• Languages: Engaging diverse London demographics?

What makes you an effective Brand Ambassador?

\"\"\",

\"AV Technician\": \"\"\"

Consider your technical skills:

• Equipment: Sound desks, lighting rigs, projectors, LED walls?

• Software: QLab, Resolume, lighting controllers?

• Venues: Conference centres, theaters, hotels, outdoor events?

• Skills: Setup, operation, troubleshooting, de-rigging?

• Languages: Working with international production teams?

What are your AV technical strengths?

\"\"\",

\# Cleaning & Housekeeping

\"Cleaner\": \"\"\"

Consider your cleaning expertise:

• Environments: Offices, pubs/restaurants, events, end-of-tenancy?

• Standards: Health & Safety, COSHH regulations, COVID protocols?

• Equipment: Henry hoovers, floor polishers, steam cleaners?

• Timing: Early morning, late night, or daytime shifts?

• Languages: Understanding safety instructions in English essential,
others helpful?

What are your cleaning strengths?

\"\"\",

\"Housekeeper\": \"\"\"

Think about your housekeeping skills:

• Standards: British hotel standards, boutique properties, Airbnb
turnover?

• Speed: Quick room turnarounds, attention to detail?

• Skills: Hospital corners, bathroom standards, minibar checks?

• Guest service: Discretion, turndown service, special requests?

• Languages: International hotel guests?

What defines your housekeeping excellence?

\"\"\",

\"Cloakroom Attendant\": \"\"\"

Consider your cloakroom skills:

• Systems: Ticket systems, numbering, lost property procedures?

• Venues: Theatres, clubs, restaurants, events?

• Service: Speed during rush, organization, customer care?

• Security: Valuable items, checking bags, safety?

• Languages: Assisting international guests?

What are your cloakroom strengths?

\"\"\",

\# Reception & Guest Services

\"Receptionist\": \"\"\"

Consider your front desk skills:

• Systems: Opera, Guestline, booking.com extranet, Outlook?

• Communication: Professional telephone manner, email etiquette?

• Tasks: Check-in/out, concierge services, handling complaints?

• Knowledge: London transport, local attractions, restaurant bookings?

• Languages: European languages, Mandarin, Arabic for international
guests?

What are your key reception skills?

\"\"\",

\"Concierge\": \"\"\"

Think about your concierge expertise:

• London knowledge: Restaurants, theaters, attractions, hidden gems?

• Services: Bookings, tickets, transport, special requests?

• Network: Contacts, suppliers, exclusive access?

• Problem-solving: Last-minute requests, difficult bookings?

• Languages: Assisting international VIP guests?

What makes you an exceptional concierge?

\"\"\",

\# Management Roles

\"Event Manager\": \"\"\"

Think about your event management:

• Planning: Risk assessments, licensing (TENS), supplier management?

• London venues: Knowledge of key venues, transport logistics?

• Events: Corporate City events, weddings, product launches, AGMs?

• Compliance: Health & Safety, insurance, local council requirements?

• Languages: International client management?

What makes you an effective Event Manager?

\"\"\",

\"Catering Manager\": \"\"\"

Consider your catering management:

• Scale: Banquets, multi-site events, contract catering?

• Planning: Menu design, costing, allergen management, staffing?

• Logistics: Equipment, transport, setup, service styles?

• Compliance: Food safety, licensing, insurance?

• Languages: Managing diverse teams and clients?

What are your catering management strengths?

\"\"\",

\"Bar Manager\": \"\"\"

Consider your bar management skills:

• Operations: Stock GP, EPOS systems, Weights & Measures, Challenge 25?

• Compliance: Personal license, health & safety, cellar management?

• Team: Rota management, training, motivating student staff?

• Commercial: Happy hours, quiz nights, sports events, promotions?

• Languages: Managing diverse teams and customers?

What are your bar management strengths?

\"\"\",

\"Duty Manager\": \"\"\"

Think about your operational skills:

• Responsibilities: Opening/closing, cash reconciliation, incident
management?

• Decision-making: Complaints, emergencies, staff issues?

• Systems: Property management, security, health & safety?

• Communication: Reporting, handovers, team briefings?

• Languages: Handling international guest issues?

What makes you an effective Duty Manager?

\"\"\",

\"Floor Supervisor\": \"\"\"

Consider your supervisory skills:

• Team leadership: Briefings, delegation, motivation, training?

• Service standards: Quality control, timing, presentation?

• Problem-solving: Customer complaints, staff issues, busy service?

• Communication: Kitchen liaison, management reporting?

• Languages: Leading diverse teams?

What are your floor supervision strengths?

\"\"\",

\# Specialist Roles

\"Sommelier\": \"\"\"

Think about your wine expertise:

• Knowledge: French regions, New World, English sparkling, natural
wines?

• Qualifications: WSET Level 2/3, Court of Master Sommeliers?

• Service: Wine pairing with British/European cuisine, decanting?

• Commercial: Wine list creation, managing GP, supplier relationships?

• Languages: French, Italian, Spanish for wine discussions?

What defines your sommelier expertise?

\"\"\",

\"DJ\": \"\"\"

Consider your DJ skills:

• Music genres: UK garage, drum & bass, house, commercial, weddings?

• Venues: Fabric, Ministry, Printworks, pubs, private parties?

• Technical: CDJs, vinyl, Serato, Rekordbox, sound systems?

• Reading crowds: British crowds, stag/hen dos, corporate events?

• Languages: MCing or announcing in multiple languages?

What makes you a top DJ?

\"\"\",

\"Photographer\": \"\"\"

Think about your photography skills:

• Specialties: Events, food, venues, portraits, social media content?

• Technical: Camera systems, lighting, editing software?

• Style: Documentary, artistic, commercial, editorial?

• Turnaround: Same-day edits, online galleries, prints?

• Languages: Directing subjects in different languages?

What defines your photography style?

\"\"\",

\"Videographer\": \"\"\"

Consider your video skills:

• Types: Event coverage, promotional, social media, live streaming?

• Technical: Camera operation, audio, lighting, drone?

• Editing: Premiere, Final Cut, DaVinci, motion graphics?

• Delivery: Quick turnarounds, various formats, platforms?

• Languages: Creating content for international audiences?

What are your videography strengths?

\"\"\",

\# Modern/Digital Roles

\"Social Media Assistant\": \"\"\"

Consider your digital skills:

• Platforms: Instagram, TikTok, LinkedIn, Twitter/X?

• Content: Reels, stories, London foodie trends, hashtag research?

• Tools: Canva, Later, Hootsuite, basic photo editing?

• Knowledge: UK influencer landscape, ASA guidelines?

• Languages: Creating content for international audiences?

What makes your social media content stand out?

\"\"\",

\"Live Stream Host\": \"\"\"

Think about your streaming skills:

• Platforms: YouTube, Twitch, Instagram Live, LinkedIn Live?

• Technical: OBS, cameras, audio, internet requirements?

• Presentation: On-camera presence, audience engagement, moderation?

• Content: Event streaming, cooking shows, interviews?

• Languages: Engaging multilingual audiences?

What are your live streaming strengths?

\"\"\",

\"Pop-up Chef\": \"\"\"

Consider your pop-up experience:

• Concepts: Street food, supper clubs, residencies, collaborations?

• Skills: Menu development, sourcing, pricing, marketing?

• Adaptability: Different kitchens, equipment limitations, dietary
trends?

• Business: Food hygiene rating, insurance, licensing?

• Languages: Explaining dishes to diverse customers?

What makes your pop-up unique?

\"\"\",

\"Vibe Curator\": \"\"\"

Think about atmosphere creation:

• Skills: Music selection, lighting design, decor, theming?

• Events: Launch parties, corporate events, weddings, clubs?

• Style: Luxury, underground, vintage, modern, themed?

• Technical: Sound systems, lighting control, playlist curation?

• Languages: Reading international crowd preferences?

What defines your vibe curation style?

\"\"\",

\"Food Stylist\": \"\"\"

Consider your styling expertise:

• Skills: Plating, prop selection, color theory, composition?

• Clients: Restaurants, photographers, brands, TV/film?

• Styles: Natural, artistic, commercial, editorial?

• Technical: Photography basics, trends, dietary presentations?

• Languages: Working with international creative teams?

What are your food styling strengths?

\"\"\",

\"Wellness Host\": \"\"\"

Think about your wellness skills:

• Services: Meditation, breathwork, sound baths, workshops?

• Venues: Hotels, spas, corporate offices, retreats?

• Qualifications: Certifications, training, specializations?

• Style: Calming presence, clear instruction, adaptability?

• Languages: Guiding relaxation in multiple languages?

What makes you an effective wellness host?

\"\"\",

\"Supper Club Host\": \"\"\"

Consider your hosting experience:

• Format: Home dining, themed nights, chef collaborations?

• Skills: Cooking, hosting, storytelling, atmosphere?

• Scale: Intimate (8-12), medium (20-30), large groups?

• Marketing: Social media, word-of-mouth, ticketing?

• Languages: Hosting international diners?

What makes your supper club special?

\"\"\",

\"Food Blogger\": \"\"\"

Think about your content creation:

• Focus: London restaurant scene, Borough Market, street food, Sunday
roasts?

• Writing: SEO, engaging copy, honest reviews?

• Photography: Natural light, flat lays, atmospheric shots?

• Knowledge: Food trends, dietary movements, sustainable dining?

• Languages: Writing for international food tourists?

What makes your food content unique?

\"\"\",

\"Food Vlogger\": \"\"\"

Consider your video content:

• Content types: Reviews, cooking, food tours, challenges?

• Technical: Filming, editing, thumbnails, SEO?

• Personality: On-camera presence, storytelling, humor?

• Platforms: YouTube, TikTok, Instagram Reels?

• Languages: Creating content for global audiences?

What defines your food vlogging style?

\"\"\"

}

\# Return role-specific prompt or generic fallback

return role_skills.get(role, \"\"\"

Tell me about your specific skills in this role:

• What technical skills do you have?

• What type of venues have you worked in?

• What makes you stand out?

• Do you have any relevant qualifications?

• What languages do you speak fluently?

\"\"\")

You\'re absolutely right! The equipment prompt details are missing. You
should insert them right after **Section 5 (Role-Specific Skills Prompts
with Languages)** and before **Section 6 (Video Bio Script Generator)**.

Here\'s the complete equipment prompts section to add as **Section 5.1**
or as a subsection:

## **5.1 Role-Specific Equipment Prompts**

### **All 46 Job Types Equipment Suggestions**

def \_get_role_specific_equipment_prompt(self, role: str) -\> str:

\"\"\"Get role-specific equipment suggestions for all 46 job types\"\"\"

role_equipment = {

\# Food & Beverage Service

\"Waitstaff\": \"\"\"

This could be things like:

• Professional uniform (black/white clothing)?

• Wine opener and waiter\'s friend?

• Non-slip shoes?

• Order pad and pens?

• Service cloth?

Do you have any of these items?

\"\"\",

\"Bartender\": \"\"\"

This could be things like:

• Cocktail making kit (shaker, strainer, jigger)?

• Professional bar blade and bottle opener?

• Black clothing/uniform?

• Bar mat and tools?

• Speed pourers?

What bar equipment do you own?

\"\"\",

\"Barista\": \"\"\"

This could be things like:

• Milk jugs and thermometer?

• Tamper and distribution tool?

• Apron and uniform?

• Coffee scales?

• Cleaning cloths?

Do you have any barista equipment?

\"\"\",

\"Barback\": \"\"\"

This could be things like:

• Black clothing/uniform?

• Non-slip shoes?

• Bar blade?

• Glass cloth?

Any equipment that helps you work?

\"\"\",

\"Mixologist\": \"\"\"

This could be things like:

• Professional cocktail set (Japanese jigger, fine strainer)?

• Muddler, bar spoon, zester?

• Speciality tools (smoking gun, ISI whip)?

• Recipe book or tablet?

• Black attire?

What mixology tools do you have?

\"\"\",

\"Host\": \"\"\"

This could be things like:

• Professional attire (suit/dress)?

• Reservation book or tablet?

• Two-way radio/earpiece?

• Name badge holder?

Do you have hosting equipment?

\"\"\",

\"Runner\": \"\"\"

This could be things like:

• Non-slip shoes?

• Service uniform?

• Tray (if experienced with tray service)?

• Order pad?

Any equipment for running food/drinks?

\"\"\",

\"Food Runner\": \"\"\"

This could be things like:

• Non-slip shoes?

• Black clothing?

• Service cloth?

• Tray for multiple plates?

Do you have service equipment?

\"\"\",

\# Kitchen Staff

\"Head Chef\": \"\"\"

This could be things like:

• Professional knife set?

• Chef whites and apron?

• Kitchen clogs or safety shoes?

• Thermometer probe?

• Recipe notebook/tablet?

• Tasting spoons?

What kitchen equipment do you own?

\"\"\",

\"Sous Chef\": \"\"\"

This could be things like:

• Knife roll with knives?

• Chef whites?

• Safety shoes?

• Thermometer?

• Timer?

• Sharpening steel?

What professional equipment do you have?

\"\"\",

\"Chef de Partie\": \"\"\"

This could be things like:

• Own knives?

• Chef whites and apron?

• Kitchen shoes?

• Thermometer?

• Specialist tools for your section?

Do you have your own kitchen equipment?

\"\"\",

\"Commis Chef\": \"\"\"

This could be things like:

• Basic knife set?

• Chef whites?

• Kitchen shoes?

• Notebook for recipes?

Any kitchen equipment of your own?

\"\"\",

\"Kitchen Porter\": \"\"\"

This could be things like:

• Waterproof apron?

• Non-slip shoes/boots?

• Rubber gloves?

• Scrubbing brushes?

Do you have any KP equipment?

\"\"\",

\"Kitchen Assistant\": \"\"\"

This could be things like:

• Apron?

• Non-slip shoes?

• Basic knives?

• Peeler?

Any kitchen prep equipment?

\"\"\",

\"Catering Assistant\": \"\"\"

This could be things like:

• Black and white uniform?

• Comfortable shoes?

• Serving tray?

• Corkscrew?

Do you have catering equipment?

\"\"\",

\# Event Staff

\"Event Staff\": \"\"\"

This could be things like:

• Black clothing/event uniform?

• Comfortable shoes for long shifts?

• Hi-vis vest?

• Radio/earpiece?

• Weather-appropriate clothing?

What event equipment do you have?

\"\"\",

\"Event Steward\": \"\"\"

This could be things like:

• Hi-vis vest or jacket?

• Steel-toe boots?

• Waterproofs?

• Torch?

• Radio?

Do you have stewarding equipment?

\"\"\",

\"Security\": \"\"\"

This could be things like:

• SIA badge and armband holder?

• Black clothing/suit?

• Boots?

• Torch?

• Earpiece?

• Body-worn camera?

What security equipment do you have?

\"\"\",

\"Brand Ambassador\": \"\"\"

This could be things like:

• Tablet for data capture?

• Branded clothing (if kept from previous roles)?

• Comfortable shoes?

• Bag for samples/materials?

Any promotional equipment?

\"\"\",

\"AV Technician\": \"\"\"

This could be things like:

• Tool kit (multitool, cable tester)?

• Gaffer tape?

• Cable ties?

• Head torch?

• Multi-meter?

• Laptop with software?

What technical equipment do you own?

\"\"\",

\# Cleaning & Housekeeping

\"Cleaner\": \"\"\"

This could be things like:

• Cleaning supplies?

• Rubber gloves?

• Apron or uniform?

• Non-slip shoes?

• Mop and bucket?

Do you have your own cleaning equipment?

\"\"\",

\"Housekeeper\": \"\"\"

This could be things like:

• Housekeeping uniform?

• Comfortable shoes?

• Cleaning caddy?

• Quality cloths?

• Rubber gloves?

What housekeeping equipment do you have?

\"\"\",

\"Cloakroom Attendant\": \"\"\"

This could be things like:

• Professional attire?

• Ticket system?

• Hangers?

• Lost property tags?

Any cloakroom equipment?

\"\"\",

\# Reception & Guest Services

\"Receptionist\": \"\"\"

This could be things like:

• Professional attire?

• Headset?

• Notebook and pens?

• Name badge?

• Diary/planner?

Do you have reception equipment?

\"\"\",

\"Concierge\": \"\"\"

This could be things like:

• Professional uniform/suit?

• Tablet or smartphone?

• Contact book?

• Maps and guides?

• Umbrella?

What concierge tools do you have?

\"\"\",

\# Management Roles

\"Event Manager\": \"\"\"

This could be things like:

• Laptop with planning software?

• Two-way radios?

• Hi-vis vest?

• Measuring tape?

• First aid kit?

• Professional attire?

What event management equipment do you have?

\"\"\",

\"Catering Manager\": \"\"\"

This could be things like:

• Laptop/tablet?

• Calculator?

• Thermometer?

• Portion scoops?

• Menu folders?

Do you have catering management tools?

\"\"\",

\"Bar Manager\": \"\"\"

This could be things like:

• Stock-taking equipment?

• Calculator/tablet?

• Hydrometer?

• Professional bar tools?

• Cellar equipment?

What bar management equipment do you own?

\"\"\",

\"Duty Manager\": \"\"\"

This could be things like:

• Professional attire?

• Radio/phone?

• Keys/access cards?

• Incident report forms?

• Torch?

Do you have duty management equipment?

\"\"\",

\"Floor Supervisor\": \"\"\"

This could be things like:

• Professional uniform?

• Radio/earpiece?

• Order pad?

• Float/till money?

What supervisory equipment do you have?

\"\"\",

\# Specialist Roles

\"Sommelier\": \"\"\"

This could be things like:

• Wine key/corkscrew?

• Decanter?

• Wine thermometer?

• Tasting glasses?

• Spit bucket?

• Wine reference books?

What wine service equipment do you own?

\"\"\",

\"DJ\": \"\"\"

This could be things like:

• Controller/CDJs?

• Headphones?

• Laptop with DJ software?

• USB sticks with music?

• Cables (RCA, XLR)?

• Needles/cartridges (if vinyl)?

What DJ equipment do you have?

\"\"\",

\"Photographer\": \"\"\"

This could be things like:

• Camera body and lenses?

• Memory cards?

• Spare batteries?

• Flash/speedlight?

• Tripod?

• Laptop with editing software?

What photography equipment do you own?

\"\"\",

\"Videographer\": \"\"\"

This could be things like:

• Camera and lenses?

• Microphones?

• Tripod/gimbal?

• Lights?

• Memory cards and batteries?

• Editing laptop?

What video equipment do you have?

\"\"\",

\# Modern/Digital Roles

\"Social Media Assistant\": \"\"\"

This could be things like:

• Smartphone with good camera?

• Ring light?

• Laptop/tablet?

• Scheduling apps subscription?

• Props for content?

What social media equipment do you have?

\"\"\",

\"Live Stream Host\": \"\"\"

This could be things like:

• Webcam or camera?

• Microphone?

• Ring light/lighting?

• Green screen?

• Streaming software?

• Fast internet?

What streaming equipment do you own?

\"\"\",

\"Pop-up Chef\": \"\"\"

This could be things like:

• Portable equipment (knives, boards)?

• Gazebo/tent?

• Tables?

• Cool boxes?

• Gas burners?

• Serving equipment?

What pop-up equipment do you have?

\"\"\",

\"Vibe Curator\": \"\"\"

This could be things like:

• Laptop with music?

• Speakers?

• Lighting equipment?

• Decorations?

• Projector?

What atmosphere equipment do you own?

\"\"\",

\"Food Stylist\": \"\"\"

This could be things like:

• Styling kit (tweezers, brushes)?

• Props and backgrounds?

• Artificial ice/steam?

• Glycerin spray?

• Color cards?

• Camera?

What food styling equipment do you have?

\"\"\",

\"Wellness Host\": \"\"\"

This could be things like:

• Yoga mats?

• Meditation cushions?

• Singing bowls?

• Essential oils?

• Speaker for music?

• Certificates to display?

What wellness equipment do you own?

\"\"\",

\"Supper Club Host\": \"\"\"

This could be things like:

• Dining equipment (plates, cutlery)?

• Serving dishes?

• Table linens?

• Glassware?

• Cooking equipment?

• Music system?

What hosting equipment do you have?

\"\"\",

\"Food Blogger\": \"\"\"

This could be things like:

• Camera or good phone?

• Tripod?

• Lighting?

• Props for styling?

• Laptop for writing?

• Notebook?

What blogging equipment do you own?

\"\"\",

\"Food Vlogger\": \"\"\"

This could be things like:

• Camera with video capability?

• Microphone?

• Tripod/gimbal?

• Lighting setup?

• Editing software?

• Props?

What vlogging equipment do you have?

\"\"\"

}

\# Generic fallback for any role

return role_equipment.get(role, \"\"\"

Do you have any professional equipment or uniform that would be helpful
for this role?

It\'s completely fine if you don\'t - most venues provide what\'s
needed!

\"\"\")

This section completes the implementation by providing tailored
equipment prompts for each of the 46 job types, maintaining the UK
context and friendly tone throughout. Each prompt is specific to the
role\'s typical equipment needs while reassuring users that not having
equipment is perfectly acceptable.

## **6. Video Bio Script Generator**

### **UK-Optimized with Note-Taking Guidance**

class UKVideoBioScriptGenerator:

\"\"\"

Generates video bio scripts with UK English and cultural context

Encourages note-taking for natural delivery

\"\"\"

def generate_script(self, profile_data: Dict) -\> Dict:

\"\"\"Generate UK-appropriate video bio script\"\"\"

script = self.\_create_script_sections(profile_data)

\# Format with note-taking instructions

formatted_script = f\"\"\"

VIDEO BIO SCRIPT - 30-45 seconds

{\'=\' \* 50}

📝 IMPORTANT: Write these key points on paper to refer to while filming!

Don\'t try to memorize - just note the main points and speak naturally.

YOUR KEY POINTS TO NOTE DOWN:

\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--

1\. Introduction: \"{script\[\'intro_notes\'\]}\"

2\. Experience: \"{script\[\'experience_notes\'\]}\"

3\. Skills: \"{script\[\'skills_notes\'\]}\"

4\. Personality: \"{script\[\'personality_notes\'\]}\"

5\. Closing: \"{script\[\'closing_notes\'\]}\"

FULL SCRIPT FOR REFERENCE:

\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--

{script\[\'full_text\'\]}

FILMING TIPS:

\-\-\-\-\-\-\-\-\-\-\-\--

• Have your notes just below the camera (not visible)

• Glance at notes between points - it looks natural!

• Film in good light (near a window is brilliant)

• Smile and imagine chatting to a friendly manager

• Do a practice run while looking at your notes

• Most people nail it on the second or third take

Remember: You don\'t need to be word-perfect!

Natural and friendly beats scripted and stiff every time.

\"\"\"

return {

\"formatted_script\": formatted_script,

\"notes_version\": script\[\'notes_version\'\],

\"estimated_duration\": \"30-45 seconds\"

}

def \_create_script_sections(self, profile_data: Dict) -\> Dict:

\"\"\"Create script sections with UK terminology and style\"\"\"

name = profile_data.get(\"name\", \"\")

role = profile_data.get(\"standardized_title\", \"\")

years = profile_data.get(\"years_experience\", 0)

venues = profile_data.get(\"venues\", \[\])

languages = profile_data.get(\"languages\", \[\"English\"\])

\# Create note-friendly versions

intro_notes = f\"I\'m {name}, {role} for {years} years\"

if len(languages) \> 1:

intro_notes += f\", speak {\'/\'.join(languages)}\"

experience_notes = f\"Worked at: {\', \'.join(venues\[:2\]) if venues
else \'various venues\'}\"

skills_notes = f\"Good at: {\',
\'.join(profile_data.get(\'specific_skills\', \[\'quality
service\'\])\[:3\])}\"

personality_notes = f\"I\'m: {\',
\'.join(profile_data.get(\'personal_traits\',
\[\'professional\'\])\[:2\])}\"

closing_notes = self.\_get_uk_closing(role)

\# Full text version

full_text = f\"\"\"

\[INTRODUCTION - Smile at camera\]

\"Hiya, I\'m {name}, and I\'ve been working as a {role} for {years}
years.\"

{f\"I speak {\' and \'.join(languages)} fluently.\" if len(languages) \>
1 else \"\"}

\[EXPERIENCE - Keep eye contact\]

\"I\'ve worked at {self.\_format_uk_venues(venues,
profile_data.get(\'venue_types\', \[\]))}.\"

\[SKILLS - Show enthusiasm\]

\"{self.\_format_uk_skills(role, profile_data.get(\'specific_skills\',
\[\]))}\"

\[PERSONALITY - Be yourself\]

\"I\'m {self.\_format_uk_traits(profile_data.get(\'personal_traits\',
\[\]))}.\"

\[CLOSING - Confident finish\]

\"{closing_notes}\"

\"\"\"

return {

\"intro_notes\": intro_notes,

\"experience_notes\": experience_notes,

\"skills_notes\": skills_notes,

\"personality_notes\": personality_notes,

\"closing_notes\": closing_notes,

\"full_text\": full_text,

\"notes_version\": f\"{intro_notes} \| {experience_notes} \|
{skills_notes} \| {personality_notes} \| {closing_notes}\"

}

def \_get_uk_closing(self, role: str) -\> str:

\"\"\"UK-appropriate closing lines for all 46 roles\"\"\"

closings = {

\"Waitstaff\": \"Ready to provide top-notch service\",

\"Bartender\": \"Can\'t wait to pull pints and make cocktails\",

\"Barista\": \"Looking forward to making perfect flat whites\",

\"Barback\": \"Ready to keep your bar running smoothly\",

\"Mixologist\": \"Excited to create amazing cocktails\",

\"Host\": \"Ready to give guests a warm welcome\",

\"Runner\": \"Here to keep service flowing\",

\"Food Runner\": \"Ready to deliver perfect plates\",

\"Head Chef\": \"Ready to cook up a storm\",

\"Sous Chef\": \"Prepared to run any kitchen\",

\"Chef de Partie\": \"Ready to work any section\",

\"Commis Chef\": \"Eager to learn and contribute\",

\"Kitchen Porter\": \"Ready to keep kitchens spotless\",

\"Kitchen Assistant\": \"Here to support your kitchen team\",

\"Catering Assistant\": \"Ready for any event\",

\"Event Staff\": \"Ready to make your event brilliant\",

\"Event Steward\": \"Here to keep events running smoothly\",

\"Security\": \"Here to keep venues safe and sound\",

\"Brand Ambassador\": \"Ready to represent your brand\",

\"AV Technician\": \"Ready to handle all technical needs\",

\"Cleaner\": \"Ready to keep everything spotless\",

\"Housekeeper\": \"Ready to maintain perfect standards\",

\"Cloakroom Attendant\": \"Here to look after belongings\",

\"Receptionist\": \"Ready to be the perfect first impression\",

\"Concierge\": \"Here to make everything possible\",

\"Event Manager\": \"Ready to deliver exceptional events\",

\"Catering Manager\": \"Ready to manage any scale catering\",

\"Bar Manager\": \"Ready to run a profitable bar\",

\"Duty Manager\": \"Ready to take charge\",

\"Floor Supervisor\": \"Ready to lead service teams\",

\"Sommelier\": \"Ready to elevate your wine service\",

\"DJ\": \"Ready to get the crowd moving\",

\"Photographer\": \"Ready to capture perfect moments\",

\"Videographer\": \"Ready to tell your story\",

\"Social Media Assistant\": \"Ready to boost your online presence\",

\"Live Stream Host\": \"Ready to engage audiences\",

\"Pop-up Chef\": \"Ready to create unique experiences\",

\"Vibe Curator\": \"Ready to create amazing atmospheres\",

\"Food Stylist\": \"Ready to make food look incredible\",

\"Wellness Host\": \"Ready to create calm spaces\",

\"Supper Club Host\": \"Ready to host memorable dinners\",

\"Food Blogger\": \"Ready to share food stories\",

\"Food Vlogger\": \"Ready to create engaging content\"

}

return closings.get(role, \"Available for immediate start and keen to
get stuck in\")

## **7. Exhaustive Training Examples**

### **Complete Conversation Flows and Edge Cases**

COMPREHENSIVE_TRAINING_EXAMPLES = {

\"complete_conversations\": \[

{

\"role\": \"Waitstaff\",

\"conversation\": \[

{\"phase\": \"initial_skill\",

\"user\": \"I\'m a waitress with 6 years experience\",

\"agent\": \"Great! You have 6 years experience as Waitstaff. Now help
me understand where you\'ve gained this experience\...\"},

{\"phase\": \"experience_deep_dive\",

\"user\": \"I worked at the Savoy Hotel for 2 years doing silver
service, then at Dishoom for 4 years\",

\"extracted\": {\"venues\": \[\"Savoy Hotel\", \"Dishoom\"\],
\"venue_types\": \[\"hotel\", \"restaurant\"\]},

\"agent\": \"Brilliant experience at luxury hotel and restaurant! Now,
let\'s talk about your qualifications\...\"},

{\"phase\": \"qualifications\",

\"user\": \"Level 2 food hygiene and personal license\",

\"extracted\": {\"qualifications\": \[\"Level 2 Food Hygiene\",
\"Personal License\"\]},

\"agent\": \"Excellent qualifications! Now let\'s highlight what makes
you exceptional as Waitstaff\...\"},

{\"phase\": \"specific_skills_and_languages\",

\"user\": \"Great at wine service, can handle 10 tables, speak English
and French\",

\"extracted\": {\"specific_skills\": \[\"wine service\", \"multi-table
management\"\], \"languages\": \[\"English\", \"French\"\]},

\"agent\": \"You\'re doing brilliantly! Now tell me about you as a
person\...\"},

{\"phase\": \"personal_traits\",

\"user\": \"I\'m calm under pressure, love chatting with customers,
always punctual\",

\"extracted\": {\"personal_traits\": \[\"calm under pressure\",
\"customer-focused\", \"punctual\"\]},

\"agent\": \"Nearly there! Finally, do you have any equipment\...\"},

{\"phase\": \"equipment\",

\"user\": \"I have my own wine opener and black uniform\",

\"extracted\": {\"equipment\": \[\"wine opener\", \"black uniform\"\]},

\"agent\": \"Perfect! Let me create your video bio script\...\"}

\]

},

{

\"role\": \"Bartender\",

\"conversation\": \[

{\"phase\": \"initial_skill\",

\"user\": \"bartender 3 years\",

\"agent\": \"Great! You have 3 years experience as a Bartender\...\"},

{\"phase\": \"experience_deep_dive\",

\"user\": \"Mainly pubs and sports bars, The Kings Arms and All Bar
One\",

\"extracted\": {\"venues\": \[\"The Kings Arms\", \"All Bar One\"\],
\"venue_types\": \[\"pub\", \"sports bar\"\]},

\"agent\": \"Great pub and bar experience!\...\"},

{\"phase\": \"qualifications\",

\"user\": \"personal license, cellar management certificate\",

\"extracted\": {\"qualifications\": \[\"Personal License\", \"Cellar
Management Certificate\"\]},

\"agent\": \"Excellent! Now let\'s highlight your bartending
skills\...\"},

{\"phase\": \"specific_skills_and_languages\",

\"user\": \"Fast cocktails, great with real ales, speak English Spanish
and Portuguese\",

\"extracted\": {\"specific_skills\": \[\"speed cocktails\", \"real ale
knowledge\"\],

\"languages\": \[\"English\", \"Spanish\", \"Portuguese\"\]},

\"agent\": \"Trilingual bartender - impressive!\...\"},

{\"phase\": \"personal_traits\",

\"user\": \"energetic, great banter, team player\",

\"extracted\": {\"personal_traits\": \[\"energetic\", \"personable\",
\"team player\"\]},

\"agent\": \"Nearly there!\...\"},

{\"phase\": \"equipment\",

\"user\": \"own cocktail kit and bar blade\",

\"extracted\": {\"equipment\": \[\"cocktail kit\", \"bar blade\"\]},

\"agent\": \"Perfect! Creating your video bio script\...\"}

\]

},

{

\"role\": \"Chef\",

\"conversation\": \[

{\"phase\": \"initial_skill\",

\"user\": \"I\'ve been a chef for 10 years\",

\"agent\": \"Great! You have 10 years experience as a Head Chef\...\"},

{\"phase\": \"experience_deep_dive\",

\"user\": \"Started at Gordon Ramsay\'s Savoy Grill, then ran kitchens
at gastropubs\",

\"extracted\": {\"venues\": \[\"Savoy Grill\"\], \"venue_types\":
\[\"fine dining\", \"gastropub\"\]},

\"agent\": \"Impressive fine dining and gastropub experience!\...\"},

{\"phase\": \"qualifications\",

\"user\": \"Level 3 food hygiene, advanced nutrition, degree from
Westminster Kingsway\",

\"extracted\": {\"qualifications\": \[\"Level 3 Food Hygiene\",
\"Advanced Nutrition\",

\"Culinary Degree - Westminster Kingsway\"\]},

\"agent\": \"Outstanding qualifications!\...\"},

{\"phase\": \"specific_skills_and_languages\",

\"user\": \"Modern British cuisine, excellent at training staff, manage
200+ covers, English and French kitchen terms\",

\"extracted\": {\"specific_skills\": \[\"modern British\", \"staff
training\", \"high volume\"\],

\"languages\": \[\"English\", \"French (kitchen)\"\]},

\"agent\": \"Excellent leadership and culinary skills!\...\"},

{\"phase\": \"personal_traits\",

\"user\": \"Creative, organized, calm leader, passionate\",

\"extracted\": {\"personal_traits\": \[\"creative\", \"organized\",
\"calm leader\", \"passionate\"\]},

\"agent\": \"Nearly done!\...\"},

{\"phase\": \"equipment\",

\"user\": \"Full knife set, chef whites, thermometer probe\",

\"extracted\": {\"equipment\": \[\"professional knife set\", \"chef
whites\", \"thermometer\"\]},

\"agent\": \"Fully equipped! Creating your video bio script\...\"}

\]

}

\],

\"edge_cases\": \[

{

\"scenario\": \"Unrecognized job title\",

\"user_input\": \"I\'m a molecular gastronomist\",

\"handling\": \"Map to closest standard role\",

\"agent_response\": \"That sounds like specialized chef work. I\'ll set
you up as a Head Chef with molecular gastronomy as a specialty\...\"

},

{

\"scenario\": \"Multiple roles mentioned\",

\"user_input\": \"I do bartending and waiting tables and sometimes help
in kitchen\",

\"handling\": \"Focus on primary skill\",

\"agent_response\": \"You\'re multi-skilled! Let\'s focus on your
primary skill first - which one do you do most often? You can add other
skills to your gigfolio later.\"

},

{

\"scenario\": \"No experience number given\",

\"user_input\": \"I\'m a bartender\",

\"handling\": \"Prompt for years\",

\"agent_response\": \"Great, a Bartender! How many years have you been
bartending? Even if you\'re just starting out, that\'s fine!\"

},

{

\"scenario\": \"Very long experience\",

\"user_input\": \"Been waiting tables since 1985\",

\"handling\": \"Calculate years\",

\"agent_response\": \"Wow! Nearly 40 years experience as Waitstaff -
you\'re a true veteran of the industry!\"

},

{

\"scenario\": \"Student/part-time\",

\"user_input\": \"I\'m a uni student who bartends on weekends\",

\"handling\": \"Accept part-time experience\",

\"agent_response\": \"Perfect! How long have you been bartending on
weekends? Part-time experience absolutely counts!\"

},

{

\"scenario\": \"Career changer\",

\"user_input\": \"Just finished chef training after working in IT\",

\"handling\": \"Welcome new entrants\",

\"agent_response\": \"Welcome to the industry! As a newly qualified
Chef, your training counts as experience. Tell me about where you
trained\...\"

},

{

\"scenario\": \"No qualifications\",

\"user_input\": \"don\'t have any certificates\",

\"handling\": \"Reassure and continue\",

\"agent_response\": \"No problem at all! Your experience speaks for
itself. Many great hospitality workers learn on the job\...\"

},

{

\"scenario\": \"International experience\",

\"user_input\": \"Worked as chef in Paris and New York before London\",

\"handling\": \"Value international experience\",

\"agent_response\": \"International experience is brilliant! Tell me
more about these roles - what type of cuisine and venues?\"

},

{

\"scenario\": \"Overqualified concerns\",

\"user_input\": \"I have a masters degree but just want bar work\",

\"handling\": \"Accept all backgrounds\",

\"agent_response\": \"Education shows commitment and intelligence -
valuable in any role! Let\'s focus on your bar experience\...\"

},

{

\"scenario\": \"Language concerns\",

\"user_input\": \"My English isn\'t perfect\",

\"handling\": \"Encourage multilingual workers\",

\"agent_response\": \"Many customers appreciate multilingual staff! What
languages do you speak? Your English seems fine for hospitality
work\...\"

}

\],

\"data_extraction_examples\": \[

{

\"input\": \"waitress 6 years full time\",

\"extracted\": {

\"role\": \"waitress\",

\"standardized_title\": \"Waitstaff\",

\"years_experience\": 6,

\"experience_type\": \"full-time\"

}

},

{

\"input\": \"I\'ve been doing bar work for about 3-4 years on and off\",

\"extracted\": {

\"role\": \"bar work\",

\"standardized_title\": \"Bartender\",

\"years_experience\": 3,

\"experience_type\": \"mixed\"

}

},

{

\"input\": \"chef de partie with 5 years in French restaurants\",

\"extracted\": {

\"role\": \"chef de partie\",

\"standardized_title\": \"Chef de Partie\",

\"years_experience\": 5,

\"notes\": \"French cuisine experience\"

}

},

{

\"input\": \"Just started as a KP but keen to learn\",

\"extracted\": {

\"role\": \"KP\",

\"standardized_title\": \"Kitchen Porter\",

\"years_experience\": 0,

\"notes\": \"Entry level, eager to learn\"

}

}

\],

\"hashtag_generation_examples\": \[

{

\"profile\": {

\"role\": \"Waitstaff\",

\"years\": 5,

\"venues\": \[\"gastropub\", \"fine dining\"\],

\"skills\": \[\"wine service\", \"upselling\"\],

\"traits\": \[\"professional\", \"calm\"\]

},

\"generated_hashtags\": {

\"skills\": \[\"wine-knowledge\", \"upselling\", \"fine-dining\"\],

\"experience\": \[\"experienced\", \"gastropub\", \"upscale\"\],

\"traits\": \[\"professional\", \"pressure-resistant\"\],

\"venue\": \[\"gastropub\", \"fine-dining\"\]

}

},

{

\"profile\": {

\"role\": \"Bartender\",

\"years\": 2,

\"venues\": \[\"nightclub\", \"cocktail bar\"\],

\"skills\": \[\"mixology\", \"flair\"\],

\"traits\": \[\"energetic\", \"creative\"\]

},

\"generated_hashtags\": {

\"skills\": \[\"mixology\", \"flair\", \"cocktail-creation\"\],

\"experience\": \[\"developing-professional\", \"nightlife\"\],

\"traits\": \[\"energetic\", \"creative\", \"showmanship\"\],

\"venue\": \[\"nightclub\", \"cocktail-bar\"\]

}

}

\]

}

## **8. UK-Specific Configuration**

### **Complete UK Settings and Compliance**

UK_HOSPITALITY_CONFIG = {

\"currency\": \"GBP\",

\"currency_symbol\": \"£\",

\"minimum_wage\": 11.44, \# UK National Living Wage 2024

\"typical_rates\": {

\"Waitstaff\": \"£12-15/hour\",

\"Bartender\": \"£13-16/hour\",

\"Barista\": \"£11.50-14/hour\",

\"Barback\": \"£11.44-13/hour\",

\"Mixologist\": \"£14-18/hour\",

\"Host\": \"£11.50-14/hour\",

\"Runner\": \"£11.44-13/hour\",

\"Food Runner\": \"£11.44-13/hour\",

\"Head Chef\": \"£18-30/hour\",

\"Sous Chef\": \"£15-22/hour\",

\"Chef de Partie\": \"£13-18/hour\",

\"Commis Chef\": \"£11.44-14/hour\",

\"Kitchen Porter\": \"£11.44-13/hour\",

\"Kitchen Assistant\": \"£11.44-13/hour\",

\"Catering Assistant\": \"£11.44-14/hour\",

\"Event Staff\": \"£12-15/hour\",

\"Event Steward\": \"£12-14/hour\",

\"Security\": \"£14-18/hour\",

\"Brand Ambassador\": \"£15-25/hour\",

\"AV Technician\": \"£15-25/hour\",

\"Cleaner\": \"£11.44-13/hour\",

\"Housekeeper\": \"£11.44-14/hour\",

\"Cloakroom Attendant\": \"£11.44-12/hour\",

\"Receptionist\": \"£12-15/hour\",

\"Concierge\": \"£13-18/hour\",

\"Event Manager\": \"£20-35/hour\",

\"Catering Manager\": \"£18-28/hour\",

\"Bar Manager\": \"£15-22/hour\",

\"Duty Manager\": \"£15-20/hour\",

\"Floor Supervisor\": \"£13-17/hour\",

\"Sommelier\": \"£15-25/hour\",

\"DJ\": \"£20-50/hour\",

\"Photographer\": \"£25-50/hour\",

\"Videographer\": \"£25-50/hour\",

\"Social Media Assistant\": \"£15-25/hour\",

\"Live Stream Host\": \"£20-35/hour\",

\"Pop-up Chef\": \"£20-35/hour\",

\"Vibe Curator\": \"£20-40/hour\",

\"Food Stylist\": \"£25-45/hour\",

\"Wellness Host\": \"£20-35/hour\",

\"Supper Club Host\": \"£25-45/hour\",

\"Food Blogger\": \"£20-35/hour\",

\"Food Vlogger\": \"£20-35/hour\"

},

\"common_qualifications\": {

\"food_hygiene\": \[

\"Level 1 Food Safety\",

\"Level 2 Food Hygiene\",

\"Level 3 Food Hygiene\"

\],

\"alcohol\": \[

\"Personal License\",

\"Award for Personal License Holders (APLH)\",

\"BIIAB Level 2\"

\],

\"security\": \[

\"SIA Door Supervisor\",

\"SIA CCTV Operator\",

\"SIA Close Protection\",

\"SIA Security Guarding\"

\],

\"first_aid\": \[

\"Emergency First Aid at Work\",

\"First Aid at Work (3-day)\",

\"Paediatric First Aid\"

\],

\"fire_safety\": \[

\"Fire Marshal Training\",

\"Fire Warden Certificate\"

\],

\"wine\": \[

\"WSET Level 1\",

\"WSET Level 2\",

\"WSET Level 3\",

\"Court of Master Sommeliers\"

\],

\"coffee\": \[

\"SCA Barista Skills\",

\"City & Guilds Barista\"

\]

},

\"london_areas\": {

\"central\": \[\"Soho\", \"Covent Garden\", \"Mayfair\", \"Fitzrovia\",
\"Marylebone\"\],

\"city\": \[\"The City\", \"Liverpool Street\", \"Bank\",
\"Moorgate\"\],

\"east\": \[\"Shoreditch\", \"Hackney\", \"Dalston\", \"Stratford\",
\"Canary Wharf\"\],

\"west\": \[\"Chelsea\", \"Kensington\", \"Notting Hill\",
\"Hammersmith\", \"Fulham\"\],

\"south\": \[\"Brixton\", \"Clapham\", \"Peckham\", \"Greenwich\",
\"Southbank\"\],

\"north\": \[\"Camden\", \"Islington\", \"King\'s Cross\",
\"Hampstead\", \"Highgate\"\]

},

\"major_venues\": \[

\"O2 Arena\", \"ExCeL London\", \"Olympia\", \"Alexandra Palace\",

\"Wembley Stadium\", \"Emirates Stadium\", \"The Oval\",

\"Royal Albert Hall\", \"Barbican Centre\", \"Roundhouse\",

\"Natural History Museum\", \"Science Museum\", \"V&A\",

\"The Shard\", \"Sky Garden\", \"Tower of London\",

\"Hyde Park\", \"Regent\'s Park\", \"Victoria Park\"

\],

\"chain_venues\": {

\"pubs\": \[\"Wetherspoons\", \"Fuller\'s\", \"Young\'s\", \"Greene
King\"\],

\"restaurants\": \[\"Nando\'s\", \"Pizza Express\", \"Wagamama\",
\"Bills\", \"Côte\"\],

\"coffee\": \[\"Pret\", \"Costa\", \"Caffè Nero\", \"Starbucks\",
\"Greggs\"\],

\"hotels\": \[\"Premier Inn\", \"Travelodge\", \"Hilton\", \"Marriott\",
\"Holiday Inn\"\]

},

\"dietary_requirements\": \[

\"Vegetarian\",

\"Vegan\",

\"Gluten-free\",

\"Dairy-free\",

\"Halal\",

\"Kosher\",

\"Nut allergies\",

\"Shellfish allergies\",

\"Coeliac\"

\],

\"compliance\": {

\"Challenge 25\": \"Proof of age for alcohol/tobacco sales\",

\"Challenge 21\": \"Some venues use Challenge 21\",

\"Natasha\'s Law\": \"Full allergen labeling on pre-packed food\",

\"COSHH\": \"Control of Substances Hazardous to Health\",

\"RIDDOR\": \"Reporting of Injuries, Diseases and Dangerous
Occurrences\",

\"GDPR\": \"General Data Protection Regulation\",

\"Licensing Act 2003\": \"Alcohol licensing laws\",

\"Health & Safety at Work Act\": \"Workplace safety requirements\",

\"Food Safety Act\": \"Food hygiene standards\",

\"Equality Act 2010\": \"Anti-discrimination law\"

},

\"peak_seasons\": {

\"Christmas\": \"November-December (party season)\",

\"Summer\": \"June-August (tourists, festivals)\",

\"Easter\": \"March-April\",

\"New Year\": \"December 31-January 1\",

\"Valentine\'s\": \"February 14\",

\"Mother\'s Day\": \"March (UK date)\",

\"Bank Holidays\": \"Various long weekends\"

},

\"major_events\": {

\"sports\": \[\"Six Nations\", \"Wimbledon\", \"Premier League\",
\"London Marathon\"\],

\"cultural\": \[\"Notting Hill Carnival\", \"Pride\", \"Winter
Wonderland\"\],

\"business\": \[\"London Fashion Week\", \"Tech Week\", \"Finance
conferences\"\]

}

}

## **9. Integration Notes**

### **Calendar Integration**

class CalendarIntegration:

\"\"\"

Integration with existing bookable calendar feature

References the calendar synchronization already implemented in beta

\"\"\"

def redirect_to_calendar_setup(self, user_id: str) -\> str:

\"\"\"

After onboarding completion, direct to calendar setup

The calendar feature is already built according to documentation:

\- Bookable calendars: Yes (Beta features)

\- Calendar synchronisation (Architecture doc)

\"\"\"

return \"\"\"

Your gigfolio is nearly complete!

Next step: Set your availability using our bookable calendar feature.

The calendar shows buyers exactly when you\'re free - no more
back-and-forth messaging!

You can:

• Set regular availability (e.g., \"Every weekend\")

• Block out holidays and busy periods

• Update on the go from your phone

• Auto-sync with your other calendars

\<insert calendar journey\>

\"\"\"

### **Database Schema**

\# PostgreSQL schema for gigfolio storage

\"\"\"

CREATE TABLE gigfolio_profiles (

id SERIAL PRIMARY KEY,

user_id INTEGER REFERENCES users(id),

standardized_title VARCHAR(100),

years_experience INTEGER,

\-- JSON fields for flexible data

venues JSONB,

venue_types JSONB,

qualifications JSONB,

specific_skills JSONB,

personal_traits JSONB,

equipment JSONB,

languages JSONB,

\-- Hashtags for matching

skill_hashtags JSONB,

experience_hashtags JSONB,

trait_hashtags JSONB,

venue_hashtags JSONB,

\-- Video bio

video_bio_script TEXT,

video_bio_url VARCHAR(500),

\-- Metadata

completion_percentage FLOAT,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE conversation_states (

id SERIAL PRIMARY KEY,

user_id INTEGER REFERENCES users(id),

current_phase VARCHAR(50),

completed_phases JSONB,

collected_data JSONB,

last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

\-- Indexes for performance

CREATE INDEX idx_gigfolio_user ON gigfolio_profiles(user_id);

CREATE INDEX idx_gigfolio_title ON
gigfolio_profiles(standardized_title);

CREATE INDEX idx_gigfolio_hashtags ON gigfolio_profiles USING GIN
(skill_hashtags);

\"\"\"

### **API Endpoints**

\# FastAPI endpoints for onboarding

\"\"\"

POST /api/onboarding/start

\- Initialize onboarding for new user

POST /api/onboarding/message

\- Process user message in onboarding flow

\- Body: {user_id, message}

\- Returns: {response, phase, collected_data}

GET /api/onboarding/status/{user_id}

\- Get current onboarding status

POST /api/onboarding/complete/{user_id}

\- Finalize gigfolio creation

GET /api/gigfolio/{user_id}

\- Retrieve completed gigfolio

PUT /api/gigfolio/{user_id}

\- Update gigfolio details

POST /api/video-bio/script/{user_id}

\- Generate video bio script

\"\"\"

## **Implementation Summary**

This document provides:

1.  **Complete standardization** for all 46 job types with alternatives

2.  **6-phase onboarding flow** optimized for user experience

3.  **Comprehensive hashtag system** for all roles enabling smart
    > matching

4.  **UK-specific content** throughout including rates, venues, and
    > compliance

5.  **Language collection** integrated into skills phase

6.  **Video bio generation** with note-taking guidance for natural
    > delivery

7.  **Exhaustive training examples** covering edge cases and full
    > conversations

8.  **Calendar integration** referencing existing bookable calendar
    > feature

9.  **Database schema** and API endpoints for implementation

The system is designed to be:

-   **Modular**: Each component can be updated independently

-   **Scalable**: Ready for expansion beyond hospitality

-   **UK-optimized**: Appropriate for London launch

-   **Developer-friendly**: Clear Python implementation with
    > documentation

-   **User-focused**: Natural conversation flow with helpful guidance

This implementation maintains Able\'s values of \"Be Good, Be Fair, Be
Kind\" while creating comprehensive gigfolios that empower workers and
simplify hiring.
