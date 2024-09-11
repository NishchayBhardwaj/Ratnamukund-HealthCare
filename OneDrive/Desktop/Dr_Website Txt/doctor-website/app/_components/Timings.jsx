  "use client";
  import { useEffect, useState } from 'react';

  export default function Timings() {
      const [data, setData] = useState([]);
      const [selectedDoctor, setSelectedDoctor] = useState(null);
      const [expandedClinic, setExpandedClinic] = useState(null);

      useEffect(() => {
          const fetchData = async () => {
              const response = await fetch('/data.json');
              const result = await response.json();
              setData(result.doctors);
          };
          fetchData();
      }, []);

      const handleDoctorSelect = (doctor) => {
          if (selectedDoctor === doctor) {
              setSelectedDoctor(null);
              setExpandedClinic(null);
          } else {
              setSelectedDoctor(doctor);
              setExpandedClinic(null);
          }
      };

      const handleClinicExpand = (clinic) => {
          setExpandedClinic(expandedClinic === clinic ? null : clinic);
      };

      return (
          <div id="container" className="container">
            <div id="doctor-list" className="doctor-list">
              {data.map((doctor, index) => (
                <div id={`doctor-card-${index}`} key={index} className="doctor-card">
                  <button
                    id={`doctor-button-${index}`}
                    className="doctor-button"
                    onClick={() => handleDoctorSelect(doctor)}
                  >
                    {doctor.name}
                  </button>
                  {selectedDoctor === doctor && (
                    <div id={`clinic-details-${index}`} className="clinic-details">
                      {doctor.clinics.map((clinic, idx) => (
                        <div id={`clinic-card-${index}-${idx}`} key={idx} className="clinic-card">
                          <button
                            id={`clinic-button-${index}-${idx}`}
                            className="clinic-button"
                            onClick={() => handleClinicExpand(clinic)}
                          >
                            {clinic["clinic name"]}
                          </button>
                          {expandedClinic === clinic && (
                            <div id={`clinic-info-${index}-${idx}`} className="clinic-info">
                              <h2 id={`clinic-header-${index}-${idx}`} className="clinic-header">
                                {clinic["header"]}
                              </h2>
                              <div id={`clinic-timings-${index}-${idx}`} className="clinic-timings">
                                <label id={`timings-label-${index}-${idx}`} className="timings-label">
                                  Timings:
                                </label>
                                <select
                                  id={`timings-select-${index}-${idx}`}
                                  className="timings-select"
                                >
                                  {clinic.timings.map((time, timeIdx) => (
                                    <option key={timeIdx} value={time}>
                                      {time}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <p id={`clinic-location-${index}-${idx}`}>
                                <strong>Location:</strong> {clinic.location}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
      );
  }
