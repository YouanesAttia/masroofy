// ── Skeleton primitives ───────────────────────────────────────

interface SkeletonLineProps {
  width?: string;
  height?: string;
  className?: string;
}

export function SkeletonLine({
  width = "100%",
  height = "h-3",
  className = "",
}: SkeletonLineProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full ${height} ${className}`}
      style={{ width }}
    />
  );
}

interface SkeletonCircleProps {
  size?: string;
}

export function SkeletonCircle({ size = "w-10 h-10" }: SkeletonCircleProps) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full ${size}`} />
  );
}

export function SkeletonCard({ children }: { children?: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 space-y-3 animate-pulse">
      {children ?? (
        <>
          <SkeletonLine height="h-4" width="40%" />
          <SkeletonLine height="h-3" width="70%" />
          <SkeletonLine height="h-3" width="55%" />
        </>
      )}
    </div>
  );
}

// ── Dashboard skeleton ────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="px-4 pt-4 space-y-4">
      {/* Budget ring card */}
      <SkeletonCard>
        <div className="flex justify-center py-2">
          <SkeletonCircle size="w-44 h-44" />
        </div>
        <SkeletonLine height="h-3" width="60%" className="mx-auto" />
        <SkeletonLine height="h-2" width="40%" className="mx-auto" />
      </SkeletonCard>

      {/* Pills */}
      <div className="flex gap-2">
        {[80, 72, 88, 64].map((w, i) => (
          <div
            key={i}
            className="h-8 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full"
            style={{ width: w }}
          />
        ))}
      </div>

      {/* Recent expenses card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700">
          <SkeletonLine height="h-4" width="35%" />
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-700">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <SkeletonCircle size="w-10 h-10" />
              <div className="flex-1 space-y-2">
                <SkeletonLine height="h-3" width="55%" />
                <SkeletonLine height="h-2" width="30%" />
              </div>
              <SkeletonLine height="h-3" width="64px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── History skeleton ──────────────────────────────────────────
export function HistorySkeleton() {
  return (
    <div className="px-4 pt-2 space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center gap-3 animate-pulse"
        >
          <SkeletonCircle size="w-10 h-10" />
          <div className="flex-1 space-y-2">
            <SkeletonLine height="h-3" width="58%" />
            <SkeletonLine height="h-2" width="35%" />
          </div>
          <SkeletonLine height="h-3" width="64px" />
        </div>
      ))}
    </div>
  );
}

// ── Insights skeleton ─────────────────────────────────────────
export function InsightsSkeleton() {
  return (
    <div className="px-4 pt-4 space-y-4 animate-pulse">
      <SkeletonCard>
        <SkeletonLine height="h-4" width="35%" />
        <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded-xl" />
      </SkeletonCard>
      <SkeletonCard>
        <SkeletonLine height="h-4" width="35%" />
        <div className="h-40 bg-gray-100 dark:bg-gray-700 rounded-xl" />
        {[1,2,3].map(i => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonCircle size="w-3 h-3" />
            <SkeletonLine height="h-3" />
            <SkeletonLine height="h-3" width="64px" />
          </div>
        ))}
      </SkeletonCard>
    </div>
  );
}