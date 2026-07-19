import React from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Shield, CheckCircle, XCircle, FileText, Building, Phone } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const SuperAdminDashboard = () => {
  const { organizations, currentUser, toggleOrganizationVerification } = useDatabase();

  if (!currentUser || currentUser.role !== 'super_admin') {
    return <Navigate to="/" />;
  }

  const handleToggleVerification = async (orgId, currentStatus) => {
    await toggleOrganizationVerification(orgId, !currentStatus);
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Shield size={32} color="var(--primary-color)" />
          <h1 style={{ fontSize: '2rem', margin: 0, color: 'var(--text-primary)' }}>Super Admin Dashboard</h1>
        </div>

        <div className="card" style={{ padding: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Registered Organizations</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {organizations.filter(org => org.id !== '00000000-0000-0000-0000-000000000000').map(org => (
              <div key={org.id} style={{ 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--border-radius-md)', 
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: org.isVerified ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {org.logoUrl ? (
                      <img src={org.logoUrl} alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'contain' }} />
                    ) : (
                      <Building size={24} color="var(--text-secondary)" />
                    )}
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{org.companyName}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <Phone size={14} /> {org.supportPhone}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>MSME Certificate</span>
                    {org.msmeCertificateUrl ? (
                      <a 
                        href={org.msmeCertificateUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}
                      >
                        <FileText size={16} /> View Document
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Not Uploaded</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Status</span>
                    {org.isVerified ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#16a34a', fontSize: '0.9rem', fontWeight: '600' }}>
                        <CheckCircle size={16} /> Verified
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#dc2626', fontSize: '0.9rem', fontWeight: '600' }}>
                        <XCircle size={16} /> Unverified
                      </span>
                    )}
                  </div>

                  <button 
                    onClick={() => handleToggleVerification(org.id, org.isVerified)}
                    className="btn"
                    style={{ 
                      backgroundColor: org.isVerified ? '#dc2626' : '#16a34a',
                      color: 'white',
                      fontWeight: '600',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    {org.isVerified ? 'Revoke Verification' : 'Verify Organization'}
                  </button>
                </div>
              </div>
            ))}
            
            {organizations.filter(org => org.id !== '00000000-0000-0000-0000-000000000000').length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                No organizations registered yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
