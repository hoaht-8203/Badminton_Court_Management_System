import LoginForm from "@/components/authentication/LoginForm";
import React from "react";

const LoginPage = () => {
  return (
    <div>
      <section className="container mx-auto mt-10 w-[500px]">
        <LoginForm isUsersMode={true} />
      </section>
    </div>
  );
};

export default LoginPage;
