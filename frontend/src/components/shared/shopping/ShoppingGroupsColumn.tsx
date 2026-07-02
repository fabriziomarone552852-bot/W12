// src/components/shared/shopping/ShoppingGroupsColumn.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useShoppingApi } from '../../../api/shoppingApi';
import { useShoppingMutations } from '../../../hooks/useShoppingMutations';
import { useModal } from '../../../hooks/useModals';
import type { ShoppingGroup, InviteFormState } from '../../../types/shopping';
import { shoppingButtonPrimaryClass, shoppingButtonSecondaryClass, shoppingCardClass, shoppingInputClass } from './shoppingUi';

interface ShoppingGroupsColumnProps {
  onSelectGroup?: (groupId: number | null) => void;
  selectedGroupId?: number | null;
}

const ShoppingGroupsColumn: React.FC<ShoppingGroupsColumnProps> = ({ onSelectGroup, selectedGroupId }) => {
  const api = useShoppingApi();
  const mutations = useShoppingMutations();
  const [selectedGroup, setSelectedGroup] = useState<ShoppingGroup | null>(null);
  const inviteModal = useModal<number>(); // groupId
  const createModal = useModal<null>();

  const { data: groups = [] } = useQuery<ShoppingGroup[]>({
    queryKey: ['shopping', 'groups'],
    queryFn: async () => {
      const data = await api.fetchGroups();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ['shopping', 'members', selectedGroup?.id],
    queryFn: async () => {
      if (!selectedGroup) return [];
      const data = await api.fetchMembers(selectedGroup.id);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedGroup,
  });

  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [inviteForm, setInviteForm] = useState<InviteFormState>({ username: '', email: '', role_code: 'reader' });

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    await mutations.createGroup({ name: groupName, description: groupDesc || undefined });
    setGroupName('');
    setGroupDesc('');
    createModal.close();
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteModal.data) return;
    await mutations.inviteMember({ groupId: inviteModal.data, form: inviteForm });
    setInviteForm({ username: '', email: '', role_code: 'reader' });
    inviteModal.close();
  };

  const handleRemoveMember = async (userId: number) => {
    if (!selectedGroup) return;
    if (!window.confirm('Rimuovere questo membro dal gruppo?')) return;
    await mutations.removeMember({ groupId: selectedGroup.id, userId });
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Gruppi Spesa</h2>
        <button type="button" onClick={() => createModal.open(null)} className={shoppingButtonSecondaryClass + ' text-xs'}>
          + Nuovo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {groups.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">Nessun gruppo. Creane uno!</p>
        ) : (
          groups.map((g) => (
            <div
              key={g.id}
              className={`${shoppingCardClass} p-3 cursor-pointer transition hover:border-blue-300 ${selectedGroup?.id === g.id ? 'border-blue-400 ring-1 ring-blue-200' : ''}`}
              onClick={() => { setSelectedGroup(g); onSelectGroup?.(g.id); }}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{g.name}</p>
                  {g.description && <p className="text-xs text-gray-500 truncate">{g.description}</p>}
                </div>
                <span className="text-xs text-gray-400 shrink-0 ml-2">{g.owner_id === 0 ? 'Owner' : 'Membro'}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedGroup && (
        <div className="shrink-0 border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-600 uppercase">Membri ({members.length})</h3>
            <button type="button" onClick={() => inviteModal.open(selectedGroup.id)} className={shoppingButtonSecondaryClass + ' text-xs'}>
              + Invita
            </button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {members.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-gray-50">
                <span className="text-gray-700">User #{m.user_id}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Role #{m.role_id}</span>
                  {selectedGroup.owner_id !== m.user_id && (
                    <button type="button" onClick={() => handleRemoveMember(m.user_id)} className="text-red-400 hover:text-red-600">✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {createModal.isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className={`${shoppingCardClass} w-full max-w-md p-5`}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Nuovo gruppo spesa</h2>
            <form onSubmit={handleCreateGroup} className="space-y-3">
              <input className={shoppingInputClass} placeholder="Nome gruppo" value={groupName} onChange={(e) => setGroupName(e.target.value)} required />
              <input className={shoppingInputClass} placeholder="Descrizione (opzionale)" value={groupDesc} onChange={(e) => setGroupDesc(e.target.value)} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={createModal.close} className={shoppingButtonSecondaryClass}>Annulla</button>
                <button type="submit" className={shoppingButtonPrimaryClass}>Crea</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {inviteModal.isOpen && inviteModal.data && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className={`${shoppingCardClass} w-full max-w-md p-5`}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Invita membro</h2>
            <form onSubmit={handleInvite} className="space-y-3">
              <input className={shoppingInputClass} placeholder="Username" value={inviteForm.username} onChange={(e) => setInviteForm((p) => ({ ...p, username: e.target.value }))} />
              <input className={shoppingInputClass} placeholder="oppure Email" value={inviteForm.email} onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))} />
              <select className={shoppingInputClass} value={inviteForm.role_code} onChange={(e) => setInviteForm((p) => ({ ...p, role_code: e.target.value }))}>
                <option value="reader">Reader</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={inviteModal.close} className={shoppingButtonSecondaryClass}>Annulla</button>
                <button type="submit" className={shoppingButtonPrimaryClass}>Invita</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingGroupsColumn;
