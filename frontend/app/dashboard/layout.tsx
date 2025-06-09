// Dashboard Layout - Server Component with modern React 19 patterns
import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { 
  SidebarInset, 
  SidebarProvider,
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/components/protected-route";
import { Skeleton } from "@/components/ui/skeleton";

// Loading components for Suspense boundaries
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex items-center gap-2 h-12 px-4">
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-6 w-32" />
    </div>
  );
}

// Server Component Layout with nested loading states
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        {/* Sidebar with loading boundary */}
        <Suspense fallback={<div className="w-72 bg-muted" />}>
          <AppSidebar variant="inset" />
        </Suspense>
        
        <SidebarInset>
          <div className="flex flex-1 flex-col">
            {/* Header with Suspense boundary */}
            <Suspense fallback={<HeaderSkeleton />}>
              <header className="sticky top-0 z-40 flex h-[--header-height] shrink-0 items-center gap-2 bg-background/80 px-4 backdrop-blur lg:px-6">
                <SidebarTrigger />
                <nav aria-label="Dashboard navigation" className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Dashboard
                  </span>
                </nav>
              </header>
            </Suspense>
            
            {/* Main content area with container queries */}
            <div className="@container/main flex flex-1 flex-col">
              <main id="main-content" className="flex-1">
                {/* Nested Suspense for dashboard content */}
                <Suspense fallback={<DashboardSkeleton />}>
                  {children}
                </Suspense>
              </main>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}

// Export metadata for this layout
export const metadata = {
  title: "Dashboard",
  description: "Modern B2B SaaS dashboard with real-time analytics and lead management",
};