import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    ScrollView,
    Alert,
    Animated,
    Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const cleanOCRText = (text) => {
    return text
        .replace(/###/g, "")
        .replace(/[☐□]/g, "☐")
        .replace(/\n\s*:\s*/g, ": ")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};

const cleanDentalChart = (text) => {
    const upperTeeth = [
        "18", "17", "16", "15", "14", "13", "12", "11",
        "21", "22", "23", "24", "25", "26", "27", "28",
    ];

    const lowerTeeth = [
        "48", "47", "46", "45", "44", "43", "42", "41",
        "31", "32", "33", "34", "35", "36", "37", "38",
    ];

    const foundUpper = upperTeeth.filter((tooth) =>
        text.includes(tooth)
    );

    const foundLower = lowerTeeth.filter((tooth) =>
        text.includes(tooth)
    );

    return [
        foundUpper.length
            ? `Upper: ${foundUpper.join(" · ")}`
            : "",
        foundLower.length
            ? `Lower: ${foundLower.join(" · ")}`
            : "",
    ]
        .filter(Boolean)
        .join("\n");
};

const parseDentalRecord = (text) => {
    text = cleanOCRText(text);
    const upperText = text.toUpperCase();

    const getSection = (start, end) => {
        const startIndex = upperText.indexOf(start);

        if (startIndex === -1) return "";

        const contentStart = startIndex + start.length;

        const endIndex = end
            ? upperText.indexOf(end, contentStart)
            : -1;

        return text
            .substring(
                contentStart,
                endIndex === -1 ? text.length : endIndex
            )
            .trim();
    };

    const patientSection = getSection(
        "PATIENT DETAILS",
        "CHIEF COMPLAINT"
    );

    const extractField = (label, section) => {
        const regex = new RegExp(
            `${label}\\s*:?\\s*(.+)`,
            "i"
        );

        const match = section.match(regex);

        return match ? match[1].trim() : "";
    };

    const sections = {

        dentalChart: cleanDentalChart(
            getSection("DENTAL CHART", "CHIEF COMPLAINT")
        ),
        patientDetails: {
            name: extractField("Name", patientSection),
            patientId: extractField("Patient ID", patientSection),
            ageGender: extractField("Age / Gender", patientSection),
            date: extractField("Date", patientSection),
            phone: extractField("Phone", patientSection),
            address: extractField("Address", patientSection),
            referredBy: extractField("Referred By", patientSection),
        },

        doctorDetails: getSection(
            "Dr. ",
            "CITY DENTAL CLINIC"
        ),

        chiefComplaint: getSection(
            "CHIEF COMPLAINT",
            "HISTORY"
        ),

        medicalHistory: getSection(
            "HISTORY",
            "CLINICAL FINDINGS"
        ),

        dentalHistory: getSection(
            "CLINICAL FINDINGS",
            "DIAGNOSIS"
        ),
        clinicalFindings: getSection(
            "CLINICAL FINDINGS",
            "DIAGNOSIS"
        ),

        diagnosis: getSection(
            "DIAGNOSIS",
            "TREATMENT PLAN"
        ),

        treatmentPlan: getSection(
            "TREATMENT PLAN",
            "PRESCRIPTION"
        ),

        radiographs: getSection(
            "RADIOGRAPHS / IMAGES",
            "NEXT APPOINTMENT"
        ),

        allergiesHabits: "",

        paymentFinancialDetails: "",

        prescription: getSection(
            "PRESCRIPTION",
            "RADIOGRAPHS / IMAGES"
        ),

        nextAppointment: getSection(
            "NEXT APPOINTMENT",
            "ADDITIONAL NOTES"
        ),

        additionalNotes: getSection(
            "ADDITIONAL NOTES",
            null
        ),
    };

    return sections;
};

export default function ReviewEditScreen({ route, navigation }) {
    const { ocrText = "" } = route.params || {};

    const parsedData = parseDentalRecord(ocrText);

    const [formData, setFormData] = React.useState(parsedData);
    const [isSaving, setIsSaving] = React.useState(false);
    const saveGlow = React.useRef(new Animated.Value(0.75)).current;
    const saveOrbit = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (!isSaving) {
            saveGlow.setValue(0.75);
            saveOrbit.setValue(0);
            return;
        }

        Animated.parallel([
            Animated.timing(saveGlow, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.back(1.6)),
                useNativeDriver: true,
            }),
            Animated.loop(
                Animated.timing(saveOrbit, {
                    toValue: 1,
                    duration: 1400,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ),
        ]).start();
    }, [isSaving]);

    const orbitRotation = saveOrbit.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    const glowScale = saveGlow.interpolate({
        inputRange: [0.75, 1],
        outputRange: [0.82, 1.25],
    });

    return (
        <View style={styles.screen}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.back}>‹</Text>
                    </Pressable>

                    <View style={styles.headerTextWrap}>
                        <Text style={styles.kicker}>AI REVIEW</Text>
                        <Text style={styles.title}>Review Record</Text>
                        <Text style={styles.subtitle}>
                            Confirm and refine the extracted dental details.
                        </Text>
                    </View>
                </View>

                <View style={styles.noticeCard}>
                    <View style={styles.noticeGlow} />
                    <Text style={styles.noticeTitle}>Document parsed</Text>
                    <Text style={styles.noticeText}>Fields are ready for final verification before saving.</Text>
                </View>

                <View style={styles.card}>
                    {Object.entries(formData).map(([key, value]) => {
                        if (key === "patientDetails") {
                            return (
                                <View key={key} style={styles.sectionBlock}>
                                    <View style={styles.sectionHeaderRow}>
                                        <Text style={styles.sectionBadge}>PATIENT</Text>
                                        <Text style={styles.sectionLabel}>Patient Details</Text>
                                    </View>

                                    <View style={styles.gridTwo}>
                                        {Object.entries(value).map(([field, fieldValue]) => (
                                            <View key={field} style={styles.gridItem}>
                                                <Text style={styles.subFieldLabel}>
                                                    {field
                                                        .replace(/([A-Z])/g, " $1")
                                                        .replace(/^./, (str) => str.toUpperCase())}
                                                </Text>

                                                <TextInput
                                                    value={fieldValue}
                                                    onChangeText={(newValue) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            patientDetails: {
                                                                ...prev.patientDetails,
                                                                [field]: newValue,
                                                            },
                                                        }))
                                                    }
                                                    placeholderTextColor="#6B7280"
                                                    style={styles.fieldInput}
                                                />
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            );
                        }

                        return (
                            <View key={key} style={styles.sectionBlock}>
                                <View style={styles.sectionHeaderRow}>
                                    <Text style={styles.sectionBadge}>{key.toUpperCase().slice(0, 4)}</Text>
                                    <Text style={styles.sectionLabel}>
                                        {key
                                            .replace(/([A-Z])/g, " $1")
                                            .replace(/^./, (str) => str.toUpperCase())}
                                    </Text>
                                </View>

                                <TextInput
                                    value={value}
                                    onChangeText={(newValue) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            [key]: newValue,
                                        }))
                                    }
                                    multiline
                                    textAlignVertical="top"
                                    placeholderTextColor="#6B7280"
                                    style={styles.fieldInputLarge}
                                />
                            </View>
                        );
                    })}
                </View>

                <Pressable
                    style={styles.saveButton}
                    onPress={async () => {
                        try {
                            const existingRecords = JSON.parse(
                                (await AsyncStorage.getItem("dentalRecords")) || "[]"
                            );

                            const newRecord = {
                                id: Date.now().toString(),
                                patient: formData.patientDetails,
                                doctor: formData.doctorDetails,
                                chiefComplaint: formData.chiefComplaint,
                                medicalHistory: formData.medicalHistory,
                                dentalHistory: formData.dentalHistory,
                                allergiesHabits: formData.allergiesHabits,
                                dentalChart: formData.dentalChart,
                                treatmentPlan: formData.treatmentPlan,
                                clinicalFindings: formData.clinicalFindings,
                                diagnosis: formData.diagnosis,
                                radiographs: formData.radiographs,
                                paymentFinancialDetails:
                                    formData.paymentFinancialDetails,
                                prescription: formData.prescription,
                                nextAppointment: formData.nextAppointment,
                                additionalNotes: formData.additionalNotes,
                                createdAt: new Date().toISOString(),
                            };

                            const isDuplicate = existingRecords.some((record) => {
                                const samePatient =
                                    record.patient?.patientId &&
                                    formData.patientDetails?.patientId &&
                                    record.patient.patientId ===
                                        formData.patientDetails.patientId;

                                const sameComplaint =
                                    (record.chiefComplaint || "")
                                        .trim()
                                        .toLowerCase() ===
                                    (formData.chiefComplaint || "")
                                        .trim()
                                        .toLowerCase();

                                const sameDiagnosis =
                                    (record.diagnosis || "")
                                        .trim()
                                        .toLowerCase() ===
                                    (formData.diagnosis || "")
                                        .trim()
                                        .toLowerCase();

                                return (
                                    samePatient &&
                                    sameComplaint &&
                                    sameDiagnosis
                                );
                            });

                            if (isDuplicate) {
                                Alert.alert(
                                    "Possible Duplicate Record",
                                    "A similar record already exists for this patient.",
                                    [
                                        {
                                            text: "Cancel",
                                            style: "cancel",
                                        },
                                        {
                                            text: "Save Anyway",
                                            onPress: async () => {
                                                existingRecords.push(newRecord);

                                                await AsyncStorage.setItem(
                                                    "dentalRecords",
                                                    JSON.stringify(existingRecords)
                                                );

                                                setIsSaving(true);

                                                setTimeout(() => {
                                                    navigation.replace("Scan");
                                                }, 1000);
                                            },
                                        },
                                    ]
                                );

                                return;
                            }

                            existingRecords.push(newRecord);

                            await AsyncStorage.setItem(
                                "dentalRecords",
                                JSON.stringify(existingRecords)
                            );

                            console.log("Record saved successfully");

                            setIsSaving(true);

                            setTimeout(() => {
                                navigation.navigate("Home");
                            }, 1000);
                        } catch (error) {
                            console.log("SAVE ERROR:", error);
                        }
                    }}
                >
                    <Text style={styles.saveText}>Save Record</Text>
                </Pressable>
            </ScrollView>

            {isSaving && (
                <View style={styles.saveOverlay} pointerEvents="none">
                    <Animated.View
                        style={[
                            styles.saveHalo,
                            { transform: [{ scale: glowScale }] },
                        ]}
                    />

                    <Animated.View
                        style={[
                            styles.saveCore,
                            { transform: [{ rotate: orbitRotation }] },
                        ]}
                    >
                        <View style={styles.saveOrbitDot} />
                        <View style={[styles.saveOrbitDot, styles.saveOrbitDotTwo]} />
                        <View style={[styles.saveOrbitDot, styles.saveOrbitDotThree]} />
                    </Animated.View>

                    <View style={styles.saveBadge}>
                        <Text style={styles.saveBadgeText}>✓</Text>
                    </View>

                    <Text style={styles.saveTitle}>Record saved</Text>
                    <Text style={styles.saveSubtitle}>Updating archive...</Text>
                </View>
            )}
        </View>
    );
}

const BG = "#0B0F1A";
const SURFACE = "#111827";
const SURFACE_ALT = "#0F172A";
const BORDER = "#1F2A3D";
const NEON = "#38BDF8";
const NEON_SOFT = "#22D3EE";
const SUCCESS = "#4ADE80";
const TEXT = "#F1F5F9";
const MUTED = "#8891A5";

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: BG,
    },

    container: {
        flex: 1,
        backgroundColor: BG,
    },

    content: {
        padding: 18,
        paddingBottom: 36,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 18,
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },

    back: {
        fontSize: 34,
        lineHeight: 34,
        color: NEON,
        fontWeight: "700",
    },

    headerTextWrap: {
        flex: 1,
    },

    kicker: {
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1.5,
        color: NEON,
    },

    title: {
        fontSize: 24,
        fontWeight: "800",
        color: TEXT,
        marginTop: 6,
    },

    subtitle: {
        color: MUTED,
        marginTop: 6,
        fontSize: 13,
        lineHeight: 18,
    },

    noticeCard: {
        backgroundColor: SURFACE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 16,
        overflow: "hidden",
        marginBottom: 16,
    },

    noticeGlow: {
        position: "absolute",
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: NEON,
        opacity: 0.12,
        top: -30,
        right: -25,
    },

    noticeTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: NEON,
        letterSpacing: 1,
        textTransform: "uppercase",
    },

    noticeText: {
        color: MUTED,
        marginTop: 8,
        fontSize: 12,
        lineHeight: 18,
    },

    card: {
        backgroundColor: SURFACE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 16,
        overflow: "hidden",
    },

    sectionBlock: {
        marginBottom: 18,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: SURFACE_ALT,
        padding: 12,
    },

    sectionHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },

    sectionBadge: {
        fontSize: 9,
        fontWeight: "800",
        color: NEON,
        letterSpacing: 1.2,
        backgroundColor: "rgba(56, 189, 248, 0.12)",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 10,
    },

    sectionLabel: {
        fontSize: 15,
        fontWeight: "700",
        color: TEXT,
    },

    gridTwo: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginHorizontal: -6,
    },

    gridItem: {
        width: "50%",
        paddingHorizontal: 6,
        marginBottom: 10,
    },

    fieldInput: {
        minHeight: 44,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: TEXT,
        backgroundColor: "#121B2A",
    },

    fieldInputLarge: {
        minHeight: 120,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 12,
        padding: 12,
        fontSize: 13,
        color: TEXT,
        backgroundColor: "#121B2A",
    },

    subFieldLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: MUTED,
        marginBottom: 6,
        letterSpacing: 0.2,
    },

    saveButton: {
        backgroundColor: NEON,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        marginBottom: 32,
        shadowColor: NEON,
        shadowOpacity: 0.45,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 0 },
        elevation: 8,
    },

    saveText: {
        color: "#06131E",
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: 0.4,
    },

    saveOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(11, 15, 26, 0.78)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20,
    },

    saveHalo: {
        position: "absolute",
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: "rgba(74, 222, 128, 0.14)",
        shadowColor: SUCCESS,
        shadowOpacity: 0.7,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 0 },
    },

    saveCore: {
        width: 84,
        height: 84,
        borderRadius: 42,
        borderWidth: 1,
        borderColor: "rgba(74, 222, 128, 0.45)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
    },

    saveOrbitDot: {
        position: "absolute",
        width: 8,
        height: 8,
        borderRadius: 10,
        backgroundColor: SUCCESS,
        top: 8,
        left: 38,
        shadowColor: SUCCESS,
        shadowOpacity: 0.8,
        shadowRadius: 8,
    },

    saveOrbitDotTwo: {
        top: 38,
        left: 9,
    },

    saveOrbitDotThree: {
        top: 38,
        left: 68,
    },

    saveBadge: {
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: SUCCESS,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        shadowColor: SUCCESS,
        shadowOpacity: 0.75,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 0 },
    },

    saveBadgeText: {
        color: "#06130E",
        fontSize: 30,
        fontWeight: "900",
        lineHeight: 30,
    },

    saveTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: TEXT,
        marginBottom: 4,
    },

    saveSubtitle: {
        fontSize: 12,
        color: MUTED,
        letterSpacing: 1,
        textTransform: "uppercase",
    },
});