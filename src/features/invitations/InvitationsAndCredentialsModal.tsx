import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Link2,
  QrCode,
  Users,
  ShieldCheck,
  Copy,
  Check,
  Plus,
  Printer,
  Trash2,
  Key,
  X,
  Building2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface InvitationsAndCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InvitationsAndCredentialsModal: React.FC<InvitationsAndCredentialsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    invitations,
    createInvitationLink,
    revokeInvitation,
    printableCards,
    generatePrintableCard,
    linkedChildren,
    branding,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'invites' | 'cards' | 'parent_linking'>('invites');

  // New Invite Generator state
  const [recipientName, setRecipientName] = useState('');
  const [targetRole, setTargetRole] = useState<UserRole>('Teacher');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Filter for printable cards
  const [cardFilterRole, setCardFilterRole] = useState<'all' | 'Student' | 'Teacher'>('all');

  if (!isOpen) return null;

  const handleGenerateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      showToast('Name Required', 'Please enter a recipient name.', 'warning');
      return;
    }
    const newInv = createInvitationLink(
      recipientName.trim(),
      targetRole,
      recipientEmail.trim() || undefined
    );
    setRecipientName('');
    setRecipientEmail('');
    showToast('Single-Use Invitation Generated', `Token: ${newInv.token} created for ${newInv.recipientName}.`);
  };

  const handleCopyLink = (token: string, inviteLink?: string) => {
    const fullLink =
      inviteLink ||
      `${window.location.origin}/join?token=${token}&school=${branding.schoolCode}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedToken(token);
    showToast('Invite Link Copied', 'Single-use joining URL copied to clipboard.');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handlePrintCards = () => {
    window.print();
  };

  const filteredCards =
    cardFilterRole === 'all'
      ? printableCards
      : printableCards.filter((c) => c.role === cardFilterRole);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-slate-900">
                  Invitations & Login Credentials Hub
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {branding.schoolName}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Single-use joining links, batch QR credential cards & secure parent linking codes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 flex gap-4 bg-white">
          <button
            onClick={() => setActiveTab('invites')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'invites'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Single-Use Invites ({invitations.filter((i) => !i.isUsed && !i.isRevoked).length} active)</span>
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'cards'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Printable Credential Cards ({printableCards.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('parent_linking')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'parent_linking'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Parent-Child Security Codes</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: SINGLE-USE INVITES */}
          {activeTab === 'invites' && (
            <div className="space-y-6">
              {/* Invite Generator Form */}
              <form
                onSubmit={handleGenerateInvite}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-slate-900">
                    Generate Single-Use School Invitation
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Single-use tokens expire in 14 days automatically.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Adeyemi Adeleke"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Target Role
                    </label>
                    <select
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value as UserRole)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="Teacher">Teacher / Academic Staff</option>
                      <option value="Parent">Parent / Guardian</option>
                      <option value="Student">Student</option>
                      <option value="Principal">Vice Principal / Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Recipient Email (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. teacher@school.edu.ng"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Secure Token</span>
                  </button>
                </div>
              </form>

              {/* Active & Historical Invitations List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Generated Tokens ({invitations.length})
                  </span>
                </div>

                <div className="space-y-2.5">
                  {invitations.map((inv) => {
                    const isCopied = copiedToken === inv.token;
                    const isActive = !inv.isUsed && !inv.isRevoked;
                    return (
                      <div
                        key={inv.id}
                        className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-white border-slate-200 shadow-2xs'
                            : 'bg-slate-50 border-slate-200/60 opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                              inv.targetRole === 'Teacher'
                                ? 'bg-purple-100 text-purple-800'
                                : inv.targetRole === 'Parent'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {inv.targetRole.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                {inv.token}
                              </span>
                              <span className="text-xs font-bold text-slate-900">{inv.recipientName}</span>
                              <span className="text-xs text-slate-500">({inv.targetRole})</span>
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                                  isActive
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : inv.isUsed
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {isActive ? 'Active' : inv.isUsed ? 'Redeemed' : 'Revoked'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                              <span>Created: {inv.createdAt}</span>
                              <span>·</span>
                              <span>Expires: {inv.expiresAt}</span>
                              {inv.recipientEmail && (
                                <>
                                  <span>·</span>
                                  <span>To: {inv.recipientEmail}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        {isActive && (
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <button
                              onClick={() => handleCopyLink(inv.token, inv.inviteLink)}
                              className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{isCopied ? 'Copied' : 'Copy Joining URL'}</span>
                            </button>
                            <button
                              onClick={() => revokeInvitation(inv.id)}
                              title="Revoke invitation immediately"
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRINTABLE CREDENTIAL CARDS */}
          {activeTab === 'cards' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200">
                <div>
                  <h4 className="font-display font-bold text-sm text-indigo-950">
                    Printable QR Credential Cards
                  </h4>
                  <p className="text-xs text-indigo-800">
                    Hand out these physical cards to younger primary students or staff for instant 1-tap QR login.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-white rounded-xl border border-slate-200 p-0.5 text-xs font-semibold">
                    <button
                      onClick={() => setCardFilterRole('all')}
                      className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                        cardFilterRole === 'all' ? 'bg-indigo-900 text-white' : 'text-slate-600'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setCardFilterRole('Student')}
                      className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                        cardFilterRole === 'Student' ? 'bg-indigo-900 text-white' : 'text-slate-600'
                      }`}
                    >
                      Students
                    </button>
                    <button
                      onClick={() => setCardFilterRole('Teacher')}
                      className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                        cardFilterRole === 'Teacher' ? 'bg-indigo-900 text-white' : 'text-slate-600'
                      }`}
                    >
                      Staff
                    </button>
                  </div>
                  <button
                    onClick={handlePrintCards}
                    className="px-3.5 py-2 bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Batch</span>
                  </button>
                </div>
              </div>

              {/* Grid of Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCards.map((card) => (
                  <div
                    key={card.id}
                    className="p-5 rounded-2xl border-2 border-slate-200 bg-white shadow-xs flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Top School Bar */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg text-white font-bold flex items-center justify-center text-[10px]"
                          style={{ backgroundColor: branding.primaryColor || '#4F46E5' }}
                        >
                          {branding.schoolName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-display font-bold text-xs text-slate-900 truncate max-w-[140px]">
                          {branding.schoolName}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-slate-100 text-slate-700">
                        {card.role}
                      </span>
                    </div>

                    {/* Member Info & QR Code */}
                    <div className="my-4 flex items-center justify-between gap-3">
                      <div>
                        <h5 className="font-display font-bold text-sm text-slate-900 leading-snug">
                          {card.fullName}
                        </h5>
                        <p className="text-[11px] font-mono text-indigo-700 font-bold mt-0.5">
                          {card.identifier}
                        </p>
                        {card.classOrDepartment && (
                          <span className="inline-block mt-1 px-1.5 py-0.2 text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 rounded">
                            {card.classOrDepartment}
                          </span>
                        )}
                        <div className="mt-2 text-[10px] text-slate-500">
                          <span>Temp PIN: </span>
                          <code className="font-bold text-slate-800 bg-slate-100 px-1 py-0.5 rounded">
                            {card.temporaryPassword}
                          </code>
                        </div>
                      </div>

                      {/* Mock QR Representation */}
                      <div className="w-16 h-16 rounded-xl bg-slate-900 p-1.5 flex flex-col items-center justify-center text-white shrink-0 shadow-inner">
                        <QrCode className="w-10 h-10 text-white" />
                        <span className="text-[8px] font-mono tracking-tighter">SCAN 1-TAP</span>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-medium">
                      <span>Issued: {card.generatedDate}</span>
                      <span>Skuggle ID Protocol</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PARENT-CHILD SECURITY LINKING */}
          {activeTab === 'parent_linking' && (
            <div className="space-y-6">
              {/* Security Rule Header */}
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-700" />
                  <h4 className="font-display font-bold text-sm text-amber-950">
                    Child Privacy & Secure Linking Protocol
                  </h4>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  <strong>Strict Architecture:</strong> Parents must not be allowed to search for and claim children by name. A secure school invitation or unique parent-linking code is mandatory to establish the relationship.
                </p>
              </div>

              {/* Linked Children in School */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Active Parent-Child Linked Records ({linkedChildren.length})
                  </span>
                </div>

                <div className="space-y-2.5">
                  {linkedChildren.map((child) => (
                    <div
                      key={child.childId}
                      className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-xs border border-amber-200">
                          {child.childName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-display font-bold text-sm text-slate-900">{child.childName}</h5>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md">
                              {child.classLevel} {child.arm}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md uppercase">
                              {child.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Admission ID: <span className="font-mono text-slate-800">{child.admissionNo}</span> · School: <strong className="text-slate-700">{child.schoolName}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Secure Linking Code
                          </span>
                          <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {child.linkCode}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Multi-Tenant Invitation Protocol · Audit Logged</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl shadow-2xs cursor-pointer"
          >
            Close Hub
          </button>
        </div>
      </motion.div>
    </div>
  );
};
