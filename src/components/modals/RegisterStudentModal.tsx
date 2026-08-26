import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudentRecord } from '../../types';
import { LoadingButton } from '../../shared/ui';
import { CustomFieldInputs, serializeCustomFieldValues } from '../../shared/ui/CustomFieldInputs';
import { GeoLocationSelects } from '../../shared/ui/GeoLocationSelects';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { getApiError } from '../../shared/api/client';
import {
  mapStudentSummaryToRecord,
  studentService,
} from '../../features/students/studentService';
import { appConfig } from '../../app/config';
import type { CustomFieldDefinition, CustomFieldValues } from '../../shared/types/customFields';
import { emptyGeoLocation, type GeoLocationValue } from '../../shared/api/geo';

interface RegisterStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveStudent: (student: StudentRecord) => void;
}

const DEFAULT_PHOTO =
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80';

export const RegisterStudentModal: React.FC<RegisterStudentModalProps> = ({
  isOpen,
  onClose,
  onSaveStudent,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValues>({});
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [lookupsError, setLookupsError] = useState<string | null>(null);
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [dob, setDob] = useState('');
  const [geoLocation, setGeoLocation] = useState<GeoLocationValue>(
    emptyGeoLocation(),
  );
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('+234 ');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('Father');
  const [photoPreview, setPhotoPreview] = useState(DEFAULT_PHOTO);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !appConfig.liveApi) return;

    const controller = new AbortController();
    setLookupsLoading(true);
    setLookupsError(null);

    void studentService
      .lookups(controller.signal)
      .then((lookups) => {
        setClasses(lookups.classes);
        setCustomFieldDefinitions(lookups.customFields ?? []);
        setCustomFieldValues({});
        setClassId((current) => current || lookups.classes[0]?.id || '');
      })
      .catch((error: unknown) => {
        setLookupsError(getApiError(error).message);
      })
      .finally(() => setLookupsLoading(false));

    return () => controller.abort();
  }, [isOpen]);

  if (!isOpen) return null;

  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 400 }, height: { ideal: 400 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraActive(false);
      feedbackBus.error('Could not access the camera. Try uploading a photo instead.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
    }
    setCameraActive(false);
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 300, 300);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const file = new File([blob], `student-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          setPhotoFile(file);
          setPhotoPreview(URL.createObjectURL(blob));
          stopCamera();
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setAdmissionNo('');
    setDob('');
    setGeoLocation(emptyGeoLocation());
    setGuardianName('');
    setGuardianPhone('+234 ');
    setGuardianEmail('');
    setGuardianRelationship('Father');
    setGender('Male');
    setPhotoFile(null);
    setPhotoPreview(DEFAULT_PHOTO);
    setCustomFieldValues({});
  };

  const handleCustomFieldChange = (
    key: string,
    value: string | number | boolean,
  ) => {
    setCustomFieldValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      feedbackBus.error('Please fill in student first and last name.');
      return;
    }
    if (!dob) {
      feedbackBus.error('Date of birth is required.');
      return;
    }
    if (!classId) {
      feedbackBus.error(
        lookupsError ||
          'Select a class. Create classes in setup before registering students.',
      );
      return;
    }
    if (!guardianName.trim() || !guardianPhone.trim()) {
      feedbackBus.error('Guardian name and phone are required.');
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.set('firstName', firstName.trim());
      formData.set('lastName', lastName.trim());
      formData.set('gender', gender.toLowerCase());
      formData.set('dateOfBirth', dob);
      formData.set('admissionDate', new Date().toISOString().slice(0, 10));
      formData.set('classId', classId);
      if (geoLocation.countryCode) {
        formData.set('countryCode', geoLocation.countryCode);
        formData.set('nationality', geoLocation.countryName);
      }
      if (geoLocation.stateName) {
        formData.set('stateOfOrigin', geoLocation.stateName);
      }
      if (geoLocation.lga) {
        formData.set('localGovernmentArea', geoLocation.lga);
      }
      if (admissionNo.trim()) {
        formData.set('admissionNumber', admissionNo.trim());
      }
      formData.set(
        'guardians',
        JSON.stringify([
          {
            name: guardianName.trim(),
            relationship: guardianRelationship,
            phone: guardianPhone.trim(),
            email: guardianEmail.trim() || undefined,
            preferredContact: true,
          },
        ]),
      );
      if (photoFile) {
        formData.set('photo', photoFile);
      }
      if (customFieldDefinitions.length > 0) {
        formData.set('customFields', serializeCustomFieldValues(customFieldValues));
      }

      const created = await studentService.create(formData);
      const record = mapStudentSummaryToRecord({
        ...created,
        photoUrl: created.photoUrl ?? photoPreview,
        guardians: created.guardians?.length
          ? created.guardians
          : [
              {
                id: 'local',
                name: guardianName.trim(),
                relationship: guardianRelationship,
                phone: guardianPhone.trim(),
                email: guardianEmail.trim() || null,
              },
            ],
      });

      onSaveStudent(record);
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
      feedbackBus.success(`${record.name} enrolled successfully.`);
      stopCamera();
      resetForm();
      onClose();
    } catch (error: unknown) {
      feedbackBus.error(getApiError(error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Register New Student</h2>
            <p className="text-xs text-slate-500">Add student bio-data, photo and parent contacts</p>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={(event) => { void handleSubmit(event); }} className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Photo & Biometric Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100">
            <div className="relative">
              {cameraActive ? (
                <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-indigo-600 shadow-md">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                </div>
              ) : (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-28 h-28 rounded-2xl object-cover border-2 border-indigo-200 shadow-sm"
                />
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <h4 className="text-xs font-bold text-slate-900">Student Profile Photo</h4>
              <p className="text-[11px] text-slate-500">
                Capture live via webcam or upload an official passport photograph.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {cameraActive ? (
                  <button
                    type="button"
                    onClick={handleCapture}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Snap Photo</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { void startCamera(); }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Use Webcam</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Student Personal Info */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              1. Student Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oluwaseun"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adeleke"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Admission Number</label>
                <input
                  type="text"
                  placeholder="Leave blank to auto-generate"
                  value={admissionNo}
                  onChange={(e) => setAdmissionNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Class & Arm *</label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  required
                  disabled={lookupsLoading || classes.length === 0}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold focus:outline-none disabled:opacity-60"
                >
                  {classes.length === 0 ? (
                    <option value="">
                      {lookupsLoading ? 'Loading classes…' : 'No classes available'}
                    </option>
                  ) : (
                    classes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))
                  )}
                </select>
                {lookupsError && (
                  <p className="mt-1 text-[11px] text-rose-600">{lookupsError}</p>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Gender</label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === 'Male'}
                      onChange={() => setGender('Male')}
                      className="text-indigo-600"
                    />
                    <span>Male</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === 'Female'}
                      onChange={() => setGender('Female')}
                      className="text-indigo-600"
                    />
                    <span>Female</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <GeoLocationSelects
                  value={geoLocation}
                  onChange={setGeoLocation}
                  disabled={isSaving}
                  title="Origin & Residence"
                />
              </div>
            </div>
          </div>

          <CustomFieldInputs
            fields={customFieldDefinitions}
            values={customFieldValues}
            onChange={handleCustomFieldChange}
            disabled={isSaving}
          />

          {/* Parent / Guardian Info */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              2. Guardian Contact Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Guardian Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chief Adeleke"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Relationship</label>
                <select
                  value={guardianRelationship}
                  onChange={(e) => setGuardianRelationship(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                >
                  <option>Father</option>
                  <option>Mother</option>
                  <option>Guardian</option>
                  <option>Sponsor</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+234 803 000 0000"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="guardian@example.com"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <LoadingButton
              type="submit"
              loading={isSaving}
              loadingText="Saving Student…"
              disabled={lookupsLoading || classes.length === 0}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all"
            >
              Save Student Record
            </LoadingButton>
          </div>

        </form>
      </div>
    </div>
  );
};
