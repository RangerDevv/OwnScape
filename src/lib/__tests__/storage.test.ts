import { parseUrls } from '@/lib/storage'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/img.jpg' } }),
      }),
    },
  },
}))

describe('parseUrls', () => {
  it('returns empty array for null input', () => {
    expect(parseUrls(null)).toEqual([])
  })

  it('returns empty array for undefined-like input', () => {
    expect(parseUrls(undefined as unknown as string)).toEqual([])
  })

  it('parses a JSON array of URLs', () => {
    const urls = ['https://example.com/1.jpg', 'https://example.com/2.jpg']
    expect(parseUrls(JSON.stringify(urls))).toEqual(urls)
  })

  it('wraps a single URL string in an array', () => {
    expect(parseUrls('https://example.com/image.jpg')).toEqual(['https://example.com/image.jpg'])
  })

  it('returns the raw string if JSON parsing fails with non-array', () => {
    expect(parseUrls('not-a-url')).toEqual(['not-a-url'])
  })
})
