import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Package, Search, MapPin, Building, CreditCard, Clock, CheckCircle, Wallet, ArrowRight, X, User } from 'lucide-react';

const CustomerDashboard = () => {
  const { 
    currentUser, 
    organizations, 
    parcels, 
    createParcel, 
    processParcelPayment, 
    addCustomerFunds, 
    logout 
  } = useDatabase();

  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'parcels' | 'wallet'
  
  // Search State
  const [searchCity, setSearchCity] = useState('');
  const [filteredOrgs, setFilteredOrgs] = useState([]);

  // Create Parcel Modal State
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [parcelForm, setParcelForm] = useState({
    senderName: currentUser?.name || '',
    recipientPhone: '',
    packageDetails: '', // Used as 'type'
    parcelDimensions: '',
    parcelWeight: '',
    pickupAddress: '',
    destination: '',
    estimatedDistance: ''
  });

  // Payment Modal State
  const [paymentParcel, setPaymentParcel] = useState(null);
  
  // Wallet State
  const [addFundsAmount, setAddFundsAmount] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchCity.trim()) return;
    const query = searchCity.toLowerCase();
    
    const results = organizations.filter(org => {
      if (!org.isVerified) return false;
      if (org.id === '00000000-0000-0000-0000-000000000000') return false;
      const cities = org.serviceableCities || [];
      return cities.some(c => c.toLowerCase().includes(query));
    });
    setFilteredOrgs(results);
  };

  const handleCreateParcel = async (e) => {
    e.preventDefault();
    if (!selectedOrg) return;

    await createParcel({
      senderName: parcelForm.senderName,
      recipientPhone: parcelForm.recipientPhone,
      packageDetails: parcelForm.packageDetails, // type
      parcelDimensions: parcelForm.parcelDimensions,
      parcelWeight: parcelForm.parcelWeight,
      pickupAddress: parcelForm.pickupAddress,
      destination: parcelForm.destination,
      status: 'Awaiting Org Approval',
      organizationId: selectedOrg.id,
      customerId: currentUser.id,
      // Temporarily store the total cost calculation in packageDetails or a new field, 
      // but for MVP we will recalculate it from Org when they pay, or we could just 
      // save distance. We'll store distance in delayReason or a custom field for MVP.
      // Wait, we can just calculate the cost dynamically in the UI based on org.pricePerKm * distance
      // So we must store distance. We'll append it to packageDetails for simplicity if no schema change.
      // Let's add distance to parcelDimensions or just a string:
      packageDetails: `${parcelForm.packageDetails} | Distance: ${parcelForm.estimatedDistance}km`
    });

    setSelectedOrg(null);
    setParcelForm({
      senderName: currentUser?.name || '',
      recipientPhone: '',
      packageDetails: '',
      parcelDimensions: '',
      parcelWeight: '',
      pickupAddress: '',
      destination: '',
      estimatedDistance: ''
    });
    setActiveTab('parcels');
  };

  const extractDistance = (detailsString) => {
    const match = detailsString?.match(/Distance: (\d+(\.\d+)?)km/);
    return match ? parseFloat(match[1]) : 0;
  };

  const handlePay = async () => {
    if (!paymentParcel) return;
    const org = organizations.find(o => o.id === paymentParcel.organizationId);
    if (!org) return;

    const distance = extractDistance(paymentParcel.packageDetails);
    const totalCost = distance * org.pricePerKm;

    if ((currentUser.walletBalance || 0) < totalCost) {
      alert('Insufficient wallet balance. Please add funds.');
      setActiveTab('wallet');
      setPaymentParcel(null);
      return;
    }

    await processParcelPayment(paymentParcel.id, org.id, totalCost, org.advancePercent);
    setPaymentParcel(null);
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    const amount = Number(addFundsAmount);
    if (amount > 0) {
      await addCustomerFunds(amount);
      setAddFundsAmount('');
    }
  };

  const myParcels = parcels.filter(p => p.customerId === currentUser.id);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)' }}>
      {/* Navbar */}
      <nav style={{ backgroundColor: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.5rem', borderRadius: 'var(--border-radius-md)' }}>
            <Package size={24} color="var(--primary-color)" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary-color)' }}>ClearDrop</span>
          <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '600' }}>
            Customer Portal
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', fontWeight: '700', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '0.5rem 1rem', borderRadius: '999px' }}>
            <Wallet size={16} /> ₹{(currentUser.walletBalance || 0).toLocaleString()}
          </div>
          <button onClick={logout} className="btn btn-secondary">Logout</button>
        </div>
      </nav>

      <div className="container" style={{ padding: '2rem 1rem', flex: 1 }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
          <button onClick={() => setActiveTab('search')} style={{ padding: '0.75rem 1.25rem', borderBottom: activeTab === 'search' ? '3px solid var(--primary-color)' : '3px solid transparent', fontWeight: '700', color: activeTab === 'search' ? 'var(--primary-color)' : 'var(--text-secondary)' }}>Marketplace</button>
          <button onClick={() => setActiveTab('parcels')} style={{ padding: '0.75rem 1.25rem', borderBottom: activeTab === 'parcels' ? '3px solid var(--primary-color)' : '3px solid transparent', fontWeight: '700', color: activeTab === 'parcels' ? 'var(--primary-color)' : 'var(--text-secondary)' }}>My Parcels</button>
          <button onClick={() => setActiveTab('wallet')} style={{ padding: '0.75rem 1.25rem', borderBottom: activeTab === 'wallet' ? '3px solid var(--primary-color)' : '3px solid transparent', fontWeight: '700', color: activeTab === 'wallet' ? 'var(--primary-color)' : 'var(--text-secondary)' }}>Wallet</button>
        </div>

        {/* Tab 1: Marketplace */}
        {activeTab === 'search' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><Search size={20} color="var(--primary-color)" /> Find Logistics Providers</h2>
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
                <input type="text" className="input-field" style={{ flex: 1 }} value={searchCity} onChange={(e) => setSearchCity(e.target.value)} placeholder="Search for your city (e.g. Mumbai)" />
                <button type="submit" className="btn btn-primary">Search</button>
              </form>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredOrgs.map(org => (
                <div key={org.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setSelectedOrg(org)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {org.logoUrl ? <img src={org.logoUrl} alt="Logo" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'contain' }} /> : <Building size={48} color="var(--text-secondary)" />}
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{org.companyName}</h3>
                      <p style={{ margin: '0.2rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Serviceable Cities: {org.serviceableCities.join(', ')}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-color)' }}>₹{org.pricePerKm} / km</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Advance: {org.advancePercent}%</div>
                  </div>
                </div>
              ))}
              {filteredOrgs.length === 0 && searchCity && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No verified providers found in this city.</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: My Parcels */}
        {activeTab === 'parcels' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {myParcels.map(parcel => {
              const org = organizations.find(o => o.id === parcel.organizationId);
              const isAwaitingPayment = parcel.status === 'Awaiting Customer Payment';
              const distance = extractDistance(parcel.packageDetails);
              const cost = distance * (org?.pricePerKm || 0);

              return (
                <div key={parcel.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{parcel.trackingNumber}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0' }}>{org?.companyName}</p>
                    </div>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '999px',
                      backgroundColor: isAwaitingPayment ? '#fef08a' : 'var(--primary-light)',
                      color: isAwaitingPayment ? '#854d0e' : 'var(--primary-color)',
                      fontWeight: '700'
                    }}>{parcel.status}</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div><strong>From:</strong> {parcel.pickupAddress}</div>
                    <div><strong>To:</strong> {parcel.destination}</div>
                    <div><strong>Cost Estimate:</strong> ₹{cost.toLocaleString()} ({distance}km)</div>
                  </div>
                  {isAwaitingPayment && (
                    <button onClick={() => setPaymentParcel(parcel)} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                      <CreditCard size={16} /> Pay & Confirm
                    </button>
                  )}
                </div>
              );
            })}
            {myParcels.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>You have not created any parcels yet.</div>
            )}
          </div>
        )}

        {/* Tab 3: Wallet */}
        {activeTab === 'wallet' && (
          <div style={{ maxWidth: '500px', margin: '0 auto' }} className="card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}><Wallet size={20} color="var(--primary-color)" /> My Wallet</h2>
            <div style={{ backgroundColor: 'var(--primary-light)', padding: '2rem', borderRadius: 'var(--border-radius-md)', textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--primary-hover)', fontWeight: '600' }}>Current Balance</div>
              <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--primary-color)' }}>₹{(currentUser.walletBalance || 0).toLocaleString()}</div>
            </div>
            <form onSubmit={handleAddFunds} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label className="label">Amount to add (₹)</label>
              <input type="number" className="input-field" value={addFundsAmount} onChange={(e) => setAddFundsAmount(e.target.value)} min="1" required />
              <button type="submit" className="btn btn-primary">Add Funds</button>
            </form>
          </div>
        )}

      </div>

      {/* Modals */}
      {selectedOrg && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Request Delivery from {selectedOrg.companyName}</h2>
              <button onClick={() => setSelectedOrg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateParcel} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label className="label">Pickup Address</label><input className="input-field" value={parcelForm.pickupAddress} onChange={e=>setParcelForm({...parcelForm, pickupAddress: e.target.value})} required /></div>
                <div><label className="label">Destination City / Address</label><input className="input-field" value={parcelForm.destination} onChange={e=>setParcelForm({...parcelForm, destination: e.target.value})} required /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label className="label">Parcel Type (e.g. Electronics)</label><input className="input-field" value={parcelForm.packageDetails} onChange={e=>setParcelForm({...parcelForm, packageDetails: e.target.value})} required /></div>
                <div><label className="label">Estimated Distance (km)</label><input type="number" className="input-field" value={parcelForm.estimatedDistance} onChange={e=>setParcelForm({...parcelForm, estimatedDistance: e.target.value})} required /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label className="label">Dimensions (L x W x H)</label><input className="input-field" value={parcelForm.parcelDimensions} onChange={e=>setParcelForm({...parcelForm, parcelDimensions: e.target.value})} required /></div>
                <div><label className="label">Weight (kg)</label><input type="number" className="input-field" value={parcelForm.parcelWeight} onChange={e=>setParcelForm({...parcelForm, parcelWeight: e.target.value})} required /></div>
              </div>
              <div><label className="label">Recipient Phone</label><input className="input-field" value={parcelForm.recipientPhone} onChange={e=>setParcelForm({...parcelForm, recipientPhone: e.target.value})} required /></div>
              
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: 'var(--border-radius-sm)', marginTop: '1rem' }}>
                <strong>Estimated Cost:</strong> ₹{(parseFloat(parcelForm.estimatedDistance || 0) * selectedOrg.pricePerKm).toLocaleString()}<br/>
                <small style={{ color: 'var(--text-secondary)' }}>Based on ₹{selectedOrg.pricePerKm}/km. This will be charged upon organization approval.</small>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Submit Request</button>
            </form>
          </div>
        </div>
      )}

      {paymentParcel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <h2 style={{ margin: '0 0 1rem 0' }}>Confirm Payment</h2>
            {(() => {
              const org = organizations.find(o => o.id === paymentParcel.organizationId);
              const distance = extractDistance(paymentParcel.packageDetails);
              const totalCost = distance * (org?.pricePerKm || 0);
              const advanceAmount = (totalCost * (org?.advancePercent || 0)) / 100;
              
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Cost:</span><strong>₹{totalCost.toLocaleString()}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem' }}><span>Advance to Org ({org?.advancePercent}%):</span><span>₹{advanceAmount.toLocaleString()}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem' }}><span>Escrow Hold:</span><span>₹{(totalCost - advanceAmount).toLocaleString()}</span></div>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: (currentUser.walletBalance || 0) < totalCost ? 'var(--error)' : 'var(--success)' }}>
                    <span>Your Wallet Balance:</span><strong>₹{(currentUser.walletBalance || 0).toLocaleString()}</strong>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button onClick={() => setPaymentParcel(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                    <button onClick={handlePay} className="btn btn-primary" style={{ flex: 1 }}>Pay Now</button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerDashboard;
