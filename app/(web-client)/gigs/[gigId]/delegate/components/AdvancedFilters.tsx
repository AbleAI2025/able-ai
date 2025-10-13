import React from 'react';
import { SearchFilters } from '../types';
import styles from '../DelegateGigPage.module.css';

interface AdvancedFiltersProps {
  filters: SearchFilters;
  updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  clearFilters: () => void;
}

export default function AdvancedFilters({ filters, updateFilter, clearFilters }: AdvancedFiltersProps) {
  return (
    <div className={styles.filtersSection}>
      <div className={styles.filterRow}>
        <div className={styles.filterGroup}>
          <label htmlFor="min-experience">Min Experience (years)</label>
          <input
            id="min-experience"
            type="number"
            min="0"
            value={filters.minExperience ?? ''}
            onChange={(e) => updateFilter('minExperience', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="0"
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Rate Range (£)</label>
          <div className={styles.rateRange}>
            <input
              type="number"
              min="0"
              value={filters.minRate || ''}
              onChange={(e) => updateFilter('minRate', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Min"
            />
            <span>-</span>
            <input
              type="number"
              min="0"
              value={filters.maxRate || ''}
              onChange={(e) => updateFilter('maxRate', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Max"
            />
          </div>
        </div>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.filterGroup}>
          <label htmlFor="sort-by">Sort By</label>
          <select
            id="sort-by"
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value as SearchFilters['sortBy'])}
          >
            <option value="relevance">Best Match</option>
            <option value="distance">Distance</option>
            <option value="experience">Experience</option>
            <option value="rate">Rate</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>
            <input
              type="checkbox"
              checked={filters.availableOnly}
              onChange={(e) => updateFilter('availableOnly', e.target.checked)}
            />
            Available Only
          </label>
        </div>
      </div>

      <div className={styles.filterActions}>
        <button onClick={clearFilters} className={styles.clearFilters}>
          Clear Filters
        </button>
      </div>
    </div>
  );
}