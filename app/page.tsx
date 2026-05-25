"use client";
import AboutSection from "./_components/AboutSection";
import ExploreSection from "./_components/ExploreSection";
import Footer from "./_components/Footer";
import Hero from "./_components/Hero";

const HomePage = () => {
  return (
    <div className="relative dark:bg-gray-900 min-h-screen transition-colors duration-300 font-SFPro">
      {/* <Header /> */}
      <Hero />
      <AboutSection />
      <ExploreSection />
      <Footer />
    </div>
  );
};
export default HomePage;
