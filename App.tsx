import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Problem from './components/Problem';
import Solution from './components/Solution';
import About from './components/About';
import Uses from './components/Uses';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';

const App: React.FC = () => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const handleOpenBooking = () => {
    setIsBookingModalOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingModalOpen(false);
  };

  return (
    <div className="antialiased text-black bg-white overflow-x-hidden">
      <Navbar onOpenBooking={handleOpenBooking} />
      <Hero onOpenBooking={handleOpenBooking} />
      <Problem />
      <Solution />
      <Uses />
      <About />
      <FAQ />
      <Footer onOpenBooking={handleOpenBooking} />
      <BookingModal isOpen={isBookingModalOpen} onClose={handleCloseBooking} />
    </div>
  );
};

export default App;