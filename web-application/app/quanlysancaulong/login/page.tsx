import LoginForm from "@/components/authentication/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-row items-center justify-center h-screen w-full">
      <div className="w-6/10 h-full relative">
        <img
          className="w-full h-full object-cover"
          src="/login-background.jpg"
          alt="Badminton Court"
        />

        <div className="absolute top-0 left-0 bg-black opacity-50 h-full w-full"></div>
        <div className="absolute top-0 left-0 h-full w-full text-white text-5xl font-bold pl-20 pt-20">
          <p>Hệ thống</p>
          <p>quản lý sân cầu lông</p>
        </div>
      </div>
      <div className="w-4/10 h-full flex items-center justify-center">
        <div className="w-[500px]">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
