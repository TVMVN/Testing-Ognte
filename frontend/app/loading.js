// pages/loading.js
export default function LoadingPage() {
  return (
    <div className="h-screen flex flex-col justify-center items-center bg-black">
      <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-green-400"></div>
      <p className="mt-6 text-lg text-gray-100 font-medium animate-pulse">Please wait...</p>
    </div>
  );
}
