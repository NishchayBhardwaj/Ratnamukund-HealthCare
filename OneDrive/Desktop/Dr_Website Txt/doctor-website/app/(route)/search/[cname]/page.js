// app/(route)/search/[cname]/page.js
"use client";
import DoctorList from '@/app/_components/DoctorList';
import GlobalApi from '@/app/_utils/GlobalApi';
import React, { useEffect, useState, useCallback } from 'react';

function Search({ params }) {
  const [doctorList, setDoctorList] = useState([]);

  // Define getDoctors as a stable callback function
  const getDoctors = useCallback(async () => {
    try {
      const resp = await GlobalApi.getDoctorByCategory(params.cname);
      console.log(resp.data.data);
      setDoctorList(resp.data.data);
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    }
  }, [params.cname]); // Dependency on params.cname

  useEffect(() => {
    getDoctors();
  }, [getDoctors]); // Dependency on getDoctors

  return (
    <div className='mt-5'>
      <DoctorList heading={params.cname} doctorList={doctorList} />
    </div>
  );
}

export default Search;
