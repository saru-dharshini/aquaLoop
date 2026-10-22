/**
 * Leaflet DivIcon Generators — AquaLoop Phase 4 Step 2
 *
 * Lightweight, offline custom HTML/SVG pins for Leaflet.
 * Eliminates external PNG asset loading issues and matches AquaLoop theme colors.
 */
import L from 'leaflet'

export function getCategoryMetadata(type) {
  switch (type) {
    case 'public_leak':
      return { label: 'Water Leak', color: '#0284c7', emoji: '💧' }
    case 'water_contamination':
      return { label: 'Contamination', color: '#dc2626', emoji: '⚠️' }
    case 'community_wastage':
      return { label: 'Water Wastage', color: '#7c3aed', emoji: '♻️' }
    case 'dry_public_tap':
      return { label: 'Dry Public Tap', color: '#ea580c', emoji: '🏜️' }
    default:
      return { label: 'Water Issue', color: '#0284c7', emoji: '💧' }
  }
}

export function createCategoryIcon(type, status) {
  const meta = getCategoryMetadata(type)
  const isResolved = status === 'resolved'
  const ringColor = isResolved ? '#16a34a' : meta.color

  const html = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: white;
      border: 3px solid ${ringColor};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 3px 6px rgba(0,0,0,0.25);
      cursor: pointer;
    ">
      <div style="transform: rotate(45deg); font-size: 14px; line-height: 1;">
        ${meta.emoji}
      </div>
    </div>
  `

  return L.divIcon({
    className: 'aqualoop-marker-pin',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

export function createPickerIcon() {
  const html = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: #0284c7;
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 10px rgba(2,132,199,0.5);
      cursor: grab;
    ">
      <div style="transform: rotate(45deg); font-size: 16px; color: white;">
        📍
      </div>
    </div>
  `

  return L.divIcon({
    className: 'aqualoop-picker-pin',
    html,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })
}
