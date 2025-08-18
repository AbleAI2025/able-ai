import styles from './Loader.module.css';

interface LoaderProps {
  customClass?: string; // para className
  customStyle?: React.CSSProperties; // para style en línea
}

const Loader = ({ customClass, customStyle }: LoaderProps) => {
  return (
    <div
      className={customClass || styles.loadingContainer}
      style={customStyle}
    >
      <div className={styles.loader}></div>
    </div>
  );
};

export default Loader;
