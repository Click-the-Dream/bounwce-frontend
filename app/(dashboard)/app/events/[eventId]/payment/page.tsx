import BackBtn from "../../_components/BackBtn";
import PrePayment from "./_components/PrePayment";

const page = () => {
  return (
    <main className="w-full max-w-3xl bg-[#ECECF080] mx-auto min-h-screen px-4 py-8 md:px-6 border-l-[0.53px] border-r-[0.53px] mb-5 border-[#00000033]">
      {/* Back Button */}
      <BackBtn />
      <PrePayment />
    </main>
  );
};

export default page;
