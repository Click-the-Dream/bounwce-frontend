"use client";
import Navbar from "./Navbar";
import SearchBar from "./SearchBar";
import heroImg from "../assets/hero-img.png";

const Hero = () => {
  return (
    <div
      className="relative p-2 md:pb-40 lg:pb-96 min-h-screen flex flex-col items-center overflow-hidden bg-[#FAFAFA] transition-colors duration-300 bg-cover bg-center bg-no-repeat border-[0.53px] border-[#BDBDBD] border-dashed"
      style={{
        backgroundImage: `url(${heroImg.src})`,
        backgroundPosition: "bottom",
        backgroundSize: "90%",
      }}
    >
      <Navbar />
      {/* Hero content goes here */}
      <div className="relative mt-14 md:mt-10 text-black w-full max-w-163.25 text-center flex flex-col items-center justify-center">
        <h1 className="text-4xl lg:text-[55px] capitalize text-gray-900nsition-colors duration-300 font-hugePromo">
          Meet People <span className="text-brand-orange">Who</span> Share Your{" "}
          <span className="text-brand-orange">Interests.</span>
        </h1>

        <p className="max-w-125 mt-4 text-[13px] text-[#4E4E4E] font-medium">
          Describe what you need — Bouwnce connects you with people who share
          your interests, and the right places
        </p>

        <SearchBar />
      </div>
    </div>
  );
};

export default Hero;
