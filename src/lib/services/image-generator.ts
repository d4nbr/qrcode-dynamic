import path from 'node:path'
import { createCanvas, GlobalFonts } from '@napi-rs/canvas'
import QRCode from 'qrcode'
import sharp from 'sharp'
import type { GenerateImageParams } from '@/lib/types'
import { buildQrString } from '@/lib/utils'

// oabma-template-wallpaper.png native resolution
const ORIG_W = 1672
const ORIG_H = 941
const OUT_W = 1920
const OUT_H = 1080

function sx(x: number) { return Math.round(x * (OUT_W / ORIG_W)) }
function sy(y: number) { return Math.round(y * (OUT_H / ORIG_H)) }

// White content rectangle measured by pixel analysis of oabma-template-wallpaper.png
const WHITE = { left: 711, top: 230, right: 1035, bottom: 733 } as const
const WHITE_W = WHITE.right - WHITE.left   // 324 px in original
const PAD = 18                             // inner padding (original px)

// QR code fills usable width, anchored at top of white area
const QR_SIZE_ORIG = WHITE_W - PAD * 2                              // 288
const QR_LEFT_ORIG = WHITE.left + Math.floor((WHITE_W - QR_SIZE_ORIG) / 2) // 729
const QR_TOP_ORIG  = WHITE.top + PAD                               // 248

// Text block starts just below QR (original-coord y)
const TEXT_Y_ORIG  = QR_TOP_ORIG + QR_SIZE_ORIG + PAD             // 554
const CENTER_X_ORIG = WHITE.left + WHITE_W / 2                    // 873

let fontsRegistered = false

function registerFonts() {
  if (fontsRegistered) return
  const fontsDir = path.join(process.cwd(), 'public', 'fonts')
  GlobalFonts.registerFromPath(path.join(fontsDir, 'GeistBold.ttf'),    'GeistBold')
  GlobalFonts.registerFromPath(path.join(fontsDir, 'GeistRegular.ttf'), 'GeistRegular')
  fontsRegistered = true
}

async function buildQrBuffer(qrString: string): Promise<Buffer> {
  return QRCode.toBuffer(qrString, {
    type: 'png',
    width: sx(QR_SIZE_ORIG),
    margin: 1,
    errorCorrectionLevel: 'H',
    color: { dark: '#001A40', light: '#FFFFFF' },
  }) as Promise<Buffer>
}

async function buildTextOverlay(
  wifiSsid: string,
  wifiPassword: string,
  wifiSecurity: string,
): Promise<Buffer> {
  registerFonts()

  const canvas = createCanvas(OUT_W, OUT_H)
  const ctx = canvas.getContext('2d')

  // Output-space coordinates for the text block
  const cx    = sx(CENTER_X_ORIG)
  const maxW  = sx(WHITE_W - PAD * 2)
  const lineX = sx(WHITE.left + PAD)

  ctx.textAlign    = 'center'
  ctx.textBaseline = 'top'

  let y = sy(TEXT_Y_ORIG)

  // Thin divider between QR and text
  ctx.fillStyle = '#CBD5E1'
  ctx.fillRect(lineX, y - 4, maxW, 1)
  y += 6

  // SSID label
  ctx.font      = '15px "GeistRegular", sans-serif'
  ctx.fillStyle = '#8898AA'
  ctx.fillText('REDE WI-FI', cx, y, maxW)
  y += 20

  // SSID value
  ctx.font      = 'bold 26px "GeistBold", sans-serif'
  ctx.fillStyle = '#001A40'
  ctx.fillText(wifiSsid, cx, y, maxW)
  y += 32

  // Password section
  if (wifiSecurity !== 'nopass') {
    ctx.fillStyle = '#CBD5E1'
    ctx.fillRect(lineX, y + 2, maxW, 1)
    y += 10

    ctx.font      = '15px "GeistRegular", sans-serif'
    ctx.fillStyle = '#8898AA'
    ctx.fillText('SENHA', cx, y, maxW)
    y += 20

    ctx.font      = 'bold 24px "GeistBold", sans-serif'
    ctx.fillStyle = '#001A40'
    ctx.fillText(wifiPassword, cx, y, maxW)
  }

  return canvas.encode('png')
}

export async function generateWallpaper(params: GenerateImageParams): Promise<Buffer> {
  const { templateBuffer, wifiSsid, wifiPassword, wifiSecurity } = params

  const qrString = buildQrString(wifiSsid, wifiPassword, wifiSecurity)

  const [qrBuffer, overlay] = await Promise.all([
    buildQrBuffer(qrString),
    buildTextOverlay(wifiSsid, wifiPassword, wifiSecurity),
  ])

  return sharp(templateBuffer)
    .resize(OUT_W, OUT_H, { fit: 'fill' })
    .composite([
      { input: qrBuffer, left: sx(QR_LEFT_ORIG), top: sy(QR_TOP_ORIG) },
      { input: overlay,  left: 0,                top: 0              },
    ])
    .png({ compressionLevel: 6 })
    .toBuffer()
}
