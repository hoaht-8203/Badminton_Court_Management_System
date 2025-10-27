import SignUpForm from "@/components/authentication/SignUpForm";
import React from "react";

const SignUpPage = () => {
  return (
    <div>
      <section className="container mx-auto mt-10 w-[500px]">
        <SignUpForm isUsersMode={true} />
      </section>
    </div>
  );
};

export default SignUpPage;
