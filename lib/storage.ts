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

  for (const asset of result.assets) {
    if (asset.fileSize && asset.fileSize > MAX_SIZE) {
      alert('One or more images exceed the 5MB limit. Choose smaller files.')
      return []
    }
  }

  return result.assets
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
