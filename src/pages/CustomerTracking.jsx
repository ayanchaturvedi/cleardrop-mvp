import React from 'react';
import { useParams } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { Package, Check, Clock, User, MapPin, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const CustomerTracking = () => {
  const { parcelId } = useParams();
  const { getParcelById, getMilestonesForParcel, getDriverById, milestoneSequence } = useDatabase();

  const parcel = getParcelById(parcelId);
  
  if (!parcel) {
    return (
      <div className="mobile-frame" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem', textAlign: 'center' }}>
        <AlertCircle size={48} color="var(--error)" style={{ marginBottom: '1rem' }} />
        <h2>Parcel Not Found</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Please check your tracking link.</p>
      </div>
    );
  }

  const milestones = getMilestonesForParcel(parcelId);
  const assignedDriver = getDriverById(parcel.currentDriverId);
  const isDelivered = parcel.status === 'Delivered';
  
  // Build dynamic milestone sequence: prepending 'Pending Pickup'
  const MILESTONES_SEQUENCE = ['Pending Pickup', ...milestoneSequence];
  
  // Build tracking timeline list
  const timeline = MILESTONES_SEQUENCE.map((stepName, index) => {
    if (index === 0) {
      // Pending Pickup is completed if there are any milestones logged at all
      const isCompleted = milestones.length > 0;
      return {
        statusName: stepName,
        isCompleted,
        isCurrent: milestones.length === 0, // Current if nothing else is logged
        timestamp: isCompleted && milestones[0] ? milestones[0].timestamp : null,
        description: 'Order details received by ClearDrop'
      };
    }
    
    const completedMilestone = milestones.find(m => m.statusName === stepName);
    
    if (completedMilestone) {
      const driver = getDriverById(completedMilestone.driverId);
      return {
        ...completedMilestone,
        driverName: driver ? driver.name : 'ClearDrop Dispatcher',
        isCompleted: true,
        isCurrent: milestones.findIndex(m => m.statusName === stepName) === milestones.length - 1,
        description: stepName === 'Delivered' 
          ? 'Package successfully handed to recipient' 
          : `Processed at checkpoint by driver`
      };
    }
    
    return {
      statusName: stepName,
      isCompleted: false,
      isCurrent: milestones.length === index,
      description: `Pending arrival at this milestone`
    };
  });

  return (
    <div className="mobile-frame">
      {/* Header Banner - Full Width rectangular */}
      <div style={{ 
        backgroundColor: 'var(--primary-color)', 
        color: 'white', 
        padding: '1.75rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={20} />
          <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
            Live Tracking
          </span>
        </div>
        
        <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: '800', letterSpacing: '-0.01em' }}>
          {parcel.trackingNumber}
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', opacity: 0.95, borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
          <MapPin size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.4' }}>
            {parcel.destination}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.95, borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
          <User size={16} style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            {isDelivered ? 'Delivered by: ' : 'Currently with: '}
            {assignedDriver ? (
              <strong>{assignedDriver.name} ({assignedDriver.vehicleNumber})</strong>
            ) : (
              <strong>Awaiting driver assignment</strong>
            )}
          </p>
        </div>
      </div>

      {/* Timeline Container */}
      <div style={{ padding: '1.5rem', flex: 1, backgroundColor: 'var(--surface-color)' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Delivery Progress
        </h3>
        
        <div style={{ position: 'relative' }}>
          {timeline.map((item, index) => {
            const isCompleted = item.isCompleted;
            const isCurrent = item.isCurrent;

            return (
              <div key={item.statusName || index} style={{ 
                display: 'flex', 
                gap: '1.25rem', 
                marginBottom: '2.25rem',
                position: 'relative',
                zIndex: 1
              }}>
                {/* Connecting Line Segment */}
                {index < timeline.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    left: '15px',
                    top: '32px',
                    bottom: '-36px',
                    width: '2px',
                    borderLeft: isCompleted && timeline[index + 1].isCompleted
                      ? '2px solid var(--success)' 
                      : '2px dashed var(--muted)',
                    zIndex: 0
                  }} />
                )}

                {/* Milestone Node (Circle) */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted ? 'var(--success)' : 'white',
                  border: `2px solid ${isCompleted ? 'var(--success)' : isCurrent ? 'var(--primary-color)' : 'var(--muted)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  zIndex: 2,
                  boxShadow: isCurrent ? '0 0 0 5px rgba(5, 150, 105, 0.25)' : 'none',
                  transition: 'box-shadow 0.3s ease'
                }}>
                  {isCompleted ? (
                    <Check size={16} color="white" strokeWidth={3} />
                  ) : (
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: isCurrent ? 'var(--primary-color)' : 'var(--muted)' 
                    }} />
                  )}
                </div>

                {/* Milestone Content */}
                <div style={{ flex: 1, paddingTop: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h4 style={{ 
                      margin: 0, 
                      color: isCompleted ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: isCompleted || isCurrent ? '700' : '500',
                      fontSize: '0.95rem'
                    }}>
                      {item.statusName}
                    </h4>
                    
                    {isCurrent && (
                      <span style={{ 
                        fontSize: '0.65rem', 
                        backgroundColor: 'var(--primary-light)', 
                        color: 'var(--primary-hover)', 
                        padding: '0.15rem 0.5rem', 
                        borderRadius: '999px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Latest Update
                      </span>
                    )}
                  </div>
                  
                  <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.3' }}>
                    {item.description}
                  </p>
                  
                  {isCompleted && item.timestamp && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        <Clock size={12} />
                        <span>{format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                      {item.driverName && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          <User size={12} />
                          <span>Logged by: <strong style={{ color: 'var(--text-primary)' }}>{item.driverName}</strong></span>
                        </div>
                      )}
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
