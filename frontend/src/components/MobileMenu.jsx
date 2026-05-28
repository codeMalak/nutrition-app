export default function MobileMenu({ open, onClose }) {
  return (
    <div
      className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Dark backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/75 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Full-screen menu panel */}
      <div
        className={`absolute inset-x-0 bottom-0 top-0 bg-white transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Navigation
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose where you want to go
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 text-2xl text-gray-700 active:scale-95"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Options */}
        <nav className="px-4 py-5 space-y-3">
          <a
            href="#search"
            onClick={onClose}
            className="block w-full rounded-2xl bg-gray-50 px-5 py-5 text-lg font-semibold text-gray-900 shadow-sm active:scale-[0.99] active:bg-gray-100"
          >
            Search Foods
            <p className="text-sm font-normal text-gray-500 mt-1">
              Find foods from the USDA database
            </p>
          </a>

          <a
            href="#summary"
            onClick={onClose}
            className="block w-full rounded-2xl bg-gray-50 px-5 py-5 text-lg font-semibold text-gray-900 shadow-sm active:scale-[0.99] active:bg-gray-100"
          >
            Daily Summary
            <p className="text-sm font-normal text-gray-500 mt-1">
              View calories and macros for the day
            </p>
          </a>

          <a
            href="#add-food"
            onClick={onClose}
            className="block w-full rounded-2xl bg-gray-50 px-5 py-5 text-lg font-semibold text-gray-900 shadow-sm active:scale-[0.99] active:bg-gray-100"
          >
            Add Food
            <p className="text-sm font-normal text-gray-500 mt-1">
              Manually add a custom food entry
            </p>
          </a>

          <a
            href="#food-log"
            onClick={onClose}
            className="block w-full rounded-2xl bg-gray-50 px-5 py-5 text-lg font-semibold text-gray-900 shadow-sm active:scale-[0.99] active:bg-gray-100"
          >
            Food Log
            <p className="text-sm font-normal text-gray-500 mt-1">
              Review and manage today’s meals
            </p>
          </a>
        </nav>
      </div>
    </div>
  );
}