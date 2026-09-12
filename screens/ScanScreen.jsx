import React from "react";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import TextRecognition from "@react-native-ml-kit/text-recognition";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Image,
    StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const OCR_API_KEY = process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY;

function ScanningIndicator() {
    const sweep = useRef(new Animated.Value(0)).current;
    const pulse = useRef(new Animated.Value(0.4)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(sweep, {
                    toValue: 1,
                    duration: 1100,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(sweep, {
                    toValue: 0,
                    duration: 1100,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 700,
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 0.4,
                    duration: 700,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const translateY = sweep.interpolate({
        inputRange: [0, 1],
        outputRange: [4, 56],
    });

    return (
        <View style={styles.frame}>
            <View style={styles.docLines}>
                {[0, 1, 2, 3].map((i) => (
                    <View key={i} style={styles.docLine} />
                ))}
            </View>

            <Animated.View
                style={[
                    styles.beam,
                    { transform: [{ translateY }] },
                ]}
            />

            <Animated.Text style={[styles.label, { opacity: pulse }]}>
                Reading document...
            </Animated.Text>
        </View>
    );
}


export default function ScanScreen({ navigation }) {

    const [imageUri, setImageUri] = React.useState(null);
    const [isOCRProcessing, setIsOCRProcessing] = React.useState(false);
    const [ocrError, setOcrError] = React.useState("");
    const [permission, requestPermission] = useCameraPermissions();
    const [showCamera, setShowCamera] = React.useState(false);
    const [ocrText, setOcrText] = React.useState("");

    const cameraRef = useRef(null);
    const insets = useSafeAreaInsets();
    if (!permission) {
        return <View />;
    }
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;

            setImageUri(uri);

            const text = await runOCR(uri);

            if (!text) {
                return;
            }

            setOcrText(text);
            navigation.navigate("ReviewEdit", { ocrText: text });
        }
    };

    const isDentalRecord = (text) => {
        const lowerText = text.toLowerCase();

        const dentalKeywords = [
            "patient",
            "patient details",
            "chief complaint",
            "medical history",
            "dental history",
            "clinical findings",
            "diagnosis",
            "treatment plan",
            "dental chart",
            "tooth",
            "prescription",
            "radiograph",
            "dentist",
            "doctor",
            "allergies",
        ];

        const matches = dentalKeywords.filter((keyword) =>
            lowerText.includes(keyword)
        );

        return matches.length >= 2;
    };

    const runOCR = async (uri) => {
        try {
            setIsOCRProcessing(true);
            setOcrError("");

            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const formData = new FormData();

            formData.append("apikey", OCR_API_KEY);
            formData.append("language", "eng");
            formData.append("OCREngine", "3");
            formData.append("isOverlayRequired", "false");
            formData.append("detectOrientation", "true");
            formData.append("scale", "true");
            formData.append(
                "base64Image",
                `data:image/jpeg;base64,${base64}`
            );

            const response = await fetch(
                "https://api.ocr.space/parse/image",
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error("OCR request failed");
            }

            const result = await response.json();

            console.log("OCR RESULT:", result);

            if (result?.IsErroredOnProcessing) {
                throw new Error(
                    result?.ErrorMessage?.[0] ||
                    "Unable to process the image"
                );
            }

            const text =
                result?.ParsedResults?.[0]?.ParsedText || "";

            if (!text.trim()) {
                throw new Error(
                    "No text could be detected. Try a clearer image."
                );
            }

            if (!isDentalRecord(text)) {
                throw new Error(
                    "This does not appear to be a dental record. Please upload a valid dental document."
                );
            }

            console.log("EXTRACTED TEXT:", text);

            return text;
        } catch (error) {
            console.log("OCR ERROR:", error);

            setOcrError(
                error.message ||
                "OCR failed. Please try another image."
            );

            return "";
        } finally {
            setIsOCRProcessing(false);
        }
    };

    if (showCamera) {
        return (
            <View style={{ flex: 1, backgroundColor: "#05070D" }}>
                <StatusBar barStyle="-content" />
                <CameraView
                    ref={cameraRef}
                    style={{ flex: 1 }}
                    facing="back"
                />

                <Pressable
                    style={{
                        position: "absolute",
                        bottom: 40,
                        alignSelf: "center",
                        backgroundColor: "#38BDF8",
                        paddingHorizontal: 30,
                        paddingVertical: 15,
                        borderRadius: 30,
                        shadowColor: "#38BDF8",
                        shadowOpacity: 0.6,
                        shadowRadius: 14,
                        shadowOffset: { width: 0, height: 0 },
                        elevation: 8,
                    }}
                    onPress={async () => {
                        try {
                            if (!cameraRef.current) {
                                return;
                            }

                            const photo =
                                await cameraRef.current.takePictureAsync({
                                    quality: 0.7,
                                    skipProcessing: true,
                                });
                            console.log("CAMERA PHOTO:", photo);

                            if (!photo?.uri) {
                                throw new Error("Failed to capture image");
                            }

                            const processedImage =
                                await ImageManipulator.manipulateAsync(
                                    photo.uri,
                                    [
                                        {
                                            resize: {
                                                width: 1600,
                                            },
                                        },
                                    ],
                                    {
                                        compress: 0.8,
                                        format: ImageManipulator.SaveFormat.JPEG,
                                    }
                                );

                            console.log("PROCESSED CAMERA IMAGE:", processedImage);

                            setImageUri(processedImage.uri);
                            setShowCamera(false);

                            setTimeout(async () => {
                                console.log("STARTING CAMERA OCR:", photo.uri);
                                const text = await runOCR(processedImage.uri);

                                if (!text) {
                                    return;
                                }

                                setOcrText(text);

                                navigation.navigate("ReviewEdit", {
                                    ocrText: text,
                                });
                            }, 300);

                        } catch (error) {
                            console.log("CAMERA ERROR:", error);

                            setShowCamera(false);
                            setIsOCRProcessing(false);

                            setOcrError(
                                error.message || "Failed to capture image"
                            );
                        }
                    }}
                >
                    <Text style={{ fontWeight: "700", color: "#04121F" }}>
                        Capture Record
                    </Text>
                </Pressable>
            </View>
        );
    }
    return (
        <View style={[styles.safeArea, { paddingTop: insets.top + 14 }]}>
            <StatusBar barStyle="light-content" />
            <ScrollView style={styles.container}>
                <View style={styles.content}>

                    {/* Header */}
                    <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
                        <Text style={styles.back}>‹ Back</Text>
                    </Pressable>

                    <Text style={styles.title}>Scan Dental Record</Text>

                    <Text style={styles.subtitle}>
                        Scan or upload a dental record to extract patient information.
                    </Text>

                    {/* Upload Area */}
                    <View style={styles.uploadBox}>
                        <View style={styles.glowBlob} />

                        <View style={styles.uploadIcon}>
                            <Text style={styles.iconText}>＋</Text>
                        </View>

                        <Text style={styles.uploadTitle}>
                            Upload a dental record
                        </Text>

                        <Text style={styles.uploadDescription}>
                            Take a photo or choose an existing image from your device.
                        </Text>

                        <View style={styles.buttonRow}>
                            <Pressable
                                style={styles.primaryButton}
                                onPress={() => setShowCamera(true)}
                            >
                                <Text style={styles.primaryButtonText}>
                                    📷 Scan Record
                                </Text>
                            </Pressable>

                            <Pressable style={styles.secondaryButton} onPress={pickImage}>
                                <Text style={styles.secondaryButtonText}>
                                    ↑  Upload
                                </Text>
                            </Pressable>
                        </View>

                        {imageUri && (
                            <Image
                                source={{ uri: imageUri }}
                                style={styles.preview}
                            />
                        )}

                        {isOCRProcessing && <ScanningIndicator />}

                        {ocrError ? (
                            <View style={styles.ocrError}>
                                <Text style={styles.ocrErrorText}>
                                    {ocrError}
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Instructions */}
                    <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>For best results</Text>

                        <Text style={styles.infoItem}>
                            • Place the entire document inside the frame
                        </Text>

                        <Text style={styles.infoItem}>
                            • Make sure the document is well lit
                        </Text>

                        <Text style={styles.infoItem}>
                            • Avoid shadows and blurry images
                        </Text>

                        <Text style={styles.infoItem}>
                            • Handwritten information is supported
                        </Text>
                    </View>

                    {/* Supported formats */}
                    <Text style={styles.formats}>
                        Supported: JPG, PNG, JPEG
                    </Text>

                </View>
            </ScrollView>
        </View>
    );
}

const ACCENT = "#38BDF8";
const BG = "#0A0E17";
const CARD_BG = "#111827";
const BORDER = "#1F2937";
const TEXT_MUTED = "#8B96A8";

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: BG,
    },

    container: {
        flex: 1,
        backgroundColor: BG,
    },

    content: {
        padding: 20,
        paddingTop: 8,
    },

    back: {
        fontSize: 15,
        color: ACCENT,
        fontWeight: "600",
        marginBottom: 20,
    },

    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#F3F6FB",
        letterSpacing: 0.3,
    },


    frame: {
        width: "100%",
        height: 90,
        borderRadius: 12,
        backgroundColor: "rgba(56,189,248,0.08)",
        borderWidth: 1,
        borderColor: "rgba(56,189,248,0.3)",
        marginTop: 12,
        paddingTop: 14,
        paddingHorizontal: 16,
        overflow: "hidden",
    },
    docLines: {
        gap: 8,
    },
    docLine: {
        height: 3,
        borderRadius: 2,
        backgroundColor: "rgba(255,255,255,0.12)",
        width: "70%",
    },
    beam: {
        position: "absolute",
        left: 0,
        right: 0,
        height: 18,
        backgroundColor: "rgba(56,189,248,0.35)",
        shadowColor: "#38BDF8",
        shadowOpacity: 0.9,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
    },
    label: {
        position: "absolute",
        bottom: 8,
        alignSelf: "center",
        color: "#38BDF8",
        fontSize: 12,
        fontWeight: "700",
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 21,
        color: TEXT_MUTED,
        marginTop: 8,
        marginBottom: 28,
    },

    uploadBox: {
        backgroundColor: CARD_BG,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 24,
        alignItems: "center",
        overflow: "hidden",
    },

    glowBlob: {
        position: "absolute",
        top: -50,
        right: -40,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: "rgba(56,189,248,0.10)",
    },

    uploadIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: "rgba(56,189,248,0.12)",
        borderWidth: 1,
        borderColor: "rgba(56,189,248,0.35)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },

    iconText: {
        fontSize: 32,
        color: ACCENT,
        fontWeight: "300",
    },

    preview: {
        width: "100%",
        height: 220,
        borderRadius: 12,
        marginTop: 20,
        resizeMode: "contain",
        borderWidth: 1,
        borderColor: BORDER,
    },

    uploadTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#F3F6FB",
    },

    uploadDescription: {
        fontSize: 13,
        color: TEXT_MUTED,
        textAlign: "center",
        lineHeight: 19,
        marginTop: 8,
        marginBottom: 22,
    },

    ocrLoading: {
        marginTop: 12,
        padding: 14,
        borderRadius: 10,
        backgroundColor: "rgba(56,189,248,0.10)",
        borderWidth: 1,
        borderColor: "rgba(56,189,248,0.25)",
        width: "100%",
    },

    ocrLoadingText: {
        color: ACCENT,
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
    },

    ocrError: {
        marginTop: 12,
        padding: 14,
        borderRadius: 10,
        backgroundColor: "rgba(248,113,113,0.10)",
        borderWidth: 1,
        borderColor: "rgba(248,113,113,0.30)",
        width: "100%",
    },

    ocrErrorText: {
        color: "#FCA5A5",
        fontSize: 14,
        lineHeight: 20,
    },

    buttonRow: {
        flexDirection: "row",
        gap: 10,
        width: "100%",
    },

    primaryButton: {
        flex: 1,
        backgroundColor: ACCENT,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        shadowColor: ACCENT,
        shadowOpacity: 0.45,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
        elevation: 6,
    },

    primaryButtonText: {
        color: "#04121F",
        fontSize: 13,
        fontWeight: "700",
    },

    secondaryButton: {
        flex: 1,
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "rgba(56,189,248,0.4)",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },

    secondaryButtonText: {
        color: ACCENT,
        fontSize: 13,
        fontWeight: "700",
    },

    infoCard: {
        backgroundColor: CARD_BG,
        borderRadius: 16,
        padding: 18,
        marginTop: 18,
        borderWidth: 1,
        borderColor: BORDER,
    },

    infoTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#F3F6FB",
        marginBottom: 10,
    },

    infoItem: {
        fontSize: 12,
        color: TEXT_MUTED,
        marginBottom: 7,
        lineHeight: 18,
    },

    formats: {
        textAlign: "center",
        fontSize: 11,
        color: "#5B6472",
        marginTop: 16,
        marginBottom: 20,
    },
});