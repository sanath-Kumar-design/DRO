import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PatientListScreen({ navigation }) {
  const [records, setRecords] = React.useState([]);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    const loadRecords = async () => {
      const saved = JSON.parse(
        (await AsyncStorage.getItem("dentalRecords")) || "[]"
      );

      setRecords(saved);
    };

    loadRecords();
  }, []);

  // Group multiple records belonging to the same patient
  const patients = React.useMemo(() => {
    const grouped = {};

    records.forEach((record) => {
      const patient = record.patient || {};

      // Patient ID is the primary identifier.
      // If unavailable, use phone number.
      // If both are unavailable, use the record ID.
      const patientKey =
        patient.patientId ||
        patient.phone ||
        `record-${record.id}`;

      if (!grouped[patientKey]) {
        grouped[patientKey] = {
          patient: patient,
          records: [],
        };
      }

      grouped[patientKey].records.push(record);
    });

    return Object.values(grouped);
  }, [records]);

  const filteredPatients = patients.filter((item) => {
    const patient = item.patient || {};

    const name = (patient.name || "").toLowerCase();
    const patientId = (patient.patientId || "").toLowerCase();
    const phone = (patient.phone || "").toLowerCase();

    const searchText = search.toLowerCase();

    return (
      name.includes(searchText) ||
      patientId.includes(searchText) ||
      phone.includes(searchText)
    );
  });

  const deleteRecord = async (id) => {
    const updatedRecords = records.filter(
      (record) => record.id !== id
    );

    await AsyncStorage.setItem(
      "dentalRecords",
      JSON.stringify(updatedRecords)
    );

    setRecords(updatedRecords);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F1E" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <View>
            <Text style={styles.title}>Patients</Text>
            <Text style={styles.subtitle}>
              {patients.length} patients · {records.length} records
            </Text>
          </View>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search patients..."
          placeholderTextColor="#5C6C8C"
          style={styles.search}
        />

        <FlatList
          data={filteredPatients}
          keyExtractor={(item) =>
            item.patient?.patientId ||
            item.patient?.phone ||
            item.records[0]?.id
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No patients found.
            </Text>
          }
          renderItem={({ item }) => {
            const patient = item.patient;
            const latestRecord =
              item.records[item.records.length - 1];

            return (
              <Pressable
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => {
                  navigation.navigate("PatientDetail", {
                    patient: latestRecord,
                    records: item.records,
                  });
                }}
              >
                <View style={styles.cardGlow} />

                <Text style={styles.name}>
                  {patient?.name || "Unknown Patient"}
                </Text>

                <Text style={styles.details}>
                  {patient?.ageGender ||
                    "Age / Gender not available"}
                </Text>

                <Text style={styles.patientId}>
                  Patient ID:{" "}
                  {patient?.patientId || "Not available"}
                </Text>

                <Text style={styles.address}>
                  {patient?.address ||
                    "Address not available"}
                </Text>

                <View style={styles.recordCountBox}>
                  <Text style={styles.recordCount}>
                    {item.records.length}{" "}
                    {item.records.length === 1
                      ? "record"
                      : "records"}
                  </Text>
                </View>

                <View style={styles.complaintBox}>
                  <Text style={styles.complaintLabel}>
                    Latest Chief Complaint
                  </Text>

                  <Text style={styles.complaint}>
                    {latestRecord?.chiefComplaint ||
                      "No chief complaint"}
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    const recordIds = item.records.map(
                      (record) => record.id
                    );

                    const updatedRecords = records.filter(
                      (record) => !recordIds.includes(record.id)
                    );

                    AsyncStorage.setItem(
                      "dentalRecords",
                      JSON.stringify(updatedRecords)
                    );

                    setRecords(updatedRecords);
                  }}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteText}>
                    Delete Patient
                  </Text>
                </Pressable>
              </Pressable>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const CYAN = "#38D9FF";
const CYAN_DIM = "#22D3EE";
const BG = "#0A0F1E";
const CARD_BG = "#111A2E";
const BORDER = "#1E2A44";
const TEXT_PRIMARY = "#EAF2FF";
const TEXT_SECONDARY = "#7C8AA8";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.OS === "android" ? 14 : 0,
  },

  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  back: {
    fontSize: 26,
    color: CYAN,
    lineHeight: 28,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    letterSpacing: 0.3,
  },

  subtitle: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginTop: 3,
  },

  deleteButton: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "rgba(220, 38, 38, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.35)",
  },

  deleteText: {
    color: "#FF6B6B",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  search: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
    color: TEXT_PRIMARY,
  },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },

  cardPressed: {
    borderColor: "rgba(56, 217, 255, 0.45)",
  },

  cardGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(56, 217, 255, 0.08)",
  },

  name: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },

  details: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    marginTop: 5,
  },

  patientId: {
    fontSize: 13,
    color: CYAN,
    marginTop: 7,
    fontWeight: "600",
  },

  address: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginTop: 5,
  },

  recordCountBox: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(56, 217, 255, 0.12)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(56, 217, 255, 0.25)",
  },

  recordCount: {
    color: CYAN,
    fontSize: 12,
    fontWeight: "600",
  },

  complaintBox: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },

  complaintLabel: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  complaint: {
    fontSize: 13,
    color: "#C3CDE3",
    lineHeight: 19,
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: TEXT_SECONDARY,
  },
});