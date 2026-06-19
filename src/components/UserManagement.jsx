import React, { useState, memo } from 'react';
import { Plus, Eye, EyeOff, Save, Edit2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const UserManagement = memo(() => {
  const { users, addUser, updateUser } = useStore();
  const currentLocId = localStorage.getItem('currentLocationId');
  
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'mozo', name: '', locationId: currentLocId });
  const [editUser, setEditUser] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Responsive state can be simple for this component
  React.useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = windowWidth <= 768;

  const togglePasswordVisibility = (userId) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.name) return;
    addUser({ ...newUser, id: Date.now().toString(), active: true });
    setNewUser({ username: '', password: '', role: 'mozo', name: '', locationId: currentLocId });
  };

  const handleSaveUser = () => {
    if (editUser) {
      updateUser(editUser.id, editUser.data);
      setEditUser(null);
    }
  };

  return (
    <div className="animate-fade-in" style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0.75rem' : '1.5rem' }}>
      <div className="card mb-6">
        <h2 className="title mb-4" style={{ fontSize: '1.25rem' }}>Añadir Nuevo Usuario</h2>
        <form onSubmit={handleAddUser} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="subtitle" style={{ fontSize: '0.875rem' }}>Nombre Completo</label>
            <input className="input mt-1" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Ej. Juan Pérez" required style={{ width: '200px' }} />
          </div>
          <div>
            <label className="subtitle" style={{ fontSize: '0.875rem' }}>Usuario (Login)</label>
            <input className="input mt-1" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="juan123" required style={{ width: '150px' }} />
          </div>
          <div>
            <label className="subtitle" style={{ fontSize: '0.875rem' }}>Contraseña</label>
            <input className="input mt-1" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="***" required style={{ width: '120px' }} />
          </div>
          <div>
            <label className="subtitle" style={{ fontSize: '0.875rem' }}>Rol</label>
            <select className="input mt-1" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} style={{ width: '130px' }}>
              <option value="mozo">Mozo</option>
              <option value="cocina">Cocina</option>
              <option value="bar">Bar</option>
              <option value="cajera">Cajera</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}><Plus size={20}/></button>
        </form>
      </div>

      <div className="card">
        <h2 className="title mb-4" style={{ fontSize: '1.25rem' }}>Usuarios de la Sede</h2>
        <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th className="pb-3 subtitle">Nombre</th>
                <th className="pb-3 subtitle">Usuario</th>
                <th className="pb-3 subtitle">Contraseña</th>
                <th className="pb-3 subtitle">Rol</th>
                <th className="pb-3 subtitle" style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(users || []).filter(u => u.locationId === currentLocId && u.role !== 'superadmin' && u.role !== 'admin' && u.active).map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {editUser?.id === u.id ? (
                    <>
                      <td className="py-2"><input className="input" value={editUser.data.name} onChange={e => setEditUser({ ...editUser, data: { ...editUser.data, name: e.target.value } })} /></td>
                      <td className="py-2"><input className="input" value={editUser.data.username} onChange={e => setEditUser({ ...editUser, data: { ...editUser.data, username: e.target.value } })} /></td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <input type={visiblePasswords[u.id] ? "text" : "password"} className="input w-full" value={editUser.data.password} onChange={e => setEditUser({ ...editUser, data: { ...editUser.data, password: e.target.value } })} />
                          <button onClick={() => togglePasswordVisibility(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-secondary)' }}>
                            {visiblePasswords[u.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </td>
                      <td className="py-2">
                        <select className="input" value={editUser.data.role} onChange={e => setEditUser({ ...editUser, data: { ...editUser.data, role: e.target.value } })}>
                          <option value="mozo">Mozo</option>
                          <option value="cocina">Cocina</option>
                          <option value="bar">Bar</option>
                          <option value="cajera">Cajera</option>
                        </select>
                      </td>
                      <td className="py-2" style={{ textAlign: 'right' }}>
                        <button onClick={handleSaveUser} className="btn btn-primary" style={{ padding: '0.4rem 0.6rem' }}><Save size={16}/></button>
                        <button onClick={() => setEditUser(null)} className="btn btn-outline ml-2" style={{ padding: '0.4rem 0.6rem' }}><X size={16}/></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-4">{u.name}</td>
                      <td className="py-4 text-secondary">{u.username}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span style={{ fontFamily: visiblePasswords[u.id] ? 'inherit' : 'monospace', color: 'var(--text-secondary)' }}>
                            {visiblePasswords[u.id] ? u.password : '••••••••'}
                          </span>
                          <button onClick={() => togglePasswordVisibility(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-secondary)' }}>
                            {visiblePasswords[u.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 capitalize">{u.role}</td>
                      <td className="py-4" style={{ textAlign: 'right' }}>
                        <button onClick={() => setEditUser({ id: u.id, data: { ...u } })} className="btn btn-outline" style={{ padding: '0.4rem 0.6rem' }}><Edit2 size={16}/></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {(!users || users.filter(u => u.locationId === currentLocId && u.role !== 'superadmin' && u.role !== 'admin' && u.active).length === 0) && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-secondary">No hay usuarios registrados en esta sede.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default UserManagement;
