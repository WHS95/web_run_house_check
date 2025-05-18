import UserProfile from "@/components/UserProfile";

export default function ProfilePage() {
  return (
    <div className='min-h-screen p-4 overflow-hidden bg-gray-100'>
      <div className='max-w-3xl mx-auto'>
        <h1 className='mb-6 text-3xl font-bold text-center'>내 프로필</h1>
        <div className='h-[calc(100vh-150px)] overflow-y-auto pb-8'>
          <UserProfile />
        </div>
      </div>
    </div>
  );
}
