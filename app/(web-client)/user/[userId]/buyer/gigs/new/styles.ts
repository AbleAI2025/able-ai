export const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  summaryContainer: {
    background: '#222',
    color: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: '16px 0',
    boxShadow: '0 2px 8px #0002'
  },
  summaryHeading: {
    marginTop: 0
  },
  summaryList: {
    listStyle: 'none',
    padding: 0
  },
  summaryListItem: {
    marginBottom: 8
  },
  summaryLabel: {
    textTransform: 'capitalize'
  },
  sanitizedStep: {
    background: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    margin: '16px 0',
    boxShadow: '0 2px 8px #0001'
  },
  sanitizedPrompt: {
    marginBottom: 8,
    color: '#0f766e',
    fontWeight: 600
  },
  sanitizedContent: {
    marginBottom: 12,
    fontStyle: 'italic'
  },
  buttonContainer: {
    display: 'flex',
    gap: 12
  },
  primaryButton: {
    background: '#0f766e',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 16px',
    fontWeight: 600
  },
  secondaryButton: {
    background: '#fff',
    color: '#0f766e',
    border: '1px solid #0f766e',
    borderRadius: 8,
    padding: '8px 16px',
    fontWeight: 600
  },
  locationExpandableText: {
    cursor: 'pointer',
    wordBreak: 'break-all',
    display: 'inline-block',
    verticalAlign: 'bottom'
  }
} as const;
