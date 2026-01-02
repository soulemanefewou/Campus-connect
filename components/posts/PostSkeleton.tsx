// components/posts/PostSkeleton.tsx
export function PostSkeleton() {
  return (
    <div className="flex overflow-hidden border border-gray-200 bg-white rounded-lg">
      {/* Sidebar de vote */}
      <div className="w-12 flex flex-col items-center py-3 bg-gray-50">
        <div className="h-7 w-7 rounded-full bg-gray-200 mb-2"></div>
        <div className="h-4 w-6 bg-gray-200 rounded my-1"></div>
        <div className="h-7 w-7 rounded-full bg-gray-200 mt-2"></div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 p-3">
        {/* Métadonnées */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-5 rounded-full bg-gray-200"></div>
          <div className="h-3 w-20 bg-gray-200 rounded"></div>
          <div className="h-3 w-16 bg-gray-200 rounded"></div>
        </div>

        {/* Titre */}
        <div className="h-5 w-full bg-gray-200 rounded mb-4"></div>
        <div className="h-4 w-3/4 bg-gray-200 rounded mb-4"></div>

        {/* Contenu */}
        <div className="space-y-2 mb-3">
          <div className="h-3 w-full bg-gray-200 rounded"></div>
          <div className="h-3 w-11/12 bg-gray-200 rounded"></div>
          <div className="h-3 w-10/12 bg-gray-200 rounded"></div>
        </div>

        {/* Image placeholder */}
        <div className="h-48 w-full bg-gray-200 rounded-md mb-3"></div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-4">
          <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
          <div className="h-8 w-20 bg-gray-200 rounded-full"></div>
          <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}