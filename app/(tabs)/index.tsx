import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useBookings } from '../context/BookingContext';

export default function HomeScreen() {
  const { addBooking } = useBookings();

  const [fullName, setFullName] = useState('');
  const [contact, setContact] = useState('');
  const [reason, setReason] = useState('');

  const [preferredDate, setPreferredDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleChangeDate = (event: DateTimePickerEvent, selected?: Date) => {
    // Android: user cancels
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (selected) {
      setPreferredDate(selected);
    }
    // For iOS spinner, we keep it open until the user taps "Done"
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  const handleSubmit = () => {
    if (!fullName || !contact || !reason || !preferredDate) {
      Alert.alert('Missing information', 'Please fill in all fields.');
      return;
    }

    const formattedDate = preferredDate.toDateString();

    addBooking({
      fullName,
      contact,
      reason,
      preferredTime: formattedDate,
    });

    Alert.alert(
      'Request sent',
      'Your meeting request has been sent to Apostle Randolph. You will be contacted with a confirmed time.'
    );

    setFullName('');
    setContact('');
    setReason('');
    setPreferredDate(null);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={null as any}
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">KAC Booking</ThemedText>
        </ThemedView>

        <ThemedText type="subtitle" style={styles.subtitle}>
          Book a meeting with Apostle Randolph
        </ThemedText>

        <ThemedText style={styles.helperText}>
          Fill in the form below and a member of the team will confirm your appointment.
        </ThemedText>

        <ThemedText style={styles.label}>Full name</ThemedText>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your full name"
          placeholderTextColor="#6b7280"
        />

        <ThemedText style={styles.label}>Contact (email or phone)</ThemedText>
        <TextInput
          style={styles.input}
          value={contact}
          onChangeText={setContact}
          placeholder="email@example.com / 07..."
          placeholderTextColor="#6b7280"
          keyboardType="email-address"
        />

        <ThemedText style={styles.label}>Reason for meeting</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={reason}
          onChangeText={setReason}
          placeholder="e.g. counselling, prayer, testimony"
          placeholderTextColor="#6b7280"
          multiline
        />

        <ThemedText style={styles.label}>Preferred date</ThemedText>

        {/* Fake input that opens the date picker modal */}
        <Pressable
          style={[styles.input, styles.dateInput]}
          onPress={() => setShowDatePicker(true)}
        >
          <ThemedText
            style={{
              color: preferredDate ? '#f9fafb' : '#6b7280',
              fontSize: 14,
            }}
          >
            {preferredDate ? preferredDate.toDateString() : 'Select a date'}
          </ThemedText>
        </Pressable>

        <Pressable style={styles.button} onPress={handleSubmit}>
          <ThemedText style={styles.buttonText}>Submit Request</ThemedText>
        </Pressable>
      </ParallaxScrollView>

      {/* Full-screen modal overlay for the date picker */}
      {showDatePicker && (
        <ThemedView style={styles.dateOverlay}>
          <ThemedView style={styles.dateCard}>
            <ThemedText
              type="defaultSemiBold"
              style={{ marginBottom: 8, textAlign: 'center' }}
            >
              Select preferred date
            </ThemedText>

            <DateTimePicker
              value={preferredDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleChangeDate}
              themeVariant="dark"
            />

            <Pressable
              style={styles.dateDoneButton}
              onPress={() => setShowDatePicker(false)}
            >
              <ThemedText style={styles.dateDoneText}>Done</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 4,
  },
  helperText: {
    marginBottom: 20,
    color: '#9ca3af',
  },
  label: {
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    color: '#f9fafb',
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateInput: {
    justifyContent: 'center',
  },
  button: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    marginBottom: 16,
  },
  buttonText: {
    color: '#f9fafb',
    fontWeight: '600',
    fontSize: 16,
  },
  // Date picker modal styles
  dateOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCard: {
    width: '85%',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  dateDoneButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
  },
  dateDoneText: {
    color: '#f9fafb',
    fontWeight: '600',
  },
});
