import React from 'react';
import { ArrowLeft } from 'lucide-react';
import styles from './ScreenHeaderWithBack.module.css';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Logo from '../brand/Logo';
import { usePathname } from 'next/navigation';
import Notification from '../shared/Notification';
import Image from 'next/image';



type OtherpageProps = {
  isHomePage?: boolean;
  title?: string;
  onBackClick: () => void;
}

type HomePageProps =  {
  isHomePage: boolean;
  title?: string;
  onBackClick: () => void;
  handleClick: () => void;
  unreadCount: number;
  unreadNotifications: number;
}

type ScreenHeaderWithBackProps = HomePageProps | OtherpageProps;
  

const ScreenHeaderWithBack: React.FC<ScreenHeaderWithBackProps> = (props) => {
  const { user } = useAuth();
  const route = usePathname();
  const { isHomePage, title, onBackClick, handleClick, unreadCount, unreadNotifications } = props as HomePageProps;

  const isChatPage = route.includes('/able-ai');

  return (
    <header className={styles.header}>
      {!isHomePage ? (
        <button onClick={onBackClick} className={styles.backButton} aria-label="Go back">
          <ArrowLeft size={20}/>
        </button>
      ) : (
        <Image src="/images/home.svg" alt="Back" width={40} height={40} />
      )}
      {title && <h1 className={styles.title}>{title}</h1>}
      <Link href={`/users/${user?.uid}/able-ai`} className={styles.chat}>
          {!isChatPage ? (
            <><span>Chat with Able</span><Logo width={30} height={30} /></> ) : (
            <Logo width={40} height={40} />
          )}   
      </Link>
      {isHomePage && (
        <Notification 
          uid={user?.uid} 
          handleClick={handleClick} 
          unreadCount={unreadCount} 
          unreadNotifications={unreadNotifications} 
        />
      )}
    </header>
  );
};
export default ScreenHeaderWithBack;