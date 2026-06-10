import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-hook';
import { useDropzone } from 'react-dropzone';
import { Plus, UploadCloud, X, Camera, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type InventoryItem = {
  id: string;
  name: string;
  purchase_price: number;
  selling_price: number | null;
  quantity: number;
  category: string;
};

type InventoryImage = {
  id: string;
  item_id: string;
  public_url: string;
};

export default function InventoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
    
    // Realtime Subscription
    const channel = supabase
      .channel('inventory_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => {
        fetchItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) setItems(data);
    setLoading(false);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*': []} });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      // 1. Inserimento prodotto
      const { data: itemData, error: itemError } = await supabase
        .from('inventory_items')
        .insert({
          user_id: user.id,
          name,
          purchase_price: parseFloat(purchasePrice),
          selling_price: sellingPrice ? parseFloat(sellingPrice) : null,
          quantity: parseInt(quantity),
          category
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // 2. Upload immagini e record
      if (files.length > 0 && itemData) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${itemData.id}/${Math.random()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('inventory_images')
            .upload(fileName, file);
            
          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from('inventory_images')
            .getPublicUrl(fileName);

          await supabase.from('inventory_images').insert({
            user_id: user.id,
            item_id: itemData.id,
            storage_path: fileName,
            public_url: publicUrlData.publicUrl
          });
        }
      }

      toast.success("Prodotto aggiunto con successo!");
      setName(''); setPurchasePrice(''); setSellingPrice(''); setQuantity('1'); setCategory(''); setFiles([]);
      setIsAddOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Errore l'inserimento del prodotto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Magazzino</h2>
          <p className="text-slate-500 text-sm">Gestisci i tuoi prodotti e strato scorte in tempo reale.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-md transition-colors uppercase tracking-widest"><Plus className="w-4 h-4 mr-2" /> Nuovo Articolo</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuovo Prodotto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome prodotto *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} required placeholder="es. MacBook Pro" />
                </div>
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Input value={category} onChange={e => setCategory(e.target.value)} required placeholder="es. Elettronica" />
                </div>
                <div className="space-y-2">
                  <Label>Prezzo Acquisto (€) *</Label>
                  <Input type="number" step="0.01" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Prezzo Vendita Suggerito (€)</Label>
                  <Input type="number" step="0.01" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Quantità *</Label>
                  <Input type="number" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label>Immagini e Scansioni</Label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isDragActive ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 bg-slate-900/40 hover:border-emerald-500/50 hover:bg-emerald-500/5'
                  }`}
                >
                  <input {...getInputProps()} capture="environment" />
                  <div className="flex gap-4 mb-2">
                    <UploadCloud className="w-8 h-8 text-slate-500" />
                    <Camera className="w-8 h-8 text-slate-500 md:hidden" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium uppercase text-center mt-2">
                    Trascina PDF o Immagine qui o clicca per caricare.<br/>Su mobile puoi scattare foto direttamente.
                  </p>
                </div>

                {files.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {files.map((file, idx) => (
                      <div key={idx} className="relative group rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800 aspect-square border border-zinc-200 dark:border-zinc-700">
                        <img src={URL.createObjectURL(file)} alt="preview" className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Annulla</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Caricamento..." : "Salva Prodotto"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden flex flex-col mt-6 shadow-2xl">
        {loading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse font-bold tracking-widest text-xs uppercase">Caricamento inventario...</div>
        ) : items.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500">
            <Package className="w-12 h-12 mb-4 text-slate-700" />
            <p className="text-sm font-medium">Nessun prodotto in magazzino.</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1 flex flex-col">
            <div className="grid grid-cols-5 px-6 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-800/50 bg-transparent">
              <span className="col-span-2">Descrizione Prodotto</span>
              <span>Q.tà</span>
              <span>Acquisto / Vendita</span>
              <span className="text-right">Margine</span>
            </div>
            <div className="flex-1 divide-y divide-slate-800/30">
              {items.map(item => {
                const margin = item.selling_price ? item.selling_price - item.purchase_price : 0;
                const marginPct = item.selling_price ? ((margin / item.selling_price) * 100).toFixed(1) : 0;
                
                return (
                  <div key={item.id} className="grid grid-cols-5 px-6 py-4 text-sm border-b border-slate-800/30 hover:bg-slate-800/30 transition-colors items-center">
                    <div className="col-span-2">
                      <div className="font-medium text-slate-200">{item.name}</div>
                      <div className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase inline-block mt-1">{item.category}</div>
                    </div>
                    <div>
                      <span className="font-mono font-bold text-slate-300">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-slate-400 font-mono text-xs line-through opacity-70">€{item.purchase_price.toFixed(2)}</span>
                       <span className="text-slate-200 font-mono font-bold">{item.selling_price ? `€${item.selling_price.toFixed(2)}` : '-'}</span>
                    </div>
                    <div className="text-right">
                      {item.selling_price ? (
                        <div className={margin > 0 ? "text-emerald-400 font-mono font-bold" : "text-red-400 font-mono font-bold"}>
                          +{margin > 0 ? '' : ''}€{margin.toFixed(2)} <span className="text-[10px] opacity-70 block">({marginPct}%)</span>
                        </div>
                      ) : '-'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
