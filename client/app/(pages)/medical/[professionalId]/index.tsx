// app/medical/[professionalId].tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Modal,
    TextInput,
    TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { formatDistanceToNow } from 'date-fns';
// Add these imports at the top
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, DateData } from 'react-native-calendars';

// Icons
import StarIcon from "@/assets/Svgs/star.svg";
import LocationPinIcon from "@/assets/Svgs/locate.svg";
import ClockIcon from "@/assets/Svgs/clock.svg";
import VerifiedIcon from "@/assets/Svgs/badge-check.svg";
import MessageIcon from "@/assets/Svgs/message-circle-more.svg";
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

const CommentModal = ({
  visible,
  onClose,
  tempComment,
  setTempComment,
  isUpdatingRating,
  tempRating,
  onSubmitRating,
}: {
  visible: boolean;
  onClose: () => void;
  tempComment: string;
  setTempComment: (text: string) => void;
  isUpdatingRating: boolean;
  tempRating: number;
  onSubmitRating: (rating: number, comment?: string) => Promise<void>;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (withComment: boolean) => {
    try {
      setIsSubmitting(true);
      await onSubmitRating(
        tempRating,
        withComment ? (tempComment || undefined) : undefined
      );
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <View key={i} style={modalStyles.starContainer}>
          <StarIcon 
            width={hp(3.2)} 
            height={hp(3.2)} 
            fill={i <= tempRating ? "#FFC107" : "transparent"}
            stroke={i <= tempRating ? "#FFC107" : "#ddd"}
            strokeWidth={1.5}
          />
        </View>
      );
    }
    return stars;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={modalStyles.overlay}>
          <TouchableWithoutFeedback>
            <View style={modalStyles.container}>
              {/* Header */}
              <View style={modalStyles.header}>
                <View style={modalStyles.headerIcon}>
                  <StarIcon width={hp(2.5)} height={hp(2.5)} fill="#FFC107" />
                </View>
                <Text style={modalStyles.title}>
                  {isUpdatingRating ? 'Update Your Review' : 'Rate this Professional'}
                </Text>
                <Text style={modalStyles.subtitle}>
                  {isUpdatingRating 
                    ? 'Edit your rating and feedback' 
                    : `You rated ${tempRating} out of 5 stars`
                  }
                </Text>
              </View>

              {/* Stars Display */}
              <View style={modalStyles.starsRow}>
                {renderStars()}
              </View>

              {/* Comment Input */}
              <View style={modalStyles.inputContainer}>
                <Text style={modalStyles.inputLabel}>
                  Share your experience (optional)
                </Text>
                <TextInput
                  style={modalStyles.input}
                  multiline
                  numberOfLines={5}
                  placeholder="What was your experience like? Was there anything particular that stood out?"
                  value={tempComment}
                  onChangeText={setTempComment}
                  autoFocus={true}
                  blurOnSubmit={false}
                  editable={!isSubmitting}
                  textAlignVertical="top"
                  placeholderTextColor="#999"
                />
                <Text style={modalStyles.charHint}>
                  {tempComment.length}/500 characters
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={modalStyles.buttonContainer}>
                <TouchableOpacity
                  style={[modalStyles.button, modalStyles.secondaryButton]}
                  onPress={onClose}
                  disabled={isSubmitting}
                >
                  <Text style={modalStyles.secondaryButtonText}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[modalStyles.button, modalStyles.primaryButton]}
                  onPress={() => handleSubmit(true)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={modalStyles.primaryButtonText}>
                      {isUpdatingRating ? 'Update Review' : 'Submit Review'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Skip Option */}
              <TouchableOpacity
                style={modalStyles.skipButton}
                onPress={() => handleSubmit(false)}
                disabled={isSubmitting}
              >
                <Text style={modalStyles.skipButtonText}>
                  {isUpdatingRating ? 'Update rating only' : 'Submit rating only'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Helper function to get day name from day index
const getDayName = (dayIndex: number) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dayIndex];
};

// Add this function to find the next available slot
const findNextAvailableSlot = (
  availability: any,
  duration: number = 60,
  preferredDate?: Date
): Date => {
  let proposedDate = preferredDate || new Date();
  
  // Add buffer of at least 1 hour from now
  proposedDate.setHours(proposedDate.getHours() + 1);
  
  // Ensure it's a working day (check professional's schedule)
  for (let i = 0; i < 30; i++) { // Check up to 30 days ahead
    const dayOfWeek = proposedDate.getDay();
    const dayName = getDayName(dayOfWeek);
    
    // Check if professional has schedule for this day
    const daySchedule = availability?.schedule?.find((s: any) => 
      s.day.toLowerCase() === dayName.toLowerCase()
    );
    
    if (!daySchedule || !daySchedule.slots || daySchedule.slots.length === 0) {
      proposedDate.setDate(proposedDate.getDate() + 1);
      proposedDate.setHours(8, 0, 0, 0); // Reset to start of day
      continue;
    }
    
    // Check all slots for this day
    for (const slot of daySchedule.slots) {
      const [startHour, startMin] = slot.start.split(':').map(Number);
      const [endHour, endMin] = slot.end.split(':').map(Number);
      
      let currentHour = startHour;
      let currentMin = startMin;
      
      // Generate slots every 30 minutes within this time block
      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const slotStart = new Date(proposedDate);
        slotStart.setHours(currentHour, currentMin, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotStart.getMinutes() + duration);
        
        // Check if the slot is available (in the future and fits within the working hours)
        const slotEndHour = slotEnd.getHours();
        const slotEndMin = slotEnd.getMinutes();
        
        // Check if the slot ends within the working hours
        const fitsInSlot = (slotEndHour < endHour) || 
                          (slotEndHour === endHour && slotEndMin <= endMin);
        
        if (slotStart > new Date() && fitsInSlot) {
          return slotStart;
        }
        
        // Move to next 30-minute interval
        currentMin += 30;
        if (currentMin >= 60) {
          currentHour += 1;
          currentMin -= 60;
        }
      }
    }
    
    // Move to next day
    proposedDate.setDate(proposedDate.getDate() + 1);
    proposedDate.setHours(8, 0, 0, 0);
  }
  
  // Fallback: Return next available slot or current date + 1 hour
  const fallbackDate = new Date();
  fallbackDate.setHours(fallbackDate.getHours() + 1);
  return fallbackDate;
};

// Add this modal component before the main component
const BookingModal = ({
  visible,
  onClose,
  professional,
  onSubmitBooking,
  loading,
  availability,
}: {
  visible: boolean;
  onClose: () => void;
  professional: HealthcareProfessional | null;
  onSubmitBooking: (date: Date, duration: number, type: string, mode: string) => Promise<void>;
  loading: boolean;
  availability?: any;
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1); // Tomorrow as default
    date.setHours(10, 0, 0, 0); // 10:00 AM default
    return date;
  });
  const { showAlert } = useToast();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState(60); // Default 60 minutes
  const [appointmentType, setAppointmentType] = useState('consultation');
  const [mode, setMode] = useState('physical');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [filteredSlots, setFilteredSlots] = useState<string[]>([]);
  
  const appointmentTypes = [
    { id: 'consultation', label: 'Consultation' },
    { id: 'followup', label: 'Follow-up' },
    { id: 'emergency', label: 'Emergency' },
    { id: 'routine', label: 'Routine Checkup' },
  ];
  
  const consultationModes = [
    { id: 'physical', label: 'In-person' },
    { id: 'virtual', label: 'Virtual' },
    { id: 'phone', label: 'Phone Call' },
  ];
  
  const durations = [
    { minutes: 30, label: '30 min' },
    { minutes: 60, label: '1 hour' },
    { minutes: 90, label: '1.5 hours' },
    { minutes: 120, label: '2 hours' },
  ];

  // Generate available slots based on professional's schedule
  const generateTimeSlots = useCallback(() => {
    if (!availability || !availability.schedule) {
      // Default slots if no schedule available
      return generateDefaultSlots();
    }
    
    const dayOfWeek = selectedDate.getDay();
    const dayName = getDayName(dayOfWeek);
    const daySchedule = availability.schedule.find((s: any) => 
      s.day.toLowerCase() === dayName.toLowerCase()
    );
    
    if (!daySchedule || !daySchedule.slots || daySchedule.slots.length === 0) {
      return generateDefaultSlots();
    }
    
    const slots: string[] = [];
    
    // Process all time blocks for this day
    daySchedule.slots.forEach((slot: any) => {
      const [startHour, startMin] = slot.start.split(':').map(Number);
      const [endHour, endMin] = slot.end.split(':').map(Number);
      
      let currentHour = startHour;
      let currentMin = startMin;
      
      // Generate slots every 30 minutes, but ensure they don't exceed the end time
      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        // Format time as HH:MM
        const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
        slots.push(timeStr);
        
        // Add 30 minutes for next slot
        currentMin += 30;
        if (currentMin >= 60) {
          currentHour += 1;
          currentMin -= 60;
        }
      }
    });
    
    return slots;
  }, [availability, selectedDate]);

  const generateDefaultSlots = () => {
    const slots: string[] = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let min = 0; min < 60; min += 30) {
        if (hour === 17 && min > 0) break; // End at 5 PM
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        slots.push(timeStr);
      }
    }
    return slots;
  };

  // Filter slots based on duration - only show slots that can accommodate the full duration
  const filterSlotsByDuration = useCallback((slots: string[]) => {
    if (!availability || !availability.schedule) return slots;
    
    const dayOfWeek = selectedDate.getDay();
    const dayName = getDayName(dayOfWeek);
    const daySchedule = availability.schedule.find((s: any) => 
      s.day.toLowerCase() === dayName.toLowerCase()
    );
    
    if (!daySchedule || !daySchedule.slots) return slots;
    
    return slots.filter(slot => {
      const [hours, minutes] = slot.split(':').map(Number);
      const slotStart = new Date(selectedDate);
      slotStart.setHours(hours, minutes, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotStart.getMinutes() + duration);
      
      // Check if this slot fits within any available time block
      return daySchedule.slots.some((timeBlock: any) => {
        const [blockStartHour, blockStartMin] = timeBlock.start.split(':').map(Number);
        const [blockEndHour, blockEndMin] = timeBlock.end.split(':').map(Number);
        
        const slotEndHour = slotEnd.getHours();
        const slotEndMin = slotEnd.getMinutes();
        
        // Check if slot ends within the time block
        return (slotEndHour < blockEndHour) || 
               (slotEndHour === blockEndHour && slotEndMin <= blockEndMin);
      });
    });
  }, [availability, selectedDate, duration]);

  const isDateDisabled = (date: DateData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(date.dateString);
    selected.setHours(0, 0, 0, 0);
    
    // Disable past dates
    if (selected < today) return true;
    
    // Check if date is within next 90 days
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);
    if (selected > maxDate) return true;
    
    // Check if professional is available on this day
    if (!availability || !availability.schedule) return false; // Changed from true to false to allow clicking
    
    const dayName = getDayName(selected.getDay());
    const daySchedule = availability.schedule.find((s: any) => 
      s.day.toLowerCase() === dayName.toLowerCase()
    );
    
    // Only disable if there's no schedule for this day
    return !daySchedule || !daySchedule.slots || daySchedule.slots.length === 0;
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    const slots = generateTimeSlots();
    setAvailableSlots(slots);
    const filtered = filterSlotsByDuration(slots);
    setFilteredSlots(filtered);
    setSelectedSlot('');
  };

  const handleTimeSelect = (slot: string) => {
    setSelectedSlot(slot);
    const [hours, minutes] = slot.split(':').map(Number);
    const newDate = new Date(selectedDate);
    newDate.setHours(hours, minutes, 0, 0);
    setSelectedDate(newDate);
  };

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    const filtered = filterSlotsByDuration(availableSlots);
    setFilteredSlots(filtered);
    
    // If current selected slot is no longer valid, clear it
    if (selectedSlot && !filtered.includes(selectedSlot)) {
      setSelectedSlot('');
    }
  };

  const validateTimeSlot = (slot: string) => {
    const [hours, minutes] = slot.split(':').map(Number);
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hours, minutes, 0, 0);
    
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotStart.getMinutes() + duration);
    
    // Check if professional has schedule for this day
    const dayOfWeek = selectedDate.getDay();
    const dayName = getDayName(dayOfWeek);
    const daySchedule = availability?.schedule?.find((s: any) => 
      s.day.toLowerCase() === dayName.toLowerCase()
    );
    
    if (!daySchedule || !daySchedule.slots) {
      return false;
    }
    
    // Check if the slot fits within any of the available time blocks
    return daySchedule.slots.some((timeBlock: any) => {
      const [blockStartHour, blockStartMin] = timeBlock.start.split(':').map(Number);
      const [blockEndHour, blockEndMin] = timeBlock.end.split(':').map(Number);
      
      const slotStartHour = slotStart.getHours();
      const slotStartMin = slotStart.getMinutes();
      const slotEndHour = slotEnd.getHours();
      const slotEndMin = slotEnd.getMinutes();
      
      // Convert all times to minutes for easier comparison
      const slotStartTotal = slotStartHour * 60 + slotStartMin;
      const slotEndTotal = slotEndHour * 60 + slotEndMin;
      const blockStartTotal = blockStartHour * 60 + blockStartMin;
      const blockEndTotal = blockEndHour * 60 + blockEndMin;
      
      // Check if the entire appointment fits within this time block
      return slotStartTotal >= blockStartTotal && slotEndTotal <= blockEndTotal;
    });
  };

  const handleSubmit = async () => {
    if (!selectedSlot) {
      showAlert({ message: 'Please select a time slot', type: 'warning' });
      return;
    }
    
    // Validate that the selected time fits within professional's schedule
    // if (!validateTimeSlot(selectedSlot)) {
    //   showAlert({ 
    //     message: `This ${duration}-minute appointment doesn't fit within the professional's available hours. Please select a shorter duration or a different time.`, 
    //     type: 'error' 
    //   });
    //   return;
    // }
    
    await onSubmitBooking(selectedDate, duration, appointmentType, mode);
  };

  // Initialize available slots on mount
  useEffect(() => {
    const slots = generateTimeSlots();
    setAvailableSlots(slots);
    const filtered = filterSlotsByDuration(slots);
    setFilteredSlots(filtered);
  }, [selectedDate, availability, generateTimeSlots, filterSlotsByDuration]);

  const markedDates = {
    [selectedDate.toISOString().split('T')[0]]: {
      selected: true,
      selectedColor: '#8089ff',
      selectedTextColor: '#fff',
    },
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={bookingModalStyles.overlay}>
          <TouchableWithoutFeedback>
            <View style={bookingModalStyles.container}>
              {/* Header */}
              <View style={bookingModalStyles.header}>
                <TouchableOpacity onPress={onClose} style={bookingModalStyles.closeButton}>
                  <BackIcon width={hp(2)} height={hp(2)} />
                </TouchableOpacity>
                <Text style={bookingModalStyles.title}>Book Appointment</Text>
                <View style={bookingModalStyles.headerRight} />
              </View>

              <ScrollView 
                style={bookingModalStyles.content}
                showsVerticalScrollIndicator={false}
              >
                {/* Professional Info */}
                <View style={bookingModalStyles.professionalInfo}>
                  <View style={bookingModalStyles.avatarContainer}>
                    {professional?.profile?.avatar ? (
                      <Image
                        source={{ uri: professional.profile.avatar }}
                        style={bookingModalStyles.avatar}
                      />
                    ) : (
                      <View style={bookingModalStyles.avatarPlaceholder}>
                        <Text style={bookingModalStyles.avatarText}>
                          {professional?.name?.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={bookingModalStyles.professionalDetails}>
                    <Text style={bookingModalStyles.professionalName}>
                      {professional?.name}
                    </Text>
                    <Text style={bookingModalStyles.professionalRole}>
                      {professional?.role}
                    </Text>
                  </View>
                </View>

                {/* Calendar */}
                <View style={bookingModalStyles.section}>
                  <Text style={bookingModalStyles.sectionTitle}>Select Date</Text>
                  <Calendar
                    current={selectedDate.toISOString().split('T')[0]}
                    minDate={new Date().toISOString().split('T')[0]}
                    maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    onDayPress={(day: DateData) => {
                      if (!isDateDisabled(day)) {
                        const newDate = new Date(day.dateString);
                        newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
                        handleDateChange(newDate);
                      }
                    }}
                    markedDates={markedDates}
                    theme={{
                      selectedDayBackgroundColor: '#8089ff',
                      todayTextColor: '#8089ff',
                      arrowColor: '#8089ff',
                      textDisabledColor: '#ddd',
                    }}
                    disableAllTouchEventsForDisabledDays={false} // Changed to false to allow clicking
                  />
                </View>

                {/* Time Slots */}
                <View style={bookingModalStyles.section}>
                  <Text style={bookingModalStyles.sectionTitle}>Select Time</Text>
                  <View style={bookingModalStyles.timeSlotsContainer}>
                    {filteredSlots.length > 0 ? (
                      <>
                        <Text style={bookingModalStyles.slotsInfo}>
                          Available slots for {duration} minutes:
                        </Text>
                        <View style={bookingModalStyles.timeSlotsGrid}>
                          {filteredSlots.map((slot, index) => (
                            <TouchableOpacity
                              key={index}
                              style={[
                                bookingModalStyles.timeSlot,
                                selectedSlot === slot && bookingModalStyles.selectedTimeSlot
                              ]}
                              onPress={() => handleTimeSelect(slot)}
                            >
                              <Text style={[
                                bookingModalStyles.timeSlotText,
                                selectedSlot === slot && bookingModalStyles.selectedTimeSlotText
                              ]}>
                                {slot}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        {selectedSlot && (
                          <View style={bookingModalStyles.selectedTimeContainer}>
                            <ClockIcon width={hp(2)} height={hp(2)} fill="#8089ff" />
                            <Text style={bookingModalStyles.selectedTimeText}>
                              Selected: {selectedSlot} ({duration} min)
                            </Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <View style={bookingModalStyles.noSlotsContainer}>
                        <ClockIcon width={hp(4)} height={hp(4)} fill="#ccc" />
                        <Text style={bookingModalStyles.noSlotsText}>
                          No available {duration}-minute slots for this date
                        </Text>
                        <Text style={bookingModalStyles.noSlotsSubtext}>
                          Try a shorter duration or select another date
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Duration */}
                <View style={bookingModalStyles.section}>
                  <Text style={bookingModalStyles.sectionTitle}>Duration</Text>
                  <View style={bookingModalStyles.durationContainer}>
                    {durations.map((dur) => (
                      <TouchableOpacity
                        key={dur.minutes}
                        style={[
                          bookingModalStyles.durationButton,
                          duration === dur.minutes && bookingModalStyles.selectedDurationButton
                        ]}
                        onPress={() => handleDurationChange(dur.minutes)}
                      >
                        <Text style={[
                          bookingModalStyles.durationButtonText,
                          duration === dur.minutes && bookingModalStyles.selectedDurationButtonText
                        ]}>
                          {dur.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {filteredSlots.length === 0 && availableSlots.length > 0 && (
                    <View style={bookingModalStyles.warningContainer}>
                      <Text style={bookingModalStyles.warningText}>
                        ⚠️ No slots available for {duration} minutes. Try 30 or 60 minutes.
                      </Text>
                    </View>
                  )}
                </View>

                {/* Appointment Type */}
                <View style={bookingModalStyles.section}>
                  <Text style={bookingModalStyles.sectionTitle}>Appointment Type</Text>
                  <View style={bookingModalStyles.typeContainer}>
                    {appointmentTypes.map((type) => (
                      <TouchableOpacity
                        key={type.id}
                        style={[
                          bookingModalStyles.typeButton,
                          appointmentType === type.id && bookingModalStyles.selectedTypeButton
                        ]}
                        onPress={() => setAppointmentType(type.id)}
                      >
                        <Text style={[
                          bookingModalStyles.typeButtonText,
                          appointmentType === type.id && bookingModalStyles.selectedTypeButtonText
                        ]}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Consultation Mode */}
                <View style={bookingModalStyles.section}>
                  <Text style={bookingModalStyles.sectionTitle}>Consultation Mode</Text>
                  <View style={bookingModalStyles.modeContainer}>
                    {consultationModes.map((modeItem) => (
                      <TouchableOpacity
                        key={modeItem.id}
                        style={[
                          bookingModalStyles.modeButton,
                          mode === modeItem.id && bookingModalStyles.selectedModeButton
                        ]}
                        onPress={() => setMode(modeItem.id)}
                      >
                        <Text style={[
                          bookingModalStyles.modeButtonText,
                          mode === modeItem.id && bookingModalStyles.selectedModeButtonText
                        ]}>
                          {modeItem.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Price Estimate */}
                {professional?.healthcareProfile?.hourlyRate && (
                  <View style={bookingModalStyles.priceContainer}>
                    <Text style={bookingModalStyles.priceLabel}>Estimated Cost:</Text>
                    <View style={bookingModalStyles.priceValueContainer}>
                      <DollarIcon width={hp(2)} height={hp(2)} fill="#28a745" />
                      <Text style={bookingModalStyles.priceValue}>
                        ${(professional.healthcareProfile.hourlyRate * (duration / 60)).toFixed(2)}
                      </Text>
                    </View>
                    <Text style={bookingModalStyles.priceNote}>
                      *Final amount may vary based on additional services
                    </Text>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    bookingModalStyles.submitButton,
                    (!selectedSlot || loading) && bookingModalStyles.submitButtonDisabled
                  ]}
                  onPress={handleSubmit}
                  disabled={!selectedSlot || loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <CalendarIcon width={hp(2)} height={hp(2)} fill="#fff" />
                      <Text style={bookingModalStyles.submitButtonText}>
                        Confirm Booking
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Note */}
                <View style={bookingModalStyles.noteContainer}>
                  <Text style={bookingModalStyles.noteText}>
                    ℹ️ Your booking request will be sent to the professional for confirmation. 
                    You&apos;ll receive a notification once it&apos;s confirmed.
                  </Text>
                </View>
              </ScrollView>

              {/* Date/Time Pickers */}
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  maximumDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)}
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      handleDateChange(date);
                    }
                  }}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="time"
                  display="spinner"
                  onChange={(event, date) => {
                    setShowTimePicker(false);
                    if (date) {
                      handleDateChange(date);
                    }
                  }}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default function MedicalProfessionalProfile() {
    const { professionalId } = useLocalSearchParams();
    const { bookAppointment } = useHealthcare();
    const [bookingLoading, setBookingLoading] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);

    const router = useRouter();
    const {
        healthcare,
        getProfessionalProfile,
        rateProfessional,
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
            // Call the actual function to get ratings
            const response = await getProfessionalRatings(professionalId as string, 1, 10);
            
            // Map the response to match your UI format
            if (response && response.ratings) {
                const formattedRatings = response.ratings.map(rating => ({
                    id: rating.id || rating.id,
                    userName: (rating as any).userId?.name || 'Anonymous User',
                    rating: rating.rating,
                    comment: rating.comment || '',
                    createdAt: rating.createdAt,
                    updatedAt: rating.updatedAt
                }));
                setRecentRatings(formattedRatings);
            }
        } catch (err) {
            console.error('Failed to load ratings:', err);
            showAlert({ message: 'Failed to load reviews', type: 'error' });
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

    const handleSendMessage = () => {
        router.push(`/chat/${professionalId}`);
    };


    const handleBookNow = () => {
        if (!professional) return;
        setShowBookingModal(true);
    };

    // New function to handle booking submission
  const handleBookingSubmit = async (
    date: Date, 
    duration: number, 
    type: string, 
    mode: string
  ) => {
    try {
      setBookingLoading(true);
      
      // Find next available slot if the selected time is in the past
      let appointmentDate = date;
      if (appointmentDate <= new Date()) {
        appointmentDate = findNextAvailableSlot(
          professional?.healthcareProfile?.availability,
          duration,
          date
        );
        
        showAlert({
          message: "Selected time was in the past. Adjusted to next available slot.",
          type: "info"
        });
      }
      
      await bookAppointment(
        professionalId as string,
        appointmentDate.toISOString(),
        duration,
        type,
        mode as "physical" | "virtual"
      );
      
      showAlert({
        message: "Booking request sent successfully! Awaiting confirmation.",
        type: "success"
      });
      
      setShowBookingModal(false);
    } catch (err: any) {
      // If there's a conflict, find next available slot
      if (err.message?.includes('conflict') || err.message?.includes('unavailable')) {
        const nextSlot = findNextAvailableSlot(
          professional?.healthcareProfile?.availability,
          duration,
          date
        );
        
        showAlert({
          message: `Time slot unavailable. Next available: ${nextSlot.toLocaleString()}`,
          type: "warning"
        });
        
        // Auto-select the next available slot
        // You could also update the modal with this time
      } else {
        showAlert({
          message: err.message || "Failed to book appointment",
          type: "error"
        });
      }
    } finally {
      setBookingLoading(false);
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

    const renderInteractiveStars = (rating: number = 0, interactive: boolean = true, isUserRating: boolean = false) => {
        const stars = [];
        // FIX: Use the passed rating for non-user ratings, userRating.rating only for user's own rating
        const currentRating = isUserRating ? userRating.rating : rating;
        
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

    const renderBio = () => {
    const bio = professional?.healthcareProfile?.bio;
    if (!bio) return null;

    return (
        <View style={styles.section}>
        <Text style={styles.sectionTitle}>About {professional?.name}</Text>
        <Text style={styles.bioText}>{bio}</Text>
        </View>
    );
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
        const certifications = professional?.healthcareProfile?.certifications || [];

        if (education.length === 0 && certifications.length === 0) return null;

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Education & Credentials</Text>

                {/* Education Items */}
                {education.length > 0 && education.map((edu, index) => (
                    <View key={`edu-${index}`} style={styles.educationItem}>
                        <BookOpenIcon width={hp(2)} height={hp(2)} fill="#666" />
                        <View style={styles.educationDetails}>
                            <Text style={styles.educationDegree}>{edu.degree}</Text>
                            <Text style={styles.educationInstitution}>{edu.institution}</Text>
                            <Text style={styles.educationYear}>Graduated: {edu.year}</Text>
                        </View>
                    </View>
                ))}

                {/* Certifications (License Info) */}
                {certifications.length > 0 && (
                    <>
                        <Text style={styles.credentialsSubtitle}>Professional Licenses</Text>
                        {certifications.map((cert, index) => (
                            <View key={`cert-${index}`} style={styles.certificationItem}>
                                <AwardIcon width={hp(2)} height={hp(2)} fill="#28a745" />
                                <View style={styles.certificationDetails}>
                                    <Text style={styles.certificationType}>{cert.licenseType}</Text>
                                    <Text style={styles.certificationNumber}>
                                        License #: {cert.licenseNumber || 'Not provided'}
                                    </Text>
                                    <Text style={styles.certificationAuthority}>
                                        Issued by: {cert.issuingAuthority || 'Unknown authority'}
                                    </Text>
                                    {cert.issueDate && (
                                        <Text style={styles.certificationDate}>
                                            Issued: {new Date(cert.issueDate).getFullYear()}
                                        </Text>
                                    )}
                                    <Text style={[
                                        styles.certificationStatus,
                                        { 
                                            color: cert.verificationStatus === 'verified' ? '#28a745' : 
                                                cert.verificationStatus === 'pending' ? '#ffc107' : '#dc3545'
                                        }
                                    ]}>
                                        Status: {cert.verificationStatus.charAt(0).toUpperCase() + cert.verificationStatus.slice(1)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </>
                )}

                {education.length === 0 && certifications.length === 0 && (
                    <Text style={styles.noDataText}>No education or license information available.</Text>
                )}
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
    
    const tabs = ['overview', 'services', 'education', 'availability', 'reviews'] as const;
    const renderTabs = () => (
    <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {tabs.map((tab) => (
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

                        {/* Bio */}
                        {renderBio()}

                        {/* Contact Info */}
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
                keyboardShouldPersistTaps="handled"
            >
                {/* Profile Header */}
                {/* Enhanced Profile Header */}
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
                        <VerifiedIcon width={hp(1.8)} height={hp(1.8)} fill="#fff" />
                    </View>
                    )}
                </View>

                <Text style={styles.name}>{professional.name}</Text>

                <Text style={styles.roleAndSpecialization}>
                    {professional?.role
                        ? professional.role === "doctor"
                        ? "Medical Doctor"
                        : professional.role === "nurse"
                        ? "Registered Nurse"
                        : professional.role === "hospital"
                        ? "Hospital"
                        : (professional.role as string).charAt(0).toUpperCase() + (professional.role as string).slice(1)
                        : ""
                    }
                    {professional?.profile?.specialization &&
                        ` • ${professional.profile.specialization.charAt(0).toUpperCase() +
                        professional.profile.specialization.slice(1)}`
                    }
                </Text>

                <View style={styles.ratingContainer}>
                    <StarIcon width={hp(2.2)} height={hp(2.2)} fill="#FFC107" />
                    <Text style={styles.rating}>
                    {professional.healthcareProfile?.stats?.averageRating?.toFixed(1) || "0.0"}
                    </Text>
                    <Text style={styles.ratingCount}>
                    ({professional.healthcareProfile?.stats?.totalRatings || 0} reviews)
                    </Text>
                </View>

                {/* Prominent Hourly Rate Card */}
                {professional.healthcareProfile?.hourlyRate !== undefined && 
                professional.healthcareProfile?.hourlyRate !== null && 
                !isNaN(professional.healthcareProfile?.hourlyRate) && (
                    <View style={styles.hourlyRateBadge}>
                        <DollarIcon width={hp(2.8)} height={hp(2.8)} fill="#28a745" />
                        <Text style={styles.hourlyRateAmount}>
                            ${professional.healthcareProfile.hourlyRate}
                        </Text>
                        <Text style={styles.hourlyRateLabel}>/hour</Text>
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
                        onPress={handleBookNow}
                        disabled={bookingLoading}
                        activeOpacity={0.8}
                    >
                        {bookingLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <CalendarIcon width={hp(2.5)} height={hp(2.5)} fill="#fff" />
                        )}
                        <Text style={styles.actionText}>
                            {bookingLoading ? "Booking..." : "Book Now"}
                        </Text>
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
            <CommentModal
                visible={showCommentModal}
                onClose={() => setShowCommentModal(false)}
                tempComment={tempComment}
                setTempComment={setTempComment}
                isUpdatingRating={isUpdatingRating}
                tempRating={tempRating}
                onSubmitRating={handleRatingUpdate}
            />

            {/*  */}
            <BookingModal
                visible={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                professional={professional}
                onSubmitBooking={handleBookingSubmit}
                loading={bookingLoading}
                availability={professional?.healthcareProfile?.availability}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    rateCard: {
    backgroundColor: '#fff',
    marginHorizontal: wp(4),
    marginBottom: hp(2),
    padding: hp(3),
    borderRadius: hp(2),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eee',
    },
    rateAmount: {
    fontSize: hp(4.5),
    fontWeight: 'bold',
    color: '#28a745',
    },
    rateLabel: {
    fontSize: hp(1.8),
    color: '#666',
    marginTop: hp(0.5),
    },
    bioText: {
    fontSize: hp(1.8),
    lineHeight: hp(2.6),
    color: '#444',
    paddingHorizontal: wp(1),
    },
    chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hp(1),
    marginTop: hp(1),
    },
    chip: {
    backgroundColor: 'rgba(128, 137, 255, 0.15)',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderRadius: hp(3),
    borderWidth: 1,
    borderColor: 'rgba(128, 137, 255, 0.3)',
    },
    chipText: {
    fontSize: hp(1.7),
    color: '#8089ff',
    fontWeight: '600',
    },
    languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderRadius: hp(3),
    borderWidth: 1,
    borderColor: '#e0e0ff',
    gap: wp(2),
    },
    languageChipText: {
    fontSize: hp(1.7),
    color: '#8089ff',
    fontWeight: '600',
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
    },
    credentialsSubtitle: {
        fontSize: hp(1.8),
        fontWeight: '600',
        color: '#444',
        marginTop: hp(2),
        marginBottom: hp(1),
    },
    certificationDate: {
        fontSize: hp(1.4),
        color: '#666',
        marginBottom: hp(0.3),
    },
    noDataText: {
        fontSize: hp(1.6),
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: hp(2),
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
    roleAndSpecialization: {
        fontSize: hp(2),
        color: '#8089ff',
        fontWeight: '600',
        marginBottom: hp(1.5),
        textAlign: 'center',
    },
    hourlyRateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: 'rgba(40, 167, 69, 0.12)',
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.5),
        borderRadius: hp(3),
        marginTop: hp(1.5),
        borderWidth: 1,
        borderColor: 'rgba(40, 167, 69, 0.3)',
        gap: wp(1),
    },
    hourlyRateAmount: {
        fontSize: hp(1.8),
        fontWeight: 'bold',
        color: '#28a745',
    },
    hourlyRateLabel: {
        fontSize: hp(1.4),
        color: '#28a745',
        fontWeight: '500',
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
        fontSize: hp(1.5),
        fontWeight: '600',
        marginLeft: wp(1.5),
        color: '#333',
    },
    ratingCount: {
        fontSize: hp(1.5),
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
        fontSize: hp(1.35),
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

// Modal-specific styles
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: wp(90),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    padding: hp(3),
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderBottomWidth: 1,
    borderBottomColor: '#eef0ff',
  },
  headerIcon: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1.5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: hp(2.3),
    fontWeight: '700',
    color: '#333',
    marginBottom: hp(0.5),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: hp(1.6),
    color: '#666',
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: hp(2),
    backgroundColor: '#fff',
  },
  starContainer: {
    padding: wp(1),
    marginHorizontal: wp(0.5),
  },
  inputContainer: {
    paddingHorizontal: hp(3),
    paddingTop: hp(1),
    paddingBottom: hp(2),
  },
  inputLabel: {
    fontSize: hp(1.7),
    fontWeight: '600',
    color: '#444',
    marginBottom: hp(1),
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    paddingHorizontal: hp(2),
    paddingVertical: hp(1.8),
    fontSize: hp(1.6),
    minHeight: hp(12),
    backgroundColor: '#fcfdff',
    color: '#333',
  },
  charHint: {
    fontSize: hp(1.3),
    color: '#999',
    textAlign: 'right',
    marginTop: hp(0.5),
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: hp(3),
    paddingVertical: hp(2),
    backgroundColor: '#fafbfd',
    borderTopWidth: 1,
    borderTopColor: '#eef0ff',
    gap: wp(2),
  },
  button: {
    flex: 1,
    paddingVertical: hp(1.6),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#8089ff',
    shadowColor: '#8089ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e1e5e9',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: hp(1.7),
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: hp(1.7),
    fontWeight: '500',
  },
  skipButton: {
    paddingVertical: hp(1.5),
    paddingHorizontal: hp(3),
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eef0ff',
  },
  skipButtonText: {
    color: '#8089ff',
    fontSize: hp(1.5),
    fontWeight: '500',
  },
});

const bookingModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: hp(90),
    minHeight: hp(70),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: hp(0.5),
  },
  title: {
    fontSize: hp(2),
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: hp(3),
  },
  content: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(4),
  },
  professionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: hp(1),
  },
  avatarContainer: {
    marginRight: wp(3),
  },
  avatar: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
  },
  avatarPlaceholder: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: '#8089ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: hp(1.8),
    fontWeight: 'bold',
    color: '#fff',
  },
  professionalDetails: {
    flex: 1,
  },
  professionalName: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: '#333',
  },
  professionalRole: {
    fontSize: hp(1.4),
    color: '#666',
  },
  section: {
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: hp(1.7),
    fontWeight: '600',
    color: '#333',
    marginBottom: hp(1),
  },
  timeSlotsContainer: {
    marginTop: hp(1),
  },
  slotsInfo: {
    fontSize: hp(1.4),
    color: '#666',
    marginBottom: hp(1),
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  timeSlot: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    minWidth: wp(20),
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#8089ff',
    borderColor: '#8089ff',
  },
  timeSlotText: {
    fontSize: hp(1.6),
    color: '#666',
  },
  selectedTimeSlotText: {
    color: '#fff',
    fontWeight: '600',
  },
  selectedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    padding: hp(1.5),
    borderRadius: 8,
    marginTop: hp(1.5),
  },
  selectedTimeText: {
    fontSize: hp(1.6),
    color: '#8089ff',
    fontWeight: '600',
    marginLeft: wp(2),
  },
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: hp(3),
  },
  noSlotsText: {
    fontSize: hp(1.7),
    color: '#666',
    marginTop: hp(1),
    fontWeight: '500',
  },
  noSlotsSubtext: {
    fontSize: hp(1.5),
    color: '#999',
    marginTop: hp(0.5),
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  durationButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  selectedDurationButton: {
    backgroundColor: '#8089ff',
    borderColor: '#8089ff',
  },
  durationButtonText: {
    fontSize: hp(1.6),
    color: '#666',
  },
  selectedDurationButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    padding: hp(1.5),
    borderRadius: 8,
    marginTop: hp(1.5),
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  warningText: {
    fontSize: hp(1.4),
    color: '#856404',
    lineHeight: hp(1.8),
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  typeButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  selectedTypeButton: {
    backgroundColor: '#8089ff',
    borderColor: '#8089ff',
  },
  typeButtonText: {
    fontSize: hp(1.6),
    color: '#666',
  },
  selectedTypeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  modeButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  selectedModeButton: {
    backgroundColor: '#8089ff',
    borderColor: '#8089ff',
  },
  modeButtonText: {
    fontSize: hp(1.6),
    color: '#666',
  },
  selectedModeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  priceContainer: {
    backgroundColor: '#f8f9ff',
    padding: hp(2),
    borderRadius: 12,
    marginVertical: hp(2),
    borderWidth: 1,
    borderColor: '#eef0ff',
  },
  priceLabel: {
    fontSize: hp(1.6),
    color: '#666',
    marginBottom: hp(0.5),
  },
  priceValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  priceValue: {
    fontSize: hp(2.5),
    fontWeight: 'bold',
    color: '#28a745',
    marginLeft: wp(1),
  },
  priceNote: {
    fontSize: hp(1.3),
    color: '#999',
    fontStyle: 'italic',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8089ff',
    paddingVertical: hp(2),
    borderRadius: 12,
    marginTop: hp(2),
    gap: wp(2),
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  noteContainer: {
    marginTop: hp(2),
    padding: hp(1.5),
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  noteText: {
    fontSize: hp(1.4),
    color: '#856404',
    lineHeight: hp(2),
  },
});