"use client"
import {useEffect,useState} from "react"
// import Image from "next/image";
import Hero from "./_components/Hero"
import CategorySearch from "./_components/CategorySearch";
import DoctorList from "./_components/DoctorList"
import GlobalApi from "./_utils/GlobalApi";
import Contact from "./_components/Contact";
import Timings from "./_components/Timings";
import dynamic from 'next/dynamic';

// Dynamically import MapComponent with server-side rendering disabled
const MapComponent = dynamic(() => import('./_components/map'), { ssr: false });
export default function Home() {

const [doctorList,setDoctorList]=useState( []);
useEffect(()=>{
  getDoctorList();
},[])

  const getDoctorList=()=>{
    GlobalApi.getDoctorList().then(resp=>{
      console.log(resp.data.data);
      setDoctorList(resp.data.data)
    })
  }
  return (
    <>
      <div>
        <Hero/>
        <CategorySearch/>
        <DoctorList doctorList={doctorList}/>
      </div>
      <div id="main-container" className="main-container">
      <div id="contact-card" className="card-container">
          <h1 id="contact-header" className="header-text">Contact Us</h1>
          <Contact />
      </div>
      <div id="timings-card" className="timings-container">
          <Timings />
      </div>
      </div>
      <div id="map-container" className="map-container">
          <MapComponent />
      </div>
    </>
  );
}
