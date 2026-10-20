import path from 'node:path'
import { createCanvas, GlobalFonts } from '@napi-rs/canvas'
import QRCode from 'qrcode'
import sharp from 'sharp'
import { CARD_LAYOUT, cardScale, cardSize, fitPlacement, OUTPUT_HEIGHT, OUTPUT_WIDTH } from '@/lib/qr-placement'
import type { GenerateImageParams, QrCardContent } from '@/lib/types'
import { buildQrString } from '@/lib/utils'

let fontsRegistered = false

function registerFonts() {
  if (fontsRegistered) return
  const fontsDir = path.join(process.cwd(), 'public', 'fonts')
  GlobalFonts.registerFromPath(path.join(fontsDir, 'GeistBold.ttf'), 'GeistBold')
  GlobalFonts.registerFromPath(path.join(fontsDir, 'GeistRegular.ttf'), 'GeistRegular')
  fontsRegistered = true
}

async function buildQrBuffer(qrString: string, size: number): Promise<Buffer> {
  return QRCode.toBuffer(qrString, {
    type: 'png',
    width: size,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: { dark: '#001A40', light: '#FFFFFF' },
  }) as Promise<Buffer>
}

// Cartão branco com o QR, o nome da rede e a senha. O texto é desenhado nas
// coordenadas do layout de escala 1, com o contexto escalado; o QR é colado
// depois, no tamanho exato, para não ser reamostrado.
export async function renderQrCard(content: QrCardContent, qrSize: number): Promise<Buffer> {
  registerFonts()

  const { wifiSsid, wifiPassword, wifiSecurity } = content
  const hasPassword = wifiSecurity !== 'nopass'
  const scale = cardScale(qrSize)
  const { width, height } = cardSize(qrSize, hasPassword)
  const L = CARD_LAYOUT

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.roundRect(0, 0, width, height, L.radius * scale)
  ctx.fill()

  ctx.scale(scale, scale)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  // Divisória entre o QR e o texto
  ctx.fillStyle = '#CBD5E1'
  ctx.fillRect(L.padding, L.ssidDividerY, L.qrSize, 1)

  ctx.font = '15px "GeistRegular", sans-serif'
  ctx.fillStyle = '#8898AA'
  ctx.fillText('REDE WI-FI', L.centerX, L.ssidLabelY, L.qrSize)

  ctx.font = 'bold 26px "GeistBold", sans-serif'
  ctx.fillStyle = '#001A40'
  ctx.fillText(wifiSsid, L.centerX, L.ssidValueY, L.qrSize)

  if (hasPassword) {
    ctx.fillStyle = '#CBD5E1'
    ctx.fillRect(L.padding, L.passwordDividerY, L.qrSize, 1)

    ctx.font = '15px "GeistRegular", sans-serif'
    ctx.fillStyle = '#8898AA'
    ctx.fillText('SENHA', L.centerX, L.passwordLabelY, L.qrSize)

    ctx.font = 'bold 24px "GeistBold", sans-serif'
    ctx.fillStyle = '#001A40'
    ctx.fillText(wifiPassword, L.centerX, L.passwordValueY, L.qrSize)
  }

  const qrBuffer = await buildQrBuffer(buildQrString(wifiSsid, wifiPassword, wifiSecurity), qrSize)
  const padding = Math.round(L.padding * scale)

  return sharp(await canvas.encode('png'))
    .composite([{ input: qrBuffer, left: padding, top: padding }])
    .png()
    .toBuffer()
}

export async function generateWallpaper(params: GenerateImageParams): Promise<Buffer> {
  const { templateBuffer, placement, ...content } = params

  // Quem chama já encaixa a posição; repetir aqui garante que o cartão nunca
  // seja cortado, mesmo com uma posição vinda de outro caminho.
  const fitted = fitPlacement(placement, content.wifiSecurity !== 'nopass')
  const card = await renderQrCard(content, fitted.qrSize)

  return sharp(templateBuffer)
    .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, { fit: 'fill' })
    .composite([{ input: card, left: fitted.qrLeft, top: fitted.qrTop }])
    .png({ compressionLevel: 6 })
    .toBuffer()
}
