import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-screen">
        {/* Background Video/Image */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://b.zmtcdn.com/web_assets/81f3ff974d82520780078ba1cfbd453a1583259680.png')] 
                         bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col">
          {/* Navigation */}
          <nav className="w-full py-6 px-8">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <span className="text-2xl text-white font-light tracking-wider">Restaurant Finder</span>
              <Link
                to="/cuisine-search"
                className="px-6 py-2 rounded-full bg-white/10 backdrop-blur-lg text-white font-light
                         hover:bg-white/20 transition-all border border-white/10"
              >
                Search Restaurants
              </Link>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center space-y-8 max-w-4xl">
              <h1 className="text-6xl md:text-8xl font-light text-white tracking-wide leading-tight">
                Discover Exceptional
                <span className="block mt-2 bg-gradient-to-r from-red-500 to-yellow-500 text-transparent bg-clip-text">
                  Dining Experiences
                </span>
              </h1>
              <p className="text-xl text-white/70 font-light tracking-wide max-w-2xl mx-auto">
                Explore curated restaurants, unique cuisines, and memorable dining moments
              </p>
              <div className="flex justify-center gap-6">
                <Link
                  to="/cuisine-search"
                  className="px-10 py-4 rounded-full bg-red-500 text-white font-light tracking-wide
                           hover:bg-red-600 transition-all transform hover:scale-105"
                >
                  Start Exploring
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-black/95 py-32">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
                title: "Smart Search",
                description: "Find restaurants by cuisine type or through image recognition"
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                ),
                title: "Location-Based",
                description: "Discover restaurants within your preferred distance"
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ),
                title: "Curated Selection",
                description: "Explore top-rated restaurants and authentic cuisines"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
                  <div className="text-red-500">{feature.icon}</div>
                </div>
                <h3 className="text-xl text-white font-light mb-4">{feature.title}</h3>
                <p className="text-white/60 font-light">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}