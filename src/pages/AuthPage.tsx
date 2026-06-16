import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, AtSign, Eye, EyeOff, Laugh, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

type AuthMode = "login" | "register" | "reset";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) setError("Email ou senha incorretos. Tente novamente.");
      } else if (mode === "register") {
        if (password !== confirmPassword) {
          setError("As senhas não coincidem.");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("A senha deve ter pelo menos 6 caracteres.");
          setLoading(false);
          return;
        }
        if (!username.match(/^[a-z0-9_]+$/)) {
          setError("Username deve conter apenas letras minúsculas, números e _");
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName, username);
        if (error) setError("Erro ao criar conta. Verifique os dados.");
        else setSuccess("Conta criada! Verifique seu email para confirmar.");
      } else {
        const { error } = await resetPassword(email);
        if (error) setError("Erro ao enviar email de recuperação.");
        else setSuccess("Email de recuperação enviado! Verifique sua caixa de entrada.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Demo login
  const handleDemoLogin = async () => {
    setLoading(true);
    setError("");
    // For demo, use mock credentials
    const { error } = await signIn("demo@memeflow.com", "demo1234");
    if (error) {
      // Create demo account if not exists
      await signUp("demo@memeflow.com", "demo1234", "Demo User", "demo_user");
      await signIn("demo@memeflow.com", "demo1234");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-700/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-900/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600 shadow-2xl shadow-purple-900/50 mb-4">
            <Laugh className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-purple-600">MemeFlow</h1>
          <p className="text-zinc-400 text-sm mt-1">A rede social do humor</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                {mode !== "login" && (
                  <button
                    onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                    className="text-zinc-400 hover:text-zinc-100 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-zinc-100">
                    {mode === "login" && "Entrar"}
                    {mode === "register" && "Criar Conta"}
                    {mode === "reset" && "Recuperar Senha"}
                  </h2>
                  <p className="text-zinc-400 text-sm">
                    {mode === "login" && "Bem-vindo(a) de volta!"}
                    {mode === "register" && "Junte-se à comunidade de humor"}
                    {mode === "reset" && "Enviaremos um link de recuperação"}
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName">Nome Completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <Input
                          id="fullName"
                          placeholder="Seu nome"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="username">Username</Label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <Input
                          id="username"
                          placeholder="seu_username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase())}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                {mode !== "reset" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 pr-9"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === "register" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm bg-red-900/20 border border-red-800/30 rounded-lg p-3"
                  >
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-green-400 text-sm bg-green-900/20 border border-green-800/30 rounded-lg p-3"
                  >
                    {success}
                  </motion.div>
                )}

                <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === "login" && "Entrar"}
                      {mode === "register" && "Criar Conta"}
                      {mode === "reset" && "Enviar Email"}
                    </>
                  )}
                </Button>

                {mode === "login" && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-zinc-700" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-zinc-900 px-2 text-zinc-500">ou</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={handleDemoLogin}
                      disabled={loading}
                    >
                      🎭 Entrar como Demo
                    </Button>
                  </>
                )}
              </form>

              {/* Footer links */}
              <div className="mt-4 space-y-2">
                {mode === "login" && (
                  <>
                    <button
                      onClick={() => { setMode("reset"); setError(""); setSuccess(""); }}
                      className="w-full text-center text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                    <p className="text-center text-sm text-zinc-400">
                      Não tem conta?{" "}
                      <button
                        onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
                        className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                      >
                        Criar grátis
                      </button>
                    </p>
                  </>
                )}
                {mode === "register" && (
                  <p className="text-center text-sm text-zinc-400">
                    Já tem conta?{" "}
                    <button
                      onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                      className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                    >
                      Entrar
                    </button>
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
