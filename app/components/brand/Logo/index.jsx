import React from 'react';
import Image from 'next/image';
import styles from './Logo.module.css';
// import Link from 'next/link';
// import { useAuth } from '@/context/AuthContext';

const Logo = ({ width = 260, height = 260 }) => {
  // const { user } = useAuth();

  return (
    // <Link href={`/user/${user?.uid}/able-ai`} className={styles.logoLink}>
      <Image
        src="/images/ableai.png"
        alt="App Logo"
        width={width}
        height={height}
        className={styles.logo}
      />
    // </Link>
  );
};
export default Logo;