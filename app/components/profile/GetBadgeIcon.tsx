import Logo from "../brand/Logo";
import { 
  Banknote, 
  CalendarCheck2, 
  ChefHat, 
  Coffee,
  Flag,
  Handshake,
  Heart,
  InfinityIcon,
  Martini,
  Moon,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  User,
  UserPlus,
  Utensils
} from "lucide-react";
import styles from './AwardDisplayBadge.module.css';

export type BadgeId =
  | "goldenVibes"
  | "fairPlay"
  | "heartMode"
  | "alphaGigee"
  | "gigPioneer"
  | "firstGigComplete"
  | "hostWithTheMost"
  | "foamArtPhenom"
  | "firstImpressionsPro"
  | "eventSetupHero"
  | "cashAndTillStylin"
  | "customerFavourite"
  | "squadRecruiter"
  | "safeGuardGoat"
  | "sparkleMode"
  | "mixologyMaster"
  | "starBartender"
  | "trayJedi"
  | "topChef"
  | "firstHire"
  | "shiftLeader"
  | "bossLevel++"
  | "safeShiftHost"
  | "inclusiveBooker"
  | "breaksMatter";

const getIconFromAwardName = (awardName: BadgeId) => {
  switch (awardName) {
    // badges for all users
    case "goldenVibes":
    case "fairPlay":
    case "heartMode":
      return <Logo width={30} height={30}/>;

    // awards for early joiners
    case "alphaGigee":
    case "gigPioneer":
      return <Flag color="#eab308" fill="#eab308" strokeWidth={3} className={styles.awardIcon} />;

    // worker badges
    case "firstGigComplete":
    case "hostWithTheMost":
      return <Trophy color="#41a1e8" strokeWidth={3} className={styles.awardIcon} />;
    case "foamArtPhenom":
      return <Coffee color="#41a1e8" strokeWidth={3} className={styles.awardIcon} />;
    case "firstImpressionsPro":
      return <Handshake color="#41a1e8" strokeWidth={3} className={styles.awardIcon} />;
    case "eventSetupHero":
      return <CalendarCheck2 color="#41a1e8" strokeWidth={3} className={styles.awardIcon} />;
    case "cashAndTillStylin":
      return <Banknote color="#41a1e8" strokeWidth={3} className={styles.awardIcon} />;
    case "customerFavourite":
      return <Heart color="#41a1e8" strokeWidth={3} className={styles.awardIcon} />;
    case "squadRecruiter":
      return <UserPlus color="#41a1e8" strokeWidth={3} className={styles.awardIcon} />;
    case "safeGuardGoat":
      return <ShieldCheck color="#41a1e8" strokeWidth={3} className={styles.awardIcon} />;
    case "sparkleMode":
      return <Sparkles color="#41a1e8" strokeWidth={3} className={styles.awardIcon} />;
    case "mixologyMaster":
      return <Martini color="#41a1e8" strokeWidth={3} className={styles.awardIcon} />;
    case "starBartender":
      return <Star color="#41a1e8" strokeWidth={3} className={styles.awardIcon} />;
    case "trayJedi":
      return <Utensils color="#41a1e8" strokeWidth={3} className={styles.awardIcon} />;
    case "topChef":
      return <ChefHat color="#41a1e8" strokeWidth={3} className={styles.awardIcon} />;

    // buyer badges
    case "firstHire":
    case "shiftLeader":
      return <Star color="#7eeef9" fill="#7eeef9" strokeWidth={3} className={styles.awardIcon} />;
    case "bossLevel++":
      return <User color="#7eeef9" strokeWidth={3} className={styles.awardIcon} />;
    case "safeShiftHost":
      return <ShieldCheck color="#7eeef9" strokeWidth={3} className={styles.awardIcon} />;
    case "inclusiveBooker":
      return <InfinityIcon color="#7eeef9" strokeWidth={3} className={styles.awardIcon} />;
    case "breaksMatter":
      return <Moon color="#7eeef9" strokeWidth={3} className={styles.awardIcon} />;

    default:
      return;
  }
};

export default getIconFromAwardName;
