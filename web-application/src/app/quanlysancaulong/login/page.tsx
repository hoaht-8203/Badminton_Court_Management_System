import LoginForm from "@/components/authentication/LoginForm";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="flex h-screen w-full flex-row items-center justify-center">
      <div className="relative h-full w-6/10">
        <Image className="h-full w-full object-cover" src="/login-background.jpg" alt="Badminton Court" width={1000} height={1000} />

        <div className="absolute top-0 left-0 h-full w-full bg-black opacity-50"></div>
        <div className="absolute top-0 left-0 h-full w-full pt-20 pl-20 text-5xl font-bold text-white">
          <p>Hệ thống</p>
          <p>quản lý sân cầu lông</p>
        </div>
      </div>
      <div className="flex h-full w-4/10 items-center justify-center">
        <div className="w-[500px]">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
