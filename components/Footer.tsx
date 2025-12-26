'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Footer component
 * Pixel-perfect design matching original
 * Fixed negative margins to prevent double scrollbars
 */
const Footer: React.FC = () => {
  const pathname = usePathname();
  const isHomepage = pathname === '/';
  const isAuctionpage = pathname === '/auction';
  const isAuctionItemPage = pathname?.startsWith('/auction-item');

  return (
    <footer className={`relative ${isHomepage ? 'lg:top-[-645px] xl:top-[-650px] lg:-mb-[645px] xl:-mb-[650px]' : ''} bg-[#0E0E0E] text-white py-24 ${isHomepage ? 'lg:pt-[324px]' : ''} ${isAuctionpage || isAuctionItemPage ? 'lg:pt-[250px]' : ''} lg:pb-[64px] w-full`}>
      <div className="max-w-7xl xl:max-w-[1240px] xl:px-0 px-4 sm:px-6 md:px-8 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Logo and Copyright */}
          <div className="grid justify-center md:justify-start md:col-span-1 w-[282px] h-[121px] mx-auto md:mx-0">
            <div className="mb-1 md:mb-8 md:w-[180px] lg:w-[272px] lg:h-[33px] cursor-pointer">
              <Link href="/">
                <img src="/footerImg.png" alt="Site logo" />
              </Link>
            </div>
            <p className="text-md font-medium text-[#FFFFFF] md:w-[192px] lg:w-[282px] lg:h-[56px] leading-relaxed hidden md:block">
              Copyright © 2025 Super Media Bros | All Rights Reserved
            </p>
          </div>

          <div className="md:col-span-1 grid grid-cols-2 gap-8">
            {/* Product Column */}
            <div>
              <h3 className="font-semibold text-lg mb-6">Product</h3>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-sm">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm">
                    Case studies
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm">
                    Reviews
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm">
                    Updates
                  </a>
                </li>
              </ul>
            </div>
            {/* Support Column */}
            <div>
              <h3 className="font-semibold text-lg mb-6">Support</h3>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-sm">
                    Getting started
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm">
                    Help center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm">
                    Server status
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm">
                    Report a bug
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm">
                    Chat support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="md:col-span-1 grid grid-cols-2 gap-8">
            {/* Company Column */}
            <div>
              <h3 className="font-semibold text-lg mb-6">Company</h3>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-sm">
                    Contact us
                  </a>
                </li>
              </ul>
            </div>

            {/* Follow us Column */}
            <div>
              <h3 className="font-semibold text-lg mb-6">Follow us</h3>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-sm flex items-center space-x-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <rect width="24" height="24" rx="5" fill="white" />
                      <path
                        d="M12.9759 18V12.5262H14.9057L15.1947 10.393H12.9759V9.03102C12.9759 8.4134 13.156 7.99252 14.0863 7.99252L15.2728 7.99199V6.08405C15.0675 6.0581 14.3632 6 13.5439 6C11.8332 6 10.662 6.99412 10.662 8.81982V10.393H8.72729V12.5262H10.662V17.9999H12.9759V18Z"
                        fill="#1C1724"
                      />
                    </svg>
                    <span>Facebook</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm flex items-center space-x-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <rect width="24" height="24" rx="5" fill="white" />
                      <path
                        d="M12 6C14.3966 6 15.5949 6.00025 16.458 6.57129C16.8435 6.82633 17.1737 7.15655 17.4287 7.54199C17.9998 8.40514 18 9.60336 18 12C18 14.3966 17.9998 15.5949 17.4287 16.458C17.1737 16.8435 16.8435 17.1737 16.458 17.4287C15.5949 17.9998 14.3966 18 12 18C9.60336 18 8.40514 17.9998 7.54199 17.4287C7.15655 17.1737 6.82633 16.8435 6.57129 16.458C6.00025 15.5949 6 14.3966 6 12C6 9.60336 6.00025 8.40514 6.57129 7.54199C6.82633 7.15655 7.15655 6.82633 7.54199 6.57129C8.40514 6.00025 9.60336 6 12 6ZM12 8.89355C10.2845 8.89355 8.89364 10.2845 8.89355 12C8.89355 13.7155 10.2845 15.1064 12 15.1064C13.7155 15.1064 15.1064 13.7155 15.1064 12C15.1064 10.2846 13.7154 8.89361 12 8.89355ZM12 9.94434C13.135 9.94439 14.0556 10.865 14.0557 12C14.0557 13.1351 13.1351 14.0556 12 14.0557C10.8649 14.0557 9.94434 13.1351 9.94434 12C9.94442 10.8649 10.8649 9.94434 12 9.94434ZM15.2285 8.00781C14.8256 8.00799 14.499 8.33529 14.499 8.73828C14.4993 9.14106 14.8257 9.46759 15.2285 9.46777C15.6315 9.46777 15.9587 9.14117 15.959 8.73828C15.959 8.33518 15.6316 8.00781 15.2285 8.00781Z"
                        fill="#1C1724"
                      />
                    </svg>
                    <span>Instagram</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm flex items-center space-x-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <rect width="24" height="24" rx="5" fill="white" />
                      <path
                        d="M6 7.61321C6 7.2284 6.13514 6.91094 6.40541 6.66082C6.67567 6.4107 7.02703 6.28564 7.45946 6.28564C7.88417 6.28564 8.2278 6.40877 8.49035 6.65505C8.76061 6.90902 8.89575 7.23994 8.89575 7.64784C8.89575 8.01725 8.76448 8.32508 8.50193 8.57136C8.23166 8.82533 7.87645 8.95231 7.43629 8.95231H7.42471C7 8.95231 6.65637 8.82533 6.39382 8.57136C6.13127 8.31739 6 7.998 6 7.61321ZM6.15058 17.7142V10.0028H8.72201V17.7142H6.15058ZM10.1467 17.7142H12.7181V13.4083C12.7181 13.1389 12.749 12.9311 12.8108 12.7849C12.9189 12.5233 13.083 12.302 13.3031 12.1211C13.5232 11.9403 13.7992 11.8499 14.1313 11.8499C14.9961 11.8499 15.4286 12.4309 15.4286 13.593V17.7142H18V13.2929C18 12.1538 17.7297 11.29 17.1892 10.7012C16.6486 10.1125 15.9344 9.81811 15.0463 9.81811C14.0502 9.81811 13.2741 10.2452 12.7181 11.0995V11.1226H12.7066L12.7181 11.0995V10.0028H10.1467C10.1622 10.2491 10.1699 11.0148 10.1699 12.3001C10.1699 13.5853 10.1622 15.39 10.1467 17.7142Z"
                        fill="#1C1724"
                      />
                    </svg>
                    <span>LinkedIn</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm flex items-center space-x-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <rect width="24" height="24" rx="5" fill="white" />
                      <path
                        d="M12.2925 16.6533L9.58433 16.6027C8.7075 16.585 7.82849 16.6202 6.96885 16.4375C5.66114 16.1645 5.5685 14.8259 5.47156 13.7031C5.33798 12.1245 5.38969 10.5173 5.64176 8.95192C5.78407 8.07358 6.34409 7.54947 7.21014 7.49243C10.1337 7.28545 13.0767 7.30998 15.9938 7.40654C16.3019 7.4154 16.6121 7.46378 16.9159 7.51885C18.4154 7.78747 18.452 9.3044 18.5492 10.5814C18.6461 11.8715 18.6052 13.1683 18.4199 14.4497C18.2713 15.5106 17.9868 16.4003 16.7866 16.4862C15.2828 16.5985 13.8134 16.6889 12.3054 16.6601C12.3054 16.6533 12.2968 16.6533 12.2925 16.6533ZM10.7003 13.9673C11.8336 13.3024 12.9453 12.6485 14.072 11.988C12.9367 11.3231 11.8271 10.6692 10.7003 10.0087V13.9673Z"
                        fill="#1C1724"
                      />
                    </svg>
                    <span>YouTube</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="md:hidden mt-8 text-center">
            <p className="text-sm leading-relaxed">
              Copyright © 2025 Super Media Bros | All Rights Reserved
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
