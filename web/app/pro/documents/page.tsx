'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Download, Trash2, X, Search, Filter, Loader2, AlertCircle } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  category: string;
  uploadDate: string;
  size: string;
  url: string;
}

const CATEGORIES = ['Prescriptions', 'Analyses', 'Imagerie', 'Certificats', 'Autres'];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Autres');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/pro/documents')
      .then(r => r.json())
      .then(data => {
        if (data.documents) setDocuments(data.documents);
        else setError(data.error || 'Erreur de chargement');
      })
      .catch(() => setError('Erreur réseau'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = documents.filter(doc => {
    const matchSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === 'all' || doc.category === filterCategory;
    return matchSearch && matchCat;
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError('');

    const form = new FormData();
    form.append('file', selectedFile);
    form.append('category', selectedCategory);

    try {
      const res = await fetch('/api/pro/documents', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok) {
        setDocuments(prev => [...prev, data.document]);
        setShowModal(false);
        setSelectedFile(null);
        setSuccess('Document uploadé avec succès');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Erreur lors de l\'upload');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/pro/documents?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch {
      setError('Erreur réseau');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestion des Documents</h1>
          <p className="text-gray-600 mt-2">Gérez les documents patients et médicaux</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Upload size={20} />
          Uploader Document
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <AlertCircle size={20} />
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les catégories</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Aucun document</p>
          <p className="text-gray-400 text-sm mt-1">Uploadez votre premier document</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-blue-600" size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={doc.url}
                    download={doc.name}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Télécharger"
                  >
                    <Download size={18} />
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2 truncate" title={doc.name}>{doc.name}</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Catégorie :</span> {doc.category}</p>
                <p><span className="font-medium">Taille :</span> {doc.size}</p>
                <p><span className="font-medium">Date :</span> {new Date(doc.uploadDate).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Uploader un Document</h2>
              <button onClick={() => { setShowModal(false); setSelectedFile(null); }} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                {selectedFile ? (
                  <div>
                    <p className="font-medium text-blue-600">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {Math.round(selectedFile.size / 1024)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-gray-800">Cliquez pour sélectionner</p>
                    <p className="text-sm text-gray-500">PDF, images, etc. — max 10 MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => { setShowModal(false); setSelectedFile(null); }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                {uploading ? 'Upload en cours...' : 'Uploader'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
