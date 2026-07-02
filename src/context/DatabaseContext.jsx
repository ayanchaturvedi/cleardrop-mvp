import React, { createContext, useContext, useState, useEffect } from 'react';

const DatabaseContext = createContext();

export const useDatabase = () => useContext(DatabaseContext);

const INITIAL_DRIVERS = [
  { id: 'd1', name: 'Vikram Singh', phone: '+91 98765 43210', vehicleNumber: 'DL-01-HA-9876' },
  { id: 'd2', name: 'Rahul Sharma', phone: '+91 87654 32109', vehicleNumber: 'MH-02-AB-1234' },
  { id: 'd3', name: 'Amit Patel', phone: '+91 76543 21098', vehicleNumber: 'KA-03-XY-5678' },
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

const DEFAULT_MILESTONES_SEQUENCE = [
  'Confirm Pickup',
  'Arrived at Transfer Hub',
  'Out for Last-Mile',
  'Delivered'
];

export const DatabaseProvider = ({ children }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('cleardrop_auth') === 'true';
  });

  // Drivers State
  const [drivers, setDrivers] = useState(() => {
    try {
      const saved = localStorage.getItem('cleardrop_drivers');
      if (saved && saved !== 'undefined') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse drivers', e);
    }
    return INITIAL_DRIVERS;
  });

  // Milestone Sequence State
  const [milestoneSequence, setMilestoneSequence] = useState(() => {
    try {
      const saved = localStorage.getItem('cleardrop_milestone_sequence');
      if (saved && saved !== 'undefined') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse milestones sequence', e);
    }
    return DEFAULT_MILESTONES_SEQUENCE;
  });

  // Parcels State
  const [parcels, setParcels] = useState(() => {
    try {
      const saved = localStorage.getItem('cleardrop_parcels');
      if (saved && saved !== 'undefined') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse parcels', e);
    }
    return INITIAL_PARCELS;
  });

  // Milestone Logs State
  const [milestones, setMilestones] = useState(() => {
    try {
      const saved = localStorage.getItem('cleardrop_milestones');
      if (saved && saved !== 'undefined') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse milestones logs', e);
    }
    return [];
  });

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('cleardrop_auth', isAuthenticated);
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('cleardrop_drivers', JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem('cleardrop_milestone_sequence', JSON.stringify(milestoneSequence));
  }, [milestoneSequence]);

  useEffect(() => {
    localStorage.setItem('cleardrop_parcels', JSON.stringify(parcels));
  }, [parcels]);

  useEffect(() => {
    localStorage.setItem('cleardrop_milestones', JSON.stringify(milestones));
  }, [milestones]);

  // Auth Actions
  const login = (email, password) => {
    if (email === 'admin@cleardrop.com' && password === 'admin123') {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  // Driver Actions
  const addDriver = (driverData) => {
    const newDriver = {
      ...driverData,
      id: `d${Date.now()}`
    };
    setDrivers(prev => [...prev, newDriver]);
  };

  const removeDriver = (driverId) => {
    setDrivers(prev => prev.filter(d => d.id !== driverId));
    // If a parcel is assigned to this driver, reset its currentDriverId
    setParcels(prev => prev.map(p => 
      p.currentDriverId === driverId ? { ...p, currentDriverId: null } : p
    ));
  };

  // Milestone Sequence Actions
  const addMilestoneStep = (stepName) => {
    if (milestoneSequence.includes(stepName)) return false;
    
    // Add right before "Delivered" to ensure "Delivered" stays last
    setMilestoneSequence(prev => {
      const newSeq = [...prev];
      const deliveredIdx = newSeq.indexOf('Delivered');
      if (deliveredIdx !== -1) {
        newSeq.splice(deliveredIdx, 0, stepName);
      } else {
        newSeq.push(stepName);
      }
      return newSeq;
    });
    return true;
  };

  const removeMilestoneStep = (stepName) => {
    if (stepName === 'Delivered') return false; // Prevent removing delivered
    setMilestoneSequence(prev => prev.filter(s => s !== stepName));
    return true;
  };

  const moveMilestoneStepUp = (index) => {
    if (index <= 0 || index >= milestoneSequence.length - 1) return; // Prevent moving first step up or Delivered step
    setMilestoneSequence(prev => {
      const newSeq = [...prev];
      const temp = newSeq[index];
      newSeq[index] = newSeq[index - 1];
      newSeq[index - 1] = temp;
      return newSeq;
    });
  };

  const moveMilestoneStepDown = (index) => {
    if (index < 0 || index >= milestoneSequence.length - 2) return; // Prevent moving Delivered step or the step right before it down
    setMilestoneSequence(prev => {
      const newSeq = [...prev];
      const temp = newSeq[index];
      newSeq[index] = newSeq[index + 1];
      newSeq[index + 1] = temp;
      return newSeq;
    });
  };

  // Parcel Actions
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
      imageUrl,
    };
    
    setMilestones(prev => [...prev, newMilestone]);
    
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
      milestoneSequence,
      isAuthenticated,
      login,
      logout,
      addDriver,
      removeDriver,
      addMilestoneStep,
      removeMilestoneStep,
      moveMilestoneStepUp,
      moveMilestoneStepDown,
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
