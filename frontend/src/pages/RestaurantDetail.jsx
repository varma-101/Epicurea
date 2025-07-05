import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        const response = await axios.get(`https://restaurant-finder-mumk.onrender.com/restaurant/${id}`);
        setRestaurant(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching restaurant details:', err);
        setError("Failed to load restaurant details");
        setLoading(false);
      }
    };

    fetchRestaurantDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
          <div className="absolute inset-0 border-t-4 border-red-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-red-500 text-xl font-serif">R</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black/95 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
            <p className="text-red-400 text-center font-light">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/95">
      {/* Hero Section */}
      <div className="relative h-[70vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={restaurant?.featured_image || 'https://via.placeholder.com/1200x800'}
            alt={restaurant?.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>

        {/* Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-3 text-white/80 hover:text-white transition-colors"
            >
              <span className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 
                           backdrop-blur-lg group-hover:bg-white/20 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </span>
              <span className="font-light tracking-wide">Back to Search</span>
            </button>
          </div>
        </nav>

        {/* Restaurant Info */}
        <div className="absolute bottom-0 left-0 right-0 p-8 pb-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <h1 className="text-5xl font-light text-white tracking-wide">{restaurant?.name}</h1>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-lg">
                    <span className="text-yellow-400 text-2xl">★</span>
                    <span className="text-white font-light text-xl">
                      {restaurant?.user_rating?.aggregate_rating}
                    </span>
                  </div>
                </div>
                <p className="text-white/70 text-xl font-light tracking-wide">{restaurant?.cuisines}</p>
                <div className="flex items-center gap-3 text-white/60">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="font-light">{restaurant?.location?.locality}</span>
                </div>
              </div>

              <div className="flex gap-4">
                {restaurant?.menu_url && (
                  <a
                    href={restaurant.menu_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-3 rounded-full bg-red-500 text-white font-light tracking-wide
                             hover:bg-red-600 transition-all transform hover:scale-105"
                  >
                    View Menu
                  </a>
                )}
                {restaurant?.book_url && (
                  <a
                    href={restaurant.book_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-3 rounded-full bg-white/10 backdrop-blur-lg text-white font-light tracking-wide
                             hover:bg-white/20 transition-all transform hover:scale-105 border border-white/20"
                  >
                    Reserve a Table
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-10">
        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white/80 font-light">Average Cost</h3>
                <p className="text-white text-xl">₹{restaurant?.average_cost_for_two} for two</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white/80 font-light">Rating</h3>
                <p className="text-white text-xl">{restaurant?.user_rating?.rating_text}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white/80 font-light">Opening Hours</h3>
                <p className="text-white text-xl">11:00 AM - 11:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
              <h2 className="text-2xl text-white font-light mb-6">About {restaurant?.name}</h2>
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  {restaurant?.cuisines?.split(',').map((cuisine) => (
                    <span
                      key={cuisine}
                      className="px-4 py-2 rounded-full bg-white/5 text-white/80 font-light text-sm
                               border border-white/10"
                    >
                      {cuisine.trim()}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {restaurant?.has_online_delivery && (
                    <div className="flex items-center gap-3 text-white/80">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-light">Online Delivery</span>
                    </div>
                  )}
                  {restaurant?.has_table_booking && (
                    <div className="flex items-center gap-3 text-white/80">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-light">Table Booking</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Events Section */}
            {restaurant?.zomato_events?.length > 0 && (
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                <h2 className="text-2xl text-white font-light mb-6">Upcoming Events</h2>
                <div className="space-y-6">
                  {restaurant.zomato_events.map((eventData, index) => (
                    <div 
                      key={index} 
                      className="p-6 rounded-2xl bg-gradient-to-r from-white/5 to-white/10 border border-white/10"
                    >
                      <div className="flex items-start gap-6">
                        {eventData.event.photos?.[0] && (
                          <img
                            src={eventData.event.photos[0].photo.url}
                            alt={eventData.event.title}
                            className="w-32 h-32 rounded-xl object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="text-xl text-white font-light mb-2">
                            {eventData.event.title}
                          </h3>
                          <p className="text-white/70 font-light mb-4">
                            {eventData.event.description}
                          </p>
                          <div className="flex gap-6 text-sm text-white/60">
                            <span>Starts: {eventData.event.start_date}</span>
                            <span>Ends: {eventData.event.end_date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Location Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
              <h2 className="text-2xl text-white font-light mb-6">Location</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-white/90 font-light">{restaurant?.location?.locality}</p>
                  <p className="text-white/60 text-sm font-light">{restaurant?.location?.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
