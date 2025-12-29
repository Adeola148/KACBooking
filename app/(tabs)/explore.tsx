import * as Calendar from 'expo-calendar';
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
import { BookingRequest, useBookings } from '../context/BookingContext';


const ACCESS_CODE = 'KAC2025'; // change this to whatever you want

export default function PastorScreen() {
  const { bookings, approveBooking, denyBooking, proposeNewTime } = useBookings();

  const [accessCode, setAccessCode] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);

  const [calendarId, setCalendarId] = useState<string | null>(null);
  const [events, setEvents] = useState<Calendar.Event[]>([]);
  const [hasCalendarPermission, setHasCalendarPermission] = useState<boolean | null>(null);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

  // Ask for calendar access and load events
  const requestCalendarAccess = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        setHasCalendarPermission(false);
        Alert.alert(
          'Calendar access needed',
          'To sync meetings with your iPhone calendar, please allow calendar access in Settings.'
        );
        return;
      }

      setHasCalendarPermission(true);

      // Get the default calendar (usually the one that syncs with iCloud / Google)
      const defaultCalendar = await Calendar.getDefaultCalendarAsync();
      setCalendarId(defaultCalendar.id);

      await loadUpcomingEvents(defaultCalendar.id);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Something went wrong while accessing the calendar.');
    }
  };

  const loadUpcomingEvents = async (id: string) => {
    setIsLoadingCalendar(true);
    try {
      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + 7); // next 7 days

      const evts = await Calendar.getEventsAsync([id], start, end);
      setEvents(evts);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const handleLogin = async () => {
    if (accessCode === ACCESS_CODE) {
      setIsAuthed(true);
      setAccessCode('');
      await requestCalendarAccess();
    } else {
      Alert.alert('Incorrect code', 'Please try again.');
    }
  };

  const handleApprove = async (booking: BookingRequest) => {
    approveBooking(booking.id);

    if (!calendarId) {
      // Calendar not ready, just mark approved
      Alert.alert(
        'Approved',
        'The request is approved. Calendar sync is not available yet (no calendar ID).'
      );
      return;
    }

    try {
      // For now, we create an event starting "now" for 1 hour.
      // Later we can add a UI to pick the exact date & time.
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      await Calendar.createEventAsync(calendarId, {
        title: `Meeting with ${booking.fullName}`,
        startDate,
        endDate,
        notes: `${booking.reason}\nContact: ${booking.contact}`,
        location: 'KAC',
        timeZone: undefined, // let the system decide
      });

      await loadUpcomingEvents(calendarId);

      Alert.alert(
        'Event added',
        'The meeting has been added to your calendar. You can adjust the exact time in the Calendar app if needed.'
      );
    } catch (e) {
      console.error(e);
      Alert.alert(
        'Calendar error',
        'The request was approved, but we could not add it to the calendar.'
      );
    }
  };

  const handleDeny = (booking: BookingRequest) => {
    denyBooking(booking.id);
  };

  const handleProposeTime = (booking: BookingRequest) => {
    // For now, we just mark it as "proposed" with a generic note.
    // Later, we can add a proper UI for selecting a specific time.
    proposeNewTime(
      booking.id,
      'Please contact the office to agree a new time.'
    );
    Alert.alert(
      'Time proposed',
      'Marked as proposed. You can follow up with the member to agree on a specific time.'
    );
  };

  const renderBooking = ({ item }: { item: BookingRequest }) => {
    return (
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold" style={styles.name}>
          {item.fullName}
        </ThemedText>
        <ThemedText style={styles.field}>Contact: {item.contact}</ThemedText>
        <ThemedText style={styles.field}>Reason: {item.reason}</ThemedText>
        <ThemedText style={styles.field}>Preferred: {item.preferredTime}</ThemedText>
        {item.proposedTime && (
          <ThemedText style={styles.field}>Proposed: {item.proposedTime}</ThemedText>
        )}
        <ThemedText style={styles.status}>
          Status:{' '}
          <ThemedText type="defaultSemiBold" style={statusColor(item.status)}>
            {item.status.toUpperCase()}
          </ThemedText>
        </ThemedText>

        <ThemedView style={styles.buttonRow}>
          <Pressable
            style={[styles.smallButton, styles.approveButton]}
            onPress={() => void handleApprove(item)}
          >
            <ThemedText style={styles.buttonText}>Approve + Calendar</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.smallButton, styles.denyButton]}
            onPress={() => handleDeny(item)}
          >
            <ThemedText style={styles.buttonText}>Deny</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.smallButton, styles.proposeButton]}
            onPress={() => handleProposeTime(item)}
          >
            <ThemedText style={styles.buttonText}>Propose Time</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    );
  };

  const renderEvent = ({ item }: { item: Calendar.Event }) => {
    const start = item.startDate ? new Date(item.startDate) : null;
    const end = item.endDate ? new Date(item.endDate) : null;

    return (
      <ThemedView style={styles.eventCard}>
        <ThemedText type="defaultSemiBold">
          {item.title || '(No title)'}
        </ThemedText>
        {start && (
          <ThemedText style={styles.eventTime}>
            {start.toLocaleString()}
            {end ? `  →  ${end.toLocaleTimeString()}` : ''}
          </ThemedText>
        )}
        {item.location && (
          <ThemedText style={styles.eventLocation}>{item.location}</ThemedText>
        )}
      </ThemedView>
    );
  };

  return (
    <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={80}
  >
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={null as any}
    >
      {!isAuthed ? (
        <>
          <ThemedText type="title" style={styles.title}>
            Welcome, Pastor Randolph
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Enter the access code to view meeting requests and sync with your calendar.
          </ThemedText>

          <ThemedText style={styles.label}>Access code</ThemedText>
          <TextInput
            style={styles.input}
            value={accessCode}
            onChangeText={setAccessCode}
            placeholder="Enter code"
            placeholderTextColor="#6b7280"
            secureTextEntry
          />

          <Pressable style={styles.button} onPress={() => void handleLogin()}>
            <ThemedText style={styles.buttonText}>Login</ThemedText>
          </Pressable>

          <ThemedText style={{ marginTop: 16, color: '#9ca3af', fontSize: 12 }}>
            (For testing, the code is currently: <ThemedText type="defaultSemiBold">{ACCESS_CODE}</ThemedText>)
          </ThemedText>
        </>
      ) : (
        <>
          {/* Calendar section */}
          <ThemedText type="title" style={styles.title}>
            Calendar
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Showing events from your default calendar for the next 7 days.
          </ThemedText>

          {hasCalendarPermission === false && (
            <ThemedText style={{ color: '#ef4444', marginBottom: 8 }}>
              Calendar permission not granted. Please enable it in Settings.
            </ThemedText>
          )}

          {hasCalendarPermission && !isLoadingCalendar && events.length === 0 && (
            <ThemedText style={{ color: '#9ca3af', marginBottom: 8 }}>
              No events in the next 7 days.
            </ThemedText>
          )}

            {hasCalendarPermission && events.length > 0 && (
              <ThemedView style={{ gap: 8, marginBottom: 16 }}>
                {events.map((event) => (
                  <ThemedView key={event.id}>{renderEvent({ item: event })}</ThemedView>
                ))}
              </ThemedView>
            )}


          {/* Requests section */}
          <ThemedText type="title" style={[styles.title, { marginTop: 16 }]}>
            Requests
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Review new meeting requests from members.
          </ThemedText>

            {bookings.length === 0 ? (
              <ThemedText style={{ marginTop: 16, color: '#9ca3af' }}>
                No booking requests yet.
              </ThemedText>
            ) : (
              <ThemedView style={{ marginTop: 8, gap: 12 }}>
                {[...bookings].reverse().map((booking) => (
                  <ThemedView key={booking.id}>{renderBooking({ item: booking })}</ThemedView>
                ))}
              </ThemedView>
            )}

        </>
      )}
    </ParallaxScrollView>
    </KeyboardAvoidingView>
  );
}

function statusColor(status: BookingRequest['status']) {
  switch (status) {
    case 'approved':
      return { color: '#22c55e' };
    case 'denied':
      return { color: '#ef4444' };
    case 'proposed':
      return { color: '#eab308' };
    default:
      return { color: '#38bdf8' };
  }
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 12,
    color: '#9ca3af',
  },
  label: {
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
    marginBottom: 12,
  },
  button: {
    marginTop: 4,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
  },
  buttonText: {
    color: '#f9fafb',
    fontWeight: '600',
  },
  card: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    padding: 12,
  },
  name: {
    marginBottom: 4,
  },
  field: {
    fontSize: 14,
    marginBottom: 2,
  },
  status: {
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 6,
  },
  smallButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#16a34a',
  },
  denyButton: {
    backgroundColor: '#b91c1c',
  },
  proposeButton: {
    backgroundColor: '#6366f1',
  },
  eventCard: {
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 10,
    padding: 10,
  },
  eventTime: {
    fontSize: 13,
    color: '#e5e7eb',
  },
  eventLocation: {
    fontSize: 13,
    color: '#9ca3af',
  },
});
