import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Shield, Eye, LogOut, Trash2, Moon, Volume2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface SettingToggleProps {
  label: string;
  description?: string;
  enabled: boolean;
  onToggle: () => void;
}

function SettingToggle({ label, description, enabled, onToggle }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
          enabled ? "bg-purple-600" : "bg-zinc-700"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow",
            enabled ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { signOut } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: false,
    soundEnabled: true,
    privateAccount: false,
    showActivity: true,
    autoplay: true,
    mutedDefault: true,
    language: "pt-BR",
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sections = [
    {
      title: "Notificações",
      icon: Bell,
      items: [
        {
          label: "Notificações Push",
          description: "Receba notificações de curtidas, comentários e seguidores",
          key: "notifications" as const,
        },
        {
          label: "Notificações por Email",
          description: "Receba um resumo das atividades por email",
          key: "emailNotifications" as const,
        },
        {
          label: "Sons",
          description: "Ativar sons nas notificações",
          key: "soundEnabled" as const,
        },
      ],
    },
    {
      title: "Privacidade",
      icon: Shield,
      items: [
        {
          label: "Conta Privada",
          description: "Somente seguidores aprovados verão seus posts",
          key: "privateAccount" as const,
        },
        {
          label: "Mostrar Atividade",
          description: "Permitir que outros vejam quando você está online",
          key: "showActivity" as const,
        },
      ],
    },
    {
      title: "Vídeos",
      icon: Volume2,
      items: [
        {
          label: "Reprodução Automática",
          description: "Reproduzir vídeos automaticamente ao aparecer na tela",
          key: "autoplay" as const,
        },
        {
          label: "Silenciado por Padrão",
          description: "Iniciar vídeos sem som",
          key: "mutedDefault" as const,
        },
      ],
    },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Configurações</h1>
        <p className="text-zinc-400 text-sm mt-1">Personalize sua experiência no MemeFlow</p>
      </div>

      {sections.map((section, si) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: si * 0.1 }}
          className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <section.icon className="w-4 h-4 text-purple-400" />
            <h3 className="font-semibold text-zinc-200 text-sm">{section.title}</h3>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {section.items.map(item => (
              <SettingToggle
                key={item.key}
                label={item.label}
                description={item.description}
                enabled={settings[item.key] as boolean}
                onToggle={() => toggle(item.key)}
              />
            ))}
          </div>
        </motion.div>
      ))}

      {/* Language */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-purple-400" />
          <h3 className="font-semibold text-zinc-200 text-sm">Idioma</h3>
        </div>
        <select
          value={settings.language}
          onChange={e => setSettings(p => ({ ...p, language: e.target.value }))}
          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="pt-BR">Português (Brasil)</option>
          <option value="en-US">English (US)</option>
          <option value="es">Español</option>
        </select>
      </motion.div>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-red-950/20 border border-red-900/30 rounded-2xl p-4 space-y-3"
      >
        <h3 className="font-semibold text-red-400 text-sm">Zona de Perigo</h3>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-zinc-400 hover:text-red-400 hover:bg-red-900/10"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-zinc-500 hover:text-red-400 hover:bg-red-900/10"
        >
          <Trash2 className="w-4 h-4" />
          Deletar conta
        </Button>
      </motion.div>

      {/* Version */}
      <p className="text-center text-xs text-zinc-600">
        MemeFlow v1.0.0 • Feito com 😂 para o humor
      </p>
    </div>
  );
}
