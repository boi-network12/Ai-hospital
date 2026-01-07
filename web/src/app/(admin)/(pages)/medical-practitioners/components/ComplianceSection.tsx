// app/dashboard/admin/medical-practitioners/components/ComplianceSection.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/types/auth';
import { useAdmin } from '@/context/AdminContext';
import {
  AlertCircle,
  FileText,
  ShieldAlert,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import debounce from 'lodash/debounce';

interface ComplianceSectionProps {
  practitioners: User[];
}

export const ComplianceSection = ({ practitioners }: ComplianceSectionProps) => {
  const { sendComplianceReminder } = useAdmin();
  const [sending, setSending] = useState<string | null>(null);
  const [customMessages, setCustomMessages] = useState<Record<string, string>>({});

  // Filter practitioners needing compliance updates
  const practitionersNeedingUpdates = practitioners.filter(practitioner => {
    const needsTaxInfo = !practitioner.taxInfo?.hasTaxInfo || 
                        practitioner.taxInfo?.status === 'pending' ||
                        practitioner.taxInfo?.status === 'rejected';
    
    const needsLicenseInfo = !practitioner.roleStatus?.licenseNumber ||
                            !practitioner.roleStatus?.verifiedLicense ||
                            !practitioner.roleStatus?.isActive;

    return needsTaxInfo || needsLicenseInfo;
  });

  // Categorize practitioners by what they need
  const categorizedPractitioners = practitionersNeedingUpdates.map(practitioner => {
    const needsTaxInfo = !practitioner.taxInfo?.hasTaxInfo || 
                        practitioner.taxInfo?.status === 'pending' ||
                        practitioner.taxInfo?.status === 'rejected';
    
    const needsLicenseInfo = !practitioner.roleStatus?.licenseNumber ||
                            !practitioner.roleStatus?.verifiedLicense ||
                            !practitioner.roleStatus?.isActive;

    return {
      ...practitioner,
      needs: {
        tax: needsTaxInfo,
        license: needsLicenseInfo,
        type: needsTaxInfo && needsLicenseInfo 
            ? 'both' 
            : needsTaxInfo 
                ? 'tax' 
                : 'license' as 'both' | 'tax' | 'license'
      }
    };
  });

  const handleSendReminder = useCallback(
    debounce(async (userId: string, name: string, reminderType: 'tax' | 'license' | 'both', customMessage?: string) => {
      setSending(userId);
      try {
        await sendComplianceReminder(userId, reminderType, customMessage);
        toast.success(`Reminder sent to ${name}`);
      } catch (error) {
        toast.error('Failed to send reminder');
      } finally {
        setSending(userId);
        setTimeout(() => setSending(null), 2000);
      }
    }, 300),
    [sendComplianceReminder]
  );

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (practitioner: User) => {
    const taxStatus = practitioner.taxInfo?.status;
    const hasLicense = practitioner.roleStatus?.licenseNumber;
    const verifiedLicense = practitioner.roleStatus?.verifiedLicense;

    if (!practitioner.taxInfo?.hasTaxInfo && !hasLicense) {
      return 'Missing tax and license information';
    } else if (!practitioner.taxInfo?.hasTaxInfo) {
      return 'Missing tax information';
    } else if (!hasLicense) {
      return 'Missing license information';
    } else if (taxStatus === 'pending') {
      return 'Tax verification pending';
    } else if (!verifiedLicense) {
      return 'License not verified';
    }
    return 'Requires attention';
  };

  if (categorizedPractitioners.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-orange-500" />
          Compliance Reminders Required
          <span className="ml-2 px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full">
            {categorizedPractitioners.length}
          </span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          These practitioners are missing required documentation. Send reminders to ensure compliance.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          <span className="font-medium">Note:</span> Without proper documentation, payments cannot be processed.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-orange-200 dark:border-orange-800/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-orange-50 dark:bg-orange-900/20">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-orange-800 dark:text-orange-300 uppercase tracking-wider">
                  Practitioner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-orange-800 dark:text-orange-300 uppercase tracking-wider">
                  Missing Information
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-orange-800 dark:text-orange-300 uppercase tracking-wider">
                  Current Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-orange-800 dark:text-orange-300 uppercase tracking-wider">
                  Custom Message
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-orange-800 dark:text-orange-300 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-orange-100 dark:divide-orange-800/30">
              {categorizedPractitioners.map((practitioner) => (
                <tr
                  key={practitioner.id}
                  className="hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-bold">
                        {practitioner.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {practitioner.name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {practitioner.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {practitioner.needs.tax && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            Tax Information
                          </span>
                          {practitioner.taxInfo?.status && (
                            <div className="flex items-center gap-1">
                              {getStatusIcon(practitioner.taxInfo.status)}
                              <span className="text-xs">
                                ({practitioner.taxInfo.status})
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      {practitioner.needs.license && (
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                            License Information
                          </span>
                          {!practitioner.roleStatus?.licenseNumber && (
                            <span className="text-xs text-gray-500">(Missing)</span>
                          )}
                          {practitioner.roleStatus?.licenseNumber && !practitioner.roleStatus?.verifiedLicense && (
                            <span className="text-xs text-gray-500">(Unverified)</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {getStatusText(practitioner)}
                    </div>
                    {practitioner.taxInfo?.adminNotes && (
                      <div className="text-xs text-gray-500 mt-1">
                        Note: {practitioner.taxInfo.adminNotes}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <textarea
                      placeholder="Add a custom message (optional)..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none bg-transparent resize-none"
                      rows={2}
                      value={customMessages[practitioner.id] || ''}
                      onChange={(e) =>
                        setCustomMessages(prev => ({
                          ...prev,
                          [practitioner.id]: e.target.value
                        }))
                      }
                    />
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() =>
                        handleSendReminder(
                          practitioner.id,
                          practitioner.name,
                          practitioner.needs.type,
                          customMessages[practitioner.id]
                        )
                      }
                      disabled={sending === practitioner.id}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {sending === practitioner.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Reminder
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        <div className="px-6 py-3 bg-orange-50/50 dark:bg-orange-900/10 border-t border-orange-100 dark:border-orange-800/30">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">Reminder:</span> Practitioners must provide all required documentation to receive payments. 
            Emails will include instructions for submitting documentation through the platform.
          </p>
        </div>
      </div>
    </div>
  );
};