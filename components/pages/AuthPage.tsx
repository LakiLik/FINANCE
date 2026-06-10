import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Registrazione completata! Controlla la tua email o accedi.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Accesso effettuato.");
      }
    } catch (error: any) {
      toast.error(error.message || "Errore durante l'autenticazione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 font-sans text-slate-200">
      <div className="w-full max-w-sm bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-2xl backdrop-blur-sm">
        <div className="mb-6 border-b border-slate-800 pb-4">
          <h1 className="text-xl font-bold tracking-tight text-white mb-1">{isSignUp ? 'Registrazione' : 'Accesso Sicuro'}</h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
            {isSignUp ? "Console Amministratore" : "Inserisci Credenziali"}
          </p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 font-mono text-sm h-10"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-white focus-visible:ring-emerald-500 font-mono text-sm h-10"
              required
            />
          </div>
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest h-10 transition-colors" disabled={loading}>
            {loading ? "Attendere..." : isSignUp ? "Registrati" : "Accedi al Sistema"}
          </Button>
          <div className="text-center mt-6 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] uppercase font-bold tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              {isSignUp ? "Passa al Login" : "Nuovo Utente? Registrati"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
