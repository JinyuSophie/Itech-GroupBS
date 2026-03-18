import { useState } from "react";
import { useLocation } from "react-router-dom";

export default function StudyTipsWidget() {
  const [visible, setVisible] = useState(true);
  const location = useLocation();

  const isLoginPage = location.pathname === "/";

  if (!visible || isLoginPage) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white p-4 shadow-xl"
      aria-label="Study tips widget"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Study Tips</h2>
          <p className="mt-1 text-sm text-gray-600">
            A small helper panel for better daily study planning.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-md px-2 py-1 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close widget"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
          <p className="text-sm font-medium text-blue-900">
            Start with the most urgent task today.
          </p>
        </div>

        <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-3">
          <p className="text-sm font-medium text-yellow-900">
            Check upcoming deadlines before planning a new session.
          </p>
        </div>

        <div className="rounded-xl border border-green-100 bg-green-50 p-3">
          <p className="text-sm font-medium text-green-900">
            Break large tasks into smaller focused sessions.
          </p>
        </div>
      </div>

      <button
        type="button"
        className="mt-4 w-full rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
      >
        Plan Better Today
      </button>
    </div>
  );
}