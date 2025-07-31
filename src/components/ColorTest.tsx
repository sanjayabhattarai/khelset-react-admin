// Test component to verify Tailwind colors
export const ColorTest = () => {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold text-blue-600">Color Test Component</h1>
      <div className="bg-red-500 text-white p-4 rounded">Red Background</div>
      <div className="bg-green-500 text-white p-4 rounded">Green Background</div>
      <div className="bg-blue-500 text-white p-4 rounded">Blue Background</div>
      <div className="bg-purple-500 text-white p-4 rounded">Purple Background</div>
      <div className="bg-yellow-500 text-black p-4 rounded">Yellow Background</div>
      <div className="bg-gray-800 text-white p-4 rounded">Gray Background</div>
      <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded transition-colors">
        Amber Button with Hover
      </button>
    </div>
  );
};
