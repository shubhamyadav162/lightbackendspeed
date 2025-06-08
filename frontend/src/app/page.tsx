import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-xl space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                LightSpeedPay
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300">
                One API. Multiple payment gateways. Unlimited possibilities.
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Streamline your payment infrastructure with our unified gateway solution that ensures 99.9% uptime and seamless failover.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/dashboard/merchant/register" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  Get Started
                </Link>
                <Link 
                  href="#features" 
                  className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-200 font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="relative w-full md:w-1/2 h-[400px]">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-10 blur-2xl"></div>
              <div className="relative h-full flex items-center justify-center">
                <div className="w-[90%] h-[90%] rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2">
                  <div className="w-full h-full bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center">
                    <div className="text-center p-6">
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">₹1,249,856.00</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">Total Transactions (This Month)</div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-700 dark:text-gray-300">Success Rate</div>
                          <div className="text-green-600 dark:text-green-400 font-semibold">99.7%</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-700 dark:text-gray-300">Avg. Response</div>
                          <div className="text-blue-600 dark:text-blue-400 font-semibold">238ms</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose LightSpeedPay?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Our unified payment gateway wrapper provides everything you need for reliable payment processing
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Automatic Failover</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Never lose a transaction. Our system automatically routes payments to functioning gateways when one fails.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Enhanced Security</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enterprise-grade security with encryption, HMAC authentication, and PCI-DSS compliant infrastructure.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-time Monitoring</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive dashboards with transaction insights, gateway health monitoring, and instant alerts.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">SDK Integration</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Simple integration with our JavaScript and Unity SDKs for web and gaming applications.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Multi-Gateway Support</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Integrate once, access multiple gateways. Support for Razorpay, PhonePe, and more payment providers.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Sandbox Testing</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive sandbox environment for testing all payment scenarios before going live.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gateways Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Supported Payment Gateways</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              We support all major payment gateways with a single, unified API
            </p>
          </div>
          <div className="flex justify-center flex-wrap gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm w-40 h-32 flex items-center justify-center">
              <div className="text-center">
                <div className="font-bold text-xl mb-1 text-blue-600">Razorpay</div>
                <div className="text-sm text-gray-500">Integrated</div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm w-40 h-32 flex items-center justify-center">
              <div className="text-center">
                <div className="font-bold text-xl mb-1 text-blue-600">PhonePe</div>
                <div className="text-sm text-gray-500">Integrated</div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm w-40 h-32 flex items-center justify-center">
              <div className="text-center">
                <div className="font-bold text-xl mb-1 text-gray-600">PayU</div>
                <div className="text-sm text-gray-500">Coming Soon</div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm w-40 h-32 flex items-center justify-center">
              <div className="text-center">
                <div className="font-bold text-xl mb-1 text-gray-600">Stripe</div>
                <div className="text-sm text-gray-500">Coming Soon</div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm w-40 h-32 flex items-center justify-center">
              <div className="text-center">
                <div className="font-bold text-xl mb-1 text-gray-600">PayTM</div>
                <div className="text-sm text-gray-500">Coming Soon</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-10 md:p-16 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to streamline your payment infrastructure?</h2>
              <p className="text-xl opacity-90 mb-8">
                Get started with LightSpeedPay today and experience the difference of a reliable payment gateway wrapper.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link 
                  href="/dashboard/merchant/register" 
                  className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-8 py-3 rounded-lg transition-colors"
                >
                  Start Free Trial
                </Link>
                <Link 
                  href="/contact" 
                  className="bg-transparent border border-white text-white hover:bg-white/10 font-medium px-8 py-3 rounded-lg transition-colors"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-100 dark:bg-gray-900">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="font-bold text-xl mb-4">LightSpeedPay</div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The unified payment gateway wrapper for modern businesses.
              </p>
            </div>
            <div>
              <div className="font-medium mb-4">Product</div>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Features</Link></li>
                <li><Link href="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Pricing</Link></li>
                <li><Link href="/documentation" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Documentation</Link></li>
                <li><Link href="/sdks" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">SDKs</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-4">Company</div>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">About</Link></li>
                <li><Link href="/blog" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Blog</Link></li>
                <li><Link href="/careers" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Careers</Link></li>
                <li><Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Contact</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-4">Legal</div>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Terms of Service</Link></li>
                <li><Link href="/security" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 text-center text-gray-600 dark:text-gray-400">
            &copy; {new Date().getFullYear()} LightSpeedPay. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
} 