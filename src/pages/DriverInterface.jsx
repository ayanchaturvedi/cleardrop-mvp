import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { Camera, MapPin, Package as PackageIcon, CheckCircle2 } from 'lucide-react';

const MILESTONES_SEQUENCE = [
  'Confirm Pickup',
  'Arrived at Transfer Hub',
  'Out for Last-Mile',
  'Delivered'
];

const DriverInterface = () => {
  const { parcelId } = useParams();
  const { getParcelById, getDriverById, getMilestonesForParcel, addMilestone } = useDatabase();
  const fileInputRef = useRef(null);

  const parcel = getParcelById(parcelId);
  
  if (!parcel) {
    return (
      <div className="mobile-container" style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Parcel Not Found</h2>
        <p>The tracking link might be invalid.</p>
      </div>
    );
  }

  const driver = getDriverById(parcel.currentDriverId);
  const milestones = getMilestonesForParcel(parcelId);
  
  // Determine next milestone
  let currentMilestoneIndex = -1;
  if (milestones.length > 0) {
    const lastMilestone = milestones[milestones.length - 1];
    currentMilestoneIndex = MILESTONES_SEQUENCE.indexOf(lastMilestone.statusName);
  }
  const nextMilestone = MILESTONES_SEQUENCE[currentMilestoneIndex + 1];
  const isDelivered = currentMilestoneIndex === MILESTONES_SEQUENCE.length - 1;

  const handleMilestoneClick = (statusName) => {
    if (!driver) {
      alert("No driver assigned to this parcel!");
      return;
    }
    
    // For delivered, we might want to simulate waiting for photo
    if (statusName === 'Delivered') {
      // Just mark delivered for now, photo is separate button
      addMilestone(parcelId, statusName, driver.id);
    } else {
      addMilestone(parcelId, statusName, driver.id);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      alert(`Simulated upload for: ${file.name}`);
      // In a real app, upload to storage, then save URL. We just alert for mockup.
    }
  };

  return (
    <div className="mobile-container" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Driver App</h1>
        {driver ? (
          <p style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>Active as: {driver.name}</p>
        ) : (
          <p style={{ color: 'var(--error)' }}>No Driver Assigned</p>
        )}
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <PackageIcon size={24} color="var(--primary-color)" />
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{parcel.trackingNumber}</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{parcel.packageDetails}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <MapPin size={24} color="var(--error)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ fontSize: '1rem', margin: '0 0 0.25rem 0' }}>Destination</h3>
            <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: '1.4' }}>
              {parcel.destination}
            </p>
            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Contact: {parcel.recipientPhone}
            </p>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'flex-end', paddingBottom: '2rem' }}>
        {isDelivered ? (
          <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--border-radius-lg)' }}>
            <CheckCircle2 size={48} color="var(--success)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ color: 'var(--success)', margin: 0 }}>Delivery Completed</h2>
          </div>
        ) : (
          <>
            <h3 style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Update Status</h3>
            
            {MILESTONES_SEQUENCE.map((milestone, index) => {
              const isNext = milestone === nextMilestone;
              const isCompleted = index <= currentMilestoneIndex;
              
              // Only show the next available action button. Hide future and past steps.
              if (!isNext) return null; 

              return (
                <button 
                  key={milestone}
                  className="btn btn-primary"
                  style={{ width: '100%', minHeight: '64px', fontSize: '1.25rem' }} 
                  onClick={() => handleMilestoneClick(milestone)}
                  disabled={!driver}
                >
                  {milestone}
                </button>
              );
            })}
          </>
        )}

        {/* Proof of Delivery Photo Button */}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={fileInputRef} 
          style={{ display: 'none' }}
          onChange={handlePhotoUpload}
        />
        <button 
          className="btn btn-secondary" 
          style={{ width: '100%', marginTop: '1rem' }}
          onClick={() => fileInputRef.current.click()}
        >
          <Camera size={20} /> Take Proof of Delivery Photo
        </button>
      </div>
    </div>
  );
};

export default DriverInterface;
