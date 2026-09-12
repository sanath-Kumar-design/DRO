import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

function isSameDay(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function isThisWeek(date, now) {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return date >= start;
}

export default function HomeScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [records, setRecords] = React.useState([]);
    const [searchText, setSearchText] = React.useState("");

    useFocusEffect(
        React.useCallback(() => {
            const loadRecords = async () => {
                try {
                    const saved = JSON.parse(
                        (await AsyncStorage.getItem("dentalRecords")) || "[]"
                    );
                    setRecords(saved);
                } catch (error) {
                    console.log("LOAD ERROR:", error);
                }
            };

            loadRecords();
        }, [])
    );

    const recentRecords = [...records].reverse().slice(0, 3);

    // Filter recent records by patient name (pure UI, does not touch stored data)
    const filteredRecords = searchText.trim()
        ? recentRecords.filter((record) =>
            (record.patient?.name || "")
                .toLowerCase()
                .includes(searchText.trim().toLowerCase())
        )
        : recentRecords;

    // Quick stats derived from existing records array
    const now = new Date();
    const todayCount = records.filter((r) => {
        if (!r.createdAt) return false;
        return isSameDay(new Date(r.createdAt), now);
    }).length;
    const weekCount = records.filter((r) => {
        if (!r.createdAt) return false;
        return isThisWeek(new Date(r.createdAt), now);
    }).length;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.appName}>DentalScan Pro</Text>
                        <Text style={styles.subtitle}>{getGreeting()}, Doctor</Text>
                    </View>

                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>D</Text>
                    </View>
                </View>

                <View style={styles.content}>
                    {/* Quick Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{records.length}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{weekCount}</Text>
                            <Text style={styles.statLabel}>This Week</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{todayCount}</Text>
                            <Text style={styles.statLabel}>Today</Text>
                        </View>
                    </View>

                    {/* Main Action */}
                    <View style={styles.welcomeCard}>
                        <View style={styles.glowDot} />
                        <Text style={styles.welcomeTitle}>Dental Record OCR</Text>

                        <Text style={styles.welcomeText}>
                            Scan or upload a dental record to extract and organize
                            patient information.
                        </Text>

                        <Pressable
                            style={styles.scanButton}
                            onPress={() => navigation.navigate("Scan")}
                        >
                            <Text style={styles.scanButtonIcon}>⌕</Text>
                            <Text style={styles.scanButtonText}>Scan Record</Text>
                        </Pressable>

                        <Pressable
                            style={styles.uploadButton}
                            onPress={() => navigation.navigate("Scan")}
                        >
                            <Text style={styles.uploadButtonIcon}>↑</Text>
                            <Text style={styles.uploadButtonText}>Upload Record</Text>
                        </Pressable>
                    </View>

                    {/* Patients */}
                    <Pressable
                        style={styles.patientsCard}
                        onPress={() => navigation.navigate("PatientList")}
                    >
                        <View>
                            <Text style={styles.sectionLabel}>PATIENTS</Text>

                            <Text style={styles.patientCount}>{records.length}</Text>

                            <Text style={styles.patientDescription}>
                                {records.length === 1
                                    ? "record available"
                                    : "records available"}
                            </Text>
                        </View>

                        <Text style={styles.arrow}>→</Text>
                    </Pressable>

                    {/* Quick Actions */}
                    <View style={styles.quickActionsRow}>
                        <Pressable
                            style={styles.quickAction}
                            onPress={() => console.log("Export pressed")}
                        >
                            <Text style={styles.quickActionIcon}>⇩</Text>
                            <Text style={styles.quickActionLabel}>Export</Text>
                        </Pressable>
                        <Pressable
                            style={styles.quickAction}
                            onPress={() => console.log("Settings pressed")}
                        >
                            <Text style={styles.quickActionIcon}>⚙</Text>
                            <Text style={styles.quickActionLabel}>Settings</Text>
                        </Pressable>
                        <Pressable
                            style={styles.quickAction}
                            onPress={() => console.log("Help pressed")}
                        >
                            <Text style={styles.quickActionIcon}>?</Text>
                            <Text style={styles.quickActionLabel}>Help</Text>
                        </Pressable>
                    </View>

                    {/* Recent Records */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Records</Text>
                    </View>

                    <View style={styles.searchBar}>
                        <Text style={styles.searchIcon}>⌕</Text>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by patient name..."
                            placeholderTextColor="#5B6478"
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                    </View>

                    {filteredRecords.length > 0 ? (
                        filteredRecords.map((record, index) => (
                            <View key={record.id || index} style={styles.recordCard}>
                                <View style={styles.recordIcon}>
                                    <Text style={styles.recordIconText}>▤</Text>
                                </View>

                                <View style={styles.recordInfo}>
                                    <Text style={styles.recordName}>
                                        {record.patient?.name || "Unknown Patient"}
                                    </Text>

                                    <Text
                                        style={styles.recordComplaint}
                                        numberOfLines={2}
                                    >
                                        {record.chiefComplaint ||
                                            "No chief complaint available"}
                                    </Text>

                                    <Text style={styles.recordDate}>
                                        {record.patient?.date ||
                                            (record.createdAt
                                                ? new Date(
                                                    record.createdAt
                                                ).toLocaleDateString()
                                                : "Date unavailable")}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyTitle}>
                                {searchText.trim()
                                    ? "No matching records"
                                    : "No records yet"}
                            </Text>

                            <Text style={styles.emptyText}>
                                {searchText.trim()
                                    ? "Try a different name."
                                    : "Scan or upload a dental record to get started."}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const NEON = "#38BDF8";
const NEON_SOFT = "#22D3EE";
const BG = "#0B0F1A";
const SURFACE = "#111827";
const BORDER = "#1F2A3D";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG,
    },

    scrollContent: {
        paddingBottom: 30,
    },

    header: {
        backgroundColor: SURFACE,
        paddingHorizontal: 18,
        paddingTop: 20,
        paddingBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    appName: {
        fontSize: 13,
        fontWeight: "700",
        color: NEON,
        textTransform: "uppercase",
        letterSpacing: 2,
    },

    subtitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#F1F5F9",
        marginTop: 4,
    },

    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: NEON,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: NEON,
        shadowOpacity: 0.6,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
        elevation: 6,
    },

    avatarText: {
        color: "#0B0F1A",
        fontSize: 16,
        fontWeight: "800",
    },

    content: {
        padding: 16,
    },

    statsRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 16,
    },

    statCard: {
        flex: 1,
        backgroundColor: SURFACE,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: BORDER,
        paddingVertical: 14,
        alignItems: "center",
    },

    statValue: {
        fontSize: 20,
        fontWeight: "800",
        color: NEON,
    },

    statLabel: {
        fontSize: 11,
        color: "#8891A5",
        marginTop: 3,
    },

    welcomeCard: {
        backgroundColor: SURFACE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 18,
        overflow: "hidden",
    },

    glowDot: {
        position: "absolute",
        top: -30,
        right: -30,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: NEON,
        opacity: 0.15,
    },

    welcomeTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#F1F5F9",
    },

    welcomeText: {
        fontSize: 13,
        lineHeight: 20,
        color: "#8891A5",
        marginTop: 8,
        marginBottom: 18,
    },

    scanButton: {
        height: 50,
        borderRadius: 12,
        backgroundColor: NEON,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        shadowColor: NEON,
        shadowOpacity: 0.5,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
        elevation: 5,
    },

    scanButtonIcon: {
        color: "#0B0F1A",
        fontSize: 22,
        fontWeight: "700",
    },

    scanButtonText: {
        color: "#0B0F1A",
        fontSize: 14,
        fontWeight: "800",
    },

    uploadButton: {
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: NEON_SOFT,
        backgroundColor: "transparent",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        marginTop: 10,
    },

    uploadButtonIcon: {
        color: NEON_SOFT,
        fontSize: 20,
        fontWeight: "700",
    },

    uploadButtonText: {
        color: NEON_SOFT,
        fontSize: 14,
        fontWeight: "700",
    },

    patientsCard: {
        backgroundColor: SURFACE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 18,
        marginTop: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    sectionLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#8891A5",
        letterSpacing: 1,
    },

    patientCount: {
        fontSize: 28,
        fontWeight: "800",
        color: NEON,
        marginTop: 4,
    },

    patientDescription: {
        fontSize: 12,
        color: "#8891A5",
        marginTop: 1,
    },

    arrow: {
        fontSize: 24,
        color: NEON,
    },

    quickActionsRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 16,
    },

    quickAction: {
        flex: 1,
        backgroundColor: SURFACE,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: BORDER,
        paddingVertical: 14,
        alignItems: "center",
    },

    quickActionIcon: {
        fontSize: 18,
        color: NEON_SOFT,
        marginBottom: 4,
    },

    quickActionLabel: {
        fontSize: 11,
        color: "#C7CEDB",
        fontWeight: "600",
    },

    sectionHeader: {
        marginTop: 24,
        marginBottom: 12,
    },

    sectionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#F1F5F9",
    },

    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: SURFACE,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BORDER,
        paddingHorizontal: 14,
        height: 44,
        marginBottom: 12,
    },

    searchIcon: {
        color: "#5B6478",
        fontSize: 16,
        marginRight: 8,
    },

    searchInput: {
        flex: 1,
        color: "#F1F5F9",
        fontSize: 13,
    },

    recordCard: {
        backgroundColor: SURFACE,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 14,
        flexDirection: "row",
        marginBottom: 10,
    },

    recordIcon: {
        width: 40,
        height: 40,
        borderRadius: 11,
        backgroundColor: "#132033",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
        borderWidth: 1,
        borderColor: BORDER,
    },

    recordIconText: {
        color: NEON,
        fontSize: 18,
    },

    recordInfo: {
        flex: 1,
    },

    recordName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#F1F5F9",
    },

    recordComplaint: {
        fontSize: 12,
        lineHeight: 17,
        color: "#8891A5",
        marginTop: 4,
    },

    recordDate: {
        fontSize: 10,
        color: "#5B6478",
        marginTop: 6,
    },

    emptyCard: {
        backgroundColor: SURFACE,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 20,
        alignItems: "center",
    },

    emptyTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#C7CEDB",
    },

    emptyText: {
        fontSize: 12,
        color: "#8891A5",
        textAlign: "center",
        marginTop: 5,
    },
});