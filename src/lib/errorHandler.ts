import type { useToast } from "@/hooks/use-toast";

export const createErrorHandler = (toast: ReturnType<typeof useToast>['toast']) => {
  return (error: any, fallbackMessage: string) => {
    console.error(error);
    
    // Extract meaningful message from various error formats
    const message = error?.message 
      || error?.error_description 
      || error?.hint
      || fallbackMessage;
    
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  };
};

/**
 * Centralized error logger for consistent error tracking
 */
export const logError = (context: string, error: any, metadata?: Record<string, any>) => {
  console.error(`[${context}]`, error, metadata || {});
  
  // Future: Send to error tracking service (Sentry, etc.)
};
