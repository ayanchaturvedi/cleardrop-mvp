import React from 'react';
import { useParams } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { Package, Check, Clock, User, MapPin } from 'lucide-react';
import { format } from 'date-fns';

const MILESTONES_SEQUENCE = [
  'Pending Pickup', // Added implicit first state
  'Confirm Pickup',
  'Arrived at Transfer Hub',
  'Out for Last-Mile',
  'Delivered'
];

const CustomerTracking = () => {
  const { parcelId } = useParams();
  const { getParcelById, getMilestonesForParcel, getDriverById } = useDatabase();

  const parcel = getParcelById(parcelId);
  
  if (!parcel) {
    return (
      <div className="mobile-container" style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Parcel Not Found</h2>
        <p>Please check your tracking link.</p>
      </div>
    );
  }

  const milestones = getMilestonesForParcel(parcelId);
  
  // Create a timeline combining sequence with actual completed milestones
  const timeline = MILESTONES_SEQUENCE.map((stepName, index) => {
    if (index === 0 && milestones.length === 0) {
      // Pending state when no actions taken yet
      return { statusName: stepName, isCompleted: false, isCurrent: true };
    }
    
    // Find if this step is in actual milestones
    const completedMilestone = milestones.find(m => m.statusName === stepName);
    
    if (completedMilestone) {
      const driver = getDriverById(completedMilestone.driverId);
      return {
        ...completedMilestone,
        driverName: driver ? driver.name : 'Unknown Driver',
        isCompleted: true,
        isCurrent: index === milestones.length - 1 // Last completed is "current" state in sequence logic
      };
    }
    
    return {
      statusName: stepName,
      isCompleted: false,
      isCurrent: index === milestones.length && milestones.length > 0
    };
  });

  return (
    <div className="mobile-container" style={{ padding: '0' }}>
      {/* Header Area */}
      <div style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '2rem 1.5rem', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Package size={24} />
          <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '600' }}>Tracking Details</h1>
        </div>
        
        <h2 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>{parcel.trackingNumber}</h2>
        
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', opacity: 0.9 }}>
          <MapPin size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.4' }}>
            To: {parcel.destination}
          </p>
        </div>
      </div>

      {/* Timeline Area */}
      <div style={{ padding: '2rem 1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontSize: '1.125rem' }}>Status History</h3>
        
        <div style={{ position: 'relative' }}>
          {/* Vertical Line */}
          <div style={{ 
            position: 'absolute', 
            left: '15px', 
            top: '24px', 
            bottom: '24px', 
            width: '2px', 
            backgroundColor: 'var(--border-color)',
            zIndex: 0 
          }} />

          {timeline.map((item, index) => {
            // Hide "Pending Pickup" if they already started
            if (index === 0 && item.isCompleted === false && milestones.length > 0) return null;

            return (
              <div key={item.statusName || index} style={{ 
                display: 'flex', 
                gap: '1.5rem', 
                marginBottom: '2rem',
                position: 'relative',
                zIndex: 1,
                opacity: item.isCompleted ? 1 : 0.5
              }}>
                {/* Milestone Icon/Circle */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: item.isCompleted ? 'var(--success)' : 'white',
                  border: `2px solid ${item.isCompleted ? 'var(--success)' : 'var(--muted)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {item.isCompleted ? (
                    <Check size={16} color="white" />
                  ) : (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--muted)' }} />
                  )}
                </div>

                {/* Milestone Content */}
                <div style={{ flex: 1, paddingTop: '4px' }}>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: item.isCompleted ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {item.statusName}
                  </h4>
                  
                  {item.isCompleted && item.timestamp && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        <Clock size={14} />
                        <span>{format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        <User size={14} />
                        <span>Handled by: <strong style={{ color: 'var(--text-primary)' }}>{item.driverName}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CustomerTracking;
