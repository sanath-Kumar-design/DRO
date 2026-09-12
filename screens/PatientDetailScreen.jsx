import React from "react";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PatientDetailScreen({ route, navigation }) {
    const { patient, records = [] } = route.params;

    const patientRecords =
        records.length > 0 ? records : [patient];

    const [activeTab, setActiveTab] = React.useState("Overview");

    const patientInfo = patient.patient || {};

    const doctorName =
        typeof patient.doctor === "string"
            ? patient.doctor
                .split("\n")
                .map((line) => line.trim())
                .find((line) => line.toLowerCase().startsWith("dr.")) ||
            patient.doctor
            : "Not available";

    const initials = (patientInfo.name || "Patient")
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const renderOverview = () => (
        <>
            {/* Contact Information */}
            <View style={styles.card}>
                <Text style={styles.cardLabel}>CONTACT INFORMATION</Text>

                <InfoItem
                    icon="☎"
                    label="PHONE"
                    value={patientInfo.phone}
                />

                <InfoItem
                    icon="⌂"
                    label="ADDRESS"
                    value={patientInfo.address}
                />

                <InfoItem
                    icon="◷"
                    label="RECORD DATE"
                    value={patientInfo.date}
                />

                <InfoItem
                    icon="↗"
                    label="REFERRED BY"
                    value={patientInfo.referredBy}
                    last
                />
            </View>

            {/* Chief Complaint */}
            <SectionCard
                title="CHIEF COMPLAINT"
                value={patient.chiefComplaint}
            />

            {/* Doctor */}
            <SectionCard
                title="DOCTOR"
                value={doctorName}
            />

            {/* Medical History */}
            <SectionCard
                title="MEDICAL HISTORY"
                value={patient.medicalHistory}
            />

            {/* Clinical Findings */}
            <SectionCard
                title="CLINICAL FINDINGS"
                value={patient.clinicalFindings}
            />

            {/* Diagnosis */}
            <SectionCard
                title="DIAGNOSIS"
                value={patient.diagnosis}
            />

            {/* Treatment */}
            <SectionCard
                title="TREATMENT PLAN"
                value={patient.treatmentPlan}
            />
        </>
    );

    const renderDental = () => (
        <>
            <View style={styles.card}>
                <Text style={styles.cardLabel}>DENTAL CHART</Text>

                <View style={styles.chartBox}>
                    <Text style={styles.chartLabel}>UPPER</Text>
                    <Text style={styles.chartNumbers}>
                        {getChartLine(patient.dentalChart, "Upper")}
                    </Text>

                    <View style={styles.chartDivider} />

                    <Text style={styles.chartLabel}>LOWER</Text>
                    <Text style={styles.chartNumbers}>
                        {getChartLine(patient.dentalChart, "Lower")}
                    </Text>
                </View>
            </View>

            <SectionCard
                title="CLINICAL FINDINGS"
                value={patient.clinicalFindings}
            />

            <SectionCard
                title="DIAGNOSIS"
                value={patient.diagnosis}
            />

            <SectionCard
                title="RADIOGRAPHS / IMAGES"
                value={patient.radiographs}
            />

            <SectionCard
                title="PRESCRIPTION"
                value={patient.prescription}
            />
        </>
    );

    const renderFinancials = () => (
        <>
            <View style={styles.card}>
                <Text style={styles.cardLabel}>FINANCIAL INFORMATION</Text>

                <View style={styles.emptyFinancial}>
                    <Text style={styles.emptyIcon}>₹</Text>

                    <Text style={styles.emptyTitle}>
                        No payment information
                    </Text>

                    <Text style={styles.emptyText}>
                        Payment and financial details will appear here
                        when available.
                    </Text>
                </View>
            </View>

            <SectionCard
                title="PAYMENT / FINANCIAL DETAILS"
                value={patient.paymentFinancialDetails}
            />
        </>
    );

    const renderDocuments = () => (
        <>
            <View style={styles.card}>
                <Text style={styles.cardLabel}>
                    DOCUMENTS
                </Text>

                <Text style={styles.documentSummary}>
                    {patientRecords.length}{" "}
                    {patientRecords.length === 1
                        ? "record"
                        : "records"}{" "}
                    for this patient
                </Text>
            </View>

            {patientRecords.map((record, index) => (
                <View
                    key={record.id || index}
                    style={styles.card}
                >
                    <Text style={styles.cardLabel}>
                        RECORD {index + 1}
                    </Text>

                    <InfoItem
                        icon="◷"
                        label="RECORD DATE"
                        value={
                            record.patient?.date ||
                            record.createdAt ||
                            "Not available"
                        }
                    />

                    <SectionCard
                        title="CHIEF COMPLAINT"
                        value={record.chiefComplaint}
                    />

                    <SectionCard
                        title="DIAGNOSIS"
                        value={record.diagnosis}
                    />

                    <SectionCard
                        title="TREATMENT PLAN"
                        value={record.treatmentPlan}
                    />
                </View>
            ))}
        </>
    );


    const exportPatientPDF = async () => {
        try {
            const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 30px;
              color: #1f2937;
            }

            h1 {
              color: #1b4fd8;
              margin-bottom: 4px;
            }

            .subtitle {
              color: #6b7280;
              margin-bottom: 25px;
            }

            .section {
              margin-bottom: 22px;
              padding: 16px;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
            }

            .title {
              color: #1b4fd8;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
            }

            .value {
              font-size: 13px;
              line-height: 1.6;
              white-space: pre-wrap;
            }

            .patient-info {
              margin-bottom: 20px;
            }

            .patient-info p {
              margin: 5px 0;
            }

            .footer {
              margin-top: 30px;
              color: #9ca3af;
              font-size: 11px;
              text-align: center;
            }
          </style>
        </head>

        <body>
          <h1>${escapeHTML(patientInfo.name || "Unknown Patient")}</h1>

          <div class="subtitle">
            Dental Patient Record
          </div>

          <div class="patient-info">
            <p><strong>Patient ID:</strong> ${escapeHTML(patientInfo.patientId || "Not available")}</p>
            <p><strong>Age / Gender:</strong> ${escapeHTML(patientInfo.ageGender || "Not available")}</p>
            <p><strong>Phone:</strong> ${escapeHTML(patientInfo.phone || "Not available")}</p>
            <p><strong>Address:</strong> ${escapeHTML(patientInfo.address || "Not available")}</p>
            <p><strong>Date:</strong> ${escapeHTML(patientInfo.date || "Not available")}</p>
            <p><strong>Referred By:</strong> ${escapeHTML(patientInfo.referredBy || "Not available")}</p>
          </div>

          ${pdfSection("Doctor Details", doctorName)}
          ${pdfSection("Chief Complaint", patient.chiefComplaint)}
          ${pdfSection("Medical History", patient.medicalHistory)}
          ${pdfSection("Dental History", patient.dentalHistory)}
          ${pdfSection("Allergies / Habits", patient.allergiesHabits)}
          ${pdfSection("Clinical Findings", patient.clinicalFindings)}
          ${pdfSection("Diagnosis", patient.diagnosis)}
          ${pdfSection("Treatment Plan", patient.treatmentPlan)}
          ${pdfSection("Dental Chart", patient.dentalChart)}
          ${pdfSection("Radiographs / Images", patient.radiographs)}
          ${pdfSection("Prescription", patient.prescription)}
          ${pdfSection("Payment / Financial Details", patient.paymentFinancialDetails)}

          <div class="footer">
            Generated by DentalScan Pro
          </div>
        </body>
      </html>
    `;

            await Print.printAsync({ html });
        } catch (error) {
            console.log("PDF EXPORT ERROR:", error);
        }
    };

    const escapeHTML = (value) => {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const pdfSection = (title, value) => {
        if (!value) return "";

        return `
    <div class="section">
      <div class="title">${escapeHTML(title)}</div>
      <div class="value">${escapeHTML(value)}</div>
    </div>
  `;
    };
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={BG} />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Text style={styles.backIcon}>‹</Text>
                    </Pressable>

                    <View style={styles.headerActions}>
                        <Pressable style={styles.iconButton}>
                            <Text style={styles.iconText}>✎</Text>
                        </Pressable>

                        <Pressable
                            style={styles.exportButton}
                            onPress={exportPatientPDF}
                        >
                            <Text style={styles.exportIcon}>▣</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Patient Header */}
                <View style={styles.patientHeader}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {initials}
                        </Text>
                    </View>

                    <View style={styles.patientHeaderInfo}>
                        <Text style={styles.patientName}>
                            {patientInfo.name || "Unknown Patient"}
                        </Text>

                        <Text style={styles.patientId}>
                            {patientInfo.patientId || "No patient ID"}
                        </Text>

                        <View style={styles.badges}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {patientInfo.ageGender || "Age / Gender"}
                                </Text>
                            </View>

                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {doctorName !== "Not available"
                                        ? doctorName
                                        : "Doctor not available"}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabs}>
                    {["Overview", "Dental", "Financials", "Documents"].map(
                        (tab) => {
                            const active = activeTab === tab;

                            return (
                                <Pressable
                                    key={tab}
                                    onPress={() => setActiveTab(tab)}
                                    style={[
                                        styles.tab,
                                        active && styles.activeTab,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.tabText,
                                            active && styles.activeTabText,
                                        ]}
                                    >
                                        {tab}
                                    </Text>
                                </Pressable>
                            );
                        }
                    )}
                </View>

                {/* Content */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                >
                    {activeTab === "Overview" && renderOverview()}

                    {activeTab === "Dental" && renderDental()}

                    {activeTab === "Financials" && renderFinancials()}

                    {activeTab === "Documents" && renderDocuments()}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

/* ---------- Components ---------- */

function InfoItem({ icon, label, value, last }) {
    return (
        <View
            style={[
                styles.infoItem,
                !last && styles.infoItemBorder,
            ]}
        >
            <View style={styles.infoIcon}>
                <Text style={styles.infoIconText}>{icon}</Text>
            </View>

            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>

                <Text style={styles.infoValue}>
                    {value || "Not available"}
                </Text>
            </View>
        </View>
    );
}

function SectionCard({ title, value }) {
    return (
        <View style={styles.card}>
            <Text style={styles.cardLabel}>{title}</Text>

            <Text style={styles.sectionValue}>
                {value || "No information available"}
            </Text>
        </View>
    );
}

function getChartLine(chart, side) {
    if (!chart) return "No chart data available";

    const line = chart
        .split("\n")
        .find((item) =>
            item.toLowerCase().startsWith(side.toLowerCase())
        );

    if (!line) return "No chart data available";

    return line
        .replace(/^Upper:\s*/i, "")
        .replace(/^Lower:\s*/i, "");
}

/* ---------- Styles ---------- */

const BG = "#0A0F1E";
const SURFACE = "#111A2E";
const BORDER = "#1E2A44";
const NEON = "#38D9FF";
const TEXT = "#EAF2FF";
const MUTED = "#7C8AA8";

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: BG,
    },

    container: {
        flex: 1,
        backgroundColor: BG,
    },

    header: {
        height: 58,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    backButton: {
        width: 42,
        height: 42,
        justifyContent: "center",
    },

    backIcon: {
        fontSize: 42,
        lineHeight: 42,
        color: NEON,
        fontWeight: "300",
    },

    headerActions: {
        flexDirection: "row",
        gap: 10,
    },

    iconButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
        alignItems: "center",
        justifyContent: "center",
    },

    iconText: {
        fontSize: 20,
        color: NEON,
    },

    exportButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: NEON,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: NEON,
        shadowOpacity: 0.5,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
        elevation: 6,
    },

    exportIcon: {
        fontSize: 19,
        color: "#06131E",
    },

    documentSummary: {
        fontSize: 14,
        color: "#C3CDE3",
        lineHeight: 21,
    },

    patientHeader: {
        paddingHorizontal: 20,
        paddingTop: 6,
        paddingBottom: 18,
        flexDirection: "row",
        alignItems: "center",
    },

    avatar: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: "rgba(56, 217, 255, 0.14)",
        borderWidth: 1,
        borderColor: "rgba(56, 217, 255, 0.35)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },

    avatarText: {
        fontSize: 18,
        fontWeight: "700",
        color: NEON,
    },

    patientHeaderInfo: {
        flex: 1,
    },

    patientName: {
        fontSize: 21,
        fontWeight: "700",
        color: TEXT,
    },

    patientId: {
        fontSize: 13,
        color: MUTED,
        marginTop: 2,
    },

    badges: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 7,
    },

    badge: {
        backgroundColor: SURFACE,
        borderRadius: 10,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: BORDER,
    },

    badgeText: {
        fontSize: 11,
        color: "#C3CDE3",
        fontWeight: "600",
    },

    tabs: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },

    tab: {
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderRadius: 18,
        marginRight: 4,
    },

    activeTab: {
        backgroundColor: NEON,
        shadowColor: NEON,
        shadowOpacity: 0.45,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
        elevation: 4,
    },

    tabText: {
        fontSize: 12,
        color: MUTED,
        fontWeight: "600",
    },

    activeTabText: {
        color: "#06131E",
    },

    content: {
        padding: 16,
        paddingBottom: 40,
    },

    card: {
        backgroundColor: SURFACE,
        borderRadius: 16,
        padding: 17,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: BORDER,
    },

    cardLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: NEON,
        letterSpacing: 0.8,
        marginBottom: 13,
    },

    sectionValue: {
        fontSize: 15,
        lineHeight: 23,
        color: "#DCE4F5",
    },

    infoItem: {
        flexDirection: "row",
        paddingVertical: 10,
    },

    infoItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },

    infoIcon: {
        width: 28,
        alignItems: "center",
        paddingTop: 2,
    },

    infoIconText: {
        fontSize: 17,
        color: NEON,
    },

    infoContent: {
        flex: 1,
        paddingLeft: 5,
    },

    infoLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: MUTED,
        marginBottom: 3,
        letterSpacing: 0.5,
    },

    infoValue: {
        fontSize: 14,
        color: TEXT,
        lineHeight: 20,
    },

    chartBox: {
        backgroundColor: "#0F1729",
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: BORDER,
    },

    chartLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: MUTED,
        marginBottom: 7,
        letterSpacing: 0.5,
    },

    chartNumbers: {
        fontSize: 13,
        color: TEXT,
        lineHeight: 22,
    },

    chartDivider: {
        height: 1,
        backgroundColor: BORDER,
        marginVertical: 14,
    },

    emptyFinancial: {
        alignItems: "center",
        paddingVertical: 22,
    },

    emptyIcon: {
        fontSize: 28,
        color: NEON,
        marginBottom: 10,
    },

    emptyTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: TEXT,
        textAlign: "center",
    },

    emptyText: {
        fontSize: 13,
        color: MUTED,
        textAlign: "center",
        lineHeight: 19,
        marginTop: 6,
    },

    documentEmpty: {
        alignItems: "center",
        paddingVertical: 28,
    },

    documentIcon: {
        fontSize: 30,
        color: MUTED,
        marginBottom: 10,
    },
});