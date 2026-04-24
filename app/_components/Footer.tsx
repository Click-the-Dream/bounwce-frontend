"use client";
import footerLogo from "../assets/bouwnce-main.png";
import Link from "next/link";
import Image from "next/image";
import { navLinks, socialLinks } from "../_utils/fields";
const Footer = () => {
  return (
    <footer className="w-full py-10 lg:py-12 bg-white">
      <div className="w-[90%] max-w-250 mx-auto flex flex-col items-center gap-6">
        {/* Logo + Navigation */}
        <div className="flex flex-col md:flex-row justify-center md:justify-between md:items-center gap-4 w-full">
          <div className="mx-auto md:mx-0">
            <Image
              src={footerLogo}
              alt="bouwnce"
              height={40}
              width={100}
              className="h-8 w-auto"
            />
          </div>

          <ul className="flex flex-wrap justify-center md:justify-end items-center gap-3 text-blackfont-medium">
            {navLinks.map((link: { name: string; path: string }) => (
              <li key={link.name}>
                <Link
                  href={link.path}
                  className="hover:text-brand-orange transition-colors duration-300 text-xs md:text-sm"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Social Icons */}
        <div className="flex flex-wrap justify-center md:justify-start gap-5">
          {socialLinks.map(
            (link: {
              name: string;
              url: string;
              icon: React.FC<{ size?: number }>;
            }) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link?.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#8C857B]00 hover:text-brand-orangebrand-orange hover:-translate-y-1 transition-all duration-300"
                  aria-label={link.name}
                >
                  <Icon size={19} />
                </a>
              );
            },
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
