import * as ImagePicker from 'expo-image-picker'
import { supabase } from './supabase'

const MAX_SIZE = 5 * 1024 * 1024

function parseUrls(storageKey: string | null): string[] {
  if (!storageKey) return []
  try {
    const parsed = JSON.parse(storageKey)
    return Array.isArray(parsed) ? parsed : [storageKey]
  } catch {
    return [storageKey]
  }
}

export { parseUrls }

export async function pickImages(): Promise<ImagePicker.ImagePickerAsset[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permission.granted) {
    alert('Camera roll permission is required to pick images.')
    return []
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.7,
  })

  if (result.canceled || !result.assets?.length) return []

  const oversized = result.assets.filter(a => a.fileSize && a.fileSize > MAX_SIZE)
  if (oversized.length > 0) {
    alert(`${oversized.length} image(s) exceed the 5MB limit and were skipped.`)
  }

  return result.assets.filter(a => !a.fileSize || a.fileSize <= MAX_SIZE)
}

export async function uploadImage(asset: ImagePicker.ImagePickerAsset, userId: string): Promise<string | null> {
  const ext = asset.fileName?.split('.').pop() || 'jpg'
  const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  let blob: Blob
  try {
    const response = await fetch(asset.uri)
    blob = await response.blob()
  } catch {
    alert('Could not read a selected image. Try a different file.')
    return null
  }

  const { error } = await supabase.storage
    .from('Post')
    .upload(fileName, blob, { contentType: asset.mimeType || 'image/jpeg', upsert: true })

  if (error) {
    if (error.message.includes('permission') || error.message.includes('unauthorized') || error.message.includes('policy')) {
      alert('Upload blocked by storage permissions. Run the storage policy SQL from supabase-setup.sql.')
    } else {
      alert('Upload failed: ' + error.message)
    }
    return null
  }

  const { data: urlData } = supabase.storage.from('Post').getPublicUrl(fileName)
  return urlData?.publicUrl || null
}

export async function deleteStorageImages(urls: string[]): Promise<void> {
  const paths: string[] = []
  for (const url of urls) {
    const parts = url.split('/Post/')
    if (parts.length === 2) {
      const path = decodeURIComponent(parts[1].split('?')[0])
      paths.push(path)
    }
  }
  if (paths.length === 0) return
  await supabase.storage.from('Post').remove(paths)
}
