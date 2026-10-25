'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Plus, Search, Filter, Pencil, Trash2, Eye, X, Check,
  ChevronDown, Upload, Package, AlertTriangle,
  ToggleLeft, ToggleRight, CheckSquare, Square, Menu,
  ArrowUpDown, LayoutGrid, List, Sparkles,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Status   = 'Active' | 'Draft' | 'Out of Stock';
type Category = 'Vegetables' | 'Fruits' | 'Grains' | 'Coffee & Spices' | 'Livestock' | 'Seeds';
type Unit     = 'kg' | 'quintal' | 'piece' | 'liter';

interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  unit: Unit;
  stock: number;
  grade: string;
  status: Status;
  image: string;
  description: string;
}

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Organic Tomatoes',  category: 'Vegetables',      price: 40,  unit: 'kg',   stock: 50,  grade: 'Grade A', status: 'Active',       image: '/images/prod_tomatoes.jpg',  description: 'Fresh organic tomatoes grown without pesticides.' },
  { id: '2', name: 'Red Onions',        category: 'Vegetables',      price: 25,  unit: 'kg',   stock: 120, grade: 'Grade B', status: 'Active',       image: '/images/cat_vegetables.jpg', description: 'Quality red onions, great for cooking.' },
  { id: '3', name: 'Yellow Maize',      category: 'Grains',          price: 12,  unit: 'kg',   stock: 0,   grade: 'Grade A', status: 'Out of Stock', image: '/images/prod_maize.jpg',     description: 'Dried yellow maize, good for grinding.' },
  { id: '4', name: 'Green Beans',       category: 'Vegetables',      price: 35,  unit: 'kg',   stock: 20,  grade: 'Grade A', status: 'Draft',        image: '/images/prod_lettuce.jpg',   description: 'Tender green beans freshly harvested.' },
  { id: '5', name: 'Arabica Coffee',    category: 'Coffee & Spices', price: 280, unit: 'kg',   stock: 15,  grade: 'Grade A', status: 'Active',       image: '/images/prod_coffee.jpg',    description: 'Premium Arabica coffee beans from Sidama.' },
  { id: '6', name: 'Navel Oranges',     category: 'Fruits',          price: 22,  unit: 'kg',   stock: 60,  grade: 'Grade A', status: 'Active',       image: '/images/prod_orange.jpg',    description: 'Sweet navel oranges, freshly picked.' },
  { id: '7', name: 'Potatoes',          category: 'Vegetables',      price: 18,  unit: 'kg',   stock: 80,  grade: 'Grade B', status: 'Active',       image: '/images/prod_maize.jpg',     description: 'Fresh white potatoes from highland farms.' },
  { id: '8', name: 'Lettuce',           category: 'Vegetables',      price: 15,  unit: 'kg',   stock: 0,   grade: 'Grade A', status: 'Out of Stock', image: '/images/prod_lettuce.jpg',   description: 'Crisp lettuce leaves, ideal for salads.' },
];

const CATEGORIES: Category[] = ['Vegetables', 'Fruits', 'Grains', 'Coffee & Spices', 'Livestock', 'Seeds'];
const UNITS: Unit[]           = ['kg', 'quintal', 'piece', 'liter'];
const GRADES                  = ['Grade A', 'Grade B', 'Grade C'];

const STATUS_STYLES: Record<Status, string> = {
  'Active':       'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'Draft':        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Out of Stock': 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

const EMPTY_FORM = {
  name: '', category: 'Vegetables' as Category, description: '',
  price: '', unit: 'kg' as Unit, stock: '', grade: 'Grade A',
  status: 'Active' as Status, image: '',
};

// ─────────────────────────────────────────────
// Delete Confirm Modal
// ─────────────────────────────────────────────
function DeleteModal({ names, onConfirm, onCancel }: {
  names: string[]; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-[#0D2118] rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 dark:border-white/10">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-base font-bold text-gray-800 dark:text-white">
            {names.length === 1 ? 'Delete Product?' : `Delete ${names.length} Products?`}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {names.length === 1
              ? <><span className="font-semibold text-gray-700 dark:text-gray-200">{names[0]}</span> will be permanently removed.</>
              : 'Selected products will be permanently removed.'}
          </p>
          <div className="flex gap-3 w-full mt-1">
            <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
              Cancel
            </button>
            <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-colors cursor-pointer">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Add / Edit Slide-over Modal
// ─────────────────────────────────────────────
function ProductModal({ initial, onSave, onClose }: {
  initial?: Product;
  onSave: (data: Omit<Product, 'id'> & { id?: string }, draft: boolean) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState(
    initial
      ? { name: initial.name, category: initial.category, description: initial.description,
          price: String(initial.price), unit: initial.unit, stock: String(initial.stock),
          grade: initial.grade, status: initial.status, image: initial.image }
      : { ...EMPTY_FORM }
  );
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleFile = (file: File) => set('image', URL.createObjectURL(file));

  const handleSubmit = (draft: boolean) => {
    if (!form.name.trim() || !form.price) return;
    onSave({
      ...(initial ? { id: initial.id } : {}),
      name: form.name.trim(), category: form.category as Category,
      description: form.description, price: Number(form.price),
      unit: form.unit as Unit, stock: Number(form.stock),
      grade: form.grade, status: draft ? 'Draft' : 'Active',
      image: form.image || '/images/prod_tomatoes.jpg',
    }, draft);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0D2118] h-full w-full max-w-lg shadow-2xl flex flex-col border-l border-gray-100 dark:border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800 dark:text-white">
              {initial ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {initial ? 'Update listing details' : 'Fill in details to list your product'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Image upload */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">Product Image</label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              className={`relative rounded-xl border-2 border-dashed cursor-pointer flex items-center justify-center overflow-hidden transition-colors ${
                dragOver ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-white/10 hover:border-emerald-300'
              }`}
              style={{ height: 110 }}
            >
              {form.image ? (
                <>
                  <Image src={form.image} alt="preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-gray-400">
                  <Upload className="w-6 h-6" />
                  <span className="text-xs font-medium">Drag & drop or click to upload</span>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">Product Name <span className="text-rose-500">*</span></label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Organic Tomatoes"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all" />
          </div>

          {/* Category + Grade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">Category</label>
              <div className="relative">
                <select value={form.category} onChange={e => set('category', e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0D2118] text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 cursor-pointer">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">Grade</label>
              <div className="relative">
                <select value={form.grade} onChange={e => set('grade', e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0D2118] text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 cursor-pointer">
                  {GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
              placeholder="Describe quality, origin, etc."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all resize-none" />
          </div>

          {/* Price + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">Price <span className="text-rose-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">ETB</span>
                <input type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">Unit</label>
              <div className="relative">
                <select value={form.unit} onChange={e => set('unit', e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0D2118] text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 cursor-pointer">
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Stock */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">Available Stock</label>
            <input type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="0"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 flex gap-3 shrink-0">
          <button onClick={() => handleSubmit(true)}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
            Save as Draft
          </button>
          <button onClick={() => handleSubmit(false)}
            className="flex-1 py-2.5 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Publish
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Image Zoom / Lightbox Modal
// ─────────────────────────────────────────────
function ZoomModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const stars = product.grade === 'Grade A' ? 5 : product.grade === 'Grade B' ? 4 : 3;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-[#0D2118] rounded-3xl shadow-2xl overflow-hidden w-full max-w-lg border border-gray-100 dark:border-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Full image */}
        <div className="relative w-full" style={{ height: 320 }}>
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, 512px"
            className="object-cover"
            priority
          />
          {/* Category + Grade overlay */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="bg-[#1B4332] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow">
              {product.category}
            </span>
            <span className="bg-white/90 text-[#1B4332] text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
              {product.grade}
            </span>
          </div>
          {/* Status */}
          <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[product.status]}`}>
            {product.status}
          </span>
        </div>

        {/* Details */}
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-extrabold text-gray-800 dark:text-white leading-tight">{product.name}</h2>
            <span className="text-xl font-extrabold text-[#1B4332] dark:text-emerald-400 shrink-0">
              ETB {product.price}<span className="text-xs font-semibold text-gray-400">/{product.unit}</span>
            </span>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className={`w-4 h-4 ${i < stars ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            ))}
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">{(stars - 0.2).toFixed(1)}/5</span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{product.description}</p>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5">
            <span className={`text-sm font-semibold ${product.stock === 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {product.stock === 0 ? 'Out of stock' : `${product.stock} ${product.unit} available`}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{product.unit} · {product.grade}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Star rating helper
// ─────────────────────────────────────────────
function Stars({ grade }: { grade: string }) {
  const count = grade === 'Grade A' ? 5 : grade === 'Grade B' ? 4 : 3;
  const rating = (count - 0.2).toFixed(1);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-3 h-3 ${i < count ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="text-[10px] font-semibold text-gray-400 ml-0.5">{rating}/5</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function MyProductsContent({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const [products, setProducts]       = useState<Product[]>(INITIAL_PRODUCTS);
  const [search, setSearch]           = useState('');
  const [catFilter, setCatFilter]     = useState('All');
  const [statusFilter, setStatus]     = useState('All');
  const [sortBy, setSortBy]           = useState<'newest' | 'price-asc' | 'price-desc' | 'stock-desc'>('newest');
  const [viewMode, setViewMode]       = useState<'grid' | 'table'>('grid');
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [modal, setModal]             = useState<null | 'add' | Product>(null);
  const [deleteTarget, setDeleteTarget] = useState<string[] | null>(null);
  const [zoomProduct, setZoomProduct] = useState<Product | null>(null);

  // ── Filter & sort ──────────────────────────
  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return (
      (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) &&
      (catFilter === 'All' || p.category === catFilter) &&
      (statusFilter === 'All' || p.status === statusFilter)
    );
  }).sort((a, b) => {
    if (sortBy === 'price-asc')   return a.price - b.price;
    if (sortBy === 'price-desc')  return b.price - a.price;
    if (sortBy === 'stock-desc')  return b.stock - a.stock;
    return Number(b.id) - Number(a.id);
  });

  // ── Selection ──────────────────────────────
  const allSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) filtered.forEach(p => next.delete(p.id));
    else             filtered.forEach(p => next.add(p.id));
    setSelected(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  // ── CRUD ───────────────────────────────────
  const saveProduct = (data: Omit<Product, 'id'> & { id?: string }) => {
    if (data.id) {
      setProducts(prev => prev.map(p => p.id === data.id ? { ...p, ...data, id: p.id } : p));
    } else {
      setProducts(prev => [{ ...data, id: String(Date.now()) }, ...prev]);
    }
    setModal(null);
  };

  const doDelete = (ids: string[]) => {
    setProducts(prev => prev.filter(p => !ids.includes(p.id)));
    setSelected(prev => { const n = new Set(prev); ids.forEach(id => n.delete(id)); return n; });
    setDeleteTarget(null);
  };

  const toggleStatus = (id: string) => {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, status: p.status === 'Active' ? 'Draft' : 'Active' } : p
    ));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Top Navbar ─────────────────────────── */}
      <header className="shrink-0 bg-white dark:bg-[#0D2118] border-b border-gray-100 dark:border-white/5 px-4 sm:px-6 py-2 min-h-14 flex items-center gap-3 flex-wrap shadow-sm">
        <button onClick={onOpenSidebar} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 cursor-pointer">
          <Menu className="w-5 h-5" />
        </button>

        <div className="shrink-0">
          <h1 className="text-xl font-extrabold text-[#1B4332] dark:text-emerald-400 leading-tight">My Products</h1>
          <p className="text-[13px] text-emerald-600 dark:text-emerald-500 font-medium mt-0.5 hidden sm:block">Manage your farm&apos;s inventory and listings</p>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none focus:border-emerald-500 transition-all" />
        </div>

        {/* Category filter */}
        <div className="relative shrink-0">
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="appearance-none pl-8 pr-8 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0D2118] text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer">
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Status filter */}
        <div className="relative shrink-0">
          <select value={statusFilter} onChange={e => setStatus(e.target.value)}
            className="appearance-none pl-3.5 pr-8 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0D2118] text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer">
            <option value="All">All Status</option>
            <option>Active</option>
            <option>Draft</option>
            <option>Out of Stock</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Add button */}
        <button onClick={() => setModal('add')}
          className="ml-auto shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add New Product</span>
          <span className="sm:hidden">Add</span>
        </button>
      </header>

      {/* ── Scrollable Body ─────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-[#F4F6F5] dark:bg-[#0B1512]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5 space-y-4">

          {/* Control bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0D2118] px-4 py-3 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Select all */}
              <button onClick={toggleAll} className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:text-[#1B4332] dark:hover:text-emerald-400 transition-colors">
                {allSelected
                  ? <CheckSquare className="w-4 h-4 text-[#1B4332] dark:text-emerald-400" />
                  : <Square className="w-4 h-4 text-gray-300 dark:text-gray-600" />}
                Select All
              </button>
              <span className="w-px h-4 bg-gray-200 dark:bg-white/10" />
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40">
                <Sparkles className="w-3.5 h-3.5" />
                {filtered.length} Product{filtered.length !== 1 ? 's' : ''}
              </span>
              {selected.size > 0 && (
                <button onClick={() => setDeleteTarget(Array.from(selected))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-xs font-bold border border-rose-200 dark:border-rose-800/40 hover:bg-rose-100 transition-colors cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selected.size})
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <div className="relative">
                <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  className="appearance-none pl-8 pr-8 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0D2118] text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer">
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                  <option value="stock-desc">Most Stock</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>

              {/* View switcher */}
              <div className="flex items-center bg-gray-100 dark:bg-white/5 p-0.5 rounded-xl border border-gray-200/60 dark:border-white/5">
                <button onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-[#0D2118] text-[#1B4332] dark:text-emerald-400 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-[#0D2118] text-[#1B4332] dark:text-emerald-400 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Empty state ─────────────────────── */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm">
              <Package className="w-14 h-14 text-gray-200 dark:text-gray-700" />
              <p className="text-base font-bold text-gray-600 dark:text-gray-300">No products found</p>
              <p className="text-xs text-gray-400">Try adjusting search or filters</p>
            </div>

          ) : viewMode === 'grid' ? (
            /* ── Card grid — vertical scroll, equal columns ── */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map(p => (
                <div key={p.id}
                  className={`bg-white dark:bg-[#0D2118] rounded-2xl border flex flex-col overflow-hidden shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                    selected.has(p.id)
                      ? 'border-[#1B4332] ring-2 ring-[#1B4332]/20'
                      : 'border-gray-100 dark:border-white/10'
                  }`}
                >
                  {/* Image */}
                  <div
                    className="relative h-[130px] bg-gray-100 dark:bg-white/5 overflow-hidden cursor-zoom-in"
                    onClick={() => setZoomProduct(p)}
                    title="Click to zoom"
                  >
                    <Image src={p.image} alt={p.name} fill sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 20vw"
                      className="object-cover hover:scale-105 transition-transform duration-500"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    {/* Category badge */}
                    <span className="absolute top-2 left-2 bg-[#1B4332] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {p.category}
                    </span>
                    {/* Status badge */}
                    <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status]}`}>
                      {p.status}
                    </span>
                    {/* Checkbox */}
                    <button onClick={() => toggleOne(p.id)} className="absolute bottom-2 right-2 cursor-pointer">
                      {selected.has(p.id)
                        ? <CheckSquare className="w-4 h-4 text-[#1B4332] drop-shadow" />
                        : <Square className="w-4 h-4 text-white drop-shadow" />}
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-3 flex-1 flex flex-col gap-1.5">
                    {/* Price */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-extrabold text-[#1B4332] dark:text-emerald-400 leading-none">ETB {p.price}</span>
                      <span className="text-[10px] text-gray-400">/{p.unit}</span>
                    </div>
                    {/* Name */}
                    <p className="text-[13px] font-bold text-gray-800 dark:text-white leading-snug line-clamp-2">{p.name}</p>
                    {/* Stars */}
                    <Stars grade={p.grade} />
                    {/* Description */}
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed flex-1">{p.description}</p>
                    {/* Stock */}
                    <p className={`text-[10px] font-semibold ${p.stock === 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {p.stock === 0 ? 'Out of stock' : `${p.stock} ${p.unit} available`}
                    </p>
                    {/* Status toggle */}
                    {p.status !== 'Out of Stock' && (
                      <button onClick={() => toggleStatus(p.id)} className="flex items-center gap-1 cursor-pointer text-gray-400 hover:text-[#1B4332] dark:hover:text-emerald-400 transition-colors">
                        {p.status === 'Active'
                          ? <ToggleRight className="w-4 h-4 text-emerald-500" />
                          : <ToggleLeft className="w-4 h-4" />}
                        <span className="text-[10px] font-semibold">{p.status}</span>
                      </button>
                    )}
                  </div>

                  {/* Edit / View / Delete footer */}
                  <div className="flex items-center border-t border-gray-100 dark:border-white/5">
                    <button onClick={() => setModal(p)}
                      className="flex-1 flex items-center justify-center gap-1 py-2.5 text-[11px] font-bold text-[#1B4332] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer">
                      <Pencil className="w-3 h-3" /> EDIT
                    </button>
                    <span className="w-px h-5 bg-gray-100 dark:bg-white/5" />
                    <button className="flex-1 flex items-center justify-center gap-1 py-2.5 text-[11px] font-bold text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors cursor-pointer">
                      <Eye className="w-3 h-3" /> VIEW
                    </button>
                    <span className="w-px h-5 bg-gray-100 dark:bg-white/5" />
                    <button onClick={() => setDeleteTarget([p.id])}
                      className="flex-1 flex items-center justify-center gap-1 py-2.5 text-[11px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors cursor-pointer">
                      <Trash2 className="w-3 h-3" /> DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>

          ) : (
            /* ── Table view ─────────────────────── */
            <div className="bg-white dark:bg-[#0D2118] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
              <div className="grid grid-cols-[40px_2.5fr_1.2fr_1fr_1fr_1.2fr_1.4fr] px-4 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50/70 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5">
                <button onClick={toggleAll} className="cursor-pointer">
                  {allSelected ? <CheckSquare className="w-4 h-4 text-[#1B4332] dark:text-emerald-400" /> : <Square className="w-4 h-4 text-gray-300 dark:text-gray-600" />}
                </button>
                <span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Status</span><span className="text-right">Actions</span>
              </div>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-2">
                  <Package className="w-12 h-12 text-gray-200 dark:text-gray-700" />
                  <p className="text-sm font-semibold text-gray-400">No products found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                  {filtered.map(p => (
                    <div key={p.id}
                      className={`grid grid-cols-[40px_2.5fr_1.2fr_1fr_1fr_1.2fr_1.4fr] items-center px-4 py-3.5 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors ${selected.has(p.id) ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                      <button onClick={() => toggleOne(p.id)} className="cursor-pointer">
                        {selected.has(p.id) ? <CheckSquare className="w-4 h-4 text-[#1B4332] dark:text-emerald-400" /> : <Square className="w-4 h-4 text-gray-300 dark:text-gray-600" />}
                      </button>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0 border border-gray-100 dark:border-white/5">
                          <Image src={p.image} alt={p.name} width={40} height={40} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{p.name}</p>
                          <p className="text-[10px] text-gray-400">{p.grade}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{p.category}</span>
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">ETB {p.price}/{p.unit}</span>
                      <span className={`text-xs font-semibold ${p.stock === 0 ? 'text-rose-500' : 'text-gray-700 dark:text-gray-300'}`}>
                        {p.stock === 0 ? '—' : `${p.stock} ${p.unit}`}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLES[p.status]}`}>{p.status}</span>
                        {p.status !== 'Out of Stock' && (
                          <button onClick={() => toggleStatus(p.id)} className="cursor-pointer text-gray-400 hover:text-[#1B4332] transition-colors">
                            {p.status === 'Active' ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setModal(p)} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20 text-gray-400 hover:text-sky-600 transition-colors cursor-pointer"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteTarget([p.id])} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer count */}
              <div className="px-5 py-3 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]">
                <span className="text-[11px] text-gray-400">{filtered.length} product{filtered.length !== 1 ? 's' : ''} total</span>
              </div>
            </div>
          )}

          <div className="h-4" />
        </div>
      </div>

      {/* ── Modals ──────────────────────────────── */}
      {modal !== null && (
        <ProductModal
          initial={modal !== 'add' ? (modal as Product) : undefined}
          onSave={saveProduct}
          onClose={() => setModal(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          names={deleteTarget.map(id => products.find(p => p.id === id)?.name ?? id)}
          onConfirm={() => doDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {zoomProduct && (
        <ZoomModal product={zoomProduct} onClose={() => setZoomProduct(null)} />
      )}
    </div>
  );
}
