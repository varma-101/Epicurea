import {BrowserRouter, Route, Routes} from 'react-router-dom';
import Home from './pages/home';
import CuisineSearch from './pages/cuisinesearch';
import RestaurantDetail from './pages/RestaurantDetail';


export default function App() {
  return (
    <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cuisine-search" element={<CuisineSearch />} />
          <Route path="/restaurant/:id" element={<RestaurantDetail />} />
        </Routes>
    </BrowserRouter>
  )
}