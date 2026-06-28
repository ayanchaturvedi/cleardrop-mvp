import React, { createContext, useContext, useState, useEffect } from 'react';

const DatabaseContext = createContext();

export const useDatabase = () => useContext(DatabaseContext);

// Initial Mock Data
const INITIAL_DRIVERS = [
  { id: 'd1', name: 'Vikram Singh', phone: '+91 98765 43210' },
  { id: 'd2', name: 'Rahul Sharma', phone: '+91 87654 32109' },
  { id: 'd3', name: 'Amit Patel', phone: '+91 76543 21098' },
];

const INITIAL_PARCELS = [
  {
    id: 'p1',
    trackingNumber: 'CD-8472910',
    senderName: 'Rohan Gupta',
    recipientPhone: '+91 91234 56789',
    packageDetails: 'Electronics (Laptop)',
    destination: '45, 12th Main Rd, Koramangala, Bengaluru',
    currentDriverId: 'd1',
    status: 'Pending Pickup',
  }
];

const INITIAL_MILESTONES = [
  // Example initial milestone if needed, but starting empty or with one is fine
];

export const DatabaseProvider = ({ children }) => {
  const [drivers] = useState(INITIAL_DRIVERS);
  
  const [parcels, setParcels] = useState(() => {
    try {
      const saved = localStorage.getItem('cleardrop_parcels');
      if (saved && saved !== 'undefined') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse parcels from local storage', e);
    }
    return INITIAL_PARCELS;
  });
  
  const [milestones, setMilestones] = useState(() => {
    try {
      const saved = localStorage.getItem('cleardrop_milestones');
      if (saved && saved !== 'undefined') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse milestones from local storage', e);
    }
    return INITIAL_MILESTONES;
  });

  useEffect(() => {
    localStorage.setItem('cleardrop_parcels', JSON.stringify(parcels));
    localStorage.setItem('cleardrop_milestones', JSON.stringify(milestones));
  }, [parcels, milestones]);

  const createParcel = (parcelData) => {
    const newParcel = {
      ...parcelData,
      id: `p${Date.now()}`,
      trackingNumber: `CD-${Math.floor(1000000 + Math.random() * 9000000)}`,
      status: 'Pending Pickup',
    };
    setParcels(prev => [newParcel, ...prev]);
    return newParcel;
  };

  const assignDriver = (parcelId, driverId) => {
    setParcels(prev => prev.map(p => 
      p.id === parcelId ? { ...p, currentDriverId: driverId } : p
    ));
  };

  const addMilestone = (parcelId, statusName, driverId, imageUrl = null) => {
    const newMilestone = {
      id: `m${Date.now()}`,
      parcelId,
      statusName,
      driverId,
      timestamp: new Date().toISOString(),
      imageUrl, // Optional for proof of delivery
    };
    
    setMilestones(prev => [...prev, newMilestone]);
    
    // Update parcel's current status for quick reference
    setParcels(prev => prev.map(p => 
      p.id === parcelId ? { ...p, status: statusName } : p
    ));
  };

  const deleteParcel = (parcelId) => {
    setParcels(prev => prev.filter(p => p.id !== parcelId));
    setMilestones(prev => prev.filter(m => m.parcelId !== parcelId));
  };

  const getParcelById = (id) => parcels.find(p => p.id === id);
  const getMilestonesForParcel = (parcelId) => milestones.filter(m => m.parcelId === parcelId).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const getDriverById = (id) => drivers.find(d => d.id === id);

  return (
    <DatabaseContext.Provider value={{
      drivers,
      parcels,
      milestones,
      createParcel,
      assignDriver,
      addMilestone,
      deleteParcel,
      getParcelById,
      getMilestonesForParcel,
      getDriverById
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};
