// app/(components)/ClipList/ClipList.tsx
import React from 'react';

const ClipList: React.FC = () => {
  return (
    <div className="bg-gray-700 p-4 rounded-md">
      <h2 className="text-lg font-semibold mb-2">Suggested Clips</h2>
      <p className="text-gray-400">No clips generated yet.</p>
      {/*  This will eventually display a list of clips */}
    </div>
  );
};

export default ClipList;