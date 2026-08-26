import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  Layers,
  Loader2,
  Rocket,
  Users,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  onboardingService,
  type OnboardingSnapshot,
} from "@/shared/api/onboarding";
import { getApiError } from "@/shared/api/client";
import { feedbackBus } from "@/shared/feedback/feedbackBus";
import { StudentImportPanel } from "./StudentImportPanel";
import { customFieldService } from "@/shared/api/customFields";
import { CustomFieldInputs } from "@/shared/ui/CustomFieldInputs";
import type { CustomFieldDefinition, CustomFieldValues } from "@/shared/types/customFields";
import { serializeCustomFieldValues } from "@/shared/ui/CustomFieldInputs";
import { GeoLocationSelects } from "@/shared/ui/GeoLocationSelects";
import { createSchoolInvite } from "@/shared/api/platform";
import {
  emptyGeoLocation,
  type GeoLocationValue,
} from "@/shared/api/geo";

const STEP_ORDER = [
  "school_profile",
  "campuses",
  "academic_session",
  "classes",
  "subjects",
  "assessment_structure",
  "fees",
  "import_students",
  "invite_staff",
  "launch",
] as const;

const STEP_ICONS: Record<string, typeof Building2> = {
  school_profile: Building2,
  campuses: Building2,
  academic_session: Calendar,
  classes: Layers,
  subjects: Layers,
  assessment_structure: Layers,
  fees: DollarSign,
  import_students: Users,
  invite_staff: Users,
  launch: Rocket,
};

const CLASS_TEMPLATE = [
  { name: "JSS 1", arm: "A", educational_level: "Junior Secondary" },
  { name: "JSS 2", arm: "A", educational_level: "Junior Secondary" },
  { name: "JSS 3", arm: "A", educational_level: "Junior Secondary" },
  { name: "SS 1", arm: "A", educational_level: "Senior Secondary" },
  { name: "SS 2", arm: "A", educational_level: "Senior Secondary" },
  { name: "SS 3", arm: "A", educational_level: "Senior Secondary" },
];

const SUBJECT_TEMPLATE = [
  { name: "English Language", code: "ENG" },
  { name: "Mathematics", code: "MTH" },
  { name: "Basic Science", code: "BSC" },
  { name: "Social Studies", code: "SST" },
  { name: "Civic Education", code: "CVE" },
  { name: "Computer Studies", code: "CMP" },
];

export default function OnboardingPage() {
  const [snapshot, setSnapshot] = useState<OnboardingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStepId, setCurrentStepId] = useState<string>("school_profile");

  const [profile, setProfile] = useState({
    name: "",
    motto: "",
    country: "Nigeria",
    state: "",
  });
  const [campusForm, setCampusForm] = useState({ name: "", code: "" });
  const [sessionForm, setSessionForm] = useState({
    name: "",
    startsAt: "",
    endsAt: "",
  });
  const [assessmentForm, setAssessmentForm] = useState({
    ca1Weight: 20,
    ca2Weight: 20,
    examWeight: 60,
  });
  const [feeHeads, setFeeHeads] = useState([
    { name: "Tuition", amount: 0 },
    { name: "PTA Levy", amount: 0 },
  ]);
  const [studentForm, setStudentForm] = useState({
    firstName: "",
    lastName: "",
    gender: "male",
    dateOfBirth: "",
    admissionDate: new Date().toISOString().slice(0, 10),
    classId: "",
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
  });
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    role: "teacher",
    employeeNumber: "",
    employmentType: "full_time",
  });
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [classOptions, setClassOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [studentCustomFields, setStudentCustomFields] = useState<
    CustomFieldDefinition[]
  >([]);
  const [studentCustomFieldValues, setStudentCustomFieldValues] =
    useState<CustomFieldValues>({});
  const [staffCustomFields, setStaffCustomFields] = useState<
    CustomFieldDefinition[]
  >([]);
  const [staffCustomFieldValues, setStaffCustomFieldValues] =
    useState<CustomFieldValues>({});
  const [studentGeo, setStudentGeo] = useState<GeoLocationValue>(
    emptyGeoLocation(),
  );
  const [staffGeo, setStaffGeo] = useState<GeoLocationValue>(
    emptyGeoLocation(),
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await onboardingService.getProgress();
      setSnapshot(data);
      setProfile({
        name: data.tenant.name ?? "",
        motto: data.tenant.motto ?? "",
        country: data.tenant.country ?? "Nigeria",
        state: data.tenant.state ?? "",
      });
      setSessionForm((current) => {
        if (current.name) return current;
        const year = new Date().getFullYear();
        return {
          name: `${year}/${year + 1}`,
          startsAt: `${year}-09-01`,
          endsAt: `${year + 1}-07-31`,
        };
      });
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (currentStepId !== "import_students") return;
    void onboardingService.studentLookups().then((lookups) => {
      setClassOptions(lookups.classes);
      setStudentCustomFields(lookups.customFields ?? []);
      if (!studentForm.classId && lookups.classes[0]) {
        setStudentForm((current) => ({
          ...current,
          classId: lookups.classes[0].id,
        }));
      }
    });
  }, [currentStepId, studentForm.classId]);

  useEffect(() => {
    if (currentStepId !== "invite_staff") return;
    const controller = new AbortController();
    void customFieldService
      .staffLookups(controller.signal)
      .then((lookups) => setStaffCustomFields(lookups.customFields ?? []))
      .catch(() => setStaffCustomFields([]));
    return () => controller.abort();
  }, [currentStepId]);

  const steps = snapshot?.steps ?? [];
  const currentIndex = STEP_ORDER.indexOf(
    currentStepId as (typeof STEP_ORDER)[number],
  );
  const currentStep = steps.find((step) => step.id === currentStepId);

  const goNext = () => {
    const next = STEP_ORDER[currentIndex + 1];
    if (next) setCurrentStepId(next);
  };

  const goPrev = () => {
    const prev = STEP_ORDER[currentIndex - 1];
    if (prev) setCurrentStepId(prev);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await onboardingService.updateSchoolProfile(profile);
      feedbackBus.success("School profile saved.");
      await refresh();
      goNext();
    } catch (err) {
      feedbackBus.error(getApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCampus = async () => {
    if (!campusForm.name.trim() || !campusForm.code.trim()) {
      feedbackBus.error("Campus name and code are required.");
      return;
    }
    setSaving(true);
    try {
      await onboardingService.createCampus({
        name: campusForm.name.trim(),
        code: campusForm.code.trim().toUpperCase(),
      });
      setCampusForm({ name: "", code: "" });
      feedbackBus.success("Campus added.");
      await refresh();
    } catch (err) {
      feedbackBus.error(getApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSession = async () => {
    if (!sessionForm.name || !sessionForm.startsAt || !sessionForm.endsAt) {
      feedbackBus.error("Complete all session fields.");
      return;
    }
    setSaving(true);
    try {
      const startYear = sessionForm.startsAt.slice(0, 4);
      const endYear = sessionForm.endsAt.slice(0, 4);
      await onboardingService.createSession({
        name: sessionForm.name,
        startsAt: sessionForm.startsAt,
        endsAt: sessionForm.endsAt,
        isCurrent: true,
        terms: [
          {
            name: "First Term",
            sequence: 1,
            startsAt: `${startYear}-09-01`,
            endsAt: `${startYear}-12-15`,
            isCurrent: true,
          },
          {
            name: "Second Term",
            sequence: 2,
            startsAt: `${endYear}-01-08`,
            endsAt: `${endYear}-04-10`,
          },
          {
            name: "Third Term",
            sequence: 3,
            startsAt: `${endYear}-04-20`,
            endsAt: sessionForm.endsAt,
          },
        ],
      });
      feedbackBus.success("Academic session created.");
      await refresh();
      goNext();
    } catch (err) {
      feedbackBus.error(getApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyClassTemplate = async () => {
    setSaving(true);
    try {
      for (const item of CLASS_TEMPLATE) {
        await onboardingService.createClass(item);
      }
      feedbackBus.success("Class template applied.");
      await refresh();
    } catch (err) {
      feedbackBus.error(getApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleApplySubjectTemplate = async () => {
    setSaving(true);
    try {
      for (const item of SUBJECT_TEMPLATE) {
        await onboardingService.createSubject(item);
      }
      feedbackBus.success("Subject template applied.");
      await refresh();
    } catch (err) {
      feedbackBus.error(getApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAssessment = async () => {
    setSaving(true);
    try {
      await onboardingService.updateAssessmentStructure(assessmentForm);
      feedbackBus.success("Assessment structure saved.");
      await refresh();
      goNext();
    } catch (err) {
      feedbackBus.error(getApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFees = async () => {
    setSaving(true);
    try {
      await onboardingService.updateFees({ feeHeads });
      feedbackBus.success("Fee configuration saved.");
      await refresh();
      goNext();
    } catch (err) {
      feedbackBus.error(getApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateStudent = async () => {
    if (
      !studentForm.firstName ||
      !studentForm.lastName ||
      !studentForm.dateOfBirth ||
      !studentForm.classId ||
      !studentForm.guardianName ||
      !studentForm.guardianPhone
    ) {
      feedbackBus.error("Complete all required student fields.");
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("firstName", studentForm.firstName);
      formData.set("lastName", studentForm.lastName);
      formData.set("gender", studentForm.gender);
      formData.set("dateOfBirth", studentForm.dateOfBirth);
      formData.set("admissionDate", studentForm.admissionDate);
      formData.set("classId", studentForm.classId);
      formData.set(
        "guardians",
        JSON.stringify([
          {
            name: studentForm.guardianName,
            relationship: "Parent",
            phone: studentForm.guardianPhone,
            email: studentForm.guardianEmail || undefined,
            preferredContact: true,
          },
        ]),
      );
      if (studentCustomFields.length > 0) {
        formData.set(
          "customFields",
          serializeCustomFieldValues(studentCustomFieldValues),
        );
      }
      if (studentGeo.countryCode) {
        formData.set("countryCode", studentGeo.countryCode);
        formData.set("nationality", studentGeo.countryName);
      }
      if (studentGeo.stateName) {
        formData.set("stateOfOrigin", studentGeo.stateName);
      }
      if (studentGeo.lga) {
        formData.set("localGovernmentArea", studentGeo.lga);
      }
      await onboardingService.createStudent(formData);
      feedbackBus.success("Student registered.");
      await refresh();
      goNext();
    } catch (err) {
      feedbackBus.error(getApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateStaff = async () => {
    if (!staffForm.name || !staffForm.email) {
      feedbackBus.error("Staff name and email are required to send a registration link.");
      return;
    }
    setSaving(true);
    try {
      const invite = await createSchoolInvite({
        email: staffForm.email.trim(),
        role: staffForm.role,
        name: staffForm.name.trim(),
      });
      setLastInviteLink(invite.registrationLink);
      if (staffForm.employeeNumber) {
        await onboardingService.createEmployee({
          employee_number: staffForm.employeeNumber,
          name: staffForm.name,
          employment_type: staffForm.employmentType,
          countryCode: staffGeo.countryCode || undefined,
          stateRegion: staffGeo.stateName || undefined,
          localGovernmentArea: staffGeo.lga || undefined,
          customFields:
            staffCustomFields.length > 0 ? staffCustomFieldValues : undefined,
        });
      }
      feedbackBus.success("Registration link created. Share it with the staff member.");
      await refresh();
    } catch (err) {
      feedbackBus.error(getApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleLaunch = async () => {
    setSaving(true);
    try {
      await onboardingService.launch();
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      feedbackBus.success("School setup complete. Parent access is enabled.");
      await refresh();
    } catch (err) {
      feedbackBus.error(getApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStepId) {
      case "school_profile":
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">School profile</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-bold text-slate-700">
                  Official school name
                </span>
                <input
                  value={profile.name}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-bold text-slate-700">
                  Motto
                </span>
                <input
                  value={profile.motto}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      motto: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">
                  Country
                </span>
                <input
                  value={profile.country}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      country: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">
                  State / province
                </span>
                <input
                  value={profile.state}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      state: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm"
                />
              </label>
            </div>
          </div>
        );

      case "campuses":
        return (
          <CampusesStep
            campusForm={campusForm}
            setCampusForm={setCampusForm}
            onAdd={handleAddCampus}
            complete={currentStep?.status === "complete"}
          />
        );

      case "academic_session":
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Academic session & terms
            </h3>
            <p className="text-xs text-slate-500">
              Create your current session with three standard terms.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-bold text-slate-700">
                  Session name
                </span>
                <input
                  value={sessionForm.name}
                  onChange={(event) =>
                    setSessionForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">
                  Starts
                </span>
                <input
                  type="date"
                  value={sessionForm.startsAt}
                  onChange={(event) =>
                    setSessionForm((current) => ({
                      ...current,
                      startsAt: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">
                  Ends
                </span>
                <input
                  type="date"
                  value={sessionForm.endsAt}
                  onChange={(event) =>
                    setSessionForm((current) => ({
                      ...current,
                      endsAt: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm"
                />
              </label>
            </div>
          </div>
        );

      case "classes":
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Classes</h3>
            <p className="text-xs text-slate-500">
              Apply a Nigerian secondary template or add classes later from
              settings.
            </p>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleApplyClassTemplate()}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              Apply JSS/SS template (6 classes)
            </button>
            {currentStep?.status === "complete" && (
              <StatusBanner message="Classes configured." />
            )}
          </div>
        );

      case "subjects":
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Subjects</h3>
            <p className="text-xs text-slate-500">
              Apply a core subject pack aligned with common NERDC offerings.
            </p>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleApplySubjectTemplate()}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              Apply core subject template
            </button>
            {currentStep?.status === "complete" && (
              <StatusBanner message="Subjects configured." />
            )}
          </div>
        );

      case "assessment_structure":
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Assessment structure
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["ca1Weight", "CA 1"],
                  ["ca2Weight", "CA 2"],
                  ["examWeight", "Exam"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block">
                  <span className="mb-1 block text-xs font-bold text-slate-700">
                    {label} (%)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={assessmentForm[key]}
                    onChange={(event) =>
                      setAssessmentForm((current) => ({
                        ...current,
                        [key]: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm"
                  />
                </label>
              ))}
            </div>
          </div>
        );

      case "fees":
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Fee heads</h3>
            {feeHeads.map((head, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-2">
                <input
                  value={head.name}
                  onChange={(event) =>
                    setFeeHeads((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, name: event.target.value }
                          : item,
                      ),
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm"
                  placeholder="Fee name"
                />
                <input
                  type="number"
                  min={0}
                  value={head.amount}
                  onChange={(event) =>
                    setFeeHeads((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, amount: Number(event.target.value) }
                          : item,
                      ),
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm"
                  placeholder="Amount"
                />
              </div>
            ))}
          </div>
        );

      case "import_students":
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Import students
            </h3>
            <p className="text-xs text-slate-500">
              Upload a CSV using the Skuggle template, or register one student
              manually below.
            </p>
            <StudentImportPanel onImported={() => void refresh()} />
            <div className="border-t border-slate-200 pt-4">
              <h4 className="mb-3 text-xs font-bold text-slate-700">
                Register one student manually
              </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={studentForm.firstName}
                onChange={(event) =>
                  setStudentForm((current) => ({
                    ...current,
                    firstName: event.target.value,
                  }))
                }
                placeholder="First name"
                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm"
              />
              <input
                value={studentForm.lastName}
                onChange={(event) =>
                  setStudentForm((current) => ({
                    ...current,
                    lastName: event.target.value,
                  }))
                }
                placeholder="Last name"
                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm"
              />
              <input
                type="date"
                value={studentForm.dateOfBirth}
                onChange={(event) =>
                  setStudentForm((current) => ({
                    ...current,
                    dateOfBirth: event.target.value,
                  }))
                }
                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm"
              />
              <select
                value={studentForm.classId}
                onChange={(event) =>
                  setStudentForm((current) => ({
                    ...current,
                    classId: event.target.value,
                  }))
                }
                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm"
              >
                {classOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <input
                value={studentForm.guardianName}
                onChange={(event) =>
                  setStudentForm((current) => ({
                    ...current,
                    guardianName: event.target.value,
                  }))
                }
                placeholder="Guardian name"
                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm sm:col-span-2"
              />
              <input
                value={studentForm.guardianPhone}
                onChange={(event) =>
                  setStudentForm((current) => ({
                    ...current,
                    guardianPhone: event.target.value,
                  }))
                }
                placeholder="Guardian phone"
                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm"
              />
              <input
                value={studentForm.guardianEmail}
                onChange={(event) =>
                  setStudentForm((current) => ({
                    ...current,
                    guardianEmail: event.target.value,
                  }))
                }
                placeholder="Guardian email (optional)"
                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm"
              />
            </div>
            <GeoLocationSelects
              value={studentGeo}
              onChange={setStudentGeo}
              disabled={saving}
              title="Student origin"
              className="mt-4"
            />
            <CustomFieldInputs
              fields={studentCustomFields}
              values={studentCustomFieldValues}
              onChange={(key, value) =>
                setStudentCustomFieldValues((current) => ({
                  ...current,
                  [key]: value,
                }))
              }
              disabled={saving}
              className="mt-4"
            />
            </div>
          </div>
        );

      case "invite_staff":
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Invite staff</h3>
            <p className="text-xs text-slate-500">
              Send a registration link. Recipients create their login and join this school
              with the selected role.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={staffForm.name}
                onChange={(event) =>
                  setStaffForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Full name"
                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm sm:col-span-2"
              />
              <input
                value={staffForm.email}
                onChange={(event) =>
                  setStaffForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="Work email"
                type="email"
                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm sm:col-span-2"
              />
              <select
                value={staffForm.role}
                onChange={(event) =>
                  setStaffForm((current) => ({
                    ...current,
                    role: event.target.value,
                  }))
                }
                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm"
              >
                <option value="teacher">Teacher</option>
                <option value="principal">Principal</option>
                <option value="bursar">Bursar</option>
                <option value="examination_officer">Examination officer</option>
                <option value="admission_officer">Admission officer</option>
                <option value="school_admin">School admin</option>
              </select>
              <input
                value={staffForm.employeeNumber}
                onChange={(event) =>
                  setStaffForm((current) => ({
                    ...current,
                    employeeNumber: event.target.value,
                  }))
                }
                placeholder="Employee number (optional HR record)"
                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm"
              />
            </div>
            {lastInviteLink && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 break-all">
                <p className="font-bold mb-1">Share this registration link</p>
                {lastInviteLink}
              </div>
            )}
            <GeoLocationSelects
              value={staffGeo}
              onChange={setStaffGeo}
              disabled={saving}
              title="Staff location (optional HR)"
            />
            <CustomFieldInputs
              fields={staffCustomFields}
              values={staffCustomFieldValues}
              onChange={(key, value) =>
                setStaffCustomFieldValues((current) => ({
                  ...current,
                  [key]: value,
                }))
              }
              disabled={saving}
            />
          </div>
        );

      case "launch":
        return (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Rocket className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ready to launch {snapshot?.tenant.name}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {snapshot?.canLaunch
                  ? "Parent portal access will be enabled once you finalize setup."
                  : "Complete the required steps before launch."}
              </p>
            </div>
            {snapshot?.launchedAt && (
              <StatusBanner message="School setup has been launched." />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const primaryAction = () => {
    switch (currentStepId) {
      case "school_profile":
        return handleSaveProfile;
      case "academic_session":
        return handleCreateSession;
      case "assessment_structure":
        return handleSaveAssessment;
      case "fees":
        return handleSaveFees;
      case "import_students":
        return handleCreateStudent;
      case "invite_staff":
        return handleCreateStaff;
      case "launch":
        return handleLaunch;
      default:
        return goNext;
    }
  };

  const primaryLabel = () => {
    if (currentStepId === "launch") {
      return snapshot?.launchedAt ? "Setup complete" : "Finalize & launch";
    }
    if (
      currentStepId === "classes" ||
      currentStepId === "subjects" ||
      currentStepId === "campuses"
    ) {
      return currentStep?.status === "complete" ? "Continue" : "Save & continue";
    }
    return "Save & continue";
  };

  if (loading && !snapshot) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link
            to="/app"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-xl font-extrabold text-slate-900">
            School setup wizard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {snapshot?.progress ?? 0}% complete
          </p>
        </div>
        <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${snapshot?.progress ?? 0}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
        <div className="flex gap-1 overflow-x-auto border-b border-indigo-100 bg-indigo-50/40 px-4 py-2">
          {STEP_ORDER.map((stepId, index) => {
            const step = steps.find((item) => item.id === stepId);
            const Icon = STEP_ICONS[stepId] ?? Building2;
            return (
              <button
                key={stepId}
                type="button"
                onClick={() => setCurrentStepId(stepId)}
                className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                  currentStepId === stepId
                    ? "bg-indigo-600 text-white"
                    : step?.status === "complete"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{index + 1}.</span>
                <span>{step?.title ?? stepId}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {currentStep?.blocker && currentStep.status !== "complete" && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              {currentStep.blocker}
            </div>
          )}
          {renderStepContent()}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentIndex <= 0 || saving}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <button
            type="button"
            disabled={
              saving ||
              (currentStepId === "launch" && !!snapshot?.launchedAt) ||
              (currentStepId === "launch" && !snapshot?.canLaunch)
            }
            onClick={() => void primaryAction()()}
            className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                {primaryLabel()}
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-800">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function CampusesStep({
  campusForm,
  setCampusForm,
  onAdd,
  complete,
}: {
  campusForm: { name: string; code: string };
  setCampusForm: React.Dispatch<
    React.SetStateAction<{ name: string; code: string }>
  >;
  onAdd: () => Promise<void>;
  complete?: boolean;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-900">Campuses</h3>
      <p className="text-xs text-slate-500">
        Your main campus was created at registration. Add additional branches
        here if needed.
      </p>
      {complete && <StatusBanner message="At least one campus is configured." />}
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={campusForm.name}
          onChange={(event) =>
            setCampusForm((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
          placeholder="Campus name"
          className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm"
        />
        <input
          value={campusForm.code}
          onChange={(event) =>
            setCampusForm((current) => ({
              ...current,
              code: event.target.value,
            }))
          }
          placeholder="Campus code"
          className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm"
        />
      </div>
      <button
        type="button"
        onClick={() => void onAdd()}
        className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
      >
        Add campus
      </button>
    </div>
  );
}
