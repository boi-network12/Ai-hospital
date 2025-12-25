// app/components/users/TaxInformationModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, XCircle, FileText, Building, Globe, Shield, Check, X, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAdmin } from '@/context/AdminContext';
import { ITaxInfo, User } from '@/types/auth';

interface TaxInformationModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TaxInformationModal = ({ user, isOpen, onClose, onSuccess }: TaxInformationModalProps) => {
  const { updateUserTaxInfo, verifyTaxInfo, getTaxInfo, removeTaxInfo } = useAdmin();
  
  const [loading, setLoading] = useState(false);
  const [loadingTaxInfo, setLoadingTaxInfo] = useState(false);
  const [taxForm, setTaxForm] = useState<Partial<ITaxInfo>>({
    hasTaxInfo: false,
    taxId: '',
    taxIdType: '' as any,
    taxCountry: '',
    taxState: '',
    taxRate: 0,
    isTaxExempt: false,
    exemptionReason: '',
    businessName: '',
    businessType: '' as any,
    businessRegistrationNumber: '',
    taxFormPreference: '' as any,
    taxTreatyBenefits: false,
    treatyCountry: '',
    treatyArticle: '',
    annualEarningsThreshold: 0,
    taxWithholdingRate: 0,
    status: 'pending' as any,
    adminNotes: '',
  });

  // Load tax information when modal opens
  useEffect(() => {
    const loadTaxInfo = async () => {
      if (user && isOpen) {
        setLoadingTaxInfo(true);
        try {
          const taxData = await getTaxInfo(user.id);
          if (taxData) {
            setTaxForm(prev => ({
              ...prev,
              hasTaxInfo: taxData.hasTaxInfo || false,
              taxId: taxData.taxId || '',
              taxIdType: taxData.taxIdType || '',
              taxCountry: taxData.taxCountry || '',
              taxState: taxData.taxState || '',
              taxRate: taxData.taxRate || 0,
              isTaxExempt: taxData.isTaxExempt || false,
              exemptionReason: taxData.exemptionReason || '',
              businessName: taxData.businessName || '',
              businessType: taxData.businessType || '',
              businessRegistrationNumber: taxData.businessRegistrationNumber || '',
              taxFormPreference: taxData.taxFormPreference || '',
              taxTreatyBenefits: taxData.taxTreatyBenefits || false,
              treatyCountry: taxData.treatyCountry || '',
              treatyArticle: taxData.treatyArticle || '',
              annualEarningsThreshold: taxData.annualEarningsThreshold || 0,
              taxWithholdingRate: taxData.taxWithholdingRate || 0,
              status: taxData.status || 'pending',
              adminNotes: taxData.adminNotes || '',
            }));
          }
        } catch (error: any) {
          console.error('Failed to load tax info:', error);
          // Initialize with default if no tax info exists
          setTaxForm(prev => ({
            ...prev,
            hasTaxInfo: false,
          }));
        } finally {
          setLoadingTaxInfo(false);
        }
      }
    };

    if (isOpen && user) {
      loadTaxInfo();
    }
  }, [user, isOpen, getTaxInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await updateUserTaxInfo(user.id, taxForm);
      toast.success('Tax information updated successfully');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update tax information');
    } finally {
      setLoading(false);
    }
  };

  const handleTaxChange = (field: string, value: any) => {
    setTaxForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVerifyTax = async (verified: boolean, status: any) => {
    if (!user) return;
    
    try {
      await verifyTaxInfo(user.id, {
        verified,
        status,
        adminNotes: taxForm.adminNotes,
      });
      toast.success(`Tax information ${verified ? 'verified' : 'rejected'}`);
      setTaxForm(prev => ({
        ...prev,
        verified,
        status,
      }));
    } catch (error: any) {
      toast.error(error.message || 'Failed to update tax verification');
    }
  };

  const handleRemoveTaxInfo = async () => {
    if (!user || !confirm('Are you sure you want to remove all tax information?')) return;
    
    try {
      await removeTaxInfo(user.id);
      setTaxForm({
        hasTaxInfo: false,
        taxId: '',
        taxIdType: '',
        taxCountry: '',
        taxState: '',
        taxRate: 0,
        isTaxExempt: false,
        exemptionReason: '',
        businessName: '',
        businessType: '',
        businessRegistrationNumber: '',
        taxFormPreference: '',
        taxTreatyBenefits: false,
        treatyCountry: '',
        treatyArticle: '',
        annualEarningsThreshold: 0,
        taxWithholdingRate: 0,
        status: 'pending',
        adminNotes: '',
      });
      toast.success('Tax information removed');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove tax information');
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tax-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 id="tax-modal-title" className="text-xl font-bold">
              Tax Information
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage tax details for {user.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            aria-label="Close tax modal"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {loadingTaxInfo ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tax Information Header */}
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="font-semibold">Tax Information</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Required for practitioners receiving payments
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={taxForm.hasTaxInfo}
                  onChange={(e) => handleTaxChange('hasTaxInfo', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Has Tax Information</span>
              </label>
            </div>

            {taxForm.hasTaxInfo && (
              <>
                {/* Tax ID Information */}
                <div className="border rounded-xl p-6">
                  <h4 className="font-medium mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Tax Identification
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Tax ID *</label>
                      <input
                        type="text"
                        value={taxForm.taxId}
                        onChange={(e) => handleTaxChange('taxId', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="e.g., 123-45-6789"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Tax ID Type *</label>
                      <select
                        value={taxForm.taxIdType}
                        onChange={(e) => handleTaxChange('taxIdType', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        aria-label='tax id type'
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="SSN">SSN (US)</option>
                        <option value="EIN">EIN (US)</option>
                        <option value="TIN">TIN (International)</option>
                        <option value="VAT">VAT (EU)</option>
                        <option value="GST">GST (India/Canada)</option>
                        <option value="PAN">PAN (India)</option>
                        <option value="NIF">NIF (Spain)</option>
                        <option value="ABN">ABN (Australia)</option>
                        <option value="CUIT">CUIT (Argentina)</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tax Location */}
                <div className="border rounded-xl p-6">
                  <h4 className="font-medium mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Tax Location
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Country *</label>
                      <input
                        type="text"
                        value={taxForm.taxCountry}
                        onChange={(e) => handleTaxChange('taxCountry', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="e.g., US"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">State/Province</label>
                      <input
                        type="text"
                        value={taxForm.taxState}
                        onChange={(e) => handleTaxChange('taxState', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="e.g., California"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Tax Rate (%)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={taxForm.taxRate}
                          onChange={(e) => handleTaxChange('taxRate', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          placeholder="0"
                        />
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Withholding Rate (%)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={taxForm.taxWithholdingRate}
                          onChange={(e) => handleTaxChange('taxWithholdingRate', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          placeholder="0"
                        />
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tax Exemption */}
                <div className="border rounded-xl p-6">
                  <h4 className="font-medium mb-4 text-gray-800 dark:text-gray-200">
                    Tax Exemption
                  </h4>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={taxForm.isTaxExempt}
                        onChange={(e) => handleTaxChange('isTaxExempt', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="font-medium">Is Tax Exempt</span>
                    </label>
                    
                    {taxForm.isTaxExempt && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Exemption Reason</label>
                        <input
                          type="text"
                          value={taxForm.exemptionReason}
                          onChange={(e) => handleTaxChange('exemptionReason', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          placeholder="e.g., Non-profit organization, Government entity"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Business Information */}
                <div className="border rounded-xl p-6">
                  <h4 className="font-medium mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Business Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Business Name</label>
                      <input
                        type="text"
                        value={taxForm.businessName}
                        onChange={(e) => handleTaxChange('businessName', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Business Type</label>
                      <select
                        value={taxForm.businessType}
                        onChange={(e) => handleTaxChange('businessType', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        aria-label='business type'
                      >
                        <option value="">Select Type</option>
                        <option value="individual">Individual</option>
                        <option value="sole_proprietorship">Sole Proprietorship</option>
                        <option value="llc">LLC</option>
                        <option value="corporation">Corporation</option>
                        <option value="partnership">Partnership</option>
                        <option value="non_profit">Non-Profit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Registration Number</label>
                      <input
                        type="text"
                        value={taxForm.businessRegistrationNumber}
                        onChange={(e) => handleTaxChange('businessRegistrationNumber', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="e.g., 123456789"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Annual Earnings Threshold</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          min="0"
                          value={taxForm.annualEarningsThreshold}
                          onChange={(e) => handleTaxChange('annualEarningsThreshold', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tax Treaty Benefits */}
                <div className="border rounded-xl p-6">
                  <h4 className="font-medium mb-4 text-gray-800 dark:text-gray-200">
                    Tax Treaty Benefits
                  </h4>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={taxForm.taxTreatyBenefits}
                        onChange={(e) => handleTaxChange('taxTreatyBenefits', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="font-medium">Claims Tax Treaty Benefits</span>
                    </label>
                    
                    {taxForm.taxTreatyBenefits && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Treaty Country</label>
                          <input
                            type="text"
                            value={taxForm.treatyCountry}
                            onChange={(e) => handleTaxChange('treatyCountry', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="e.g., United Kingdom"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Treaty Article</label>
                          <input
                            type="text"
                            value={taxForm.treatyArticle}
                            onChange={(e) => handleTaxChange('treatyArticle', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="e.g., Article 12"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tax Form Preference */}
                <div className="border rounded-xl p-6">
                  <h4 className="font-medium mb-4 text-gray-800 dark:text-gray-200">
                    Tax Form Preference
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Preferred Tax Form</label>
                      <select
                        value={taxForm.taxFormPreference}
                        onChange={(e) => handleTaxChange('taxFormPreference', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        aria-label='preferred tax form'
                      >
                        <option value="">Select Form</option>
                        <option value="1099">Form 1099 (US)</option>
                        <option value="W-9">Form W-9 (US)</option>
                        <option value="W-8BEN">Form W-8BEN (Foreign Individual)</option>
                        <option value="W-8ECI">Form W-8ECI (Foreign Corporation)</option>
                        <option value="W-8IMY">Form W-8IMY (Intermediary)</option>
                        <option value="W-8EXP">Form W-8EXP (Foreign Government)</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Verification Status</label>
                      <select
                        value={taxForm.status}
                        onChange={(e) => handleTaxChange('status', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        aria-label='verification status'
                      >
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                        <option value="expired">Expired</option>
                        <option value="not_required">Not Required</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="border rounded-xl p-6">
                  <h4 className="font-medium mb-4 text-gray-800 dark:text-gray-200">
                    Admin Notes
                  </h4>
                  <textarea
                    value={taxForm.adminNotes}
                    onChange={(e) => handleTaxChange('adminNotes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Add any notes about this tax information..."
                  />
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <div className="flex-1 flex gap-2">
                <button
                  type="button"
                  onClick={handleRemoveTaxInfo}
                  disabled={!taxForm.hasTaxInfo}
                  className="px-4 py-2 border border-red-300 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Tax Info
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleVerifyTax(true, 'verified')}
                    disabled={!taxForm.hasTaxInfo}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                  >
                    <Check className="w-4 h-4" />
                    Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyTax(false, 'rejected')}
                    disabled={!taxForm.hasTaxInfo}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Saving...' : 'Save Tax Information'}
                </button>
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};