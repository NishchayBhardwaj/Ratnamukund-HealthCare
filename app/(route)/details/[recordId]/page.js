// // app/(route)/details/[recordId]/page.js
// "use client";

// import React, { useEffect, useState } from 'react';
// import GlobalApi from '@/app/_utils/GlobalApi';
// import DoctorDetail from './_components/DoctorDetail';

// function Details({ params }) {
//   const [doctor, setDoctor] = useState(null);

//   useEffect(() => {
//     if (params.recordId) {
//       getDoctorById();
//     }
//   }, [params.recordId]);

//   const getDoctorById = async () => {
//     try {
//       const resp = await GlobalApi.getDoctorById(params.recordId);
//       setDoctor(resp.data.data);
//     } catch (error) {
//       console.error("Failed to fetch doctor details:", error);
//     }
//   };

//   return (
//     <div className='p-5 md:px-20'>
//       <h2 className='font-bold text-[22px]'>Details</h2>
//       <div className='grid grid-cols-1 md:grid-cols-4 gap-5'>
//         {/* Doctor Details */}
//         <div className='col-span-3'>
//           {doctor ? (
//             <DoctorDetail doctor={doctor} />
//           ) : (
//             <p>Loading doctor details...</p>
//           )}
//         </div>
//         <div>
//           {/* Additional details or components can go here */}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Details;
// app/(route)/details/[recordId]/page.js
// app/(route)/details/[recordId]/page.js
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import GlobalApi from '@/app/_utils/GlobalApi';
import DoctorDetail from './_components/DoctorDetail';

function Details({ params }) {
  const [doctor, setDoctor] = useState(null);

  // Define getDoctorById as a stable callback function
  const getDoctorById = useCallback(async () => {
    try {
      const resp = await GlobalApi.getDoctorById(params.recordId);
      setDoctor(resp.data.data);
    } catch (error) {
      console.error("Failed to fetch doctor details:", error);
    }
  }, [params.recordId]); // Dependency on params.recordId

  useEffect(() => {
    if (params.recordId) {
      getDoctorById();
    }
  }, [getDoctorById, params.recordId]); // Dependencies: getDoctorById and params.recordId

  return (
    <div className='p-5 md:px-20'>
      <h2 className='font-bold text-[22px]'>Details</h2>
      <div className='grid grid-cols-1 md:grid-cols-4 gap-5'>
        {/* Doctor Details */}
        <div className='col-span-3'>
          {doctor ? (
            <DoctorDetail doctor={doctor} />
          ) : (
            <p>Loading doctor details...</p>
          )}
        </div>
        <div>
          {/* Additional details or components can go here */}
        </div>
      </div>
    </div>
  );
}

export default Details;

