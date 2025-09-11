import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center">
        <div className="text-7xl font-extrabold text-white">404</div>
        <h1 className="mt-3 text-2xl font-bold text-white">Page not found</h1>
        <p className="mt-2 text-sm text-gray-400">
          The page you are looking for doesn’t exist or has been moved.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-fedex-orange hover:bg-fedex-orange-dark text-white font-medium"
          >
            Go to Home
          </Link>
          <Link
            to="/grandstand"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium"
          >
            Open Grandstand
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
