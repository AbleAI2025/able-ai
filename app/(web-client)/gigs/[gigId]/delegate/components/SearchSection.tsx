import React from 'react';
import SearchInput from '@/app/components/forms/SearchInput';
import { SearchFilters } from '../types';
import styles from '../DelegateGigPage.module.css';

interface SearchSectionProps {
  filters: SearchFilters;
  updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
}

export default function SearchSection({ filters, updateFilter, showFilters, setShowFilters }: SearchSectionProps) {
  return (
    <div className={styles.searchSection}>
      <SearchInput
        value={filters.searchTerm}
        onChange={(value) => updateFilter('searchTerm', value)}
        placeholder="Search by name, skill, or location..."
        className={styles.searchInputArea}
      />
      <button
        className={styles.filterToggle}
        onClick={() => setShowFilters(!showFilters)}
      >
        Filters {showFilters ? '▲' : '▼'}
      </button>
    </div>
  );
}