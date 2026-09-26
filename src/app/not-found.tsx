import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HouseIcon as Home, CompassIcon as Compass } from '@phosphor-icons/react/ssr';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-lg p-8 md:p-12 text-center space-y-6">
        <div className="inline-flex items-center justify-center rounded-full border border-border bg-muted/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Compass aria-hidden="true" focusable="false" className="mr-2 h-4 w-4" />
          404 - Page Not Found
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Lost your path?</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or may have moved. Use the button below to return to the
            main entry point of the app.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="default" size="lg" className="min-w-[200px]">
            <Link href="/">
              <Home aria-hidden="true" focusable="false" className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
