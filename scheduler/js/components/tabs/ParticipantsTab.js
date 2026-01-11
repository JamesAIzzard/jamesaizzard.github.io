import * as React from 'react';
import { Plus, Trash2, Pencil, Check, X, AlertTriangle } from 'lucide-react';

const { useState } = React;
const h = React.createElement;

export const ParticipantsTab = ({
  participants,
  setParticipants,
  preferences,
  setPreferences,
  shiftTypes
}) => {
  // Find participants with quota > 0 but no shift types assigned
  const participantsWithNoShiftTypes = participants.filter(p =>
    (p.paQuota || 0) > 0 &&
    p.shiftTypeIds &&
    p.shiftTypeIds.length === 0
  );
  const [newParticipant, setNewParticipant] = useState({ name: '', paQuota: '' });
  const [editingParticipant, setEditingParticipant] = useState(null);

  const addParticipant = () => {
    if (!newParticipant.name.trim()) return;
    const id = Date.now().toString();
    setParticipants([...participants, { id, name: newParticipant.name.trim(), paQuota: parseFloat(newParticipant.paQuota) || 0 }]);
    setPreferences({ ...preferences, [id]: {} });
    setNewParticipant({ name: '', paQuota: '' });
  };

  const startEditParticipant = (participant) => {
    setEditingParticipant({ ...participant, paQuota: participant.paQuota.toString() });
  };

  const saveEditParticipant = () => {
    if (!editingParticipant.name.trim()) return;
    setParticipants(participants.map(p => p.id === editingParticipant.id
      ? {
          ...editingParticipant,
          name: editingParticipant.name.trim(),
          paQuota: parseFloat(editingParticipant.paQuota) || 0,
          shiftTypeIds: editingParticipant.shiftTypeIds || []
        }
      : p
    ));
    setEditingParticipant(null);
  };

  const deleteParticipant = (p) => {
    setParticipants(participants.filter((x) => x.id !== p.id));
    const newPrefs = { ...preferences };
    delete newPrefs[p.id];
    setPreferences(newPrefs);
  };

  return h('div', null,
    h('h2', { className: 'text-lg font-semibold mb-4' }, 'Manage Participants'),

    // Warning for participants with no shift types
    participantsWithNoShiftTypes.length > 0 && h('div', { className: 'mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2' },
      h(AlertTriangle, { size: 18, className: 'text-amber-600 flex-shrink-0 mt-0.5' }),
      h('div', null,
        h('p', { className: 'text-amber-800 font-medium text-sm' },
          `${participantsWithNoShiftTypes.length} participant${participantsWithNoShiftTypes.length > 1 ? 's have' : ' has'} no shift types assigned`
        ),
        h('p', { className: 'text-amber-700 text-xs mt-1' },
          'They won\'t be assigned any shifts. Edit them to add shift types, or set their PA quota to 0.'
        ),
        h('p', { className: 'text-amber-600 text-xs mt-1' },
          participantsWithNoShiftTypes.map(p => p.name).join(', ')
        )
      )
    ),
    h('div', { className: 'flex flex-wrap gap-3 mb-4' },
      h('input', {
        type: 'text',
        placeholder: 'Name',
        value: newParticipant.name,
        onChange: (e) => setNewParticipant({ ...newParticipant, name: e.target.value }),
        onKeyDown: (e) => e.key === 'Enter' && addParticipant(),
        className: 'flex-1 min-w-[120px] px-3 py-2 border rounded-lg'
      }),
      h('input', {
        type: 'number',
        step: '0.5',
        placeholder: 'PA Quota',
        value: newParticipant.paQuota,
        onChange: (e) => setNewParticipant({ ...newParticipant, paQuota: e.target.value }),
        onKeyDown: (e) => e.key === 'Enter' && addParticipant(),
        className: 'w-28 px-3 py-2 border rounded-lg'
      }),
      h('button', {
        onClick: addParticipant,
        className: 'px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 whitespace-nowrap'
      }, h(Plus, { size: 18 }), ' Add')
    ),
    participants.length === 0
      ? h('p', { className: 'text-slate-500 text-center py-8' }, 'No participants added yet')
      : h('div', { className: 'space-y-3' },
          participants.map((p) =>
            editingParticipant?.id === p.id
              ? h('div', { key: p.id, className: 'p-3 bg-emerald-50 rounded-lg space-y-3' },
                  h('div', { className: 'flex flex-wrap items-center gap-2' },
                    h('input', {
                      type: 'text',
                      value: editingParticipant.name,
                      onChange: (e) => setEditingParticipant({ ...editingParticipant, name: e.target.value }),
                      className: 'flex-1 min-w-[120px] px-2 py-1 border rounded'
                    }),
                    h('input', {
                      type: 'number',
                      step: '0.5',
                      value: editingParticipant.paQuota,
                      onChange: (e) => setEditingParticipant({ ...editingParticipant, paQuota: e.target.value }),
                      placeholder: 'PA Quota',
                      className: 'w-24 px-2 py-1 border rounded'
                    }),
                    h('button', {
                      onClick: saveEditParticipant,
                      className: 'p-2 text-emerald-600 hover:bg-emerald-100 rounded'
                    }, h(Check, { size: 18 })),
                    h('button', {
                      onClick: () => setEditingParticipant(null),
                      className: 'p-2 text-slate-500 hover:bg-slate-100 rounded'
                    }, h(X, { size: 18 }))
                  ),
                  shiftTypes.length > 0 && h('div', { className: 'border-t pt-3' },
                    h('p', { className: 'text-sm font-medium text-emerald-700 mb-2' }, 'Which shift types can they do? (click to toggle)'),
                    h('div', { className: 'flex flex-wrap gap-2' },
                      shiftTypes.map(st => {
                        const isSelected = editingParticipant.shiftTypeIds && editingParticipant.shiftTypeIds.includes(st.id);
                        const noneSelected = !editingParticipant.shiftTypeIds || editingParticipant.shiftTypeIds.length === 0;
                        return h('button', {
                          key: st.id,
                          onClick: () => {
                            const current = editingParticipant.shiftTypeIds || [];
                            if (current.includes(st.id)) {
                              setEditingParticipant({ ...editingParticipant, shiftTypeIds: current.filter(id => id !== st.id) });
                            } else {
                              setEditingParticipant({ ...editingParticipant, shiftTypeIds: [...current, st.id] });
                            }
                          },
                          className: `px-3 py-1.5 rounded text-sm font-medium transition-colors border-2 ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : noneSelected
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 border-dashed'
                                : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                          }`
                        }, st.name);
                      })
                    ),
                    h('p', { className: 'text-xs text-slate-500 mt-2' },
                      (!editingParticipant.shiftTypeIds || editingParticipant.shiftTypeIds.length === 0)
                        ? 'No restrictions - can do all shift types. Click a shift type to restrict.'
                        : `Restricted to ${editingParticipant.shiftTypeIds.length} shift type${editingParticipant.shiftTypeIds.length > 1 ? 's' : ''}.`
                    )
                  )
                )
              : h('div', { key: p.id, className: 'p-3 bg-slate-50 rounded-lg' },
                  h('div', { className: 'flex items-center justify-between gap-2' },
                    h('div', { className: 'flex flex-wrap items-center gap-2 sm:gap-4 min-w-0' },
                      h('span', { className: 'font-medium' }, p.name),
                      h('span', { className: 'px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-sm font-medium whitespace-nowrap' }, 'Quota: ', p.paQuota, ' PA')
                    ),
                    h('div', { className: 'flex items-center gap-1 flex-shrink-0' },
                      h('button', {
                        onClick: () => startEditParticipant(p),
                        className: 'p-2 text-emerald-500 hover:bg-emerald-50 rounded'
                      }, h(Pencil, { size: 18 })),
                      h('button', {
                        onClick: () => deleteParticipant(p),
                        className: 'p-2 text-red-500 hover:bg-red-50 rounded'
                      }, h(Trash2, { size: 18 }))
                    )
                  ),
                  // Show assigned shift types
                  shiftTypes.length > 0 && h('div', { className: 'mt-2 flex flex-wrap gap-1' },
                    (!p.shiftTypeIds || p.shiftTypeIds.length === 0)
                      ? h('span', { className: 'text-xs text-slate-500' }, 'Can do all shift types')
                      : p.shiftTypeIds.map(stId => {
                          const st = shiftTypes.find(s => s.id === stId);
                          return st && h('span', { key: stId, className: 'text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded' }, st.name);
                        })
                  )
                )
          )
        )
  );
};
