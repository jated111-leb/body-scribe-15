import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
}

export const ErrorFallback = ({ error, onReset }: ErrorFallbackProps) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
    onReset?.();
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertCircle className="h-6 w-6" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>
            We encountered an unexpected error. Don't worry, your data is safe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-mono text-muted-foreground break-all">
                {error.message}
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleRetry}
              variant="default"
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            If this problem persists, please contact{" "}
            <a href="mailto:support@aurahealth.app" className="text-primary underline">
              support@aurahealth.app
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
