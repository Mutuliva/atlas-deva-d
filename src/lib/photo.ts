export async function preparePhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024)
    throw Error('Alege o fotografie JPEG, PNG sau WebP de maximum 8 MB.')
  const image = await createImageBitmap(file)
  try {
    if (!image.width || !image.height || image.width * image.height > 24000000)
      throw Error('Rezoluția fotografiei este prea mare.')
    const sc = Math.min(1, 1240 / Math.max(image.width, image.height))
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(image.width * sc))
    c.height = Math.max(1, Math.round(image.height * sc))
    const ctx = c.getContext('2d')
    if (!ctx) throw Error('Prelucrarea fotografiei nu este disponibilă.')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.drawImage(image, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', 0.82)
  } finally {
    image.close()
  }
}
