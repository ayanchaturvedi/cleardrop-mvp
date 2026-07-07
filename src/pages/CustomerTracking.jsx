import React from 'react';
import { useParams } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { Package, Check, Clock, User, MapPin, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const CustomerTracking = () => {
  const { parcelId } = useParams();
  const { getParcelById, getMilestonesForParcel, getDriverById, milestoneSequence, branding, isOffline, isLoading } = useDatabase();

  const parcel = getParcelById(parcelId);

  if (isLoading) {
    return (
      <div className="mobile-frame" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem', textAlign: 'center' }}>
        <div style={{ border: '4px solid rgba(0,0,0,0.1)', width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: 'var(--primary-color)', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading parcel details...</p>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }
  
  if (!parcel) {
    return (
      <div className="mobile-frame" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem', textAlign: 'center' }}>
        {isOffline && (
          <div style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: '600', width: '100%', borderRadius: '4px', marginBottom: '1.5rem' }}>
            ⚠️ Offline Fallback Mode
          </div>
        )}
        <AlertCircle size={48} color="var(--error)" style={{ marginBottom: '1rem' }} />
        <h2>Parcel Not Found</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Please check your tracking link.</p>
      </div>
    );
  }

  const milestones = getMilestonesForParcel(parcelId);
  const assignedDriver = getDriverById(parcel.currentDriverId);
  const isDelivered = parcel.status === 'Delivered';
  
  // Call fallback office number if no driver assigned
  const supportPhone = branding.supportPhone || '+91 1800 123 4567';
  const rawPhoneNumber = assignedDriver ? assignedDriver.phone : supportPhone;
  const dialPhoneNumber = rawPhoneNumber.replace(/\s+/g, '');

  // Build dynamic milestone sequence: prepending 'Pending Pickup'
  const MILESTONES_SEQUENCE = ['Pending Pickup', ...milestoneSequence];

  // Build timeline items chronologically
  const completedTimelineItems = milestones.map(m => {
    const driver = getDriverById(m.driverId);
    const isDelay = m.isDelay || m.statusName.startsWith('Delay:');
    const isTransfer = m.isTransfer || m.statusName.startsWith('Package successfully transferred');
    
    return {
      statusName: m.statusName,
      isCompleted: true,
      isCurrent: false,
      timestamp: m.timestamp,
      driverName: driver ? driver.name : 'ClearDrop Dispatcher',
      isDelay,
      isTransfer,
      description: isDelay 
        ? `Parcel delayed: ${m.delayReason || m.statusName.replace('Delay: ', '')}` 
        : isTransfer
          ? `Package custody successfully transferred to ${driver ? driver.name : 'new driver'}`
          : (m.statusName === 'Delivered' ? 'Package successfully handed to recipient' : 'Processed at checkpoint by driver')
    };
  });

  // Prepend Pending Pickup
  if (completedTimelineItems.length > 0) {
    completedTimelineItems.unshift({
      statusName: 'Pending Pickup',
      isCompleted: true,
      isCurrent: false,
      timestamp: milestones[0].timestamp,
      description: 'Order details received by ClearDrop'
    });
  } else {
    completedTimelineItems.push({
      statusName: 'Pending Pickup',
      isCompleted: false,
      isCurrent: true,
      description: 'Order details received by ClearDrop'
    });
  }

  // Find pending standard steps
  const completedStandardNames = milestones.map(m => m.statusName);
  const pendingStandardItems = milestoneSequence
    .filter(name => !completedStandardNames.includes(name))
    .map(name => ({
      statusName: name,
      isCompleted: false,
      isCurrent: false,
      description: 'Pending arrival at this milestone'
    }));

  // Combine
  const timeline = [...completedTimelineItems, ...pendingStandardItems];

  // Set current flag
  if (milestones.length > 0) {
    const lastCompletedIdx = completedTimelineItems.length - 1;
    if (lastCompletedIdx >= 0) {
      completedTimelineItems[lastCompletedIdx].isCurrent = true;
    }
  }

  return (
    <div className="mobile-frame">
      {isOffline && (
        <div style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: '600', textAlign: 'center', borderBottom: '1px solid #fde68a' }}>
          ⚠️ Offline Fallback Mode
        </div>
      )}
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
          {branding.logoUrl ? (
            <img src={branding.logoUrl} style={{ height: '20px', width: 'auto', maxHeight: '20px', objectFit: 'contain', borderRadius: '2px' }} alt="Brand Logo" />
          ) : (
            <Package size={20} />
          )}
          <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
            {branding.companyName ? branding.companyName.replace(/\s*Admin\s*$/i, '') : ''} Tracking
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

      {/* High-visibility Warning Banner for Delay */}
      {parcel.delayReason && (
        <div style={{ 
          backgroundColor: '#fffbeb', 
          borderBottom: '1px solid #fcd34d', 
          padding: '1rem 1.5rem', 
          color: '#b45309',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'start',
          gap: '0.5rem',
          boxShadow: 'var(--shadow-sm)',
          zIndex: 10
        }}>
          <AlertCircle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Notice:</strong> Your parcel is experiencing a temporary delay due to <strong>{parcel.delayReason}</strong>.
          </span>
        </div>
      )}

      {/* Timeline Container */}
      <div style={{ padding: '1.5rem', flex: 1, backgroundColor: 'var(--surface-color)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Call Carrier Action Button */}
        <a 
          href={`tel:${dialPhoneNumber}`} 
          className="btn btn-secondary" 
          style={{ 
            width: '100%', 
            borderColor: 'var(--primary-color)', 
            color: 'var(--primary-color)',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            boxShadow: 'var(--shadow-sm)',
            minHeight: '48px',
            backgroundColor: 'white',
            borderRadius: 'var(--border-radius-md)'
          }}
        >
          <span>📞</span>
           <span>{assignedDriver ? `Call Carrier (${assignedDriver.name})` : `Contact Support (${branding.companyName ? branding.companyName.replace(/\s*Admin\s*$/i, '') : ''})`}</span>
        </a>

        <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
          Delivery Progress
        </h3>
        
        <div style={{ position: 'relative' }}>
          {timeline.map((item, index) => {
            const isCompleted = item.isCompleted;
            const isCurrent = item.isCurrent;
            const isDelay = item.isDelay;

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
                      ? (isDelay || timeline[index + 1].isDelay ? '2px dotted #f59e0b' : '2px solid var(--success)') 
                      : '2px dashed var(--muted)',
                    zIndex: 0
                  }} />
                )}

                {/* Milestone Node (Circle) */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isDelay ? '#fffbeb' : isCompleted ? 'var(--success)' : 'white',
                  border: `2px solid ${isDelay ? '#f59e0b' : isCompleted ? 'var(--success)' : isCurrent ? 'var(--primary-color)' : 'var(--muted)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  zIndex: 2,
                  boxShadow: isCurrent ? (isDelay ? '0 0 0 5px rgba(245, 158, 11, 0.25)' : '0 0 0 5px rgba(5, 150, 105, 0.25)') : 'none',
                  transition: 'box-shadow 0.3s ease'
                }}>
                  {isDelay ? (
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#d97706' }}>⚠️</span>
                  ) : isCompleted ? (
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
                      color: isDelay ? '#d97706' : isCompleted ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: isCompleted || isCurrent ? '700' : '500',
                      fontSize: '0.95rem'
                    }}>
                      {item.statusName}
                    </h4>
                    
                    {isCurrent && (
                      <span style={{ 
                        fontSize: '0.65rem', 
                        backgroundColor: isDelay ? '#fffbeb' : 'var(--primary-light)', 
                        color: isDelay ? '#d97706' : 'var(--primary-hover)', 
                        padding: '0.15rem 0.5rem', 
                        borderRadius: '999px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        border: isDelay ? '1px solid #fcd34d' : 'none'
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
