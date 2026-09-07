import React, { useState } from 'react';
import { InvitationsAndCredentialsModal } from '../invitations/InvitationsAndCredentialsModal';

export const InvitationsPage: React.FC = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <h1 className="font-display font-extrabold text-xl text-slate-900">Invitations</h1>
        <p className="text-xs text-slate-500 mt-1">Invite staff, parents, and students, and issue QR credentials.</p>
        <button type="button" onClick={() => setOpen(true)} className="mt-4 px-4 py-2 rounded-xl bg-indigo-950 text-white text-xs font-bold">
          Open invitations
        </button>
      </div>
      <InvitationsAndCredentialsModal isOpen={open} onClose={() => setOpen(false)} />
    </div>
  );
};
