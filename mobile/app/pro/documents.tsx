import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView,
  ActivityIndicator, TextInput, Modal, Alert, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import api from '@/lib/api';
import { getToken } from '@/lib/auth';

const T = '#0d9488';

interface Doc {
  id: string;
  name: string;
  category: string;
  uploadDate: string;
  size?: number;
  url: string;
}

const CATEGORIES = ['Tous', 'Prescriptions', 'Analyses', 'Imagerie', 'Certificats', 'Autres'];
const CAT_ICON: Record<string, string> = {
  Prescriptions: 'document-text', Analyses: 'flask', Imagerie: 'image',
  Certificats: 'ribbon', Autres: 'attach',
};

function fmtSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProDocumentsScreen() {
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tous');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<any>(null);
  const [uploadCategory, setUploadCategory] = useState('Autres');
  const [uploading, setUploading] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/pro/documents')
      .then(res => setDocs(res.data.documents || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (!result.canceled && result.assets?.length) setUploadFile(result.assets[0]);
  };

  const uploadDoc = async () => {
    if (!uploadFile) return Alert.alert('Requis', 'Sélectionnez un fichier.');
    setUploading(true);
    try {
      const token = await getToken();
      const fd = new FormData();
      fd.append('file', { uri: uploadFile.uri, name: uploadFile.name, type: uploadFile.mimeType || 'application/octet-stream' } as any);
      fd.append('category', uploadCategory);
      await fetch(`${api.defaults.baseURL}/pro/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      setShowUpload(false);
      setUploadFile(null);
      load();
    } catch {
      Alert.alert('Erreur', 'Impossible d\'uploader le document.');
    } finally {
      setUploading(false);
    }
  };

  const deleteDoc = (id: string) => {
    Alert.alert('Supprimer', 'Voulez-vous supprimer ce document ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/pro/documents?id=${id}`);
          load();
        } catch {
          Alert.alert('Erreur', 'Impossible de supprimer ce document.');
        }
      }},
    ]);
  };

  const filtered = docs.filter(d => {
    const matchCat = category === 'Tous' || d.category === category;
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={{ backgroundColor: T, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600' }}>Retour</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowUpload(true)} style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Uploader</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 14 }}>Documents</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 12 }}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un document..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={{ flex: 1, paddingVertical: 10, paddingLeft: 8, color: '#fff', fontSize: 14 }}
          />
        </View>
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setCategory(cat)}
            style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: category === cat ? T : '#fff', borderWidth: 1.5, borderColor: category === cat ? T : '#e2e8f0' }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: category === cat ? '#fff' : '#64748b' }}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={T} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}>
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
              <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 15 }}>Aucun document</Text>
              <TouchableOpacity onPress={() => setShowUpload(true)} style={{ marginTop: 20, backgroundColor: T, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Uploader un document</Text>
              </TouchableOpacity>
            </View>
          ) : filtered.map(doc => (
            <View key={doc.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={(CAT_ICON[doc.category] || 'document') as any} size={22} color={T} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }} numberOfLines={1}>{doc.name}</Text>
                <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{doc.category} · {doc.uploadDate}{doc.size ? ` · ${fmtSize(doc.size)}` : ''}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => Linking.openURL(doc.url)} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="download-outline" size={18} color={T} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteDoc(doc.id)} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="trash-outline" size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Upload modal */}
      <Modal visible={showUpload} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 20 }}>Uploader un document</Text>
            <TouchableOpacity
              onPress={pickFile}
              style={{ borderWidth: 2, borderColor: T, borderStyle: 'dashed', borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, marginBottom: 16, backgroundColor: uploadFile ? '#f0fdfa' : '#fafafa' }}
            >
              <Ionicons name="cloud-upload" size={32} color={uploadFile ? T : '#94a3b8'} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: uploadFile ? T : '#64748b', textAlign: 'center' }}>
                {uploadFile ? uploadFile.name : 'Appuyez pour sélectionner\nPDF ou image (max 10 MB)'}
              </Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 10 }}>Catégorie</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {CATEGORIES.filter(c => c !== 'Tous').map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setUploadCategory(cat)}
                  style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 2, borderColor: uploadCategory === cat ? T : '#e2e8f0', backgroundColor: uploadCategory === cat ? '#f0fdfa' : '#f8fafc' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: uploadCategory === cat ? T : '#64748b' }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => { setShowUpload(false); setUploadFile(null); }} style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ fontWeight: '700', color: '#64748b' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={uploadDoc} disabled={uploading || !uploadFile} style={{ flex: 1, backgroundColor: T, borderRadius: 12, paddingVertical: 14, alignItems: 'center', opacity: uploadFile ? 1 : 0.5 }}>
                {uploading ? <ActivityIndicator color="#fff" /> : <Text style={{ fontWeight: '700', color: '#fff' }}>Uploader</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
