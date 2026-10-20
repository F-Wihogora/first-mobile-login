import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Checkbox from "expo-checkbox";
import Slider from "@react-native-community/slider";

// ---------- constants ----------
const INTERESTS = ["Coding", "Music", "Sports", "Design", "Gaming", "Reading"];
const GENDERS = ["Female", "Male", "Other"];
const BIO_MAX = 200;

const INITIAL = {
  fullName: "",
  email: "",
  phone: "",
  dob: "",
  password: "",
  confirmPassword: "",
  bio: "",
  country: "Rwanda",
  gender: "",
  interests: [],
  experience: 3,
  newsletter: false,
  agreed: false,
};

// ---------- validation ----------
function validate(f) {
  const e = {};

  if (f.fullName.trim().length < 2) e.fullName = "Enter your full name";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
    e.email = "Enter a valid email address";

  if (!/^\+?\d{9,15}$/.test(f.phone.replace(/[\s-]/g, "")))
    e.phone = "Enter a valid phone number (9-15 digits)";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.dob)) {
    e.dob = "Use the format YYYY-MM-DD";
  } else {
    const d = new Date(f.dob);
    const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
    if (isNaN(d.getTime())) e.dob = "That date doesn't exist";
    else if (age < 13) e.dob = "You must be at least 13";
    else if (age > 120) e.dob = "Check the year";
  }

  if (f.password.length < 8) e.password = "At least 8 characters";
  else if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password))
    e.password = "Use both letters and numbers";

  if (f.confirmPassword !== f.password)
    e.confirmPassword = "Passwords do not match";

  if (!f.gender) e.gender = "Select one option";
  if (f.interests.length === 0) e.interests = "Pick at least one interest";
  if (!f.agreed) e.agreed = "You must accept the terms";

  return e;
}

function passwordStrength(p) {
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const labels = ["Too weak", "Weak", "Okay", "Good", "Strong"];
  const colors = ["#c0392b", "#e67e22", "#f1c40f", "#2ecc71", "#27ae60"];
  return { score, label: labels[score], color: colors[score] };
}

// ---------- small reusable pieces ----------
function Field({ label, error, children, hint }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

function Chip({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------- main screen ----------
export default function App() {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  // refs so "next" on the keyboard jumps to the following field
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const dobRef = useRef(null);
  const passRef = useRef(null);
  const confirmRef = useRef(null);
  const bioRef = useRef(null);

  const update = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    // re-validate live, but only show errors for fields the user has touched
    if (touched[field]) setErrors(validate(next));
  };

  const blur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate(form));
  };

  const toggleInterest = (item) => {
    const has = form.interests.includes(item);
    update(
      "interests",
      has ? form.interests.filter((i) => i !== item) : [...form.interests, item]
    );
    setTouched((t) => ({ ...t, interests: true }));
  };

  const err = (field) => (touched[field] ? errors[field] : undefined);

  const handleSubmit = () => {
    const found = validate(form);
    setErrors(found);
    // mark everything as touched so all errors appear
    setTouched(Object.fromEntries(Object.keys(INITIAL).map((k) => [k, true])));

    if (Object.keys(found).length > 0) {
      Alert.alert("Check your form", "Please fix the highlighted fields.");
      return;
    }

    // never send confirmPassword; build a clean payload
    const { confirmPassword, ...rest } = form;
    const payload = {
      ...rest,
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      submittedAt: new Date().toISOString(),
    };

    console.log(JSON.stringify(payload, null, 2));
    setSubmitted(payload);
  };

  const handleReset = () => {
    setForm(INITIAL);
    setErrors({});
    setTouched({});
    setSubmitted(null);
  };

  const strength = passwordStrength(form.password);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f4f6fa" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Fill in your details below</Text>

        {submitted && (
          <View style={styles.success}>
            <Text style={styles.successText}>
              Form submitted. Check your terminal for the JSON output.
            </Text>
          </View>
        )}

        {/* ---------- Section 1 ---------- */}
        <View style={styles.card}>
          <Text style={styles.section}>Personal details</Text>

          <Field label="Full name" error={err("fullName")}>
            <TextInput
              style={[styles.input, err("fullName") && styles.inputError]}
              placeholder="Jane Doe"
              value={form.fullName}
              onChangeText={(t) => update("fullName", t)}
              onBlur={() => blur("fullName")}
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          </Field>

          <Field label="Email" error={err("email")}>
            <TextInput
              ref={emailRef}
              style={[styles.input, err("email") && styles.inputError]}
              placeholder="you@example.com"
              value={form.email}
              onChangeText={(t) => update("email", t)}
              onBlur={() => blur("email")}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
          </Field>

          <Field label="Phone" error={err("phone")}>
            <TextInput
              ref={phoneRef}
              style={[styles.input, err("phone") && styles.inputError]}
              placeholder="+250 788 000 000"
              value={form.phone}
              onChangeText={(t) => update("phone", t)}
              onBlur={() => blur("phone")}
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => dobRef.current?.focus()}
            />
          </Field>

          <Field
            label="Date of birth"
            error={err("dob")}
            hint="Format: YYYY-MM-DD"
          >
            <TextInput
              ref={dobRef}
              style={[styles.input, err("dob") && styles.inputError]}
              placeholder="2003-05-21"
              value={form.dob}
              onChangeText={(t) => update("dob", t)}
              onBlur={() => blur("dob")}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              returnKeyType="next"
              onSubmitEditing={() => passRef.current?.focus()}
            />
          </Field>

          <Field label="Gender" error={err("gender")}>
            <View style={styles.rowWrap}>
              {GENDERS.map((g) => (
                <Pressable
                  key={g}
                  style={styles.radioRow}
                  onPress={() => {
                    update("gender", g);
                    setTouched((t) => ({ ...t, gender: true }));
                  }}
                >
                  <View style={styles.radio}>
                    {form.gender === g && <View style={styles.radioDot} />}
                  </View>
                  <Text>{g}</Text>
                </Pressable>
              ))}
            </View>
          </Field>

          <Field label="Country">
            <View style={styles.pickerBox}>
              <Picker
                selectedValue={form.country}
                onValueChange={(v) => update("country", v)}
              >
                <Picker.Item label="Rwanda" value="Rwanda" />
                <Picker.Item label="Kenya" value="Kenya" />
                <Picker.Item label="Uganda" value="Uganda" />
                <Picker.Item label="Tanzania" value="Tanzania" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>
          </Field>
        </View>

        {/* ---------- Section 2 ---------- */}
        <View style={styles.card}>
          <Text style={styles.section}>Security</Text>

          <Field label="Password" error={err("password")}>
            <View style={styles.passwordRow}>
              <TextInput
                ref={passRef}
                style={[
                  styles.input,
                  { flex: 1 },
                  err("password") && styles.inputError,
                ]}
                placeholder="At least 8 characters"
                value={form.password}
                onChangeText={(t) => update("password", t)}
                onBlur={() => blur("password")}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
              />
              <Pressable
                onPress={() => setShowPassword((s) => !s)}
                style={styles.showBtn}
              >
                <Text style={styles.showBtnText}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>

            {form.password.length > 0 && (
              <View style={{ marginTop: 6 }}>
                <View style={styles.meterTrack}>
                  <View
                    style={{
                      height: 6,
                      borderRadius: 3,
                      width: `${(strength.score / 4) * 100}%`,
                      backgroundColor: strength.color,
                    }}
                  />
                </View>
                <Text style={{ color: strength.color, fontSize: 12 }}>
                  {strength.label}
                </Text>
              </View>
            )}
          </Field>

          <Field label="Confirm password" error={err("confirmPassword")}>
            <TextInput
              ref={confirmRef}
              style={[styles.input, err("confirmPassword") && styles.inputError]}
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChangeText={(t) => update("confirmPassword", t)}
              onBlur={() => blur("confirmPassword")}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => bioRef.current?.focus()}
            />
          </Field>
        </View>

        {/* ---------- Section 3 ---------- */}
        <View style={styles.card}>
          <Text style={styles.section}>About you</Text>

          <Field
            label="Bio"
            hint={`${form.bio.length}/${BIO_MAX} characters`}
          >
            <TextInput
              ref={bioRef}
              style={[styles.input, { height: 100 }]}
              placeholder="Tell us a little about yourself"
              value={form.bio}
              onChangeText={(t) => update("bio", t)}
              multiline
              numberOfLines={4}
              maxLength={BIO_MAX}
              textAlignVertical="top"
            />
          </Field>

          <Field label="Interests" error={err("interests")}>
            <View style={styles.rowWrap}>
              {INTERESTS.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={form.interests.includes(item)}
                  onPress={() => toggleInterest(item)}
                />
              ))}
            </View>
          </Field>

          <Field label={`Programming experience: ${form.experience} / 10`}>
            <Slider
              minimumValue={0}
              maximumValue={10}
              step={1}
              value={form.experience}
              onValueChange={(v) => update("experience", v)}
              minimumTrackTintColor="#4f46e5"
            />
          </Field>
        </View>

        {/* ---------- Section 4 ---------- */}
        <View style={styles.card}>
          <Text style={styles.section}>Preferences</Text>

          <View style={styles.switchRow}>
            <Text style={{ flex: 1 }}>Send me the newsletter</Text>
            <Switch
              value={form.newsletter}
              onValueChange={(v) => update("newsletter", v)}
            />
          </View>

          <Pressable
            style={[styles.switchRow, { marginTop: 14 }]}
            onPress={() => {
              update("agreed", !form.agreed);
              setTouched((t) => ({ ...t, agreed: true }));
            }}
          >
            <Checkbox
              value={form.agreed}
              onValueChange={(v) => {
                update("agreed", v);
                setTouched((t) => ({ ...t, agreed: true }));
              }}
            />
            <Text style={{ marginLeft: 10, flex: 1 }}>
              I agree to the terms and conditions
            </Text>
          </Pressable>
          {err("agreed") && <Text style={styles.error}>{err("agreed")}</Text>}
        </View>

        {/* ---------- Buttons ---------- */}
        <Pressable style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit</Text>
        </Pressable>
        <Pressable style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetText}>Reset form</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------- styles ----------
const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "800", color: "#1f2937" },
  subtitle: { color: "#6b7280", marginBottom: 16 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  section: { fontSize: 17, fontWeight: "700", marginBottom: 12, color: "#111827" },

  field: { marginBottom: 14 },
  label: { fontWeight: "600", marginBottom: 6, color: "#374151" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fafafa",
  },
  inputError: { borderColor: "#dc2626", backgroundColor: "#fef2f2" },
  error: { color: "#dc2626", fontSize: 12, marginTop: 4 },
  hint: { color: "#9ca3af", fontSize: 12, marginTop: 4 },

  pickerBox: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#fafafa",
    overflow: "hidden",
  },

  passwordRow: { flexDirection: "row", alignItems: "center" },
  showBtn: { marginLeft: 8, padding: 8 },
  showBtnText: { color: "#4f46e5", fontWeight: "600" },
  meterTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e5e7eb",
    marginBottom: 4,
  },

  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  radioRow: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#4f46e5",
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4f46e5",
  },

  chip: {
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipSelected: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  chipText: { color: "#4f46e5" },
  chipTextSelected: { color: "#fff" },

  switchRow: { flexDirection: "row", alignItems: "center" },

  submitBtn: {
    backgroundColor: "#4f46e5",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  resetBtn: { padding: 14, alignItems: "center" },
  resetText: { color: "#6b7280", fontWeight: "600" },

  success: {
    backgroundColor: "#dcfce7",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  successText: { color: "#166534" },
});