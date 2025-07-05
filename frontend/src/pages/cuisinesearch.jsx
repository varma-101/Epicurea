import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function CuisineSearch() {
  // Initialize state with values from localStorage if they exist
  const [cuisine, setCuisine] = useState(() => localStorage.getItem('lastCuisine') || "");
  const [restaurants, setRestaurants] = useState(() => {
    const saved = localStorage.getItem('lastRestaurants');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(() => 
    parseInt(localStorage.getItem('lastPage')) || 1
  );
  const [totalPages, setTotalPages] = useState(() => 
    parseInt(localStorage.getItem('lastTotalPages')) || 1
  );
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [maxDistance, setMaxDistance] = useState(() => 
    parseInt(localStorage.getItem('lastMaxDistance')) || 25
  );
  const [distanceRange, setDistanceRange] = useState(() => 
    localStorage.getItem('lastDistanceRange') || 'nearby'
  );
  const [showDistanceFilter, setShowDistanceFilter] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isDistanceFilterActive, setIsDistanceFilterActive] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [searchMode, setSearchMode] = useState('text'); // 'text' or 'image'
  const [showSearchTips, setShowSearchTips] = useState(false);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (cuisine) localStorage.setItem('lastCuisine', cuisine);
    if (restaurants.length) localStorage.setItem('lastRestaurants', JSON.stringify(restaurants));
    if (currentPage) localStorage.setItem('lastPage', currentPage.toString());
    if (totalPages) localStorage.setItem('lastTotalPages', totalPages.toString());
    if (maxDistance) localStorage.setItem('lastMaxDistance', maxDistance.toString());
    if (distanceRange) localStorage.setItem('lastDistanceRange', distanceRange);
  }, [cuisine, restaurants, currentPage, totalPages, maxDistance, distanceRange]);

  // Get user's location when component mounts
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationError(null);
          
          // If we have saved search results, perform the search again with location
          if (cuisine && restaurants.length === 0) {
            handleSearch(currentPage);
          }
        },
        (error) => {
          setLocationError("Unable to get your location. Distance calculation won't be available.");
          console.error("Error getting location:", error);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser");
    }
  }, []);

  // Clear saved data when leaving the page
  useEffect(() => {
    return () => {
      // Optionally clear the saved data when component unmounts
      // Comment this out if you want to persist across page refreshes
      // localStorage.removeItem('lastCuisine');
      // localStorage.removeItem('lastRestaurants');
      // localStorage.removeItem('lastPage');
      // localStorage.removeItem('lastTotalPages');
      // localStorage.removeItem('lastMaxDistance');
      // localStorage.removeItem('lastDistanceRange');
    };
  }, []);

  // Update useEffect to handle dependencies warning and prevent infinite loop
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationError(null);
          
          // If we have saved search results, perform the search again with location
          if (cuisine && restaurants.length === 0) {
            handleSearch(currentPage);
          }
        },
        (error) => {
          setLocationError("Unable to get your location. Distance calculation won't be available.");
          console.error("Error getting location:", error);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser");
    }
  }, []); // Empty dependency array as we only want this to run once

  // Optimize handleSearch with caching
  const handleSearch = useCallback(async (page = 1) => {
    if (!cuisine) {
      alert("Please enter a cuisine type");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        cuisine: cuisine,
        page: page.toString(),
        limit: '6'
      });

      if (userLocation && isDistanceFilterActive) {
        params.append('latitude', userLocation.latitude.toString());
        params.append('longitude', userLocation.longitude.toString());
        params.append('maxDistance', maxDistance.toString());
      }

      const response = await axios.get(`https://restaurant-finder-mumk.onrender.com/restaurants-by-cuisine?${params}`);

      if (!response.data) {
        throw new Error('No data received');
      }

      const newRestaurants = response.data.data || [];
      
      if (newRestaurants.length === 0) {
        setError('No restaurants found for this cuisine type');
        setRestaurants([]);
      } else {
        setRestaurants(newRestaurants);
        setCurrentPage(response.data.current_page);
        setTotalPages(response.data.total_pages);
      }

    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.message || 'Failed to fetch restaurants. Please try again.');
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, [cuisine, userLocation, isDistanceFilterActive, maxDistance]);

  // Update handlePageChange to handle both text and image-based searches
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      if (fileInputRef.current?.files?.length > 0) {
        // If there's a file selected, use image-based search
        handleImageUpload({ target: { files: [fileInputRef.current.files[0]] } }, newPage);
      } else {
        // Otherwise use text-based search
        handleSearch(newPage);
      }
    }
  }, [handleSearch, totalPages]);

  // Update handleDistanceRangeChange
  const handleDistanceRangeChange = useCallback((range) => {
    setDistanceRange(range);
    setIsDistanceFilterActive(true);
    let newDistance;
    
    switch (range) {
      case 'nearby':
        newDistance = 10;
        break;
      case 'city':
        newDistance = 50;
        break;
      case 'state':
        newDistance = 500;
        break;
      case 'country':
        newDistance = 3000;
        break;
      default:
        newDistance = 50;
    }
    
    setMaxDistance(newDistance);
    if (cuisine) {
      setShowNotification(true);
      setSearchMessage(`Range updated to ${range}. Click Search to see restaurants within ${newDistance}km`);
      setTimeout(() => setShowNotification(false), 6000);
    }
  }, [cuisine]);

  // Update form submit handler
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (cuisine.trim()) {
      handleSearch(1);
    }
  }, [handleSearch, cuisine]);

  // Function to handle distance range change
  const handleClearDistanceFilter = () => {
    setIsDistanceFilterActive(false);
    handleSearch(1);
  };

  // Update handleRestaurantClick to save current state before navigation
  const handleRestaurantClick = (restaurantId) => {
    // Save current state before navigating
    localStorage.setItem('lastCuisine', cuisine);
    localStorage.setItem('lastRestaurants', JSON.stringify(restaurants));
    localStorage.setItem('lastPage', currentPage.toString());
    localStorage.setItem('lastTotalPages', totalPages.toString());
    localStorage.setItem('lastMaxDistance', maxDistance.toString());
    localStorage.setItem('lastDistanceRange', distanceRange);
    
    navigate(`/restaurant/${restaurantId}`);
  };

  // Update handleImageUpload function
  const handleImageUpload = async (e, page = 1) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post(
        `https://restaurant-finder-mumk.onrender.com/api/analyze-image?page=${page}&limit=6`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data.success) {
        setRestaurants(response.data.result);
        setTotalPages(response.data.totalPages);
        setCurrentPage(response.data.currentPage);
        setCuisine(response.data.detectedCuisine);
        
        // Show notification about detected cuisine
        setShowNotification(true);
        setSearchMessage(`Detected ${response.data.detectedCuisine} cuisine from your image!`);
        setTimeout(() => setShowNotification(false), 6000);
      } else {
        setError('No restaurants found for the detected cuisine');
      }
    } catch (err) {
      console.error('Image analysis error:', err);
      setError(
        err.response?.data?.message || 
        'Failed to analyze image. Please try again with a clearer food image.'
      );
    } finally {
      setLoading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-black/95">
      {/* Floating Search Mode Toggle */}
      <div className="fixed top-24 right-6 z-50">
        <div className="bg-white/5 backdrop-blur-xl rounded-full border border-white/10 p-1">
          <button
            onClick={() => setSearchMode('text')}
            className={`px-4 py-2 rounded-full transition-all ${
              searchMode === 'text'
                ? 'bg-red-500 text-white'
                : 'text-white/60 hover:text-white'
            } font-light`}
          >
            Text
          </button>
          <button
            onClick={() => setSearchMode('image')}
            className={`px-4 py-2 rounded-full transition-all ${
              searchMode === 'image'
                ? 'bg-red-500 text-white'
                : 'text-white/60 hover:text-white'
            } font-light`}
          >
            Image
          </button>
        </div>
      </div>

      {/* Header with Animation */}
      <header className="bg-black/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-3 text-white/80 hover:text-white transition-colors"
            >
              <span className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 
                           group-hover:bg-white/20 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </span>
              <span className="font-light tracking-wide">Back</span>
            </button>

            <h1 className="text-2xl text-white font-light tracking-wider">Find Restaurants</h1>
            
            {userLocation && (
              <div className="flex items-center gap-2 text-sm text-green-400/80">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="font-light">Location enabled</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Search Section with Animation */}
        <div className="relative">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 mb-12
                      transform transition-all duration-500 ease-in-out"
               style={{
                 transform: searchMode === 'image' ? 'translateY(0)' : 'translateY(-100%)',
                 opacity: searchMode === 'image' ? 1 : 0,
                 position: searchMode === 'image' ? 'relative' : 'absolute',
                 visibility: searchMode === 'image' ? 'visible' : 'hidden'
               }}
          >
            {/* Image Upload Content */}
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="relative group cursor-pointer"
                   onClick={() => fileInputRef.current.click()}
              >
                <div className="aspect-video rounded-2xl border-2 border-dashed border-white/20 
                             flex items-center justify-center overflow-hidden group-hover:border-red-500/50 transition-colors">
                  <div className="text-center p-8">
                    <svg className="w-16 h-16 mx-auto text-white/20 group-hover:text-red-500/50 transition-colors" 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-4 text-white/60 font-light group-hover:text-white/80 transition-colors">
                      Drop your food image here or click to browse
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Search Tips */}
              <button
                onClick={() => setShowSearchTips(!showSearchTips)}
                className="text-white/40 hover:text-white/60 text-sm font-light transition-colors"
              >
                📸 Tips for better results
              </button>
              
              {showSearchTips && (
                <div className="bg-white/5 rounded-xl p-6 text-left space-y-3">
                  <p className="text-white/60 font-light">• Take clear, well-lit photos</p>
                  <p className="text-white/60 font-light">• Focus on the main dish</p>
                  <p className="text-white/60 font-light">• Avoid dark or blurry images</p>
                </div>
              )}
            </div>
          </div>

          {/* Text Search with Animation */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 mb-12
                      transform transition-all duration-500 ease-in-out"
               style={{
                 transform: searchMode === 'text' ? 'translateY(0)' : 'translateY(-100%)',
                 opacity: searchMode === 'text' ? 1 : 0,
                 position: searchMode === 'text' ? 'relative' : 'absolute',
                 visibility: searchMode === 'text' ? 'visible' : 'hidden'
               }}
          >
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Existing text search form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    placeholder="Search for cuisines..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white
                             placeholder:text-white/30 focus:border-red-500/50 focus:outline-none focus:ring-2 
                             focus:ring-red-500/20 transition-colors font-light"
                    disabled={loading}
                  />
                  <svg 
                    className="w-6 h-6 text-white/30 absolute left-4 top-1/2 transform -translate-y-1/2" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <button
                  type="submit"
                  disabled={!cuisine.trim() || loading}
                  className={`w-full py-4 rounded-xl transition-all ${
                    !cuisine.trim() || loading
                      ? 'bg-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600 text-white transform hover:scale-[1.02]'
                  } font-light tracking-wide`}
                >
                  {loading ? 'Searching...' : 'Search Restaurants'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Distance Filter */}
        {userLocation && (
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <h3 className="text-xl text-white font-light">Distance Filter</h3>
              </div>
              
              {isDistanceFilterActive && (
                <button
                  onClick={handleClearDistanceFilter}
                  className="text-red-400 hover:text-red-300 text-sm font-light"
                >
                  Clear Filter
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { id: 'nearby', label: 'Nearby', distance: '10km' },
                { id: 'city', label: 'City', distance: '50km' },
                { id: 'state', label: 'State', distance: '500km' },
                { id: 'country', label: 'Country', distance: '3000km' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleDistanceRangeChange(option.id)}
                  className={`p-4 rounded-xl text-sm font-light transition-all duration-300 ${
                    distanceRange === option.id
                      ? 'bg-red-500 text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  } border border-white/10`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="opacity-60 mt-1">{option.distance}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
              <div className="absolute inset-0 border-t-4 border-red-500 rounded-full animate-spin"></div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
            <p className="text-red-400 text-center font-light">{error}</p>
          </div>
        ) : restaurants.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  onClick={() => handleRestaurantClick(restaurant.id)}
                  className="group bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden
                           cursor-pointer transform hover:scale-[1.02] transition-all duration-300"
                >
                  {restaurant.featured_image ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={restaurant.featured_image}
                        alt={restaurant.name}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-white/5 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl text-white font-light mb-2">{restaurant.name}</h3>
                        <p className="text-white/60 text-sm font-light">{restaurant.cuisines}</p>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-400">
                        <span className="font-medium">{restaurant.user_rating?.aggregate_rating}</span>
                        <span>★</span>
                      </div>
                    </div>

                    <div className="text-sm text-white/40 font-light">
                      <p className="line-clamp-2">{restaurant.location?.address}</p>
                    </div>

                    {restaurant.distance && (
                      <div className="mt-4 flex items-center text-sm text-white/40 font-light">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {restaurant.distance < 1 
                          ? `${(restaurant.distance * 1000).toFixed(0)}m away`
                          : restaurant.distance >= 100
                            ? `${(restaurant.distance / 1000).toFixed(1)}k km away`
                            : `${restaurant.distance.toFixed(1)} km away`
                        }
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-16 flex justify-center items-center gap-6">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-8 py-3 rounded-full font-light tracking-wide transition-all ${
                    currentPage === 1
                      ? 'bg-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-red-500 transform hover:scale-105'
                  } border border-white/10`}
                >
                  Previous
                </button>

                <span className="px-6 py-2 rounded-full bg-white/5 text-white/70 font-light border border-white/10">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-8 py-3 rounded-full font-light tracking-wide transition-all ${
                    currentPage === totalPages
                      ? 'bg-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-red-500 transform hover:scale-105'
                  } border border-white/10`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Notification */}
      {showNotification && (
        <div className="fixed bottom-8 inset-x-0 flex justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl text-white px-8 py-4 rounded-2xl shadow-xl 
                       animate-fade-in-up flex items-center gap-3 border border-white/10">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-light tracking-wide">{searchMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
