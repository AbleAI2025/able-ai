// Helper for error handling
export function handleError(error: unknown) {
  console.error("Error fetching gig:", error);
  return {
    success: false,
    error: error instanceof Error ? error.message : "Unknown error",
    data: {} as any,
    status: 500,
  };
}
