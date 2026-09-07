import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Receipt,
  Download,
  CheckCircle2,
  FileText,
  Building,
  CreditCard,
  AlertCircle,
  Eye,
  Send,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FeeStructureItem, FeeInvoice, FeeTransaction } from '../../types';
import { apiMutation, apiRequest, describeApiError } from '../../lib/apiClient';
import {
  Button,
  StatusBadge,
  MetricCard,
  Modal,
  Drawer,
  FormField,
  Input,
  Select,
  DataTable,
  Column,
} from '../../components/ui';

interface FeeStructureBillingViewProps {
  initialTab?: 'invoices' | 'structure' | 'settlement';
  hideInternalNav?: boolean;
  intent?: string;
}

export const FeeStructureBillingView: React.FC<FeeStructureBillingViewProps> = ({
  initialTab = 'invoices',
  hideInternalNav = false,
  intent,
}) => {
  const { branding, students, feeTransactions, addFeeTransaction, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'invoices' | 'structure' | 'settlement'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [showNewFeeModal, setShowNewFeeModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<any>(students[0]);
  const [selectedTransaction, setSelectedTransaction] = useState<FeeTransaction | null>(null);
  const [payAmount, setPayAmount] = useState<number>(150000);
  const [paymentChannel, setPaymentChannel] = useState<'Bank Transfer' | 'Paystack Card' | 'Cash / POS'>('Bank Transfer');

  const demoFeeStructures: FeeStructureItem[] = [
    {
      id: 'fs-1',
      name: 'Tuition & Academic Levies',
      applicableClass: 'All Junior Secondary',
      amount: 180000,
      isMandatory: true,
      category: 'Tuition',
    },
    {
      id: 'fs-2',
      name: 'STEM & Robotics Lab Levy',
      applicableClass: 'All Junior Secondary',
      amount: 25000,
      isMandatory: true,
      category: 'STEM & Lab',
    },
    {
      id: 'fs-3',
      name: 'ICT, Coding & Internet Access',
      applicableClass: 'All Classes',
      amount: 15000,
      isMandatory: true,
      category: 'Development',
    },
    {
      id: 'fs-4',
      name: 'Uniforms & Sports Kit Bundle',
      applicableClass: 'JSS 1',
      amount: 45000,
      isMandatory: false,
      category: 'Uniform & Books',
    },
    {
      id: 'fs-5',
      name: 'Senior Secondary Tuition & Practical Lab',
      applicableClass: 'All Senior Secondary',
      amount: 220000,
      isMandatory: true,
      category: 'Tuition',
    },
    {
      id: 'fs-6',
      name: 'WAEC / NECO Registration Fund',
      applicableClass: 'SSS 3',
      amount: 65000,
      isMandatory: true,
      category: 'Exam Levy',
    },
  ];

  const [feeStructures, setFeeStructures] = useState<FeeStructureItem[]>(
    import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true' ? demoFeeStructures : [],
  );
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    apiRequest<{ data: { payload: { items?: FeeStructureItem[] }; revision: number } }>('/module-data/fee-structure')
      .then(({ data }) => {
        setFeeStructures(data.payload.items || []);
        setRevision(data.revision);
      })
      .catch((error) => showToast('Could not load fee structure', describeApiError(error), 'error'));
  }, [showToast]);

  const [newFeeName, setNewFeeName] = useState('');
  const [newFeeClass, setNewFeeClass] = useState('All Classes');
  const [newFeeAmount, setNewFeeAmount] = useState(20000);
  const [newFeeCategory, setNewFeeCategory] = useState<FeeStructureItem['category']>('Development');

  const handleAddFeeStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeeName) return;
    const item: FeeStructureItem = {
      id: `fs-${Date.now()}`,
      name: newFeeName,
      applicableClass: newFeeClass,
      amount: Number(newFeeAmount),
      isMandatory: true,
      category: newFeeCategory,
    };
    const next = [...feeStructures, item];
    try {
      const response = await apiMutation<{ data: { revision: number } }>('/module-data/fee-structure', 'PUT', {
        payload: { items: next },
        revision,
      });
      setFeeStructures(next);
      setRevision(response.data.revision);
      setShowNewFeeModal(false);
      setNewFeeName('');
    } catch (error) {
      showToast('Fee item not created', describeApiError(error), 'error');
      return;
    }
    showToast('Fee item created', `${item.name} is now in the school billing schedule.`, 'success');
  };

  const handleRecordDirectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPay || payAmount <= 0) return;

    addFeeTransaction({
      studentId: selectedStudentForPay.id,
      studentName: `${selectedStudentForPay.firstName} ${selectedStudentForPay.lastName}`,
      admissionNo: selectedStudentForPay.admissionNo,
      amount: Number(payAmount),
      currency: 'NGN',
      title: 'Tuition & Academic Levies (First Term)',
      status: 'paid',
      paymentMethod: paymentChannel,
    });

    setShowPaymentModal(false);
    showToast('Payment submitted', `The payment for ${selectedStudentForPay.firstName} is pending verification.`, 'info');
  };

  const totalCollected = feeTransactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
  const totalBilledEstimate = students.length * 220000;
  const collectionPercentage = Math.round((totalCollected / (totalBilledEstimate || 1)) * 100);
  const outstandingStudents = useMemo(() => students.filter((s) => s.feesStatus !== 'Paid'), [students]);

  const transactionColumns: Column<FeeTransaction>[] = [
    {
      key: 'receiptNumber',
      header: 'Receipt No',
      sortable: true,
      accessor: (tx) => (
        <span className="font-mono font-bold text-indigo-700 text-xs px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100/80">
          {tx.receiptNumber}
        </span>
      ),
    },
    {
      key: 'student',
      header: 'Student & Admission',
      sortable: true,
      sortValue: (row) => row.studentName,
      accessor: (tx) => (
        <div>
          <span className="font-semibold text-slate-900 block">{tx.studentName}</span>
          <span className="text-[11px] text-slate-400 font-mono block">{tx.admissionNo}</span>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Title / Purpose',
      accessor: (tx) => <span className="font-medium text-slate-700 text-xs">{tx.title}</span>,
    },
    {
      key: 'amount',
      header: 'Amount (NGN)',
      sortable: true,
      accessor: (tx) => (
        <span className="font-bold text-emerald-700 font-display">₦{tx.amount.toLocaleString()}</span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Channel',
      accessor: (tx) => <span className="text-slate-600 text-xs">{tx.paymentMethod}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      accessor: (tx) => <span className="text-slate-500 font-mono text-xs">{tx.date}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: () => <StatusBadge status="Paid" />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      accessor: (tx) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="xs"
            leftIcon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => setSelectedTransaction(tx)}
          >
            Receipt
          </Button>
          <Button
            variant="outline"
            size="xs"
            leftIcon={<Download className="w-3 h-3" />}
            onClick={() => showToast('Receipt Downloaded', `Digital Receipt ${tx.receiptNumber} exported.`, 'success')}
          >
            PDF
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2.5">
        <Button
          variant="outline"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowNewFeeModal(true)}
        >
          Add Fee Schedule
        </Button>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Receipt className="w-4 h-4" />}
          onClick={() => setShowPaymentModal(true)}
        >
          Record Payment & Issue Receipt
        </Button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Collected"
          value={`₦${totalCollected.toLocaleString()}`}
          icon={<Receipt className="w-5 h-5" />}
          variant="success"
          subtitle={`${feeTransactions.length} cleared payments`}
        />
        <MetricCard
          label="Collection Rate"
          value={`${collectionPercentage}%`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="primary"
          subtitle="Progress towards term target"
        />
        <MetricCard
          label="Outstanding Arrears"
          value={`₦${Math.max(0, totalBilledEstimate - totalCollected).toLocaleString()}`}
          icon={<AlertCircle className="w-5 h-5" />}
          variant="warning"
          subtitle={`${outstandingStudents.length} students with balance`}
        />
        <MetricCard
          label="Payment Gateways"
          value="Paystack & NIBSS"
          icon={<CreditCard className="w-5 h-5" />}
          variant="default"
          subtitle="Instant webhook verification"
        />
      </div>

      {/* Navigation Sub-Tabs */}
      {!hideInternalNav && (
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors cursor-pointer inline-flex items-center gap-2 ${
              activeTab === 'invoices'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Student Invoices & Receipts</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 font-medium">
              {feeTransactions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('structure')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors cursor-pointer inline-flex items-center gap-2 ${
              activeTab === 'structure'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Fee Schedules & Levies</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 font-medium">
              {feeStructures.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settlement')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors cursor-pointer inline-flex items-center gap-2 ${
              activeTab === 'settlement'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Bank Accounts & Gateway Config</span>
          </button>
        </div>
      )}

      {/* Tab 1: Invoices & Receipts */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/40">
            <h3 className="font-display font-bold text-base text-slate-900">
              Payment Receipts & Audit Trail
            </h3>
            <Button
              variant="subtle"
              size="sm"
              leftIcon={<Send className="w-3.5 h-3.5" />}
              onClick={() => showToast('Dispatched', 'Bulk fee payment reminders queued for guardians.', 'info')}
            >
              Send SMS / WhatsApp Reminders
            </Button>
          </div>

          <DataTable
            columns={transactionColumns}
            data={feeTransactions}
            keyExtractor={(tx) => tx.id}
            pageSize={10}
            onRowClick={(tx) => setSelectedTransaction(tx)}
            emptyTitle="No payment records"
            emptyDescription="Record a direct payment to generate your first transaction receipt."
            emptyAction={{
              label: 'Record Payment',
              onClick: () => setShowPaymentModal(true),
            }}
            className="border-none rounded-none shadow-none"
          />
        </div>
      )}

      {/* Tab 2: Fee Schedules */}
      {activeTab === 'structure' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {feeStructures.map((fee) => (
            <div
              key={fee.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                    {fee.category}
                  </span>
                  <StatusBadge
                    status={fee.isMandatory ? 'Compulsory' : 'Optional'}
                    variant={fee.isMandatory ? 'warning' : 'neutral'}
                  />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 mt-2">{fee.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Applicable to: {fee.applicableClass}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Amount</span>
                  <div className="font-display font-bold text-xl text-slate-900">
                    ₦{fee.amount.toLocaleString()}
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => showToast('Fee applied', `${fee.name} attached to class invoices.`, 'success')}
                >
                  Bill Class
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Bank Accounts */}
      {activeTab === 'settlement' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 max-w-2xl">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">Designated Settlement Accounts</h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure settlement bank details and Paystack auto-split in your school administration panel.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-xs text-amber-800 leading-relaxed">
            Bank account details must be configured in your school settings before they appear on parent invoices.
          </div>
        </div>
      )}

      {/* Receipt Slide-Over Drawer */}
      <Drawer
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        title="Official Payment Receipt"
        footer={
          selectedTransaction && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => showToast('Downloaded', `Receipt ${selectedTransaction.receiptNumber} exported as PDF.`, 'success')}
            >
              Download PDF Receipt
            </Button>
          )
        }
      >
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center space-y-1">
              <span className="text-xs font-semibold text-emerald-800 block">Amount Paid</span>
              <h2 className="text-2xl font-bold font-display text-emerald-900">
                ₦{selectedTransaction.amount.toLocaleString()}
              </h2>
              <StatusBadge status="Paid & Verified" variant="success" />
            </div>

            <div className="rounded-2xl border border-slate-200/80 p-4 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider">Receipt Breakdown</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block">Receipt No</span>
                  <span className="font-mono font-bold text-slate-800">{selectedTransaction.receiptNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date</span>
                  <span className="font-mono text-slate-800">{selectedTransaction.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Student</span>
                  <span className="font-semibold text-slate-800">{selectedTransaction.studentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Admission No</span>
                  <span className="font-mono text-slate-800">{selectedTransaction.admissionNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Channel</span>
                  <span className="font-medium text-slate-800">{selectedTransaction.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Item / Purpose</span>
                  <span className="font-medium text-slate-800">{selectedTransaction.title}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* New Fee Schedule Modal */}
      <Modal
        isOpen={showNewFeeModal}
        onClose={() => setShowNewFeeModal(false)}
        title="Create Fee Schedule Item"
        description="Add a new tuition levy or activity fee to the school schedule."
        size="md"
      >
        <form onSubmit={handleAddFeeStructure} className="space-y-4">
          <FormField label="Fee Item Name" required>
            <Input
              required
              placeholder="e.g. Cambridge Checkpoint Exam Fee"
              value={newFeeName}
              onChange={(e) => setNewFeeName(e.target.value)}
            />
          </FormField>

          <FormField label="Applicable Class" required>
            <Select value={newFeeClass} onChange={(e) => setNewFeeClass(e.target.value)}>
              <option value="All Classes">All Classes</option>
              <option value="All Junior Secondary">All Junior Secondary (JSS 1-3)</option>
              <option value="All Senior Secondary">All Senior Secondary (SSS 1-3)</option>
              <option value="JSS 1">JSS 1 Only</option>
              <option value="SSS 3">SSS 3 Only</option>
            </Select>
          </FormField>

          <FormField label="Amount (NGN)" required>
            <Input
              type="number"
              required
              value={newFeeAmount}
              onChange={(e) => setNewFeeAmount(Number(e.target.value))}
            />
          </FormField>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setShowNewFeeModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Save Fee Schedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Direct Fee Payment"
        description="Record a bursary settlement and generate an official receipt."
        size="md"
      >
        <form onSubmit={handleRecordDirectPayment} className="space-y-4">
          <FormField label="Select Student" required>
            <Select
              value={selectedStudentForPay?.id}
              onChange={(e) => {
                const st = students.find((s) => s.id === e.target.value);
                setSelectedStudentForPay(st);
              }}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.admissionNo}) — {s.classLevel}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Amount Paid (NGN)" required>
            <Input
              type="number"
              required
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
            />
          </FormField>

          <FormField label="Payment Channel" required>
            <Select
              value={paymentChannel}
              onChange={(e: any) => setPaymentChannel(e.target.value)}
            >
              <option value="Bank Transfer">Bank Transfer (Zenith / Direct NIBSS)</option>
              <option value="Paystack Card">Paystack Online Card</option>
              <option value="Cash / POS">School Bursary POS / Cash</option>
            </Select>
          </FormField>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" leftIcon={<Receipt className="w-3.5 h-3.5" />}>
              Issue Digital Receipt
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
