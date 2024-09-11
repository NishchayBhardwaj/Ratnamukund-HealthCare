"use client";
import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { AiOutlineArrowRight, AiOutlineArrowLeft } from "react-icons/ai";
import GlobalApi from "@/app/_utils/GlobalApi";

function DoctorList({ doctorList, heading = 'Popular Doctors' }) {
  const [campaigns, setCampaigns] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState("left");
  const animationDuration = 1000; // 1 second for each slide transition

  useEffect(() => {
    GlobalApi.getCampaigns()
      .then((response) => {
        setCampaigns(response.data.data);
      })
      .catch((error) => {
        console.error("Error fetching campaigns: ", error);
      });
  }, []);

  // Define goToSlide as a stable callback function
  const goToSlide = useCallback((index) => {
    preventClick();
    if (index >= campaigns.length) {
      index = 0;
    } else if (index < 0) {
      index = campaigns.length - 1;
    }
    setSlideDirection(currentSlide < index ? "left" : "right");
    setCurrentSlide(index);
  }, [campaigns.length, currentSlide]); // Dependencies: campaigns.length and currentSlide

  useEffect(() => {
    if (campaigns.length > 0) {
      const interval = setInterval(() => {
        if (!isAnimating) {
          setSlideDirection("left");
          goToSlide(currentSlide + 1);
        }
      }, 2000); // Change image every 2 seconds

      return () => clearInterval(interval);
    }
  }, [campaigns, currentSlide, isAnimating, goToSlide]); // Added goToSlide to dependencies

  const preventClick = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
    }, animationDuration);
  };

  const nextSlide = () => {
    setSlideDirection("left");
    goToSlide(currentSlide + 1);
  };

  const prevSlide = () => {
    setSlideDirection("right");
    goToSlide(currentSlide - 1);
  };

  return (
    <div className='mb-10 px-8'>
      {/* Campaign Section */}
      {campaigns.length > 0 && (
        <div className="campaign-section relative w-full mb-10">
          <div className="relative w-[90%] max-w-3xl h-80 overflow-hidden rounded-lg shadow-lg mb-6 mx-auto">
            <div className={`relative w-full h-full flex transition-transform duration-${animationDuration} ease-in-out ${slideDirection}`}>
              {campaigns.map((campaign, i) => (
                <div
                  key={i}
                  className={`flex-shrink-0 w-full h-full ${currentSlide === i ? "opacity-100" : "opacity-0"}`}
                >
                  <Image
                    src={campaign.attributes?.Camp_Poster?.data?.attributes?.url || "/default-image.jpg"}
                    alt={`Campaign Image ${i + 1}`}
                    layout="fill"
                    objectFit="contain"
                    className="transition-opacity duration-1000"
                  />
                </div>
              ))}
            </div>

            {/* Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition duration-300 ease-in-out z-10"
            >
              <AiOutlineArrowLeft size={20} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition duration-300 ease-in-out z-10"
            >
              <AiOutlineArrowRight size={20} />
            </button>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-semibold text-gray-800 mb-2">
              {campaigns[currentSlide].attributes.Details}
            </h2>
            <p className="text-lg text-gray-600 mb-1">
              Start Date: {new Date(campaigns[currentSlide].attributes.Start_date).toLocaleDateString()}
            </p>
            <p className="text-lg text-gray-600 mb-4">
              End Date: {new Date(campaigns[currentSlide].attributes.End_Date).toLocaleDateString()}
            </p>
            <Link href={campaigns[currentSlide].attributes.Link}>
              <button className="bg-primary text-white py-2 px-4 rounded-full hover:bg-primary-dark transition duration-300 ease-in-out">
                Join Group
              </button>
            </Link>
          </div>

          {campaigns.length > 1 && (
            <div className="pagination mt-6 flex justify-center gap-2">
              {campaigns.map((_, i) => (
                <span
                  key={i}
                  className={`cursor-pointer p-2 rounded-full ${
                    currentSlide === i ? "bg-primary" : "bg-gray-300"
                  }`}
                  onClick={() => goToSlide(i)}
                >
                  <span className="sr-only">{`Slide ${i + 1}`}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <h2 className='font-bold text-2xl text-gray-800 mb-6'>
        {heading}
      </h2>
      <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7'>
        {doctorList.length > 0 ? doctorList.map((doctor, index) => (
          <div 
            key={index}
            className='border border-gray-200 rounded-lg p-4 transition-transform duration-300 hover:scale-105 hover:shadow-lg'
          >
           <Image 
              src={doctor.attributes?.Image?.data?.[0]?.attributes?.url || '/default-image.jpg'} // Fallback image if URL is undefined
              alt='doctor'
              width={500}
              height={200}
              className='h-[200px] w-full object-cover rounded-lg'
            />

            <div className='mt-4 flex flex-col gap-2'>
              <h2 className='text-xs bg-blue-100 p-1 rounded-full px-3 text-primary font-medium self-start'>
                {doctor.attributes?.categories?.data?.[0]?.attributes?.Name || 'General'}  {/* Ensures access to category name */}
              </h2>
              <h2 className='font-bold text-lg text-gray-900'>
                {doctor.attributes?.Name}
              </h2>
              <h2 className='text-sm text-primary'>
                {doctor.attributes?.Year_of_Experience} Years Experience
              </h2>
              <h2 className='text-sm text-gray-600'>
                {doctor.attributes?.Address}
              </h2>
              <Link href={'/details/'+doctor?.id}>
                <h2 
                  className='mt-4 py-2 bg-primary text-white text-sm rounded-full w-full text-center transition-colors duration-300 hover:bg-blue-700'
                >
                  Book Now
                </h2>
              </Link>
            </div>
          </div>
        )) : (
          [1, 2].map((_, index) => (
            <div key={index} className='h-[220px] bg-slate-200 w-full rounded-lg animate-pulse'></div>
          ))
        )}
      </div>
    </div>
  );
}

export default DoctorList;
