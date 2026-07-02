import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { Camera, MapPin, Package as PackageIcon, CheckCircle2 } from 'lucide-react';

const DriverInterface = () => {
  const { parcelId } = useParams();
  const { getParcelById, getDriverById, getMilestonesForParcel, addMilestone, milestoneSequence } = useDatabase();
  const fileInputRef = useRef(null);

  const parcel = getParcelById(parcelId);
  
  if (!parcel) {
    return (
      <div className="mobile-frame" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem', textAlign: 'center' }}>
        <h2>Parcel Not Found</h2>
        <p style={{ color: 'var(--text-secondary)' }}>The tracking link might be invalid.</p>
      </div>
    );
  }

  const driver = getDriverById(parcel.currentDriverId);
  const milestones = getMilestonesForParcel(parcelId);
  
  // Use dynamic sequence from database context
  const MILESTONES_SEQUENCE = milestoneSequence;
  
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
    addMilestone(parcelId, statusName, driver.id);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      alert(`Simulated photo upload: ${file.name}`);
    }
  };

  return (
    <div className="mobile-frame">
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
        
        {/* Header */}
        <header style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.25rem', fontWeight: '800' }}>
            Driver Console
          </h1>
          {driver ? (
            <span style={{ 
              display: 'inline-block',
              fontSize: '0.75rem', 
              color: 'var(--primary-hover)', 
              fontWeight: '700',
              backgroundColor: 'var(--primary-light)',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px'
            }}>
              Active: {driver.name}
            </span>
          ) : (
            <span style={{ 
              display: 'inline-block',
              fontSize: '0.75rem', 
              color: 'var(--error)', 
              fontWeight: '700',
              backgroundColor: '#fee2e2',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px'
            }}>
              No Driver Assigned
            </span>
          )}
        </header>

        {/* Parcel Info Card */}
        <div className="card" style={{ boxShadow: 'var(--shadow-sm)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.5rem', borderRadius: 'var(--border-radius-sm)' }}>
              <PackageIcon size={20} color="var(--primary-color)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '700' }}>{parcel.trackingNumber}</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{parcel.packageDetails}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <MapPin size={20} color="var(--error)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '0.875rem', margin: '0 0 0.25rem 0', color: 'var(--text-secondary)', fontWeight: '600' }}>Destination</h3>
              <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.4' }}>
                {parcel.destination}
              </p>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Phone: {parcel.recipientPhone}
              </p>
            </div>
          </div>
        </div>

        {/* Status Actions */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ 
            textTransform: 'uppercase', 
            fontSize: '0.75rem', 
            fontWeight: '700', 
            color: 'var(--text-secondary)', 
            letterSpacing: '0.05em',
            marginBottom: '0.25rem'
          }}>
            Actions
          </h3>

          {isDelivered ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '1.5rem', 
              backgroundColor: 'var(--primary-light)', 
              borderRadius: 'var(--border-radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={36} color="var(--success)" />
              <h4 style={{ color: 'var(--primary-hover)', margin: 0, fontWeight: '700' }}>Delivery Completed</h4>
            </div>
          ) : (
            MILESTONES_SEQUENCE.map((milestone, index) => {
              const isNext = milestone === nextMilestone;
              if (!isNext) return null; 

              return (
                <button 
                  key={milestone}
                  className="btn btn-primary"
                  style={{ width: '100%', minHeight: '52px', fontSize: '1.1rem', fontWeight: '700' }} 
                  onClick={() => handleMilestoneClick(milestone)}
                  disabled={!driver}
                >
                  {milestone}
                </button>
              );
            })
          )}

          {/* Proof of Delivery Photo */}
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
            style={{ width: '100%', minHeight: '48px', fontWeight: '600' }}
            onClick={() => fileInputRef.current.click()}
          >
            <Camera size={18} /> Take Proof of Delivery Photo
          </button>
        </div>

      </div>
    </div>
  );
};

export default DriverInterface;
