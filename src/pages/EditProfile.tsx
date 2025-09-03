import React from 'react';

interface EditProfileProps {
  onClose: () => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg text-white">
        <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
        <p className="text-slate-300 mb-6">
          Placeholder editor. Replace this with your real Edit Profile form.
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
