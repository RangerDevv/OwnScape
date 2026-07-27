import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import BottomNav from '@/components/bottom-nav'

const TRENDING = [
  { id: '1', image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=500&auto=format&fit=crop&q=80', likes: '1.2k', handle: '@catlover' },
  { id: '2', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80', likes: '840', handle: '@mayar' },
  { id: '3', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80', likes: '652', handle: '@artgallery' },
  { id: '4', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&auto=format&fit=crop&q=80', likes: '2.1k', handle: '@peaks' },
  { id: '5', image: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=500&auto=format&fit=crop&q=80', likes: '930', handle: '@breakfast' },
  { id: '6', image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80', likes: '1.5k', handle: '@cyber' },
]

const TAGS = ['#decentralized', '#ownyourdata', '#web3', '#art', '#nature', '#photography', '#crypto']

export default function ExploreScreen() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState('#decentralized')

  return (
    <View style={styles.page}>
      <View style={styles.searchHeader}>
        <TextInput placeholder="Search posts, tags & users..." placeholderTextColor="#6b7280"
          style={styles.searchInput} value={query} onChangeText={setQuery} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsRow}>
          {TAGS.map(tag => (
            <Pressable key={tag} style={[styles.tag, activeTag === tag && styles.tagActive]}
              onPress={() => setActiveTag(tag)}>
              <Text style={[styles.tagText, activeTag === tag && styles.tagTextActive]}>{tag}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TRENDING</Text>
          <Text style={styles.sectionTag}>{activeTag}</Text>
        </View>

        <View style={styles.grid}>
          {TRENDING.map(item => (
            <Pressable key={item.id} style={styles.gridItem} onPress={() => router.push('/feed')}>
              <Image source={{ uri: item.image }} style={styles.gridImage} />
              <View style={styles.gridOverlay}>
                <Text style={styles.gridHandle}>{item.handle}</Text>
                <Text style={styles.gridLikes}>⭐ {item.likes}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <BottomNav active="explore" />
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fffdf0' },
  searchHeader: { padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 3, borderBottomColor: '#000' },
  searchInput: {
    backgroundColor: '#f3f4f6', borderWidth: 2, borderColor: '#000', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: '#000',
  },
  scrollContent: { paddingBottom: 110 },
  tagsRow: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  tag: {
    backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#000', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  tagActive: { backgroundColor: '#ffe600' },
  tagText: { fontSize: 12, fontWeight: '900', color: '#000' },
  tagTextActive: { color: '#000' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginTop: 10, marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
  sectionTag: {
    fontSize: 12, fontWeight: '900', backgroundColor: '#ff70a6',
    paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1.5, borderColor: '#000', color: '#000',
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 12,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%', height: 180, backgroundColor: '#ffffff', borderRadius: 8,
    borderWidth: 2.5, borderColor: '#000', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
    marginBottom: 4,
  },
  gridImage: { width: '100%', height: '100%' },
  gridOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 6, borderTopWidth: 2, borderTopColor: '#000',
  },
  gridHandle: { fontSize: 11, fontWeight: '900', color: '#000' },
  gridLikes: { fontSize: 11, fontWeight: '900', color: '#000' },
})
