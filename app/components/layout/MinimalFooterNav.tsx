import React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import styles from './MinimalFooterNav.module.css';
import { usePathname } from 'next/navigation'; // If active state is needed

const MinimalFooterNav: React.FC = () => {
  const pathname = usePathname(); // Example for active state
  // Define navigation items if more than one
  // const navItems = [{ href: '/dashboard', icon: Home, label: 'Home' }];

  return (
    <footer className={styles.footerNav}>
      <Link href="/dashboard" className={`${styles.navItem} ${pathname === '/dashboard' ? styles.active : ''}`}>
        <Home size={24} className={styles.navIcon} />
        {/* Optional: <span className={styles.navLabel}>Home</span> */}
      </Link>
      {/* Add more items if needed */}
    </footer>
  );
};
export default MinimalFooterNav; 