import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Constants from "expo-constants";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "../hooks/useAuth";
import { useAuthStore } from "@/stores/useAuthStore";
import { Icon } from "@/shared/components/ui/Icon";

const loginSchema = z.object({
  username: z.string().min(1, "Ingrese su usuario"),
  password: z.string().min(1, "Ingrese su contraseña"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const COLOR = {
  blue: "#3575EE",
  blueDark: "#2960CA",
  iconBlue: "#3B82F6",
  bgDeep: "#08121F",
  bgBase: "#05080C",
  inputBg: "#1C2738",
  outlineBorder: "#313F51",
  textSoft: "#899DB5",
  textDetail: "#475D7A",
  white: "#FFFFFF",
  error: "#E63946",
  badgeBg: "#082C22",
  badgeGreen: "#11A570",
} as const;

const primaryGlow = {
  shadowColor: COLOR.blue,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.45,
  shadowRadius: 16,
  elevation: 12,
} as const;

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useLogin();
  const rememberUser = useAuthStore((state) => state.rememberUser);
  const lastUsername = useAuthStore((state) => state.lastUsername);
  const setRememberUser = useAuthStore((state) => state.setRememberUser);

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Populate remembered username after mount to avoid state-update-during-render warning
  useEffect(() => {
    if (rememberUser && lastUsername) {
      setValue("username", lastUsername);
    }
  }, [rememberUser, lastUsername, setValue]);

  const onSubmit = async (values: LoginFormValues) => {
    setError("");
    setLoading(true);
    try {
      const user = await login(values.username, values.password);
      if (!user) {
        setError("Credenciales incorrectas");
      } else {
        setRememberUser(rememberUser, values.username);
      }
    } catch {
      setError("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // TODO: navigate to password recovery
  };


  const inputBorderStyle = (hasError: boolean) => ({
    borderWidth: 1,
    borderColor: hasError ? COLOR.error : "transparent",
  });

  return (
    <SafeAreaView className="flex-1 bg-kamaq-bg-base">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[COLOR.bgDeep, COLOR.bgBase]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            className="flex-1"
          >
            {/* Decorative glow */}
            <View
              className="absolute top-[-120px] left-1/2 w-64 h-64 rounded-full -ml-32"
              style={{ backgroundColor: "rgba(53, 117, 238, 0.07)" }}
            />

            {/* Form content with margins */}
            <View
              className="flex-1"
              style={{
                marginTop: 8,
                marginBottom: 16,
                marginHorizontal: 24,
              }}
            >
              {/* ─── Header: Status Badge + Settings ─── */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    alignSelf: "flex-start",
                    backgroundColor: COLOR.badgeBg,
                    borderWidth: 1,
                    borderColor: COLOR.badgeGreen,
                    borderRadius: 20,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: COLOR.badgeGreen,
                      marginRight: 8,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "500",
                      color: COLOR.badgeGreen,
                      letterSpacing: 0.3,
                    }}
                  >
                    Servidor Conectado
                  </Text>
                </View>

                <Pressable
                  onPress={() => router.push("/settings")}
                  hitSlop={12}
                  style={{
                    width: 30,
                    height: 30,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon
                    name="settings"
                    size={22}
                    color={COLOR.textSoft}
                    style={{ lineHeight: 22 }}
                  />
                </Pressable>
              </View>

              {/* ─── Main content ─── */}
              <View
                className="flex-1 justify-center"
                style={{ paddingTop: 16, flex: 1, justifyContent: "center" }}
              >
                {/* Logo + Title */}
                <View
                  className="items-center"
                  style={{ marginBottom: 28, alignItems: "center" }}
                >
                  <View
                    className="items-center justify-center"
                    style={{
                      width: 64,
                      height: 64,
                      backgroundColor: COLOR.iconBlue,
                      borderRadius: 18,
                      marginBottom: 14,
                      alignSelf: "center",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      name="inventory_2"
                      size={32}
                      color={COLOR.white}
                      weight={700}
                    />
                  </View>

                  <Text
                    className="font-bold text-center"
                    style={{ fontSize: 28, textAlign: "center", alignSelf: "center" }}
                  >
                    <Text style={{ color: COLOR.white }}>Kamaq </Text>
                    <Text style={{ color: COLOR.blue, fontWeight: "500" }}>Mobile</Text>
                  </Text>

                  <Text
                    className="mt-1.5 text-center"
                    style={{
                      fontSize: 13,
                      color: COLOR.textSoft,
                      textAlign: "center",
                      alignSelf: "center",
                      marginTop: 6,
                    }}
                  >
                    Tu aliado comercial en tu bolsillo
                  </Text>
                </View>

                {/* ─── Form Fields ─── */}
                <View className="w-full">
                  {/* Username */}
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: COLOR.white,
                      letterSpacing: 1.2,
                      marginBottom: 8,
                    }}
                  >
                    USUARIO
                  </Text>
                  <Controller
                    control={control}
                    name="username"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <>
                        <View
                          style={[
                            {
                              flexDirection: "row",
                              alignItems: "center",
                              backgroundColor: COLOR.inputBg,
                              borderRadius: 10,
                              height: 46,
                              paddingHorizontal: 14,
                            },
                            inputBorderStyle(Boolean(errors.username)),
                          ]}
                        >
                          <Icon name="person" size={20} color={COLOR.textSoft} />
                          <TextInput
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            placeholder="Ej. admin"
                            placeholderTextColor={COLOR.textSoft}
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={{
                              flex: 1,
                              marginLeft: 10,
                              fontSize: 15,
                              color: COLOR.white,
                              paddingVertical: 0,
                            }}
                          />
                        </View>
                        {errors.username ? (
                          <Text
                            className="mt-1"
                            style={{ fontSize: 12, color: COLOR.error }}
                          >
                            {errors.username.message}
                          </Text>
                        ) : null}
                      </>
                    )}
                  />

                  {/* Password label row */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 16,
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: COLOR.white,
                        letterSpacing: 1.2,
                      }}
                    >
                      CONTRASEÑA
                    </Text>
                    <Pressable onPress={handleForgotPassword} hitSlop={8}>
                      <Text style={{ fontSize: 12, color: COLOR.blue }}>
                        ¿La olvidaste?
                      </Text>
                    </Pressable>
                  </View>

                  {/* Password input */}
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <>
                        <View
                          style={[
                            {
                              flexDirection: "row",
                              alignItems: "center",
                              backgroundColor: COLOR.inputBg,
                              borderRadius: 10,
                              height: 46,
                              paddingHorizontal: 14,
                            },
                            inputBorderStyle(Boolean(errors.password)),
                          ]}
                        >
                          <Icon name="lock" size={20} color={COLOR.textSoft} />
                          <TextInput
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            placeholder="••••••••"
                            placeholderTextColor={COLOR.textSoft}
                            secureTextEntry={!showPassword}
                            style={{
                              flex: 1,
                              marginLeft: 10,
                              fontSize: 15,
                              color: COLOR.white,
                              paddingVertical: 0,
                            }}
                          />
                          <Pressable
                            onPress={() => setShowPassword((prev) => !prev)}
                            hitSlop={8}
                            style={{ padding: 4 }}
                          >
                            <Icon
                              name={showPassword ? "visibility_off" : "visibility"}
                              size={20}
                              color={COLOR.textSoft}
                            />
                          </Pressable>
                        </View>
                        {errors.password ? (
                          <Text
                            className="mt-1"
                            style={{ fontSize: 12, color: COLOR.error }}
                          >
                            {errors.password.message}
                          </Text>
                        ) : null}
                      </>
                    )}
                  />

                  {/* General error */}
                  {error ? (
                    <Text
                      className="mt-3 text-center"
                      style={{ fontSize: 13, color: COLOR.error }}
                    >
                      {error}
                    </Text>
                  ) : null}

                  {/* Remember checkbox */}
                  <Pressable
                    onPress={() => setRememberUser(!rememberUser)}
                    className="flex-row items-center"
                    style={{
                      marginTop: 20,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <View
                      className="items-center justify-center"
                      style={{
                        width: 18,
                        height: 18,
                        backgroundColor: rememberUser ? COLOR.blue : COLOR.inputBg,
                        borderWidth: 1,
                        borderColor: rememberUser ? COLOR.blue : COLOR.outlineBorder,
                        borderRadius: 4,
                        marginRight: 10,
                      }}
                    >
                      {rememberUser ? (
                        <Icon name="check" size={13} color={COLOR.white} weight={700} />
                      ) : null}
                    </View>
                    <Text
                      style={{ fontSize: 13, color: COLOR.textSoft, flexShrink: 1 }}
                    >
                      Recordar usuario en este terminal
                    </Text>
                  </Pressable>

                  {/* Submit button */}
                  <Pressable
                    onPress={handleSubmit(onSubmit)}
                    style={{ marginTop: 24 }}
                  >
                    <LinearGradient
                      colors={[COLOR.blue, COLOR.blueDark]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={[
                        {
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 12,
                          height: 50,
                        },
                        primaryGlow,
                      ]}
                    >
                      {loading ? (
                        <ActivityIndicator color={COLOR.white} />
                      ) : (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "600",
                              color: COLOR.white,
                              marginRight: 8,
                            }}
                          >
                            Iniciar Sesión
                          </Text>
                          <Icon
                            name="arrow_forward"
                            size={18}
                            color={COLOR.white}
                            weight={700}
                          />
                        </View>
                      )}
                    </LinearGradient>
                  </Pressable>


                </View>
              </View>

              {/* ─── Footer ─── */}
              <View style={{ paddingTop: 20 }}>
                <View
                  className="flex-row items-center justify-between"
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    className="flex-row items-center"
                    style={{ flexShrink: 1, marginRight: 8 }}
                  >
                    <View
                      className="w-1.5 h-1.5 rounded-full mr-2"
                      style={{ backgroundColor: COLOR.textSoft }}
                    />
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 11, color: COLOR.textSoft, flexShrink: 1 }}
                    >
                      Almacén Central (Nodo 01)
                    </Text>
                  </View>
                  <View
                    className="px-2 py-1"
                    style={{
                      backgroundColor: COLOR.inputBg,
                      borderRadius: 6,
                      flexShrink: 0,
                      marginLeft: "auto",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "500",
                        color: COLOR.textSoft,
                      }}
                    >
                      Versión {appVersion}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}