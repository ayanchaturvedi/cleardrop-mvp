import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const DatabaseContext = createContext();

export const useDatabase = () => useContext(DatabaseContext);

const INITIAL_DRIVERS = [
  { id: 'd1', name: 'Vikram Singh', phone: '+91 98765 43210', vehicleNumber: 'DL-01-HA-9876', organizationId: '00000000-0000-0000-0000-000000000000' },
  { id: 'd2', name: 'Rahul Sharma', phone: '+91 87654 32109', vehicleNumber: 'MH-02-AB-1234', organizationId: '00000000-0000-0000-0000-000000000000' },
  { id: 'd3', name: 'Amit Patel', phone: '+91 76543 21098', vehicleNumber: 'KA-03-XY-5678', organizationId: '00000000-0000-0000-0000-000000000000' },
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
    organizationId: '00000000-0000-0000-0000-000000000000'
  }
];

const DEFAULT_MILESTONES_SEQUENCE = [
  'Confirm Pickup',
  'Arrived at Transfer Hub',
  'Out for Last-Mile',
  'Delivered'
];

const DEFAULT_BRANDING = {
  companyName: 'ClearDrop',
  supportPhone: '+91 1800 123 4567',
  logoUrl: ''
};

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Database field mappings to frontend camelCase
const mapOrgFromDb = (o) => {
  if (!o) return null;
  return {
    id: o.id,
    companyName: o.name,
    logoUrl: o.logo_url || '',
    supportPhone: o.support_phone || '+91 1800 123 4567',
    isVerified: o.is_verified || false,
    msmeCertificateUrl: o.msme_certificate_url || '',
    serviceableCities: o.serviceable_cities || [],
    pricePerKm: o.price_per_km || 0,
    advancePercent: o.advance_percent || 0,
    walletBalance: o.wallet_balance || 0
  };
};

const mapDriverFromDb = (d) => {
  if (!d) return null;
  return {
    id: d.id,
    name: d.name,
    phone: d.phone,
    vehicleNumber: d.vehicle_number,
    organizationId: d.organization_id
  };
};

const mapParcelFromDb = (p) => {
  if (!p) return null;
  return {
    id: p.id,
    trackingNumber: p.tracking_number,
    senderName: p.sender_name,
    recipientPhone: p.recipient_phone,
    packageDetails: p.package_details,
    destination: p.destination,
    currentDriverId: p.current_driver_id,
    status: p.status,
    delayReason: p.delay_reason,
    organizationId: p.organization_id,
    customerId: p.customer_id,
    parcelDimensions: p.parcel_dimensions,
    parcelWeight: p.parcel_weight,
    parcelType: p.parcel_type,
    pickupAddress: p.pickup_address,
    escrowLockedAmount: p.escrow_locked_amount || 0
  };
};

const mapMilestoneFromDb = (m) => {
  if (!m) return null;
  return {
    id: m.id,
    parcelId: m.parcel_id,
    statusName: m.status_name,
    driverId: m.driver_id,
    timestamp: m.timestamp,
    imageUrl: m.image_url,
    isDelay: m.is_delay,
    delayReason: m.delay_reason,
    isTransfer: m.is_transfer
  };
};

export const DatabaseProvider = ({ children }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('cleardrop_auth') === 'true';
  });

  // Current User Profile State (Replaces adminUser)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cleardrop_current_user');
      if (saved && saved !== 'undefined') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse current user', e);
    }
    return null;
  });

  // Connection & loading states
  const [isOffline, setIsOffline] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Raw Database Arrays
  const [rawDrivers, setRawDrivers] = useState([]);
  const [rawParcels, setRawParcels] = useState([]);
  const [rawMilestones, setRawMilestones] = useState([]);
  const [rawOrganizations, setRawOrganizations] = useState([]);
  const [rawMilestoneSequences, setRawMilestoneSequences] = useState([]);

  // Fallback Loader
  const loadLocalFallback = () => {
    try {
      const localDrivers = localStorage.getItem('cleardrop_drivers');
      setRawDrivers(localDrivers ? JSON.parse(localDrivers) : INITIAL_DRIVERS);

      const localParcels = localStorage.getItem('cleardrop_parcels');
      setRawParcels(localParcels ? JSON.parse(localParcels) : INITIAL_PARCELS);

      const localMilestones = localStorage.getItem('cleardrop_milestones');
      setRawMilestones(localMilestones ? JSON.parse(localMilestones) : []);

      const localBranding = localStorage.getItem('cleardrop_branding');
      const brandingObj = localBranding ? JSON.parse(localBranding) : DEFAULT_BRANDING;
      setRawOrganizations([{
        id: '00000000-0000-0000-0000-000000000000',
        name: brandingObj.companyName,
        logo_url: brandingObj.logoUrl,
        support_phone: brandingObj.supportPhone
      }]);

      const localSeq = localStorage.getItem('cleardrop_milestone_sequence');
      const seqArray = localSeq ? JSON.parse(localSeq) : DEFAULT_MILESTONES_SEQUENCE;
      setRawMilestoneSequences(seqArray.map((step, idx) => ({
        stepName: step,
        stepOrder: idx,
        organizationId: '00000000-0000-0000-0000-000000000000'
      })));
    } catch (e) {
      console.error('Failed to load local fallback data', e);
    }
  };

  // Supabase Loaders
  const loadFromSupabase = async () => {
    const { data: orgs, error: orgsError } = await supabase.from('organizations').select('*');
    if (orgsError) throw orgsError;
    setRawOrganizations(orgs.map(mapOrgFromDb));

    const { data: drvs, error: drvsError } = await supabase.from('drivers').select('*');
    if (drvsError) throw drvsError;
    setRawDrivers(drvs.map(mapDriverFromDb));

    const { data: prcls, error: prclsError } = await supabase.from('parcels').select('*');
    if (prclsError) throw prclsError;
    setRawParcels(prcls.map(mapParcelFromDb));

    const { data: mlstns, error: mlstnsError } = await supabase.from('milestones').select('*');
    if (mlstnsError) throw mlstnsError;
    setRawMilestones(mlstns.map(mapMilestoneFromDb));

    const { data: seqs, error: seqsError } = await supabase.from('milestone_sequences').select('*');
    if (seqsError) throw seqsError;
    setRawMilestoneSequences(seqs.map(s => ({
      stepName: s.step_name,
      stepOrder: s.step_order,
      organizationId: s.organization_id
    })));
  };

  const loadParcelsOnly = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('parcels').select('*');
    if (data) setRawParcels(data.map(mapParcelFromDb));
  };

  const loadMilestonesOnly = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('milestones').select('*');
    if (data) setRawMilestones(data.map(mapMilestoneFromDb));
  };

  const loadDriversOnly = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('drivers').select('*');
    if (data) setRawDrivers(data.map(mapDriverFromDb));
  };

  const loadBrandingOnly = async () => {
    if (!supabase) return;
    const { data: orgs } = await supabase.from('organizations').select('*');
    if (orgs) setRawOrganizations(orgs.map(mapOrgFromDb));
    const { data: seqs } = await supabase.from('milestone_sequences').select('*');
    if (seqs) setRawMilestoneSequences(seqs.map(s => ({
      stepName: s.step_name,
      stepOrder: s.step_order,
      organizationId: s.organization_id
    })));
  };

  // Bootstrap Database
  useEffect(() => {
    const initDatabase = async () => {
      setIsLoading(true);
      if (!supabase) {
        setIsOffline(true);
        setConnectionError('Supabase client is not configured.');
        loadLocalFallback();
        setIsLoading(false);
        return;
      }

      try {
        const { error: testError } = await supabase
          .from('organizations')
          .select('id')
          .limit(1);

        if (testError) throw testError;

        await loadFromSupabase();
        setIsOffline(false);
        setConnectionError(null);
      } catch (error) {
        console.error('Supabase connection failed. Falling back to local storage.', error);
        setIsOffline(true);
        setConnectionError(error.message || 'Network connection failed.');
        loadLocalFallback();
      } finally {
        setIsLoading(false);
      }
    };

    initDatabase();
  }, []);

  // Real-time listener
  useEffect(() => {
    if (!supabase || isOffline) return;

    const dbChannel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parcels' }, () => {
        loadParcelsOnly();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'milestones' }, () => {
        loadMilestonesOnly();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => {
        loadDriversOnly();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'organizations' }, () => {
        loadBrandingOnly();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dbChannel);
    };
  }, [isOffline]);

  // Clear stale admin user sessions with invalid (non-UUID) organizationId format
  useEffect(() => {
    if (currentUser && typeof currentUser.organizationId === 'string' && currentUser.organizationId.startsWith('org-')) {
      console.warn('[Session Sync] Logging out stale user with legacy organizationId format.');
      logout();
    }
  }, [currentUser]);

  // Sync auth state to local storage
  useEffect(() => {
    localStorage.setItem('cleardrop_auth', isAuthenticated);
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('cleardrop_current_user', currentUser ? JSON.stringify(currentUser) : 'undefined');
  }, [currentUser]);

  // Dynamic context resolution based on admin session or URL param
  const [activeOrgId, setActiveOrgId] = useState('00000000-0000-0000-0000-000000000000');

  useEffect(() => {
    if (currentUser?.organizationId) {
      setActiveOrgId(currentUser.organizationId);
      return;
    }

    const path = window.location.pathname;
    const match = path.match(/\/(driver|track)\/([^/]+)/);
    if (match && match[2]) {
      const pId = match[2];
      const parcel = rawParcels.find(p => p.id === pId || p.trackingNumber === pId);
      if (parcel) {
        setActiveOrgId(parcel.organizationId);
        return;
      }
    }
    setActiveOrgId('00000000-0000-0000-0000-000000000000');
  }, [currentUser, rawParcels, window.location.pathname]);

  // Computed state getters
  const drivers = currentUser 
    ? rawDrivers.filter(d => d.organizationId === currentUser.organizationId)
    : rawDrivers.filter(d => d.organizationId === activeOrgId);

  const parcels = currentUser
    ? rawParcels.filter(p => p.organizationId === currentUser.organizationId)
    : rawParcels;

  const milestones = rawMilestones;

  const branding = rawOrganizations.find(o => o.id === activeOrgId) || DEFAULT_BRANDING;

  const milestoneSequence = (() => {
    const seqs = rawMilestoneSequences.filter(s => s.organizationId === activeOrgId);
    if (seqs.length > 0) {
      return seqs.sort((a, b) => a.stepOrder - b.stepOrder).map(s => s.stepName);
    }
    return DEFAULT_MILESTONES_SEQUENCE;
  })();

  // Auth Actions
  const login = async (email, password) => {
    // Legacy default admin check
    if (email === 'admin@cleardrop.com' && password === 'admin123') {
      setIsAuthenticated(true);
      const defaultAdmin = {
        name: 'Super Admin',
        email,
        role: 'super_admin',
        organizationId: '00000000-0000-0000-0000-000000000000'
      };
      setCurrentUser(defaultAdmin);
      return true;
    }

    if (supabase && !isOffline) {
      try {
        // Query users table instead of admins
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          // Since we don't have password in our users schema right now for MVP testing
          // we are assuming simple auth. In a real app this uses auth.users.
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setIsAuthenticated(true);
          setCurrentUser({
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
            organizationId: data.organization_id,
            walletBalance: data.wallet_balance || 0
          });
          return true;
        }
      } catch (err) {
        console.error('Database login query failed:', err);
      }
    }

    try {
      const registered = localStorage.getItem('cleardrop_registered_users');
      if (registered) {
        const usersList = JSON.parse(registered);
        const match = usersList.find(a => a.email === email && a.password === password);
        if (match) {
          setIsAuthenticated(true);
          setCurrentUser({
            id: match.id,
            name: match.name,
            email: match.email,
            role: match.role,
            organizationId: match.organizationId || '00000000-0000-0000-0000-000000000000',
            walletBalance: match.walletBalance || 0
          });
          return true;
        }
      }
    } catch (e) {
      console.error('Failed to read registered users locally', e);
    }

    return false;
  };

  const signUp = async (name, email, password, role = 'customer', orgName = '', orgLogo = '', msmeCertUrl = '') => {
    const userId = generateUUID();
    let orgId = null;

    if (role === 'business_owner') {
      orgId = generateUUID();
    }

    if (supabase && !isOffline) {
      try {
        if (role === 'business_owner') {
          const { error: orgErr } = await supabase.from('organizations').insert({
            id: orgId,
            name: orgName,
            logo_url: orgLogo || '',
            support_phone: '+91 1800 123 4567',
            msme_certificate_url: msmeCertUrl || null,
            is_verified: false
          });
          if (orgErr) throw orgErr;

          const defaultSteps = DEFAULT_MILESTONES_SEQUENCE.map((step, idx) => ({
            step_name: step,
            step_order: idx,
            organization_id: orgId
          }));
          await supabase.from('milestone_sequences').insert(defaultSteps);
        }

        const { error: userErr } = await supabase.from('users').insert({
          id: userId,
          name,
          email,
          role,
          organization_id: orgId
        });
        if (userErr) throw userErr;

        await loadFromSupabase();

        setIsAuthenticated(true);
        setCurrentUser({ id: userId, name, email, role, organizationId: orgId, walletBalance: 0 });
        return true;
      } catch (err) {
        console.error('Database sign up failed:', err);
      }
    }

    try {
      const registered = localStorage.getItem('cleardrop_registered_users');
      const usersList = registered ? JSON.parse(registered) : [];
      if (usersList.some(a => a.email === email)) {
        return false;
      }

      const newUser = { id: userId, name, email, password, role, organizationId: orgId, walletBalance: 0 };
      usersList.push(newUser);
      localStorage.setItem('cleardrop_registered_users', JSON.stringify(usersList));

      setIsAuthenticated(true);
      setCurrentUser({ id: userId, name, email, role, organizationId: orgId, walletBalance: 0 });

      if (role === 'business_owner') {
        const newBranding = { companyName: orgName, logoUrl: orgLogo || '', supportPhone: '+91 1800 123 4567', msmeCertificateUrl: msmeCertUrl, isVerified: false };
        localStorage.setItem('cleardrop_branding', JSON.stringify(newBranding));
      }
      
      loadLocalFallback();
      return true;
    } catch (e) {
      console.error('Failed local sign up', e);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const updateBranding = async (newBranding) => {
    const targetOrgId = currentUser?.organizationId || '00000000-0000-0000-0000-000000000000';
    setRawOrganizations(prev => prev.map(o => 
      o.id === targetOrgId ? { ...o, ...newBranding } : o
    ));

    if (supabase && !isOffline) {
      try {
        const updateObj = {};
        if (newBranding.companyName !== undefined) updateObj.name = newBranding.companyName;
        if (newBranding.logoUrl !== undefined) updateObj.logo_url = newBranding.logoUrl;
        if (newBranding.supportPhone !== undefined) updateObj.support_phone = newBranding.supportPhone;
        if (newBranding.isVerified !== undefined) updateObj.is_verified = newBranding.isVerified;
        if (newBranding.serviceableCities !== undefined) updateObj.serviceable_cities = newBranding.serviceableCities;
        if (newBranding.pricePerKm !== undefined) updateObj.price_per_km = newBranding.pricePerKm;
        if (newBranding.advancePercent !== undefined) updateObj.advance_percent = newBranding.advancePercent;

        await supabase
          .from('organizations')
          .update(updateObj)
          .eq('id', targetOrgId);
      } catch (err) {
        console.error('Failed to update branding in Supabase:', err);
      }
    } else {
      const localBranding = localStorage.getItem('cleardrop_branding');
      const current = localBranding ? JSON.parse(localBranding) : DEFAULT_BRANDING;
      const updated = { ...current, ...newBranding };
      localStorage.setItem('cleardrop_branding', JSON.stringify(updated));
    }
  };

  const toggleOrganizationVerification = async (orgId, isVerified) => {
    setRawOrganizations(prev => prev.map(o => 
      o.id === orgId ? { ...o, isVerified } : o
    ));

    if (supabase && !isOffline) {
      try {
        await supabase
          .from('organizations')
          .update({ is_verified: isVerified })
          .eq('id', orgId);
      } catch (err) {
        console.error('Failed to toggle verification in Supabase:', err);
      }
    }
  };

  // Driver Actions
  const addDriver = async (driverData) => {
    const newDriver = {
      ...driverData,
      id: `d${Date.now()}`,
      organizationId: currentUser?.organizationId || '00000000-0000-0000-0000-000000000000'
    };

    setRawDrivers(prev => [...prev, newDriver]);

    if (supabase && !isOffline) {
      try {
        await supabase.from('drivers').insert({
          id: newDriver.id,
          name: newDriver.name,
          phone: newDriver.phone,
          vehicle_number: newDriver.vehicleNumber,
          organization_id: newDriver.organizationId
        });
      } catch (err) {
        console.error('Failed to add driver in Supabase:', err);
      }
    } else {
      localStorage.setItem('cleardrop_drivers', JSON.stringify([...rawDrivers.filter(d => d.id !== newDriver.id), newDriver]));
    }
  };

  const removeDriver = async (driverId) => {
    setRawDrivers(prev => prev.filter(d => d.id !== driverId));
    setRawParcels(prev => prev.map(p => 
      p.currentDriverId === driverId ? { ...p, currentDriverId: null } : p
    ));

    if (supabase && !isOffline) {
      try {
        await supabase.from('drivers').delete().eq('id', driverId);
      } catch (err) {
        console.error('Failed to remove driver in Supabase:', err);
      }
    } else {
      localStorage.setItem('cleardrop_drivers', JSON.stringify(rawDrivers.filter(d => d.id !== driverId)));
    }
  };

  // Milestone Sequence Actions
  const addMilestoneStep = async (stepName) => {
    const targetOrgId = currentUser?.organizationId || '00000000-0000-0000-0000-000000000000';
    if (milestoneSequence.includes(stepName)) return false;

    const nextSeq = [...milestoneSequence];
    const deliveredIdx = nextSeq.indexOf('Delivered');
    if (deliveredIdx !== -1) {
      nextSeq.splice(deliveredIdx, 0, stepName);
    } else {
      nextSeq.push(stepName);
    }

    setRawMilestoneSequences(nextSeq.map((step, idx) => ({
      stepName: step,
      stepOrder: idx,
      organizationId: targetOrgId
    })));

    if (supabase && !isOffline) {
      try {
        const upsertData = nextSeq.map((step, idx) => ({
          step_name: step,
          step_order: idx,
          organization_id: targetOrgId
        }));
        await supabase.from('milestone_sequences').upsert(upsertData, { onConflict: 'organization_id,step_name' });
      } catch (err) {
        console.error('Failed to add milestone step in Supabase:', err);
      }
    } else {
      localStorage.setItem('cleardrop_milestone_sequence', JSON.stringify(nextSeq));
    }
    return true;
  };

  const removeMilestoneStep = async (stepName) => {
    if (stepName === 'Delivered') return false;
    const targetOrgId = currentUser?.organizationId || '00000000-0000-0000-0000-000000000000';
    
    const nextSeq = milestoneSequence.filter(s => s !== stepName);
    setRawMilestoneSequences(nextSeq.map((step, idx) => ({
      stepName: step,
      stepOrder: idx,
      organizationId: targetOrgId
    })));

    if (supabase && !isOffline) {
      try {
        await supabase.from('milestone_sequences').delete().eq('organization_id', targetOrgId).eq('step_name', stepName);
        const upsertData = nextSeq.map((step, idx) => ({
          step_name: step,
          step_order: idx,
          organization_id: targetOrgId
        }));
        await supabase.from('milestone_sequences').upsert(upsertData, { onConflict: 'organization_id,step_name' });
      } catch (err) {
        console.error('Failed to remove milestone step in Supabase:', err);
      }
    } else {
      localStorage.setItem('cleardrop_milestone_sequence', JSON.stringify(nextSeq));
    }
    return true;
  };

  const moveMilestoneStepUp = async (index) => {
    if (index <= 0 || index >= milestoneSequence.length - 1) return;
    const targetOrgId = currentUser?.organizationId || '00000000-0000-0000-0000-000000000000';

    const nextSeq = [...milestoneSequence];
    const temp = nextSeq[index];
    nextSeq[index] = nextSeq[index - 1];
    nextSeq[index - 1] = temp;

    setRawMilestoneSequences(nextSeq.map((step, idx) => ({
      stepName: step,
      stepOrder: idx,
      organizationId: targetOrgId
    })));

    if (supabase && !isOffline) {
      try {
        const upsertData = nextSeq.map((step, idx) => ({
          step_name: step,
          step_order: idx,
          organization_id: targetOrgId
        }));
        await supabase.from('milestone_sequences').upsert(upsertData, { onConflict: 'organization_id,step_name' });
      } catch (err) {
        console.error('Failed to move milestone step in Supabase:', err);
      }
    } else {
      localStorage.setItem('cleardrop_milestone_sequence', JSON.stringify(nextSeq));
    }
  };

  const moveMilestoneStepDown = async (index) => {
    if (index < 0 || index >= milestoneSequence.length - 2) return;
    const targetOrgId = currentUser?.organizationId || '00000000-0000-0000-0000-000000000000';

    const nextSeq = [...milestoneSequence];
    const temp = nextSeq[index];
    nextSeq[index] = nextSeq[index + 1];
    nextSeq[index + 1] = temp;

    setRawMilestoneSequences(nextSeq.map((step, idx) => ({
      stepName: step,
      stepOrder: idx,
      organizationId: targetOrgId
    })));

    if (supabase && !isOffline) {
      try {
        const upsertData = nextSeq.map((step, idx) => ({
          step_name: step,
          step_order: idx,
          organization_id: targetOrgId
        }));
        await supabase.from('milestone_sequences').upsert(upsertData, { onConflict: 'organization_id,step_name' });
      } catch (err) {
        console.error('Failed to move milestone step in Supabase:', err);
      }
    } else {
      localStorage.setItem('cleardrop_milestone_sequence', JSON.stringify(nextSeq));
    }
  };

  // Parcel Actions
  const createParcel = async (parcelData) => {
    const newParcel = {
      ...parcelData,
      id: `p${Date.now()}`,
      trackingNumber: `CD-${Math.floor(1000000 + Math.random() * 9000000)}`,
      status: parcelData.status || 'Pending Pickup',
      organizationId: parcelData.organizationId || currentUser?.organizationId || '00000000-0000-0000-0000-000000000000'
    };

    setRawParcels(prev => [newParcel, ...prev]);

    if (supabase && !isOffline) {
      try {
        await supabase.from('parcels').insert({
          id: newParcel.id,
          tracking_number: newParcel.trackingNumber,
          sender_name: newParcel.senderName,
          recipient_phone: newParcel.recipientPhone,
          package_details: newParcel.packageDetails,
          destination: newParcel.destination,
          current_driver_id: newParcel.currentDriverId || null,
          status: newParcel.status,
          organization_id: newParcel.organizationId,
          customer_id: newParcel.customerId || null,
          parcel_dimensions: newParcel.parcelDimensions || null,
          parcel_weight: newParcel.parcelWeight || null,
          parcel_type: newParcel.parcelType || null,
          pickup_address: newParcel.pickupAddress || null,
          escrow_locked_amount: newParcel.escrowLockedAmount || 0
        });
      } catch (err) {
        console.error('Failed to create parcel in Supabase:', err);
      }
    } else {
      localStorage.setItem('cleardrop_parcels', JSON.stringify([newParcel, ...rawParcels]));
    }
    return newParcel;
  };

  const assignDriver = async (parcelId, driverId) => {
    setRawParcels(prev => prev.map(p => 
      p.id === parcelId ? { ...p, currentDriverId: driverId } : p
    ));

    if (supabase && !isOffline) {
      try {
        await supabase.from('parcels').update({ current_driver_id: driverId }).eq('id', parcelId);
      } catch (err) {
        console.error('Failed to assign driver in Supabase:', err);
      }
    } else {
      localStorage.setItem('cleardrop_parcels', JSON.stringify(rawParcels.map(p => 
        p.id === parcelId ? { ...p, currentDriverId: driverId } : p
      )));
    }
  };

  const addMilestone = async (parcelId, statusName, driverId, imageUrl = null) => {
    const newMilestone = {
      id: `m${Date.now()}`,
      parcelId,
      statusName,
      driverId,
      timestamp: new Date().toISOString(),
      imageUrl,
      isDelay: false,
      delayReason: null,
      isTransfer: false
    };

    setRawMilestones(prev => [...prev, newMilestone]);
    setRawParcels(prev => prev.map(p => 
      p.id === parcelId ? { ...p, status: statusName, delayReason: null } : p
    ));

    if (supabase && !isOffline) {
      try {
        await supabase.from('milestones').insert({
          id: newMilestone.id,
          parcel_id: newMilestone.parcelId,
          status_name: newMilestone.statusName,
          driver_id: newMilestone.driverId,
          timestamp: newMilestone.timestamp,
          image_url: newMilestone.imageUrl
        });
        await supabase.from('parcels').update({ status: statusName, delay_reason: null }).eq('id', parcelId);
      } catch (err) {
        console.error('Failed to add milestone in Supabase:', err);
      }
    } else {
      localStorage.setItem('cleardrop_milestones', JSON.stringify([...rawMilestones, newMilestone]));
      localStorage.setItem('cleardrop_parcels', JSON.stringify(rawParcels.map(p => 
        p.id === parcelId ? { ...p, status: statusName, delayReason: null } : p
      )));
    }
  };

  const logDelay = async (parcelId, reason, driverId) => {
    const delayStatus = `Delay: ${reason}`;
    const newMilestone = {
      id: `m${Date.now()}`,
      parcelId,
      statusName: delayStatus,
      driverId,
      timestamp: new Date().toISOString(),
      isDelay: true,
      delayReason: reason,
      isTransfer: false
    };

    setRawMilestones(prev => [...prev, newMilestone]);
    setRawParcels(prev => prev.map(p => 
      p.id === parcelId ? { ...p, status: delayStatus, delayReason: reason } : p
    ));

    if (supabase && !isOffline) {
      try {
        await supabase.from('milestones').insert({
          id: newMilestone.id,
          parcel_id: newMilestone.parcelId,
          status_name: newMilestone.statusName,
          driver_id: newMilestone.driverId,
          timestamp: newMilestone.timestamp,
          is_delay: true,
          delay_reason: newMilestone.delayReason
        });
        await supabase.from('parcels').update({ status: delayStatus, delay_reason: reason }).eq('id', parcelId);
      } catch (err) {
        console.error('Failed to log delay in Supabase:', err);
      }
    } else {
      localStorage.setItem('cleardrop_milestones', JSON.stringify([...rawMilestones, newMilestone]));
      localStorage.setItem('cleardrop_parcels', JSON.stringify(rawParcels.map(p => 
        p.id === parcelId ? { ...p, status: delayStatus, delayReason: reason } : p
      )));
    }
  };

  const transferParcel = async (parcelId, newDriverId, newDriverName) => {
    const transferStatus = `Package successfully transferred to ${newDriverName}`;
    const newMilestone = {
      id: `m${Date.now()}`,
      parcelId,
      statusName: transferStatus,
      driverId: newDriverId,
      timestamp: new Date().toISOString(),
      isDelay: false,
      delayReason: null,
      isTransfer: true
    };

    setRawMilestones(prev => [...prev, newMilestone]);
    setRawParcels(prev => prev.map(p => 
      p.id === parcelId ? { ...p, currentDriverId: newDriverId } : p
    ));

    if (supabase && !isOffline) {
      try {
        await supabase.from('milestones').insert({
          id: newMilestone.id,
          parcel_id: newMilestone.parcelId,
          status_name: newMilestone.statusName,
          driver_id: newMilestone.driverId,
          timestamp: newMilestone.timestamp,
          is_transfer: true
        });
        await supabase.from('parcels').update({ current_driver_id: newDriverId }).eq('id', parcelId);
      } catch (err) {
        console.error('Failed to transfer parcel in Supabase:', err);
      }
    } else {
      localStorage.setItem('cleardrop_milestones', JSON.stringify([...rawMilestones, newMilestone]));
      localStorage.setItem('cleardrop_parcels', JSON.stringify(rawParcels.map(p => 
        p.id === parcelId ? { ...p, currentDriverId: newDriverId } : p
      )));
    }
  };

  const deleteParcel = async (parcelId) => {
    setRawParcels(prev => prev.filter(p => p.id !== parcelId));
    setRawMilestones(prev => prev.filter(m => m.parcelId !== parcelId));

    if (supabase && !isOffline) {
      try {
        await supabase.from('parcels').delete().eq('id', parcelId);
      } catch (err) {
        console.error('Failed to delete parcel in Supabase:', err);
      }
    } else {
      localStorage.setItem('cleardrop_parcels', JSON.stringify(rawParcels.filter(p => p.id !== parcelId)));
      localStorage.setItem('cleardrop_milestones', JSON.stringify(rawMilestones.filter(m => m.parcelId !== parcelId)));
    }
  };

  const cleanId = (str) => {
    if (typeof str !== 'string') return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const getParcelById = (id) => {
    if (!id) return null;
    const target = cleanId(id);
    return rawParcels.find(p => 
      cleanId(p.id) === target || cleanId(p.trackingNumber) === target
    );
  };
  const getMilestonesForParcel = (parcelId) => rawMilestones.filter(m => m.parcelId === parcelId).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const getDriverById = (id) => rawDrivers.find(d => d.id === id);

  const approveParcel = async (parcelId) => {
    setRawParcels(prev => prev.map(p => 
      p.id === parcelId ? { ...p, status: 'Awaiting Customer Payment' } : p
    ));
    if (supabase && !isOffline) {
      await supabase.from('parcels').update({ status: 'Awaiting Customer Payment' }).eq('id', parcelId);
    }
  };

  const processParcelPayment = async (parcelId, orgId, totalCost, advancePercent) => {
    const advanceAmount = (totalCost * advancePercent) / 100;
    const escrowAmount = totalCost - advanceAmount;

    // Deduct total cost from Customer wallet
    const newCustomerBalance = (currentUser.walletBalance || 0) - totalCost;
    setCurrentUser(prev => ({ ...prev, walletBalance: newCustomerBalance }));

    // Update Org wallet locally
    setRawOrganizations(prev => prev.map(o => 
      o.id === orgId ? { ...o, walletBalance: (o.walletBalance || 0) + advanceAmount } : o
    ));

    // Update Parcel locally
    setRawParcels(prev => prev.map(p => 
      p.id === parcelId ? { ...p, status: 'Ready for Pickup', escrowLockedAmount: escrowAmount } : p
    ));

    if (supabase && !isOffline) {
      // 1. Update customer wallet
      await supabase.from('users').update({ wallet_balance: newCustomerBalance }).eq('id', currentUser.id);
      
      // 2. Update Org wallet
      const { data: orgData } = await supabase.from('organizations').select('wallet_balance').eq('id', orgId).single();
      const currentOrgBalance = orgData?.wallet_balance || 0;
      await supabase.from('organizations').update({ wallet_balance: currentOrgBalance + advanceAmount }).eq('id', orgId);

      // 3. Update Parcel
      await supabase.from('parcels').update({ status: 'Ready for Pickup', escrow_locked_amount: escrowAmount }).eq('id', parcelId);
    }
  };

  const addCustomerFunds = async (amount) => {
    const newBalance = (currentUser.walletBalance || 0) + amount;
    setCurrentUser(prev => ({ ...prev, walletBalance: newBalance }));
    if (supabase && !isOffline) {
      await supabase.from('users').update({ wallet_balance: newBalance }).eq('id', currentUser.id);
    } else {
       // fallback for local users
       const registered = localStorage.getItem('cleardrop_registered_users');
       if (registered) {
         const usersList = JSON.parse(registered);
         const updatedList = usersList.map(u => u.id === currentUser.id ? { ...u, walletBalance: newBalance } : u);
         localStorage.setItem('cleardrop_registered_users', JSON.stringify(updatedList));
       }
    }
  };

  return (
    <DatabaseContext.Provider value={{
      drivers,
      parcels,
      milestones,
      milestoneSequence,
      organizations: rawOrganizations,
      isAuthenticated,
      currentUser,
      branding,
      isOffline,
      connectionError,
      isLoading,
      login,
      signUp,
      logout,
      updateBranding,
      toggleOrganizationVerification,
      addDriver,
      removeDriver,
      addMilestoneStep,
      removeMilestoneStep,
      moveMilestoneStepUp,
      moveMilestoneStepDown,
      createParcel,
      assignDriver,
      addMilestone,
      logDelay,
      transferParcel,
      deleteParcel,
      getParcelById,
      getMilestonesForParcel,
      getDriverById,
      approveParcel,
      processParcelPayment,
      addCustomerFunds
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};
