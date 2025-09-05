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
  Utensils,
} from "lucide-react";
import styles from "./AwardDisplayBadge.module.css";

export type BadgeIcon =
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

const getIconFromAwardName = (awardName: BadgeIcon) => {
  switch (awardName) {
    // badges for all users
    case "goldenVibes":
    case "fairPlay":
    case "heartMode":
      return <Logo width={30} height={30} />;

    // awards for early joiners
    case "alphaGigee":
    case "gigPioneer":
      return (
        <Flag
          fill="#eab308"
          className={`${styles.awardIcon} ${styles.commonIcon}`}
        />
      );

    // worker badges
    case "firstGigComplete":
    case "hostWithTheMost":
      return <Trophy className={`${styles.awardIcon} ${styles.workerIcon}`} />;
    case "foamArtPhenom":
      return <Coffee className={`${styles.awardIcon} ${styles.workerIcon}`} />;
    case "firstImpressionsPro":
      return (
        <Handshake className={`${styles.awardIcon} ${styles.workerIcon}`} />
      );
    case "eventSetupHero":
      return (
        <CalendarCheck2
          className={`${styles.awardIcon} ${styles.workerIcon}`}
        />
      );
    case "cashAndTillStylin":
      return (
        <Banknote className={`${styles.awardIcon} ${styles.workerIcon}`} />
      );
    case "customerFavourite":
      return <Heart className={`${styles.awardIcon} ${styles.workerIcon}`} />;
    case "squadRecruiter":
      return (
        <UserPlus className={`${styles.awardIcon} ${styles.workerIcon}`} />
      );
    case "safeGuardGoat":
      return (
        <ShieldCheck className={`${styles.awardIcon} ${styles.workerIcon}`} />
      );
    case "sparkleMode":
      return (
        <Sparkles className={`${styles.awardIcon} ${styles.workerIcon}`} />
      );
    case "mixologyMaster":
      return <Martini className={`${styles.awardIcon} ${styles.workerIcon}`} />;
    case "starBartender":
      return <Star className={`${styles.awardIcon} ${styles.workerIcon}`} />;
    case "trayJedi":
      return (
        <Utensils className={`${styles.awardIcon} ${styles.workerIcon}`} />
      );
    case "topChef":
      return <ChefHat className={`${styles.awardIcon} ${styles.workerIcon}`} />;

    // buyer badges
    case "firstHire":
    case "shiftLeader":
      return <Star className={`${styles.awardIcon} ${styles.buyerIcon}`} />;
    case "bossLevel++":
      return <User className={`${styles.awardIcon} ${styles.buyerIcon}`} />;
    case "safeShiftHost":
      return (
        <ShieldCheck className={`${styles.awardIcon} ${styles.buyerIcon}`} />
      );
    case "inclusiveBooker":
      return (
        <InfinityIcon className={`${styles.awardIcon} ${styles.buyerIcon}`} />
      );
    case "breaksMatter":
      return <Moon className={`${styles.awardIcon} ${styles.buyerIcon}`} />;

    default:
      return;
  }
};

export default getIconFromAwardName;
