import Image from "next/image";
import Link from "next/link"
import styles from './Notification.module.css'
import { useAuth } from "@/context/AuthContext";

interface NotificationProps {
    handleClick: () => void;
    unreadCount: number;
    unreadNotifications: number;
}


const Notification = ({ handleClick, unreadCount, unreadNotifications }: NotificationProps) => {
    const {user} = useAuth()
  return (
      <Link
            href={`/user/${user?.uid}/notifications`}
            passHref
            onClick={handleClick}
        >
            <button
                className={styles.notificationButton}
                aria-label="Notifications"
            >
                <Image
                    src="/images/notifications.svg"
                    alt="Notifications"
                    width={40}
                    height={40}
                />
            </button>
            {unreadCount > 0 || unreadNotifications > 0 ? (
                <span
                    className={styles.notificationBadge}
                >
                    {unreadCount > 0 ? unreadCount : unreadNotifications}
                </span>
            ) : null}
        </Link>
  )
}

export default Notification
