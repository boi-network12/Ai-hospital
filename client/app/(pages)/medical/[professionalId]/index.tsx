// app/medical/[professionalId].tsx
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { formatDistanceToNow } from 'date-fns';

// Icons
import StarIcon from "@/assets/Svgs/star.svg";
import LocationPinIcon from "@/assets/Svgs/locate.svg";
import ClockIcon from "@/assets/Svgs/clock.svg";
import VerifiedIcon from "@/assets/Svgs/badge-check.svg";
import MessageIcon from "@/assets/Svgs/message-circle-more.svg";
import TipIcon from "@/assets/Svgs/badge-dollar-sign.svg";
import BackIcon from "@/assets/Svgs/arrow-left.svg";
import DollarIcon from "@/assets/Svgs/dollar-sign.svg";
import AwardIcon from "@/assets/Svgs/award.svg";
import GlobeIcon from "@/assets/Svgs/globe.svg";
import UsersIcon from "@/assets/Svgs/user.svg";
import CalendarIcon from "@/assets/Svgs/calendar.svg";
import PhoneIcon from "@/assets/Svgs/phone-call.svg";
import MailIcon from "@/assets/Svgs/mail.svg";
import BookOpenIcon from "@/assets/Svgs/book-open.svg";

// Components
import { useHealthcare } from '@/context/HealthContext';
import { HealthcareProfessional } from '@/types/auth.d';
import { RefreshControl } from 'react-native-gesture-handler';
import { useUser } from '@/Hooks/userHooks.d';
import { useToast } from '@/Hooks/useToast.d';

export default function MedicalProfessionalProfile() {
    const { professionalId } = useLocalSearchParams();
    const router = useRouter();
    const {
        healthcare,
        getProfessionalProfile,
        rateProfessional,
        tipProfessional,
        getUserProfessionalRating,
        getProfessionalRatings
    } = useHealthcare();
    const { user } = useUser();
    const { showAlert } = useToast();

    const [professional, setProfessional] = useState<HealthcareProfessional | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userRating, setUserRating] = useState<{
        hasRated: boolean;
        rating: number;
        comment: string;
        ratingId?: string;
        updatedAt?: string | null;
    }>({ hasRated: false, rating: 0, comment: '' });
    const [loadingRating, setLoadingRating] = useState(false);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [tempRating, setTempRating] = useState(0);
    const [tempComment, setTempComment] = useState('');
    const [isUpdatingRating, setIsUpdatingRating] = useState(false);
    const [showTipModal, setShowTipModal] = useState(false);
    const [tipAmount, setTipAmount] = useState('10');
    const [tipMessage, setTipMessage] = useState('');
    const [recentRatings, setRecentRatings] = useState<any[]>([]);
    const [loadingRatings, setLoadingRatings] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const showCommentDialog = (rating: number, existingComment: string, isUpdate: boolean) => {
        setTempRating(rating);
        setTempComment(existingComment || '');
        setIsUpdatingRating(isUpdate);
        setShowCommentModal(true);
    };

    useEffect(() => {
        if (professionalId && !healthcare.selectedProfessional) {
            loadProfessionalProfile();
        }
    }, [professionalId]);

    useEffect(() => {
        if (healthcare.selectedProfessional) {
            setProfessional(healthcare.selectedProfessional);
            setLoading(false);
            loadUserRating();
            loadRecentRatings();
        }
    }, [healthcare.selectedProfessional]);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                setError(null);
                setProfessional(null);
                await getProfessionalProfile(professionalId as string);
            } catch (err: any) {
                console.error('API Error:', err);
                setError(err.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        if (professionalId) {
            loadProfile();
        }
    }, [professionalId]);

    const loadProfessionalProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            await getProfessionalProfile(professionalId as string);
        } catch (err: any) {
            console.error('API Error:', err);
            setError(err.message || 'Failed to load profile');
            setLoading(false);
        }
    };

    const loadUserRating = async () => {
        if (!user) {
            setUserRating({ hasRated: false, rating: 0, comment: '' });
            return;
        }
        
        try {
            setLoadingRating(true);
            const ratingData = await getUserProfessionalRating(professionalId as string);
            setUserRating({
                hasRated: ratingData.hasRated,
                rating: ratingData.rating || 0,
                comment: ratingData.comment || '',
                ratingId: ratingData.id,
                updatedAt: ratingData.updatedAt
            });
        } catch (err) {
            console.error('Failed to load user rating:', err);
        } finally {
            setLoadingRating(false);
        }
    };

    const loadRecentRatings = async () => {
        if (!professionalId) return;
        
        try {
            setLoadingRatings(true);
            // This would need to be implemented in your context
            // For now, we'll use a mock or empty array
            setRecentRatings([]);
        } catch (err) {
            console.error('Failed to load ratings:', err);
        } finally {
            setLoadingRatings(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            loadProfessionalProfile(),
            loadUserRating(),
            loadRecentRatings()
        ]);
        setRefreshing(false);
    };

    const handleSendTip = async (customAmount?: number) => {
        try {
            const amount = customAmount || parseInt(tipAmount) || 10;
            await tipProfessional(professionalId as string, amount, tipMessage || "Thank you for your service!");
            showAlert({ message: 'Tip sent successfully!', type: 'success' });
            setShowTipModal(false);
            setTipMessage('');
        } catch {
            showAlert({ message: 'Failed to send tip', type: 'error' });
        }
    };

    const handleSendMessage = () => {
        router.push(`/chat/${professionalId}`);
    };

    const handleScheduleAppointment = () => {
        router.push(`/appointment/book/${professionalId}`);
    };

    const handleRateProfessional = async (rating: number) => {
        if (!user) {
            Alert.alert('Login Required', 'Please login to rate this professional', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Login', onPress: () => router.push('/auth/login') }
            ]);
            return;
        }
        
        try {
            await loadUserRating();
            const currentComment = userRating.comment || '';
            
            if (userRating.hasRated) {
                Alert.alert(
                    'Update Rating',
                    'You have already rated this professional. Would you like to:',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                            text: 'Update Rating Only', 
                            onPress: async () => {
                                await handleRatingUpdate(rating, currentComment);
                            }
                        },
                        { 
                            text: 'Update with New Comment', 
                            onPress: () => {
                                showCommentDialog(rating, currentComment, true);
                            }
                        }
                    ]
                );
            } else {
                showCommentDialog(rating, '', false);
            }
        } catch (error: any) {
            console.error('Rating error:', error);
            showAlert({ 
                message: error.message || 'Failed to submit rating', 
                type: 'error' 
            });
        }
    };

    const handleRatingUpdate = async (rating: number, comment?: string) => {
        try {
            await rateProfessional(
                professionalId as string, 
                rating, 
                comment
            );
            
            await loadUserRating();
            await loadProfessionalProfile();
            
            showAlert({ 
                message: `Rating ${userRating.hasRated ? 'updated' : 'submitted'} successfully!`, 
                type: 'success' 
            });
        } catch (error: any) {
            console.error('Rating update error:', error);
            if (error.message === 'Already rated') {
                await loadUserRating();
                showAlert({ 
                    message: 'You have already rated this professional!', 
                    type: 'info' 
                });
                return;
            }
            showAlert({ 
                message: error.message || 'Failed to submit rating', 
                type: 'error' 
            });
        }
    };

    const CommentModal = () => (
        <Modal
            visible={showCommentModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCommentModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>
                        {isUpdatingRating ? 'Update Comment' : 'Add a Comment (Optional)'}
                    </Text>
                    
                    <TextInput
                        style={styles.commentInput}
                        multiline
                        numberOfLines={4}
                        placeholder="Share your experience (optional)..."
                        value={tempComment}
                        onChangeText={setTempComment}
                    />
                    
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={() => setShowCommentModal(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.modalButton, styles.skipButton]}
                            onPress={async () => {
                                setShowCommentModal(false);
                                await handleRatingUpdate(tempRating, undefined);
                            }}
                        >
                            <Text style={styles.skipButtonText}>
                                {isUpdatingRating ? 'Update Without Comment' : 'Skip Comment'}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.modalButton, styles.submitButton]}
                            onPress={async () => {
                                setShowCommentModal(false);
                                await handleRatingUpdate(tempRating, tempComment || undefined);
                            }}
                        >
                            <Text style={styles.submitButtonText}>
                                {isUpdatingRating ? 'Update' : 'Submit'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const TipModal = () => (
        <Modal
            visible={showTipModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowTipModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Send a Tip</Text>
                    
                    <View style={styles.tipAmountContainer}>
                        <Text style={styles.tipLabel}>Amount ($)</Text>
                        <View style={styles.amountInputContainer}>
                            <DollarIcon width={hp(2.5)} height={hp(2.5)} fill="#666" />
                            <TextInput
                                style={styles.amountInput}
                                value={tipAmount}
                                onChangeText={setTipAmount}
                                keyboardType="numeric"
                                placeholder="10"
                            />
                        </View>
                    </View>
                    
                    <View style={styles.quickAmounts}>
                        {[5, 10, 20, 50, 100].map((amount) => (
                            <TouchableOpacity
                                key={amount}
                                style={styles.quickAmountButton}
                                onPress={() => setTipAmount(amount.toString())}
                            >
                                <Text style={styles.quickAmountText}>${amount}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    <View style={styles.messageContainer}>
                        <Text style={styles.tipLabel}>Message (Optional)</Text>
                        <TextInput
                            style={styles.messageInput}
                            multiline
                            numberOfLines={3}
                            placeholder="Add a personal message..."
                            value={tipMessage}
                            onChangeText={setTipMessage}
                        />
                    </View>
                    
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={() => {
                                setShowTipModal(false);
                                setTipMessage('');
                            }}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.modalButton, styles.submitButton]}
                            onPress={() => handleSendTip()}
                        >
                            <Text style={styles.submitButtonText}>Send Tip</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderInteractiveStars = (rating: number = 0, interactive: boolean = true) => {
        const stars = [];
        const currentRating = userRating.hasRated ? userRating.rating : rating;
        
        for (let i = 1; i <= 5; i++) {
            stars.push(
                interactive ? (
                    <TouchableOpacity
                        key={i}
                        style={styles.starButton}
                        onPress={() => {
                            setTempRating(i);
                            if (!userRating.hasRated || (userRating.hasRated && !userRating.comment)) {
                                showCommentDialog(i, userRating.comment || '', userRating.hasRated);
                            } else {
                                handleRatingUpdate(i, userRating.comment);
                            }
                        }}
                    >
                        <StarIcon 
                            width={hp(3.5)} 
                            height={hp(3.5)} 
                            fill={i <= currentRating ? "#FFC107" : "transparent"}
                            stroke={i <= currentRating ? "#FFC107" : "#ddd"}
                            strokeWidth={1.5}
                        />
                    </TouchableOpacity>
                ) : (
                    <View key={i} style={styles.starButton}>
                        <StarIcon 
                            width={hp(2)} 
                            height={hp(2)} 
                            fill={i <= currentRating ? "#FFC107" : "transparent"}
                            stroke={i <= currentRating ? "#FFC107" : "#ddd"}
                            strokeWidth={1.5}
                        />
                    </View>
                )
            );
        }
        
        return stars;
    };

    const renderStatsSection = () => {
        if (!professional) return null;
        
        const stats = professional.healthcareProfile?.stats || {};
        
        return (
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                        <UsersIcon width={hp(2.5)} height={hp(2.5)} fill="#8089ff" />
                    </View>
                    <Text style={styles.statValue}>{stats.totalConsultations || 0}</Text>
                    <Text style={styles.statLabel}>Patients</Text>
                </View>
                
                <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                        <StarIcon width={hp(2.5)} height={hp(2.5)} fill="#FFC107" />
                    </View>
                    <Text style={styles.statValue}>{stats.averageRating?.toFixed(1) || "0.0"}</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                </View>
                
                <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                        <ClockIcon width={hp(2.5)} height={hp(2.5)} fill="#28a745" />
                    </View>
                    <Text style={styles.statValue}>{stats.responseTime || "N/A"}</Text>
                    <Text style={styles.statLabel}>Response</Text>
                </View>
                
                <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                        <AwardIcon width={hp(2.5)} height={hp(2.5)} fill="#dc3545" />
                    </View>
                    <Text style={styles.statValue}>{stats.acceptanceRate || "N/A"}%</Text>
                    <Text style={styles.statLabel}>Acceptance</Text>
                </View>
            </View>
        );
    };

    const renderLanguages = () => {
        const languages = professional?.healthcareProfile?.languages || [];
        if (languages.length === 0) return null;
        
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Languages</Text>
                <View style={styles.languagesContainer}>
                    {languages.map((lang, index) => (
                        <View key={index} style={styles.languageBadge}>
                            <GlobeIcon width={hp(1.5)} height={hp(1.5)} fill="#666" />
                            <Text style={styles.languageText}>{lang}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const renderServices = () => {
        const services = professional?.healthcareProfile?.services || [];
        if (services.length === 0) return null;
        
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Services</Text>
                <View style={styles.servicesContainer}>
                    {services.map((service, index) => (
                        <View key={index} style={styles.serviceBadge}>
                            <Text style={styles.serviceText}>{service}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const renderEducation = () => {
        const education = professional?.healthcareProfile?.education || [];
        if (education.length === 0) return null;
        
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Education</Text>
                {education.map((edu, index) => (
                    <View key={index} style={styles.educationItem}>
                        <BookOpenIcon width={hp(2)} height={hp(2)} fill="#666" />
                        <View style={styles.educationDetails}>
                            <Text style={styles.educationDegree}>{edu.degree}</Text>
                            <Text style={styles.educationInstitution}>{edu.institution}</Text>
                            <Text style={styles.educationYear}>Graduated: {edu.year}</Text>
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    const renderCertifications = () => {
        const certifications = professional?.healthcareProfile?.certifications || [];
        if (certifications.length === 0) return null;
        
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Certifications</Text>
                {certifications.map((cert, index) => (
                    <View key={index} style={styles.certificationItem}>
                        <AwardIcon width={hp(2)} height={hp(2)} fill="#28a745" />
                        <View style={styles.certificationDetails}>
                            <Text style={styles.certificationType}>{cert.licenseType}</Text>
                            <Text style={styles.certificationNumber}>{cert.licenseNumber}</Text>
                            <Text style={styles.certificationAuthority}>{cert.issuingAuthority}</Text>
                            <Text style={styles.certificationStatus}>
                                Status: <Text style={{
                                    color: cert.verificationStatus === 'verified' ? '#28a745' : 
                                           cert.verificationStatus === 'pending' ? '#ffc107' : '#dc3545'
                                }}>{cert.verificationStatus}</Text>
                            </Text>
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    const renderAvailability = () => {
        const availability = professional?.healthcareProfile?.availability;
        if (!availability) return null;
        
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Availability</Text>
                <View style={styles.availabilityContainer}>
                    <View style={styles.availabilityStatus}>
                        <View style={[
                            styles.statusDot,
                            { backgroundColor: availability.isAvailable ? '#28a745' : '#dc3545' }
                        ]} />
                        <Text style={[
                            styles.availabilityText,
                            { color: availability.isAvailable ? '#28a745' : '#dc3545' }
                        ]}>
                            {availability.isAvailable ? 'Available for consultations' : 'Currently unavailable'}
                        </Text>
                    </View>
                    
                    {availability.schedule && availability.schedule.length > 0 && (
                        <View style={styles.scheduleContainer}>
                            <Text style={styles.scheduleTitle}>Weekly Schedule:</Text>
                            {availability.schedule.map((day, index) => (
                                <View key={index} style={styles.scheduleDay}>
                                    <Text style={styles.scheduleDayName}>{day.day}</Text>
                                    <View style={styles.scheduleSlots}>
                                        {day.slots.map((slot, slotIndex) => (
                                            <Text key={slotIndex} style={styles.scheduleSlot}>
                                                {slot.start} - {slot.end}
                                            </Text>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderRatingSection = () => {
        if (loadingRating) {
            return (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Rating</Text>
                    <ActivityIndicator size="small" color="#8089ff" />
                </View>
            );
        }

        if (!user) {
            return (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Rate this Professional</Text>
                    <View style={styles.loginContainer}>
                        <Text style={styles.loginPrompt}>
                            Login to share your experience
                        </Text>
                        <TouchableOpacity 
                            style={styles.loginButton}
                            onPress={() => router.push('/auth/login')}
                        >
                            <Text style={styles.loginButtonText}>Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {userRating.hasRated ? 'Your Rating' : 'Rate this Professional'}
                </Text>
                
                <View style={styles.ratingButtons}>
                    {renderInteractiveStars(0, true)}
                </View>
                
                <Text style={styles.ratingPrompt}>
                    {userRating.hasRated 
                        ? `You rated ${userRating.rating} out of 5 stars`
                        : 'Tap a star to rate from 1 to 5'}
                </Text>
                
                {userRating.hasRated && userRating.comment && (
                    <View style={styles.commentContainer}>
                        <Text style={styles.commentLabel}>Your comment:</Text>
                        <Text style={styles.userComment}>
                            {`"${userRating.comment}"`}
                        </Text>
                    </View>
                )}
                
                {userRating.hasRated && (
                    <TouchableOpacity 
                        style={styles.editCommentButton}
                        onPress={() => showCommentDialog(userRating.rating, userRating.comment || '', true)}
                    >
                        <Text style={styles.editCommentText}>Edit Comment</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderContactInfo = () => {
        if (!professional) return null;
        
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                
                {professional.email && (
                    <View style={styles.contactItem}>
                        <MailIcon width={hp(2)} height={hp(2)} fill="#666" />
                        <Text style={styles.contactText}>{professional.email}</Text>
                    </View>
                )}
                
                {professional.phoneNumber && (
                    <View style={styles.contactItem}>
                        <PhoneIcon width={hp(2)} height={hp(2)} fill="#666" />
                        <Text style={styles.contactText}>{professional.phoneNumber}</Text>
                    </View>
                )}
                
                {professional.profile?.location?.city && professional.profile?.location?.country && (
                    <View style={styles.contactItem}>
                        <LocationPinIcon width={hp(2)} height={hp(2)} fill="#666" />
                        <Text style={styles.contactText}>
                            {[
                                professional.profile.location.city,
                                professional.profile.location.state,
                                professional.profile.location.country
                            ].filter(Boolean).join(', ')}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    const renderTabs = () => (
        <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['overview', 'services', 'education', 'availability', 'reviews'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[
                            styles.tabButton,
                            activeTab === tab && styles.activeTabButton
                        ]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[
                            styles.tabText,
                            activeTab === tab && styles.activeTabText
                        ]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'services':
                return (
                    <>
                        {renderServices()}
                        {renderCertifications()}
                        {renderLanguages()}
                    </>
                );
            case 'education':
                return renderEducation();
            case 'availability':
                return renderAvailability();
            case 'reviews':
                return (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Patient Reviews</Text>
                        {loadingRatings ? (
                            <ActivityIndicator size="small" color="#8089ff" />
                        ) : recentRatings.length > 0 ? (
                            recentRatings.map((rating, index) => (
                                <View key={index} style={styles.reviewItem}>
                                    <View style={styles.reviewHeader}>
                                        <Text style={styles.reviewerName}>{rating.userName}</Text>
                                        <View style={styles.reviewStars}>
                                            {renderInteractiveStars(rating.rating, false)}
                                        </View>
                                    </View>
                                    <Text style={styles.reviewDate}>
                                        {formatDistanceToNow(new Date(rating.createdAt), { addSuffix: true })}
                                    </Text>
                                    {rating.comment && (
                                        <Text style={styles.reviewComment}>{rating.comment}</Text>
                                    )}
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noReviewsText}>No reviews yet. Be the first to rate!</Text>
                        )}
                    </View>
                );
            default:
                return (
                    <>
                        {renderStatsSection()}
                        {professional?.healthcareProfile?.bio && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>About</Text>
                                <Text style={styles.bio}>{professional.healthcareProfile.bio}</Text>
                            </View>
                        )}
                        {professional?.healthcareProfile?.specializations && 
                         professional.healthcareProfile.specializations.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Specializations</Text>
                                <View style={styles.specializations}>
                                    {professional.healthcareProfile.specializations.map((spec, index) => (
                                        <View key={index} style={styles.specItem}>
                                            <Text style={styles.specName}>{spec.name}</Text>
                                            <Text style={styles.specExp}>{spec.yearsOfExperience} years</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                        {renderContactInfo()}
                    </>
                );
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <BackIcon width={hp(2.5)} height={hp(2.5)} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Professional Profile</Text>
                    <View style={styles.headerRight} />
                </View>

                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8089ff" />
                    <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!professional || error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <BackIcon width={hp(2.5)} height={hp(2.5)} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Professional Profile</Text>
                    <View style={styles.headerRight} />
                </View>

                <View style={styles.notFoundContainer}>
                    <View style={styles.notFoundIcon}>
                        <LocationPinIcon width={hp(15)} height={hp(15)} fill="#ccc" />
                    </View>
                    <Text style={styles.notFoundTitle}>Professional Not Found</Text>
                    <Text style={styles.notFoundMessage}>
                        {error || "The professional you're looking for may no longer be available."}
                    </Text>
                    
                    <TouchableOpacity 
                        style={styles.retryButton} 
                        onPress={loadProfessionalProfile}
                    >
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.goBackButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.goBackButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <BackIcon width={hp(2.5)} height={hp(2.5)} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Professional Profile</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView 
                style={styles.content}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh}
                        colors={["#8089ff"]}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {professional.profile?.avatar ? (
                            <Image
                                source={{ uri: professional.profile.avatar }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {professional.name?.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        {professional.healthcareProfile?.isVerified && (
                            <View style={styles.verifiedBadge}>
                                <VerifiedIcon width={hp(1.5)} height={hp(1.5)} fill="#fff" />
                            </View>
                        )}
                    </View>

                    <Text style={styles.name}>{professional.name}</Text>
                    <Text style={styles.role}>
                        {professional.role === "doctor" ? "Medical Doctor" : 
                         professional.role === "nurse" ? "Registered Nurse" : 
                         professional.role === "hospital" ? "Hospital" : professional.role}
                    </Text>

                    <View style={styles.ratingContainer}>
                        <StarIcon width={hp(2)} height={hp(2)} fill="#FFC107" />
                        <Text style={styles.rating}>
                            {professional.healthcareProfile?.stats?.averageRating?.toFixed(1) || "0.0"}
                        </Text>
                        <Text style={styles.ratingCount}>
                            ({professional.healthcareProfile?.stats?.totalRatings || 0} ratings)
                        </Text>
                    </View>

                    {professional.healthcareProfile?.hourlyRate && (
                        <View style={styles.hourlyRateContainer}>
                            <DollarIcon width={hp(1.8)} height={hp(1.8)} fill="#28a745" />
                            <Text style={styles.hourlyRateText}>
                                ${professional.healthcareProfile.hourlyRate}/hour
                            </Text>
                        </View>
                    )}
                </View>

                {/* Quick Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity 
                        style={styles.actionButton} 
                        onPress={handleSendMessage}
                        activeOpacity={0.8}
                    >
                        <MessageIcon width={hp(2.5)} height={hp(2.5)} fill="#fff" />
                        <Text style={styles.actionText}>Message</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.actionButton, styles.appointmentButton]} 
                        onPress={handleScheduleAppointment}
                        activeOpacity={0.8}
                    >
                        <CalendarIcon width={hp(2.5)} height={hp(2.5)} fill="#fff" />
                        <Text style={styles.actionText}>Book</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.actionButton, styles.tipButton]} 
                        onPress={() => setShowTipModal(true)}
                        activeOpacity={0.8}
                    >
                        <TipIcon width={hp(2.5)} height={hp(2.5)} fill="#fff" />
                        <Text style={styles.actionText}>Tip</Text>
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                {renderTabs()}

                {/* Tab Content */}
                {renderTabContent()}

                {/* Rating Section */}
                {renderRatingSection()}

                {/* Spacer */}
                <View style={{ height: hp(3) }} />
            </ScrollView>

            {/* Modals */}
            <CommentModal />
            <TipModal />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    backButton: {
        padding: hp(0.5),
        borderRadius: hp(1),
    },
    headerTitle: {
        fontSize: hp(1.9),
        fontWeight: '600',
        color: '#333',
    },
    headerRight: {
        width: hp(4),
    },
    content: {
        flex: 1,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: hp(3),
        paddingHorizontal: wp(4),
        backgroundColor: '#fff',
        marginBottom: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: hp(2),
    },
    avatar: {
        width: hp(14),
        height: hp(14),
        borderRadius: hp(7),
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatarPlaceholder: {
        width: hp(14),
        height: hp(14),
        borderRadius: hp(7),
        backgroundColor: '#8089ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatarText: {
        fontSize: hp(4),
        fontWeight: 'bold',
        color: '#fff',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4CAF50',
        borderRadius: hp(1.5),
        padding: hp(0.6),
        borderWidth: 2,
        borderColor: '#fff',
    },
    name: {
        fontSize: hp(2.8),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: hp(0.5),
        textAlign: 'center',
    },
    role: {
        fontSize: hp(1.8),
        color: '#666',
        marginBottom: hp(1.5),
        textAlign: 'center',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1),
        borderRadius: hp(2),
        marginTop: hp(0.5),
        marginBottom: hp(1),
    },
    rating: {
        fontSize: hp(1.9),
        fontWeight: '600',
        marginLeft: wp(1.5),
        color: '#333',
    },
    ratingCount: {
        fontSize: hp(1.6),
        color: '#999',
        marginLeft: wp(1),
    },
    hourlyRateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e8',
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.8),
        borderRadius: hp(1),
        marginTop: hp(0.5),
    },
    hourlyRateText: {
        fontSize: hp(1.6),
        color: '#28a745',
        fontWeight: '600',
        marginLeft: wp(1),
    },
    actions: {
        flexDirection: 'row',
        paddingHorizontal: wp(4),
        marginBottom: hp(2),
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#8089ff',
        paddingVertical: hp(1.8),
        marginHorizontal: wp(1),
        borderRadius: hp(1.2),
        shadowColor: '#8089ff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    appointmentButton: {
        backgroundColor: '#6f42c1',
        shadowColor: '#6f42c1',
    },
    tipButton: {
        backgroundColor: '#28a745',
        shadowColor: '#28a745',
    },
    actionText: {
        color: '#fff',
        fontSize: hp(1.9),
        fontWeight: '600',
        marginLeft: wp(2),
    },
    tabsContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1),
        marginBottom: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    tabButton: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(1),
        marginRight: wp(2),
        borderRadius: hp(1),
    },
    activeTabButton: {
        backgroundColor: '#8089ff',
    },
    tabText: {
        fontSize: hp(1.6),
        color: '#666',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#fff',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        marginHorizontal: wp(4),
        marginBottom: hp(2),
        borderRadius: hp(1.5),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statIconContainer: {
        width: hp(5),
        height: hp(5),
        borderRadius: hp(2.5),
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(0.5),
    },
    statValue: {
        fontSize: hp(2),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: hp(0.3),
    },
    statLabel: {
        fontSize: hp(1.3),
        color: '#666',
    },
    section: {
        backgroundColor: '#fff',
        marginHorizontal: wp(4),
        marginBottom: hp(2),
        padding: hp(2.5),
        borderRadius: hp(1.5),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sectionTitle: {
        fontSize: hp(2.1),
        fontWeight: '600',
        color: '#333',
        marginBottom: hp(1.5),
    },
    bio: {
        fontSize: hp(1.7),
        lineHeight: hp(2.3),
        color: '#666',
    },
    specializations: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -wp(1),
    },
    specItem: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: wp(3.5),
        paddingVertical: hp(1),
        borderRadius: hp(1),
        marginRight: wp(2),
        marginBottom: hp(1.5),
        minWidth: wp(28),
    },
    specName: {
        fontSize: hp(1.6),
        fontWeight: '500',
        color: '#333',
        marginBottom: hp(0.3),
    },
    specExp: {
        fontSize: hp(1.4),
        color: '#666',
    },
    languagesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -wp(1),
    },
    languageBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f4f8',
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.8),
        borderRadius: hp(1),
        marginRight: wp(2),
        marginBottom: hp(1),
    },
    languageText: {
        fontSize: hp(1.4),
        color: '#31708f',
        marginLeft: wp(1),
        fontWeight: '500',
    },
    servicesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -wp(1),
    },
    serviceBadge: {
        backgroundColor: '#f8f9fa',
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.8),
        borderRadius: hp(1),
        marginRight: wp(2),
        marginBottom: hp(1),
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    serviceText: {
        fontSize: hp(1.4),
        color: '#666',
    },
    educationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: hp(2),
    },
    educationDetails: {
        flex: 1,
        marginLeft: wp(3),
    },
    educationDegree: {
        fontSize: hp(1.7),
        fontWeight: '600',
        color: '#333',
        marginBottom: hp(0.3),
    },
    educationInstitution: {
        fontSize: hp(1.5),
        color: '#666',
        marginBottom: hp(0.3),
    },
    educationYear: {
        fontSize: hp(1.3),
        color: '#999',
    },
    certificationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: hp(2),
    },
    certificationDetails: {
        flex: 1,
        marginLeft: wp(3),
    },
    certificationType: {
        fontSize: hp(1.7),
        fontWeight: '600',
        color: '#333',
        marginBottom: hp(0.3),
    },
    certificationNumber: {
        fontSize: hp(1.5),
        color: '#666',
        marginBottom: hp(0.3),
    },
    certificationAuthority: {
        fontSize: hp(1.4),
        color: '#666',
        marginBottom: hp(0.3),
    },
    certificationStatus: {
        fontSize: hp(1.3),
        color: '#999',
    },
    availabilityContainer: {
        marginTop: hp(1),
    },
    availabilityStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(1.5),
    },
    statusDot: {
        width: hp(1),
        height: hp(1),
        borderRadius: hp(0.5),
        marginRight: wp(2),
    },
    availabilityText: {
        fontSize: hp(1.6),
        fontWeight: '500',
    },
    scheduleContainer: {
        marginTop: hp(1),
    },
    scheduleTitle: {
        fontSize: hp(1.6),
        fontWeight: '600',
        color: '#333',
        marginBottom: hp(1),
    },
    scheduleDay: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(1),
        paddingBottom: hp(1),
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    scheduleDayName: {
        width: wp(20),
        fontSize: hp(1.5),
        fontWeight: '500',
        color: '#333',
    },
    scheduleSlots: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    scheduleSlot: {
        fontSize: hp(1.4),
        color: '#666',
        marginRight: wp(2),
        marginBottom: hp(0.5),
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(1.5),
    },
    contactText: {
        fontSize: hp(1.6),
        color: '#666',
        marginLeft: wp(3),
        flex: 1,
    },
    ratingButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: hp(1.5),
    },
    starButton: {
        padding: wp(1.5),
    },
    ratingPrompt: {
        fontSize: hp(1.6),
        color: '#888',
        textAlign: 'center',
        marginTop: hp(0.5),
        marginBottom: hp(1),
    },
    userRatingContainer: {
        alignItems: 'center',
    },
    ratingDisplay: {
        flexDirection: 'row',
        marginBottom: hp(1),
    },
    ratedText: {
        fontSize: hp(1.7),
        color: '#666',
        textAlign: 'center',
        marginBottom: hp(1),
        fontWeight: '500',
    },
    ratingDate: {
        fontSize: hp(1.4),
        color: '#888',
        fontStyle: 'italic',
    },
    editCommentButton: {
        marginTop: hp(1),
        padding: hp(1),
        alignItems: 'center',
    },
    editCommentText: {
        color: '#8089ff',
        fontSize: hp(1.6),
        fontWeight: '500',
    },
    commentContainer: {
        backgroundColor: '#f8f9fa',
        padding: hp(1.5),
        borderRadius: hp(1),
        width: '100%',
        marginTop: hp(1),
        marginBottom: hp(1),
    },
    commentLabel: {
        fontSize: hp(1.5),
        color: '#888',
        marginBottom: hp(0.5),
    },
    userComment: {
        fontSize: hp(1.6),
        color: '#555',
        fontStyle: 'italic',
        lineHeight: hp(2),
    },
    loginContainer: {
        alignItems: 'center',
        paddingVertical: hp(1),
    },
    loginPrompt: {
        fontSize: hp(1.7),
        color: '#666',
        textAlign: 'center',
        marginBottom: hp(1.5),
    },
    loginButton: {
        backgroundColor: '#8089ff',
        paddingHorizontal: wp(6),
        paddingVertical: hp(1.2),
        borderRadius: hp(1),
    },
    loginButtonText: {
        color: '#fff',
        fontSize: hp(1.7),
        fontWeight: '600',
    },
    reviewItem: {
        backgroundColor: '#f8f9fa',
        padding: hp(1.5),
        borderRadius: hp(1),
        marginBottom: hp(1.5),
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(0.5),
    },
    reviewerName: {
        fontSize: hp(1.6),
        fontWeight: '600',
        color: '#333',
    },
    reviewStars: {
        flexDirection: 'row',
    },
    reviewDate: {
        fontSize: hp(1.3),
        color: '#999',
        marginBottom: hp(0.8),
    },
    reviewComment: {
        fontSize: hp(1.5),
        color: '#666',
        lineHeight: hp(2),
    },
    noReviewsText: {
        fontSize: hp(1.6),
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
        paddingVertical: hp(2),
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(5),
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: hp(2),
        padding: hp(3),
        width: '100%',
        maxWidth: wp(90),
    },
    modalTitle: {
        fontSize: hp(2.2),
        fontWeight: '600',
        color: '#333',
        marginBottom: hp(2),
        textAlign: 'center',
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: hp(1),
        padding: hp(1.5),
        fontSize: hp(1.6),
        minHeight: hp(10),
        marginBottom: hp(2),
        textAlignVertical: 'top',
    },
    tipAmountContainer: {
        marginBottom: hp(2),
    },
    tipLabel: {
        fontSize: hp(1.6),
        color: '#666',
        marginBottom: hp(0.8),
        fontWeight: '500',
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: hp(1),
        paddingHorizontal: hp(1.5),
    },
    amountInput: {
        flex: 1,
        fontSize: hp(2),
        paddingVertical: hp(1.5),
        paddingLeft: wp(2),
    },
    quickAmounts: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: hp(2),
    },
    quickAmountButton: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: wp(3),
        paddingVertical: hp(1),
        borderRadius: hp(1),
        minWidth: wp(15),
        alignItems: 'center',
    },
    quickAmountText: {
        fontSize: hp(1.6),
        color: '#333',
        fontWeight: '500',
    },
    messageContainer: {
        marginBottom: hp(2),
    },
    messageInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: hp(1),
        padding: hp(1.5),
        fontSize: hp(1.6),
        minHeight: hp(8),
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        paddingVertical: hp(1.5),
        borderRadius: hp(1),
        alignItems: 'center',
        marginHorizontal: wp(1),
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
    },
    skipButton: {
        backgroundColor: '#6c757d',
    },
    submitButton: {
        backgroundColor: '#8089ff',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: hp(1.6),
        fontWeight: '600',
    },
    skipButtonText: {
        color: '#fff',
        fontSize: hp(1.6),
        fontWeight: '600',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: hp(1.6),
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: hp(2),
        fontSize: hp(1.9),
        color: '#666',
        fontWeight: '500',
    },
    notFoundContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(8),
        backgroundColor: '#f8f9fa',
    },
    notFoundIcon: {
        marginBottom: hp(4),
        opacity: 0.5,
    },
    notFoundTitle: {
        fontSize: hp(2.8),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: hp(1.5),
        textAlign: 'center',
    },
    notFoundMessage: {
        fontSize: hp(1.9),
        color: '#777',
        textAlign: 'center',
        lineHeight: hp(2.6),
        marginBottom: hp(4),
    },
    retryButton: {
        backgroundColor: '#8089ff',
        paddingHorizontal: wp(10),
        paddingVertical: hp(1.8),
        borderRadius: hp(1.5),
        minWidth: wp(60),
        shadowColor: '#8089ff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: hp(1.9),
        fontWeight: '600',
        textAlign: 'center',
    },
    goBackButton: {
        marginTop: hp(2.5),
        padding: hp(1.5),
    },
    goBackButtonText: {
        color: '#8089ff',
        fontSize: hp(1.9),
        fontWeight: '500',
    },
});