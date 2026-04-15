'use client';

import { useState } from 'react';
import { Upload, FileText, Download, Trash2, Plus, X, Check, Search, Filter } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  category: string;
  uploadDate: string;
  size: string;
  type: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([
    { id: '1', name: 'Prescription_Mamadou_Diallo.pdf', category: 'Prescriptions', uploadDate: '2024-04-15', size: '245 KB', type: 'PDF' },
    { id: '2', name: 'Analyse_Sang_2024.pdf', category: 'Analyses', uploadDate: '2024-04-14', size: '1.2 MB', type: 'PDF' },
    { id: '3', name: 'Radiographie_Thorax.pdf', category: 'Imagerie', uploadDate: '2024-04-13', size: '3.5 MB', type: 'PDF' },
    { id: '4', name: 'Certificat_Medical.pdf', category: 'Certificats', uploadDate: '2024-04-12', size: '156 KB', type: 'PDF' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const categories = ['Prescriptions', 'Analyses', 'Imagerie', 'Certificats', 'Autres'];

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
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
          <Plus size={20} />
          Uploader Document
        </button>
      </div>

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
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((doc) => (
          <div key={doc.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="text-blue-600" size={24} />
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Download size={18} />
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{doc.name}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">Catégorie :</span> {doc.category}</p>
              <p><span className="font-medium">Taille :</span> {doc.size}</p>
              <p><span className="font-medium">Date :</span> {new Date(doc.uploadDate).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Uploader un Document</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                <p className="font-medium text-gray-800">Cliquez pour uploader</p>
                <p className="text-sm text-gray-600">ou glissez-déposez un fichier</p>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Check size={18} />
                Uploader
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
