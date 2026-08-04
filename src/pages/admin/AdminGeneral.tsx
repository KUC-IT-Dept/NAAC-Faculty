import { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Save, Search, Settings } from 'lucide-react';
import { useConfirmSave } from '../../components/useConfirmSave';

export default function AdminGeneral() {
  const [institutions, setInstitutions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newInstitution, setNewInstitution] = useState('');
  const { confirmSave, ConfirmDialog } = useConfirmSave();

  const fetchDropdowns = async () => {
    try {
      const { data } = await api.get('/admin/dropdowns');
      if (data.institutions) {
        setInstitutions(data.institutions);
      }
    } catch {
      toast.error('Failed to load dropdown options');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const handleSave = async (updatedList: string[]) => {
    setSaving(true);
    try {
      await api.patch('/admin/dropdowns/institutions', { options: updatedList });
      toast.success('Institutions updated successfully');
      setInstitutions(updatedList);
    } catch {
      toast.error('Failed to update institutions');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    const trimmed = newInstitution.trim();
    if (!trimmed) return;
    if (institutions.includes(trimmed)) {
      toast.error('Institution already exists');
      return;
    }
    const updated = [...institutions, trimmed].sort();
    confirmSave(async () => {
      await handleSave(updated);
      setNewInstitution('');
    });
  };

  const handleRemove = (inst: string) => {
    if (!confirm(`Are you sure you want to remove "${inst}"?`)) return;
    const updated = institutions.filter(i => i !== inst);
    handleSave(updated);
  };

  const filteredInstitutions = institutions.filter(i => i.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AppLayout title="General Settings">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={20} color="var(--primary)" />
          <div>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>General Configurations</h2>
            <p className="text-muted text-sm" style={{ margin: '4px 0 0' }}>Manage global settings and dropdown options</p>
          </div>
        </div>

        <div className="card-body" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Institutions Dropdown</h3>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search institutions..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Add new institution" 
                value={newInstitution}
                onChange={e => setNewInstitution(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <button className="btn btn-primary" onClick={handleAdd} disabled={saving || !newInstitution.trim()}>
                <Save size={16} /> Add
              </button>
            </div>
          </div>

          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', maxHeight: '400px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span className="spinner" style={{ marginRight: '8px' }}></span> Loading...
              </div>
            ) : filteredInstitutions.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No institutions found.
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {filteredInstitutions.slice(0, 100).map((inst, i) => (
                  <li key={i} style={{ 
                    padding: '10px 16px', 
                    borderBottom: i < filteredInstitutions.slice(0, 100).length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{inst}</span>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => handleRemove(inst)}
                      style={{ color: 'var(--danger)', padding: '4px 8px' }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!loading && filteredInstitutions.length > 100 && (
              <div style={{ padding: '12px 16px', textAlign: 'center', borderTop: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Showing 100 of {filteredInstitutions.length} matching results. Please use the search bar to refine.
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog />
    </AppLayout>
  );
}
