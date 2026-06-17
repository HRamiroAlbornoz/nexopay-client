import React, { useEffect, useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { createProduct, updateProduct, deleteProduct } from '../../services/firebase/firestore';
import { uploadProductImage } from '../../services/upload/upload';
import { Product } from '../../types';
import Spinner from '../../components/common/Spinner';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, ShieldCheck, X, Image, AlertCircle, RefreshCw } from 'lucide-react';

const CATEGORIES = ['Laptops', 'Smartphones', 'Audio', 'Accesorios', 'Dispositivos Inteligentes', 'Vestimenta', 'Zapatillas', 'Ropa'];

export const ProductsCrud: React.FC = () => {
  const { products, loading, error, refreshCatalog, totalProducts } = useProducts();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [stock, setStock] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState('');
  
  // Image Upload States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  // Form validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync Form fields when editing changes
  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setDescription(editingProduct.description);
      setPrice(editingProduct.price);
      setCategory(editingProduct.category);
      setStock(editingProduct.stock);
      setImageUrl(editingProduct.imageUrl);
      setPreviewUrl(editingProduct.imageUrl);
    } else {
      resetForm();
    }
  }, [editingProduct]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice(0);
    setCategory(CATEGORIES[0]);
    setStock(0);
    setImageUrl('');
    setImageFile(null);
    setPreviewUrl('');
    setValidationErrors({});
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  // Real-time image change & preview creation
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Form Fields Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'El nombre de producto es obligatorio.';
    if (!description.trim()) errors.description = 'La descripción es obligatoria.';
    if (price <= 0) errors.price = 'El precio debe ser un número positivo mayor que cero.';
    if (stock < 0) errors.stock = 'El inventario no puede ser negativo.';
    if (!previewUrl) errors.image = 'Se requiere cargar una imagen representativa.';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler (Supports Create & Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    let finalImageUrl = imageUrl;

    try {
      // 1. Check if we need to upload a new file first
      if (imageFile) {
        setUploadingImage(true);
        finalImageUrl = await uploadProductImage(imageFile);
        setUploadingImage(false);
      }

      const productPayload = {
        name,
        description,
        price: parseFloat(price.toString()),
        category,
        stock: parseInt(stock.toString(), 10),
        imageUrl: finalImageUrl,
      };

      if (editingProduct) {
        // Edit Mode
        await updateProduct(editingProduct.id, productPayload);
      } else {
        // Create Mode
        await createProduct(productPayload);
      }

      setModalOpen(false);
      resetForm();
      refreshCatalog(); // Refresh live catalog table
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al registrar el producto.');
    } finally {
      setUploadingImage(false);
      setIsSaving(false);
    }
  };

  // Delete Handler
  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      '¿ADVERTENCIA: ¿Estás totalmente seguro de purgar este producto del catálogo central?'
    );
    if (confirmDelete) {
      try {
        await deleteProduct(id);
        refreshCatalog();
      } catch (err) {
        console.error(err);
        alert('Error al purgar el producto.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black py-12 px-4 sm:px-6 lg:px-8 cyber-grid relative select-none">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

      <div className="max-w-6xl mx-auto z-10 relative space-y-8">
        
        {/* Navigation Breadcrumb & Admin Controls Header */}
        <div className="border-b border-cyber-gray pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase bg-cyber-pink/10 border border-cyber-pink/30 text-cyber-pink px-2.5 py-0.5 mb-2">
              <ShieldCheck size={10} /> Consola de Administración Autorizada
            </div>
            <h1 className="font-display font-black text-3xl uppercase text-white tracking-widest">
              Catálogo <span className="text-cyber-cyan neon-text-cyan">CRUD</span>
            </h1>
            <p className="text-xs text-cyber-light/40 font-mono uppercase mt-1">
              Administración de inventario, adición de nuevos productos y carga de recursos S3
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="btn-neon-pink py-2.5 text-[9px] shadow-none hover:shadow-[0_0_15px_rgba(255,0,127,0.4)] flex items-center gap-1.5"
            >
              <Plus size={12} /> AÑADIR PRODUCTO
            </button>
            <Link to="/admin" className="btn-neon-violet py-2 text-[9px]">
              DASHBOARD METRICAS
            </Link>
            <Link to="/admin/orders" className="btn-neon-dark py-2 text-[9px]">
              GESTIÓN ÓRDENES
            </Link>
          </div>
        </div>

        {/* DATA TABLE VIEW */}
        <div className="bg-cyber-card border border-cyber-gray overflow-hidden relative">
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyber-cyan" />
          
          <div className="p-4 bg-cyber-black/60 border-b border-cyber-gray/80 flex justify-between items-center font-mono text-[9px] text-cyber-light/45 uppercase">
            <span>REGISTRO DE INVENTARIO ({totalProducts} ARTÍCULOS)</span>
            <button onClick={refreshCatalog} className="text-cyber-cyan hover:text-white transition-colors">
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {loading && products.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
              <Spinner />
              <span className="text-[10px] font-mono text-cyber-light/40 uppercase">
                Sincronizando catálogo con base de datos...
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-cyber-black text-cyber-light/50 border-b border-cyber-gray uppercase text-[10px]">
                    <th className="p-4 w-16">PREVIEW</th>
                    <th className="p-4">NOMBRE PRODUCTO</th>
                    <th className="p-4">CATEGORÍA</th>
                    <th className="p-4">VALOR</th>
                    <th className="p-4">STOCK</th>
                    <th className="p-4 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-gray/40 text-white uppercase">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-cyber-black/40 transition-colors">
                      <td className="p-4">
                        <div className="w-10 h-10 border border-cyber-gray overflow-hidden bg-cyber-black flex items-center justify-center">
                          <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="p-4 font-bold tracking-tight text-white">{p.name}</td>
                      <td className="p-4 text-cyber-light/60">{p.category}</td>
                      <td className="p-4 text-cyber-cyan font-bold">${p.price.toFixed(2)}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 border text-[9px] ${
                            p.stock <= 0
                              ? 'border-cyber-pink/30 text-cyber-pink bg-cyber-pink/5'
                              : p.stock <= 5
                              ? 'border-cyber-yellow/30 text-cyber-yellow bg-cyber-yellow/5'
                              : 'border-cyber-lime/30 text-cyber-lime bg-cyber-lime/5'
                          }`}
                        >
                          {p.stock} U
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan hover:text-cyber-black transition-colors cursor-pointer outline-none"
                            title="Editar"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 border border-cyber-pink/30 text-cyber-pink hover:bg-cyber-pink hover:text-cyber-black transition-colors cursor-pointer outline-none"
                            title="Eliminar"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL EDIT / CREATE GLOWING CONSOLE */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-cyber-black/85 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
            
            <div className="relative w-full max-w-lg bg-cyber-card border border-cyber-cyan shadow-[0_0_30px_rgba(0,240,255,0.2)] p-6 z-10 flex flex-col justify-between">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-cyber-gray pb-4 mb-6">
                <h3 className="font-display font-black text-sm uppercase text-white tracking-widest flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-cyber-cyan animate-pulse" />
                  {editingProduct ? 'MODIFICAR ARTEFACTO' : 'REGISTRAR NUEVO MÓDULO'}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-cyber-light/45 hover:text-cyber-pink transition-colors p-1"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs uppercase">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-cyber-light/50">Nombre Producto</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="CYBER SHIELD BUZO"
                      className="w-full bg-cyber-black border border-cyber-gray focus:border-cyber-cyan focus:shadow-neon-cyan p-2 text-white outline-none"
                    />
                    {validationErrors.name && (
                      <p className="text-[8px] text-cyber-pink">{validationErrors.name}</p>
                    )}
                  </div>

                  {/* Category Field */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-cyber-light/50">Categoría</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-cyber-black border border-cyber-gray focus:border-cyber-cyan p-2 text-white outline-none cursor-pointer"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Price field */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-cyber-light/50">Valor ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(parseFloat(e.target.value))}
                      className="w-full bg-cyber-black border border-cyber-gray focus:border-cyber-cyan focus:shadow-neon-cyan p-2 text-white outline-none"
                    />
                    {validationErrors.price && (
                      <p className="text-[8px] text-cyber-pink">{validationErrors.price}</p>
                    )}
                  </div>

                  {/* Stock field */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-cyber-light/50">Stock Disponible</label>
                    <input
                      type="number"
                      required
                      value={stock}
                      onChange={(e) => setStock(parseInt(e.target.value, 10))}
                      className="w-full bg-cyber-black border border-cyber-gray focus:border-cyber-cyan focus:shadow-neon-cyan p-2 text-white outline-none"
                    />
                    {validationErrors.stock && (
                      <p className="text-[8px] text-cyber-pink">{validationErrors.stock}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] text-cyber-light/50">Descripción Táctica</label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Buzo táctico impermeable con detalles neón..."
                    className="w-full bg-cyber-black border border-cyber-gray focus:border-cyber-cyan p-2 text-white outline-none resize-none"
                  />
                  {validationErrors.description && (
                    <p className="text-[8px] text-cyber-pink">{validationErrors.description}</p>
                  )}
                </div>

                {/* Image Upload Input File */}
                <div className="bg-cyber-black p-4 border border-cyber-gray flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-16 h-16 border border-cyber-gray bg-cyber-card flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {previewUrl ? (
                      <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Image size={24} className="text-cyber-light/20" />
                    )}
                  </div>
                  <div className="space-y-1.5 flex-grow w-full">
                    <label className="text-[10px] text-cyber-light/50 block">CARGAR RECURSO IMAGEN</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="text-[9px] text-cyber-light/40 file:bg-cyber-gray file:border file:border-cyber-cyan file:text-cyber-cyan file:px-2 file:py-1 file:mr-2 file:cursor-pointer hover:file:bg-cyber-cyan hover:file:text-cyber-black hover:file:scale-105 file:transition-all cursor-pointer"
                    />
                    {validationErrors.image && (
                      <p className="text-[8px] text-cyber-pink block">{validationErrors.image}</p>
                    )}
                  </div>
                </div>

                {/* Status loading overlays */}
                {uploadingImage && (
                  <div className="text-[10px] text-cyber-cyan font-mono flex items-center gap-2 bg-cyber-cyan/5 border-l-2 border-cyber-cyan p-2">
                    <Spinner size="sm" /> SUBIENDO IMAGEN EN DIRECTO A NODO S3...
                  </div>
                )}
                
                {isSaving && (
                  <div className="text-[10px] text-cyber-pink font-mono flex items-center gap-2 bg-cyber-pink/5 border-l-2 border-cyber-pink p-2">
                    <Spinner size="sm" /> REGISTRANDO NODO EN BASE DE DATOS...
                  </div>
                )}

                {/* Form Footer Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-cyber-gray">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn-neon-dark py-2 text-[9px]"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingImage || isSaving}
                    className="btn-neon-pink py-2 text-[9px] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    GUARDAR REGISTRO
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductsCrud;
