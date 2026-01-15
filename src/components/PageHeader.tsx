import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backPath?: string;
  rightContent?: React.ReactNode;
  showLogo?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  showBack = true,
  backPath = '/',
  rightContent,
  showLogo = false,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(backPath)}
              className="touch-button"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {showLogo && (
            <img
              src="/logo-small.png"
              alt="Hotel Yonanda"
              className="h-10 w-10 object-contain"
              draggable={false}
            />
          )}
          <div>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {rightContent && <div>{rightContent}</div>}
      </div>
    </header>
  );
}
