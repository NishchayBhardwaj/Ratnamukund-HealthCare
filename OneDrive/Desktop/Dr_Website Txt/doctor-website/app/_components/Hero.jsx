import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

function Hero() {
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState(''); // Added state for slide direction

  const slides = [
    {
      id: 0,
      image: "/doctors.jpeg",
      title: "Dr Shreepad Bhat",
      description: `Dr. Shreepad Bhat is a distinguished consultant physician with a strong academic and clinical background in internal medicine. He earned his MBBS from the prestigious B.J. Medical College in Pune and pursued his MD in Medicine at Sasoon Medical College, Pune. With a deep specialization in coronary artery disease, Dr. Bhat’s research on Young Coronary Artery Disease and its preventive factors has been recognized internationally.`,
      moreInfo: `Dr. Bhat has served as a Senior Research Associate at the renowned John Hopkins University and has made significant contributions as an Assistant Professor of Medicine at Bharatratna Atalbihari Vajpayee Medical College, Pune. He has also shared his expertise as an Honorary Physician with Pune Municipal Corporation and as a consulting physician at Tata Motors, Pune.

In addition to his clinical practice at Shreevag Clinic, Pune, Dr. Bhat continues to contribute to the academic field as a Visiting Faculty at Tilak Maharashtra Vidyapeeth, Pune. His work has been published in top-tier medical journals, with a notable focus on coronary artery disease.`,
      showMoreInfoButton: true,
    },
    {
      id: 1,
      image: "/Shilpa Bhat.jpg",
      title: "Dr Shilpa Bhat",
      description: `Dr. Shilpa Bhat is a leading obstetrician and gynecologist with extensive experience in women’s health. She completed her MBBS from Govt. Medical College, Aurangabad, followed by an MD in Obstetrics & Gynaecology from Govt. Medical College, Pune. Her expertise lies in managing Intra Uterine Contraceptive Devices (IUCD) and postpartum care, where she has made significant contributions.`,
      moreInfo: `Dr. Bhat has previously held the position of Associate Professor in Obstetrics and Gynaecology at S.K.N. Medical College, Pune. Her dedication to women’s health earned her the Best Family Planning Service Award in Maharashtra in 2013. She has published multiple papers in international journals on IUCD and other critical aspects of gynecological care.

Currently, Dr. Bhat serves as a Consultant Gynecologist at Mamta Clinic, Pune, and continues to educate future healthcare professionals as a Visiting Faculty at Tilak Maharashtra Vidyapeeth, Pune.`,
      showMoreInfoButton: true,
    },
  ];

  const handleMoreInfoClick = () => {
    setShowMoreInfo(!showMoreInfo);
  };

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setSlideDirection('right'); // Set direction for transition
      setTimeout(() => {
        setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
        setSlideDirection(''); // Reset direction after transition
      }, 500); // Adjust to match the CSS transition duration
    }, 7000); // 7 seconds

    return () => clearInterval(slideInterval);
  }, [slides.length]);

  const currentData = slides[currentSlide];

  return (
    <section>
      <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="relative overflow-hidden">
          <div
            className={`grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16 transition-transform duration-500 ${
              slideDirection === 'right' ? 'translate-x-full' : 'translate-x-0'
            }`}
          >
            <div className="relative h-64 overflow-hidden rounded-lg sm:h-80 lg:order-last lg:h-full">
              <Image
                alt={currentData.title}
                src={currentData.image}
                width={800}
                height={800}
                className="absolute inset-0 h-full w-full object-cover rounded-3xl"
              />
            </div>

            <div className="lg:py-24">
              <h2 className="text-3xl font-bold sm:text-4xl text-primary">
                {currentData.title}
              </h2>

              <p className="mt-4 text-gray-600">
                {currentData.description}
              </p>

              {currentData.showMoreInfoButton && (
                <>
                  <Button className="mt-8 bg-gradient-to-b from-blue-400 to-blue-800" onClick={handleMoreInfoClick}>
                    More Info
                  </Button>

                  <div
                    className={`mt-4 p-4 bg-gray-100 rounded-lg overflow-hidden transition-all duration-500 ease-in-out ${
                      showMoreInfo ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-gray-700">
                      {currentData.moreInfo}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
