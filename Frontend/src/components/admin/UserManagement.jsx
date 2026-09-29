import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Edit2, Trash2, Shield, Building2, Truck, User, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../../api/api';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [stationId, setStationId] = useState('');
  const [modalError, setModalError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([
        api.getUsers({ role: roleFilter }),
        api.getStations(),
      ]);
      setUsers(uRes);
      setStations(sRes);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setRole('CUSTOMER');
    setStationId(stations.length > 0 ? stations[0]._id : '');
    setModalError('');
    setModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setPhone(u.phone || '');
    setRole(u.role);
    setStationId(u.stationId?._id || u.stationId || '');
    setModalError('');
    setModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setModalError('');

    try {
      if (editingUser) {
        await api.updateUser(editingUser._id, {
          name,
          phone,
          role,
          stationId: role === 'PARCEL_AGENT' ? stationId : null,
          ...(password ? { password } : {}),
        });
      } else {
        await api.createUser({
          name,
          email,
          password: password || 'password123',
          phone,
          role,
          stationId: role === 'PARCEL_AGENT' ? stationId : null,
        });
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      setModalError(err.message || 'Failed to save user.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.deleteUser(id);
      fetchUsers();
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const filteredUsers = users.filter((u) => {
    const s = search.toLowerCase();
    return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
          >
            <option value="">Tous les rôles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="PARCEL_AGENT">PARCEL_AGENT</option>
            <option value="DRIVER">DRIVER</option>
            <option value="CUSTOMER">CUSTOMER</option>
          </select>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition"
        >
          <UserPlus size={16} />
          <span>Ajouter un Utilisateur</span>
        </button>
      </div>

      {/* User Table */}
      <div className="rounded-xl border border-slate-300 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-300">
              <tr>
                <th className="py-3 px-4">Nom</th>
                <th className="py-3 px-4">Adresse e-mail</th>
                <th className="py-3 px-4">Rôle</th>
                <th className="py-3 px-4">Gare Assignée</th>
                <th className="py-3 px-4">Téléphone</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">Chargement de l'annuaire des utilisateurs...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">Aucun utilisateur trouvé.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          u.role === 'ADMIN'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : u.role === 'PARCEL_AGENT'
                            ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                            : u.role === 'DRIVER'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {u.stationId?.name || (u.role === 'PARCEL_AGENT' ? 'Non assignée' : '—')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{u.phone || '—'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                          title="Modifier"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-300 p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-4">
              {editingUser ? 'Modifier le compte utilisateur' : 'Créer un compte utilisateur'}
            </h3>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Adresse e-mail *</label>
                <input
                  type="email"
                  required
                  disabled={Boolean(editingUser)}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 disabled:bg-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">
                  {editingUser ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe initial *'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingUser ? 'Conserver le mot de passe actuel' : '••••••••'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Téléphone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+237 ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Rôle assigné *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                >
                  <option value="CUSTOMER">CUSTOMER (Client particulier)</option>
                  <option value="PARCEL_AGENT">PARCEL_AGENT (Agent de guichet gare)</option>
                  <option value="DRIVER">DRIVER (Conducteur de bus)</option>
                  <option value="ADMIN">ADMIN (Super Administrateur)</option>
                </select>
              </div>

              {role === 'PARCEL_AGENT' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">
                    Gare de rattachement *
                  </label>
                  <select
                    value={stationId}
                    onChange={(e) => setStationId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                  >
                    <option value="">Sélectionner une gare...</option>
                    {stations.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 font-bold transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-xs transition"
                >
                  Enregistrer l'utilisateur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
