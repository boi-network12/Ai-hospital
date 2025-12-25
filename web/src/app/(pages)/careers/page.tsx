// app/careers/page.tsx
'use client';

import { DotBackgroundDemo } from '@/UI/DotBackgroundDemo';
import HomeNav from '@/components/Header/HomeNav';
import Footer from '@/components/HomeComponents/Footer';
import { AnimatedSection } from '@/components/Opportunities/AnimatedSection';
import { RoleCard } from '@/components/Opportunities/RoleCard';
import { TechSection } from '@/components/Opportunities/TechSection';
import { Code2, Stethoscope, Brain, FileText, Users, Clock } from 'lucide-react';
import FinalCTA from '@/components/HomeComponents/FinalCTA';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useCareer } from '@/context/CareerContext';

export default function Careers() {
  const [activeTab, setActiveTab] = useState<'apply' | 'applications'>('apply');
  const { career } = useCareer();
  
  // Only show admin tab if user is admin
  const isAdmin = false; // You'll need to get this from your auth context

  return (
    <DotBackgroundDemo>
      <HomeNav />
      <main className="w-full min-h-screen pt-20">
        {/* Hero */}
        <section className="px-6 md:px-10 py-20">
          <div className="max-w-7xl mx-auto text-center">
            <AnimatedSection>
              <span className="inline-block px-4 py-2 rounded-full bg-[#8089ff]/10 text-[#8089ff] font-semibold text-sm mb-6">
                Build the Future of Healthcare with Us
              </span>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                Careers at Neuromed
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-12">
                Join our mission to revolutionize healthcare with AI. We're looking for passionate 
                doctors, nurses, and technologists who want to make a real impact.
              </p>
            </AnimatedSection>

            {/* Tabs for Admin/Applicant */}
            <AnimatedSection delay={0.3}>
              <div className="flex justify-center gap-4 mb-12">
                <button
                  onClick={() => setActiveTab('apply')}
                  className={`px-6 py-3 rounded-full font-semibold transition-all ${activeTab === 'apply' ? 'bg-[#8089ff] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                >
                  <FileText className="inline mr-2" size={20} />
                  Apply Now
                </button>
                
                {isAdmin && (
                  <button
                    onClick={() => setActiveTab('applications')}
                    className={`px-6 py-3 rounded-full font-semibold transition-all ${activeTab === 'applications' ? 'bg-[#8089ff] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                  >
                    <Users className="inline mr-2" size={20} />
                    View Applications
                    {career.applications?.total && (
                      <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                        {career.applications.total}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Main Content - Dynamic based on tab */}
        {activeTab === 'apply' ? (
          <ApplySection />
        ) : (
          <AdminApplicationsSection />
        )}

        {/* Role Opportunities */}
        <section className="px-6 md:px-10 pb-20">
          <div className="max-w-7xl mx-auto">
            <AnimatedSection>
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
                Open Positions
              </h2>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-8">
              <RoleCard
                icon={<Code2 size={32} />}
                title="AI/ML Engineer"
                subtitle="Build intelligent healthcare systems"
                gradient="from-[#8089ff] to-[#5a6aff]"
                href="#tech"
                badge="Remote Available"
              />
              <RoleCard
                icon={<Stethoscope size={32} />}
                title="Clinical Nurse"
                subtitle="Shape patient care workflows"
                gradient="from-emerald-500 to-teal-600"
                href="#nurse"
                badge="Full-time"
              />
              <RoleCard
                icon={<Brain size={32} />}
                title="Medical Director"
                subtitle="Lead clinical strategy & innovation"
                gradient="from-rose-500 to-pink-600"
                href="#doctor"
                badge="Senior Level"
              />
            </div>
          </div>
        </section>

        {/* Detailed sections */}
        <TechSection />

        {/* Application Process */}
        <ApplicationProcessSection />

        {/* Final CTA */}
        <FinalCTA />
      </main>

      <Footer />
    </DotBackgroundDemo>
  );
}

/* -------------------------------------------------
   Apply Section Component
   ------------------------------------------------- */
function ApplySection() {
  const { career, submitApplication } = useCareer();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    desiredRole: 'doctor',
    specialization: '',
    yearsOfExperience: '',
    coverLetter: '',
    privacyConsent: false,
    termsAccepted: false,
  });
  const [resume, setResume] = useState<File | null>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  // Add these gender and nationality options
  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
    { value: 'Prefer not to say', label: 'Prefer not to say' },
  ];

  const nationalityOptions = [
    { value: 'US', label: 'United States' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'CA', label: 'Canada' },
    { value: 'NG', label: 'Nigeria' },
    { value: 'IN', label: 'India' },
    // Add more as needed
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.privacyConsent || !formData.termsAccepted) {
      toast.error('Please accept the privacy policy and terms');
      return;
    }

    if (!resume || !profilePicture) {
      toast.error('Please upload both resume and profile picture');
      return;
    }

    // Validate date format
    const dobDate = new Date(formData.dateOfBirth);
    if (isNaN(dobDate.getTime())) {
      toast.error('Please enter a valid date of birth');
      return;
    }

    const form = new FormData();
    
    // Add form data
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'dateOfBirth' && typeof value === 'string') {
        form.append(key, new Date(value).toISOString());
      } else if (typeof value === 'boolean') {
        form.append(key, value.toString());
      } else {
        form.append(key, value);
      }
    });

    // Add files
    form.append('resume', resume);
    form.append('profilePicture', profilePicture);
    form.append('applicationDate', new Date().toISOString());

    const result = await submitApplication(form);
    if (result.success) {
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        gender: '',
        nationality: '',
        desiredRole: 'doctor',
        specialization: '',
        yearsOfExperience: '',
        coverLetter: '',
        privacyConsent: false,
        termsAccepted: false,
      });
      setResume(null);
      setProfilePicture(null);
    }
  };

  return (
    <section className="px-6 md:px-10 py-20 bg-gradient-to-b ">
      <div className="max-w-4xl mx-auto">
        <AnimatedSection>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Apply Now
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-12">
            Fill out the form below to apply for a position at Neuromed
          </p>
        </AnimatedSection>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <AnimatedSection delay={0.1}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <Users className="mr-2" />
                Personal Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#8089ff]"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#8089ff]"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#8089ff]"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#8089ff]"
                    aria-label="Date of Birth"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#8089ff]"
                    aria-label='Gender'
                    required
                  >
                    <option value="">Select Gender</option>
                    {genderOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Nationality *</label>
                  <select
                    value={formData.nationality}
                    onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#8089ff]"
                    required
                    aria-label='Nationality'
                  >
                    <option value="">Select Nationality</option>
                    {nationalityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>


                <div>
                  <label className="block text-sm font-medium mb-2">Desired Role *</label>
                  <select
                    value={formData.desiredRole}
                    onChange={(e) => setFormData({...formData, desiredRole: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#8089ff]"
                    aria-label='Describe Role'
                  >
                    <option value="doctor">Doctor/Physician</option>
                    <option value="nurse">Nurse</option>
                    <option value="hospital">Hospital Administrator</option>
                    <option value="ai">AI/ML Engineer</option>
                  </select>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Professional Information */}
          <AnimatedSection delay={0.2}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <Brain className="mr-2" />
                Professional Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Specialization *</label>
                  <input
                    type="text"
                    required
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#8089ff]"
                    placeholder="Cardiology, Pediatrics, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Years of Experience *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({...formData, yearsOfExperience: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#8089ff]"
                    placeholder="5"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Cover Letter</label>
                  <textarea
                    value={formData.coverLetter}
                    onChange={(e) => setFormData({...formData, coverLetter: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#8089ff]"
                    placeholder="Tell us why you want to join Neuromed..."
                  />
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Documents Upload */}
          <AnimatedSection delay={0.3}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <FileText className="mr-2" />
                Required Documents
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Resume/CV *</label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-[#8089ff] transition-colors">
                    <input
                      type="file"
                      id="resume"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResume(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label htmlFor="resume" className="cursor-pointer">
                      <FileText className="mx-auto mb-4 text-gray-400" size={48} />
                      <p className="text-gray-600 dark:text-gray-400">
                        {resume ? resume.name : 'Click to upload resume (PDF, DOC, DOCX)'}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">Max file size: 10MB</p>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Profile Picture/Passport Photo *</label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-[#8089ff] transition-colors">
                    <input
                      type="file"
                      id="profilePicture"
                      accept="image/*"
                      onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label htmlFor="profilePicture" className="cursor-pointer">
                      <FileText className="mx-auto mb-4 text-gray-400" size={48} />
                      <p className="text-gray-600 dark:text-gray-400">
                        {profilePicture ? profilePicture.name : 'Click to upload profile picture'}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">Max file size: 5MB</p>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Terms & Submit */}
          <AnimatedSection delay={0.4}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="space-y-4 mb-8">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.privacyConsent}
                    onChange={(e) => setFormData({...formData, privacyConsent: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-300 text-[#8089ff] focus:ring-[#8089ff]"
                  />
                  <span>I agree to the Privacy Policy *</span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData({...formData, termsAccepted: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-300 text-[#8089ff] focus:ring-[#8089ff]"
                  />
                  <span>I accept the Terms & Conditions *</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={career.submitting}
                className="w-full py-4 px-6 bg-gradient-to-r from-[#8089ff] to-[#5a6aff] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {career.submitting ? (
                  <>
                    <Clock className="inline mr-2 animate-spin" size={20} />
                    Submitting Application...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>

              <p className="text-sm text-gray-500 mt-4 text-center">
                We'll review your application and contact you within 5-7 business days.
              </p>
            </div>
          </AnimatedSection>
        </form>
      </div>
    </section>
  );
}

/* -------------------------------------------------
   Admin Applications Section Component
   ------------------------------------------------- */
function AdminApplicationsSection() {
  const { career, fetchApplications, updateStatus } = useCareer();
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Filter applications based on status
  const filteredApplications = career.applications?.applications.filter(app => 
    statusFilter ? app.status === statusFilter : true
  ) || [];

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'interview_scheduled': return 'bg-purple-100 text-purple-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <section className="px-6 md:px-10 py-20">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Career Applications
            </h2>
            
            <div className="flex items-center gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                aria-label="Filter by Status"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              
              <button
                onClick={() => fetchApplications()}
                className="px-4 py-2 bg-[#8089ff] text-white rounded-lg hover:opacity-90"
              >
                Refresh
              </button>
            </div>
          </div>
        </AnimatedSection>

        {career.loading ? (
          <AnimatedSection>
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#8089ff]"></div>
              <p className="mt-4 text-gray-600">Loading applications...</p>
            </div>
          </AnimatedSection>
        ) : filteredApplications.length === 0 ? (
          <AnimatedSection>
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl">
              <Users className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-xl font-semibold mb-2">No applications found</h3>
              <p className="text-gray-600">No applications match your current filters.</p>
            </div>
          </AnimatedSection>
        ) : (
          <div className="grid gap-6">
            {filteredApplications.map((app, index) => (
              <AnimatedSection key={app._id} delay={index * 0.05}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-xl font-semibold">{app.fullName}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                          {app.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Role:</span> {app.desiredRole}
                        </div>
                        <div>
                          <span className="font-medium">Specialty:</span> {app.specialization}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {app.email}
                        </div>
                        <div>
                          <span className="font-medium">Applied:</span> {new Date(app.applicationDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(app._id, 'under_review', 'Moved to review')}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => updateStatus(app._id, 'rejected', 'Not a good fit')}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        )}

        {/* Statistics */}
        {career.applications && (
          <AnimatedSection delay={0.3}>
            <div className="mt-12 p-6 bg-gradient-to-r from-[#8089ff]/10 to-[#5a6aff]/10 rounded-2xl">
              <h3 className="text-xl font-semibold mb-4">Application Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard label="Total" value={career.applications.total} />
                <StatCard label="Pending" value={career.applications.applications.filter(a => a.status === 'pending').length} />
                <StatCard label="Under Review" value={career.applications.applications.filter(a => a.status === 'under_review').length} />
                <StatCard label="Interview Scheduled" value={career.applications.applications.filter(a => a.status === 'interview_scheduled').length} />
                <StatCard label="Approved" value={career.applications.applications.filter(a => a.status === 'approved').length} />
              </div>
            </div>
          </AnimatedSection>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------
   Application Process Section
   ------------------------------------------------- */
function ApplicationProcessSection() {
  const steps = [
    {
      number: '01',
      title: 'Submit Application',
      description: 'Fill out the form and upload your documents',
      icon: '📝',
    },
    {
      number: '02',
      title: 'Initial Review',
      description: 'Our team reviews your qualifications',
      icon: '👨‍⚕️',
    },
    {
      number: '03',
      title: 'Interview',
      description: 'Video call with our hiring team',
      icon: '🎥',
    },
    {
      number: '04',
      title: 'Offer & Onboarding',
      description: 'Welcome to the Neuromed family!',
      icon: '🎉',
    },
  ];

  return (
    <section className="px-6 md:px-10 py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Application Process
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-12 max-w-3xl mx-auto">
            Our streamlined process ensures a smooth experience from application to onboarding
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <AnimatedSection key={step.number} delay={index * 0.1}>
              <motion.div
                whileHover={{ y: -5 }}
                className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
              >
                <div className="text-4xl mb-4">{step.icon}</div>
                <div className="text-sm font-semibold text-[#8089ff] mb-2">
                  STEP {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
                
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
                )}
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------
   Helper Components
   ------------------------------------------------- */
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl">
      <div className="text-3xl font-bold text-[#8089ff]">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">{label}</div>
    </div>
  );
}