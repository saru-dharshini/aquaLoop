/**
 * Image Sanitizer Utility — AquaLoop Phase 4
 *
 * Implements pure-JavaScript buffer validation and metadata sanitisation:
 * 1. Validates magic bytes (JPEG: FF D8 FF; PNG: 89 50 4E 47 0D 0A 1A 0A).
 * 2. Explicitly rejects unsafe or unsupported formats (WebP, SVG, GIF, BMP, HEIC).
 * 3. Strips EXIF/GPS and APPn metadata from JPEG streams, enforces valid SOF frame header,
 *    and slices cleanly at real EOI (FF D9) to discard any appended polyglot payloads.
 * 4. Strips ancillary metadata chunks (eXIf, tEXt, zTXt, iTXt, tIME, pHYs) from PNG streams,
 *    and enforces structural requirements (IHDR first, IDAT present, IEND terminating).
 * 5. Rejects truncated or malformed buffers.
 *
 * Note on capabilities:
 * This utility performs structural marker/chunk stream filtering and metadata stripping in pure JS.
 * It does NOT perform full pixel-level decompression or re-encoding.
 * Zero external binary dependencies; runs with 100% parity across platforms at ₹0 cost.
 */

/**
 * Checks file signature (magic bytes).
 * @param {Buffer} buffer
 * @returns {'jpeg' | 'png' | null}
 */
export function detectImageFormat(buffer) {
  if (!buffer || buffer.length < 3) return null

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg'
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png'
  }

  return null
}

/**
 * Strips EXIF/GPS and APPn segments from a JPEG buffer.
 * Keeps: SOI (FF D8), DQT (FF DB), DHT (FF C4), SOF (FF C0..C3, etc.), SOS (FF DA), EOI (FF D9).
 * Drops: APP0..APP15 (FF E0..EF), COM (FF FE), and any trailing polyglot bytes after EOI.
 * Rejects: Missing SOF, missing SOS, missing EOI, truncated segments, or malformed marker lengths.
 *
 * @param {Buffer} buffer
 * @returns {Buffer} Sanitized JPEG buffer
 */
export function sanitizeJPEG(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new Error('Invalid JPEG format')
  }

  const chunks = [Buffer.from([0xff, 0xd8])] // SOI
  let offset = 2
  let hasSOF = false
  let hasSOS = false
  let hasEOI = false

  while (offset < buffer.length) {
    // Find next marker (0xFF followed by non-0x00)
    if (buffer[offset] !== 0xff) {
      offset++
      continue
    }

    const marker = buffer[offset + 1]

    // Fill bytes (0xFF 0xFF)
    if (marker === 0xff) {
      offset++
      continue
    }

    // EOI (End of Image) before SOS — invalid order
    if (marker === 0xd9) {
      if (!hasSOS) {
        throw new Error('Malformed JPEG: EOI encountered before SOS')
      }
      chunks.push(Buffer.from([0xff, 0xd9]))
      hasEOI = true
      break
    }

    // SOS (Start of Scan) — image entropy data follows until EOI
    if (marker === 0xda) {
      if (!hasSOF) {
        throw new Error('Malformed JPEG: missing SOF frame header before SOS')
      }
      hasSOS = true

      // Marker header has 2-byte length
      if (offset + 4 > buffer.length) {
        throw new Error('Truncated JPEG SOS marker length')
      }
      const sosLength = buffer.readUInt16BE(offset + 2)
      if (offset + 2 + sosLength > buffer.length) {
        throw new Error('Malformed JPEG SOS length exceeds buffer')
      }

      // Search for EOI (0xFF 0xD9) in entropy-coded scan data starting after SOS header
      let eoiOffset = -1
      for (let i = offset + 2 + sosLength; i < buffer.length - 1; i++) {
        if (buffer[i] === 0xff && buffer[i + 1] === 0xd9) {
          eoiOffset = i
          break
        }
      }

      if (eoiOffset === -1) {
        throw new Error('Malformed or truncated JPEG: missing EOI marker after SOS')
      }

      // Append SOS up through EOI (eoiOffset + 2), strictly dropping any polyglot bytes trailing after EOI
      chunks.push(buffer.subarray(offset, eoiOffset + 2))
      hasEOI = true
      break
    }

    // Standalone markers with no length payload (RST0..RST7, SOI, TEM)
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      chunks.push(buffer.subarray(offset, offset + 2))
      offset += 2
      continue
    }

    // Markers with length payload: offset+2 has 2-byte big-endian length (including length itself)
    if (offset + 4 > buffer.length) {
      throw new Error('Truncated JPEG marker length')
    }

    const length = buffer.readUInt16BE(offset + 2)
    if (length < 2) {
      throw new Error('Malformed JPEG marker length too small')
    }
    const segmentEnd = offset + 2 + length
    if (segmentEnd > buffer.length) {
      throw new Error('Malformed JPEG segment length exceeds buffer')
    }

    // Track SOF (Start of Frame: baseline, extended, progressive, etc.)
    const isSOF =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)

    if (isSOF) {
      hasSOF = true
    }

    // Strip APP0..APP15 (0xE0..0xEF) and COM (0xFE)
    const isAppOrCom = (marker >= 0xe0 && marker <= 0xef) || marker === 0xfe

    if (!isAppOrCom) {
      chunks.push(buffer.subarray(offset, segmentEnd))
    }

    offset = segmentEnd
  }

  if (!hasSOF) {
    throw new Error('Malformed JPEG: missing SOF frame header')
  }
  if (!hasSOS) {
    throw new Error('Malformed JPEG: missing SOS marker')
  }
  if (!hasEOI) {
    throw new Error('Malformed or truncated JPEG: missing EOI marker')
  }

  return Buffer.concat(chunks)
}

/**
 * Strips ancillary metadata chunks from a PNG buffer.
 * Retains critical chunks: IHDR, PLTE, IDAT, IEND.
 * Drops: eXIf, tEXt, zTXt, iTXt, tIME, pHYs, and trailing bytes after IEND.
 * Enforces: First chunk is IHDR, at least one IDAT chunk exists, and IEND terminates stream.
 *
 * @param {Buffer} buffer
 * @returns {Buffer} Sanitized PNG buffer
 */
export function sanitizePNG(buffer) {
  const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_HEADER)) {
    throw new Error('Invalid PNG header')
  }

  const chunks = [PNG_HEADER]
  let offset = 8
  let hasIHDR = false
  let hasIDAT = false
  let hasIEND = false

  // Critical chunks to keep
  const criticalTypes = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND'])

  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) {
      throw new Error('Truncated PNG chunk header')
    }

    const length = buffer.readUInt32BE(offset)
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii')

    // First chunk must strictly be IHDR
    if (offset === 8) {
      if (type !== 'IHDR') {
        throw new Error('Malformed PNG: first chunk must be IHDR')
      }
      hasIHDR = true
    }

    const totalChunkLength = 12 + length // 4 (length) + 4 (type) + length (data) + 4 (crc)

    if (offset + totalChunkLength > buffer.length) {
      throw new Error('Malformed PNG chunk length exceeds buffer')
    }

    if (type === 'IDAT') {
      hasIDAT = true
    }

    if (criticalTypes.has(type)) {
      chunks.push(buffer.subarray(offset, offset + totalChunkLength))
    }

    if (type === 'IEND') {
      hasIEND = true
      break
    }

    offset += totalChunkLength
  }

  if (!hasIHDR) {
    throw new Error('Malformed PNG: missing IHDR chunk')
  }
  if (!hasIDAT) {
    throw new Error('Malformed PNG: missing IDAT chunk')
  }
  if (!hasIEND) {
    throw new Error('Malformed or truncated PNG: missing IEND chunk')
  }

  return Buffer.concat(chunks)
}

/**
 * Validates and sanitizes an uploaded image buffer.
 * @param {Buffer} buffer
 * @returns {{ sanitizedBuffer: Buffer, format: 'jpeg' | 'png', extension: 'jpg' | 'png' }}
 */
export function sanitizeImageBuffer(buffer) {
  if (!buffer || buffer.length === 0) {
    const err = new Error('No image data provided')
    err.status = 400
    throw err
  }

  // Maximum upload size 5MB
  if (buffer.length > 5 * 1024 * 1024) {
    const err = new Error('Image size exceeds 5MB limit')
    err.status = 413
    throw err
  }

  const format = detectImageFormat(buffer)
  if (!format) {
    const err = new Error(
      'Unsupported or invalid image format. Only JPEG and PNG images are accepted.',
    )
    err.status = 400
    throw err
  }

  try {
    if (format === 'jpeg') {
      const sanitized = sanitizeJPEG(buffer)
      return { sanitizedBuffer: sanitized, format: 'jpeg', extension: 'jpg' }
    } else {
      const sanitized = sanitizePNG(buffer)
      return { sanitizedBuffer: sanitized, format: 'png', extension: 'png' }
    }
  } catch (err) {
    const error = new Error(`Malformed or unparseable image data: ${err.message}`)
    error.status = 400
    throw error
  }
}
