import React from 'react';
import Image from 'next/image';
import styles from './Logo.module.css';

const Logo = ({ width = 260, height = 260 }) => {

  return (
      <Image
        src="/images/ableai.png"
        alt="App Logo"
        width={width}
        height={height}
        className={styles.logo}
      />
  );
};
export default Logo;