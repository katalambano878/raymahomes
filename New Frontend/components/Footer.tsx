import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#2C3E50] text-white mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h3 className="text-lg font-semibold mb-4">About Us</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Premium kitchenware designed for home chefs who demand quality, durability, and style in every piece.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/shop" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Shop All
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-gray-300 hover:text-white transition-colors text-sm">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/shipping" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
            <div className="flex space-x-4 mb-6">
              <a href="#" className="text-gray-300 hover:text-white transition-colors w-8 h-8 flex items-center justify-center">
                <i className="ri-facebook-fill text-xl"></i>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors w-8 h-8 flex items-center justify-center">
                <i className="ri-instagram-line text-xl"></i>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors w-8 h-8 flex items-center justify-center">
                <i className="ri-pinterest-line text-xl"></i>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors w-8 h-8 flex items-center justify-center">
                <i className="ri-youtube-line text-xl"></i>
              </a>
            </div>
            <p className="text-gray-300 text-sm">
              Email: hello@kitchenware.com<br />
              Phone: (555) 123-4567
            </p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 Premium Kitchenware. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <Link href="https://readdy.ai/?ref=logo" className="text-gray-400 hover:text-white transition-colors text-sm">
              Made with Readdy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
